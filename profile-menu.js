const STORE_EXTENSION_ID = "dhalfjnfoocnfpppmkpidbliccemicno";
const NATIVE_HOST = chrome.runtime.id === STORE_EXTENSION_ID
  ? "dev.afrojun.profilebar"
  : "dev.afrojun.profilebar.dev";
const MENU_ROOT = "move-to-profile";
const TAB_MENU_ROOT = "move-selected-tabs-to-profile";
const MENU_ENABLE = "enable-profilebar";
const MENU_ENABLE_TABS = "enable-selected-tabs";
const MENU_SETUP = "setup-profilebar";
const MENU_REFRESH = "refresh-profiles";
const PROFILE_PREFIX = "profile:";
const PROFILEBAR_SETUP = "https://afrojun.dev/profilebar/#move-tabs";

let menuRefresh = Promise.resolve();

chrome.runtime.onInstalled.addListener(() => {
  void refreshProfileMenu();
});
chrome.runtime.onStartup.addListener(() => {
  void refreshProfileMenu();
});
chrome.permissions.onAdded.addListener(({ permissions }) => {
  if (permissions.some((permission) => ["nativeMessaging", "tabs"].includes(permission))) {
    void refreshProfileMenu();
  }
});
chrome.permissions.onRemoved.addListener(({ permissions }) => {
  if (permissions.some((permission) => ["nativeMessaging", "tabs"].includes(permission))) {
    void refreshProfileMenu();
  }
});
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const menuId = String(info.menuItemId).replace(/^tab:/, "");
  if (menuId === MENU_ENABLE) {
    void chrome.permissions.request({ permissions: ["nativeMessaging"] })
      .catch((error) => console.error("Could not enable ProfileBar integration:", error));
    return;
  }
  if (menuId === MENU_ENABLE_TABS) {
    void chrome.permissions.request({ permissions: ["tabs"] })
      .catch((error) => console.error("Could not enable selected tab moves:", error));
    return;
  }
  if (menuId === MENU_SETUP) {
    void chrome.tabs.create({ url: PROFILEBAR_SETUP });
    return;
  }
  if (menuId === MENU_REFRESH) {
    void refreshProfileMenu();
    return;
  }
  if (menuId.startsWith(PROFILE_PREFIX)) {
    void moveToProfile(menuId, info, tab, String(info.menuItemId).startsWith("tab:"));
  }
});

function refreshProfileMenu() {
  menuRefresh = menuRefresh.catch(() => {}).then(buildProfileMenu).catch((error) => {
    console.error("Could not update the profile menu:", error);
  });
  return menuRefresh;
}

async function buildProfileMenu() {
  let profiles;
  const platform = await chrome.runtime.getPlatformInfo();
  let state = platform.os === "mac" ? "enable" : "unsupported";
  if (state === "enable" && await chrome.permissions.contains({ permissions: ["nativeMessaging"] })) {
    try {
      const response = await chrome.runtime.sendNativeMessage(NATIVE_HOST, { type: "listProfiles" });
      if (!response?.ok || !Array.isArray(response.profiles) || !response.profiles.every(
        (profile) => profile && typeof profile.directory === "string" && typeof profile.name === "string",
      )) throw new Error("Invalid profile list");
      profiles = response.profiles;
      state = "ready";
    } catch (error) {
      console.debug("ProfileBar is unavailable:", error);
      state = "setup";
    }
  }

  await removeMenus();
  await buildContextMenu(MENU_ROOT, "page", "", state, profiles);
  if (chrome.contextMenus.ContextType?.TAB) {
    await buildContextMenu(TAB_MENU_ROOT, "tab", "tab:", state, profiles);
  }
}

async function buildContextMenu(root, context, prefix, state, profiles) {
  const contexts = [context];
  await createMenu({ id: root, title: "Move tab to profile", contexts });
  if (state === "unsupported") {
    await createMenu({ id: `${prefix}mac-only`, parentId: root, title: "ProfileBar requires macOS", enabled: false, contexts });
  } else if (state === "enable") {
    await createMenu({ id: `${prefix}${MENU_ENABLE}`, parentId: root, title: "Enable ProfileBar integration…", contexts });
  } else if (state === "setup") {
    await createMenu({ id: `${prefix}${MENU_SETUP}`, parentId: root, title: "Set up ProfileBar…", contexts });
  } else {
    const nameCounts = new Map();
    for (const profile of profiles) nameCounts.set(profile.name, (nameCounts.get(profile.name) ?? 0) + 1);
    for (const profile of profiles) {
      const title = nameCounts.get(profile.name) > 1 ? `${profile.name} (${profile.directory})` : profile.name;
      await createMenu({
        id: `${prefix}${PROFILE_PREFIX}${encodeURIComponent(profile.directory)}`,
        parentId: root,
        title,
        contexts,
      });
    }
    if (profiles.length === 0) {
      await createMenu({ id: `${prefix}no-profiles`, parentId: root, title: "No Chrome profiles found", enabled: false, contexts });
    } else {
      await createMenu({ id: `${prefix}profiles-refresh-divider`, parentId: root, type: "separator", contexts });
    }
  }
  if (state !== "unsupported") {
    await createMenu({ id: `${prefix}${MENU_REFRESH}`, parentId: root, title: "Refresh profiles", contexts });
  }
  if (context === "tab" && state === "ready"
      && !await chrome.permissions.contains({ permissions: ["tabs"] })) {
    await createMenu({
      id: `${prefix}${MENU_ENABLE_TABS}`, parentId: root,
      title: "Enable selected tab moves…", contexts,
    });
  }
}

function removeMenus() {
  return new Promise((resolve, reject) => {
    chrome.contextMenus.removeAll(() => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else resolve();
    });
  });
}

function createMenu(properties) {
  return new Promise((resolve, reject) => {
    chrome.contextMenus.create(properties, () => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else resolve();
    });
  });
}

async function moveToProfile(menuId, info, tab, fromTabMenu) {
  if (!Number.isInteger(tab?.id)) {
    await showProfileError("source-unavailable");
    return;
  }

  let sourceTabs;
  try {
    sourceTabs = fromTabMenu ? await selectedTabs(tab) : [{ id: tab.id, url: info.pageUrl ?? tab.url }];
  } catch (error) {
    await showProfileError(error.message === "tabs-permission" ? error.message : "selection-changed");
    return;
  }
  if (sourceTabs.some(({ url, pendingUrl }) => !url || !/^https?:\/\//i.test(url) || pendingUrl)) {
    await showProfileError("unsupported-url");
    return;
  }
  const encoder = new TextEncoder();
  const urlSizes = sourceTabs.map(({ url }) => encoder.encode(url).length);
  if (sourceTabs.length > 100 || urlSizes.some((size) => size > 65_536)
      || urlSizes.reduce((total, size) => total + size, 0) > 120_000) {
    await showProfileError("batch-too-large");
    return;
  }

  let response;
  try {
    const profileDirectory = decodeURIComponent(menuId.slice(PROFILE_PREFIX.length));
    const urls = sourceTabs.map(({ url }) => url);
    const request = urls.length === 1
      ? { type: "openURL", profileDirectory, url: urls[0] }
      : { type: "openURLs", profileDirectory, urls };
    response = await chrome.runtime.sendNativeMessage(NATIVE_HOST, request);
  } catch (error) {
    console.debug("ProfileBar could not open the tab:", error);
    void refreshProfileMenu();
    await showProfileError("profilebar-unavailable");
    return;
  }

  if (response?.ok) {
    await closeSourceTabs(sourceTabs);
  } else if (response?.error === "profile_not_found") {
    void refreshProfileMenu();
    await showProfileError("profile-changed");
  } else if (sourceTabs.length > 1 && response?.error === "invalid_request") {
    await showProfileError("profilebar-update-required");
  } else {
    await showProfileError("open-failed");
  }
}

async function selectedTabs(clickedTab) {
  if (!Number.isInteger(clickedTab.windowId)) return [{ id: clickedTab.id, url: clickedTab.url }];
  const highlighted = await chrome.tabs.query({ highlighted: true, windowId: clickedTab.windowId });
  if (highlighted.length < 2 || !highlighted.some(({ id }) => id === clickedTab.id)) {
    return [{ id: clickedTab.id, url: clickedTab.url }];
  }
  const selectedIds = highlighted.map(({ id }) => id).sort((a, b) => a - b);
  if (!await chrome.permissions.contains({ permissions: ["tabs"] })) {
    throw new Error("tabs-permission");
  }
  const selected = await chrome.tabs.query({ highlighted: true, windowId: clickedTab.windowId });
  if (selected.map(({ id }) => id).sort((a, b) => a - b).join(",") !== selectedIds.join(",")) {
    throw new Error("source-changed");
  }
  return selected.sort((a, b) => a.index - b.index);
}

async function closeSourceTabs(sourceTabs) {
  try {
    const current = await Promise.all(sourceTabs.map(({ id }) => chrome.tabs.get(id)));
    if (current.some((tab, index) => tab.url !== sourceTabs[index].url || tab.pendingUrl)) {
      await showProfileError("source-changed");
      return;
    }
    await chrome.tabs.remove(sourceTabs.map(({ id }) => id));
  } catch (error) {
    console.error("Could not close the original tab:", error);
    await showProfileError("close-failed");
  }
}

function showProfileError(code) {
  return chrome.tabs.create({ url: chrome.runtime.getURL(`integration-status.html#${code}`) });
}
