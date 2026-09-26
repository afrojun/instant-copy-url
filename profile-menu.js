const STORE_EXTENSION_ID = "dhalfjnfoocnfpppmkpidbliccemicno";
const NATIVE_HOST = chrome.runtime.id === STORE_EXTENSION_ID
  ? "dev.afrojun.profilebar"
  : "dev.afrojun.profilebar.dev";
const MENU_ROOT = "move-to-profile";
const TAB_MENU_ROOT = "tab-actions";
const MENU_COPY_GROUP = "copy-group-urls";
const MENU_ENABLE = "enable-profilebar";
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
  if (permissions.includes("nativeMessaging")) {
    void refreshProfileMenu();
  }
});
chrome.permissions.onRemoved.addListener(({ permissions }) => {
  if (permissions.includes("nativeMessaging")) {
    void refreshProfileMenu();
  }
});
chrome.windows.onFocusChanged.addListener(() => {
  void refreshProfileMenu();
});
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const itemId = String(info.menuItemId);
  const menuId = itemId.replace(/^(tab:|group:)/, "");
  if (itemId === MENU_COPY_GROUP) {
    void copyGroupUrls(tab);
    return;
  }
  if (menuId === MENU_ENABLE) {
    void chrome.permissions.request({ permissions: ["nativeMessaging"] })
      .catch((error) => console.error("Could not enable ProfileBar integration:", error));
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
    const mode = itemId.startsWith("group:") ? "group" : itemId.startsWith("tab:") ? "tab" : "page";
    void moveToProfile(menuId, info, tab, mode);
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
      if (profiles.some(({ directory }) => directory === response.focusedProfileDirectory)) {
        const window = await chrome.windows.getLastFocused().catch(() => null);
        if (window?.focused) {
          profiles = profiles.filter(({ directory }) => directory !== response.focusedProfileDirectory);
        }
      }
      state = "ready";
    } catch (error) {
      console.debug("ProfileBar is unavailable:", error);
      state = "setup";
    }
  }

  await removeMenus();
  await buildPageMenu(state, profiles);
  if (chrome.contextMenus.ContextType?.TAB) {
    await buildTabMenu(state, profiles);
  }
}

async function buildPageMenu(state, profiles) {
  const contexts = ["page"];
  await createMenu({ id: MENU_ROOT, title: "Move tab to profile", contexts });
  if (state === "unsupported") {
    await createMenu({ id: "mac-only", parentId: MENU_ROOT, title: "ProfileBar requires macOS", enabled: false, contexts });
  } else if (state === "enable") {
    await createMenu({ id: MENU_ENABLE, parentId: MENU_ROOT, title: "Enable ProfileBar integration…", contexts });
  } else if (state === "setup") {
    await createMenu({ id: MENU_SETUP, parentId: MENU_ROOT, title: "Set up ProfileBar…", contexts });
  } else {
    for (const profile of namedProfiles(profiles)) {
      await createMenu({
        id: `${PROFILE_PREFIX}${encodeURIComponent(profile.directory)}`,
        parentId: MENU_ROOT,
        title: profile.title,
        contexts,
      });
    }
    if (profiles.length === 0) {
      await createMenu({ id: "no-profiles", parentId: MENU_ROOT, title: "No destination profiles found", enabled: false, contexts });
    } else {
      await createMenu({ id: "profiles-refresh-divider", parentId: MENU_ROOT, type: "separator", contexts });
    }
  }
  if (state !== "unsupported") {
    await createMenu({ id: MENU_REFRESH, parentId: MENU_ROOT, title: "Refresh profiles", contexts });
  }
}

async function buildTabMenu(state, profiles) {
  const contexts = ["tab"];
  const parentId = TAB_MENU_ROOT;
  await createMenu({ id: parentId, title: "Copy or move tabs", contexts });
  await createMenu({ id: MENU_COPY_GROUP, parentId, title: "Copy group URLs", contexts });
  await createTabDivider("tab:copy-divider");

  if (state === "ready" && profiles.length > 0) {
    const destinations = namedProfiles(profiles);
    for (const profile of destinations) {
      await createMenu({
        id: `tab:${PROFILE_PREFIX}${encodeURIComponent(profile.directory)}`,
        parentId,
        title: `Move tab to ${profile.title}`,
        contexts,
      });
    }
    await createTabDivider("tab:group-divider");
    for (const profile of destinations) {
      await createMenu({
        id: `group:${PROFILE_PREFIX}${encodeURIComponent(profile.directory)}`,
        parentId,
        title: `Move group to ${profile.title}`,
        contexts,
      });
    }
  } else {
    let option;
    if (state === "unsupported") {
      option = { id: "tab:mac-only", title: "ProfileBar requires macOS", enabled: false };
    } else if (state === "enable") {
      option = { id: `tab:${MENU_ENABLE}`, title: "Enable ProfileBar integration…" };
    } else if (state === "setup") {
      option = { id: `tab:${MENU_SETUP}`, title: "Set up ProfileBar…" };
    } else {
      option = { id: "tab:no-profiles", title: "No destination profiles found", enabled: false };
    }
    await createMenu({ ...option, parentId, contexts });
  }

  if (state !== "unsupported") {
    await createTabDivider("tab:profiles-refresh-divider");
    await createMenu({ id: `tab:${MENU_REFRESH}`, parentId, title: "Refresh profiles", contexts });
  }
}

function createTabDivider(id) {
  // Chrome hides native separators in tab submenus; this short rule matches the page menu.
  return createMenu({ id, parentId: TAB_MENU_ROOT, title: "───────", enabled: false, contexts: ["tab"] });
}

function namedProfiles(profiles) {
  const nameCounts = new Map();
  for (const profile of profiles) nameCounts.set(profile.name, (nameCounts.get(profile.name) ?? 0) + 1);
  return profiles.map((profile) => ({
    directory: profile.directory,
    title: nameCounts.get(profile.name) > 1 ? `${profile.name} (${profile.directory})` : profile.name,
  }));
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

async function copyGroupUrls(tab) {
  let tabs;
  try {
    ({ tabs } = await selectedGroup(tab));
  } catch (error) {
    console.error("Could not find the tab group:", error);
    await showProfileError(tab?.groupId == null || tab.groupId === -1 ? "not-in-group" : "group-changed");
    return;
  }
  if (tabs.some(({ url }) => !url)) {
    await showProfileError("group-changed");
    return;
  }
  try {
    await copyUrls(tabs.map(({ url }) => url));
    await showToast(tab.id, tabs.length);
  } catch (error) {
    console.error("Could not copy the tab group URLs:", error);
    await showProfileError("copy-failed");
  }
}

async function moveToProfile(menuId, info, tab, mode) {
  if (!Number.isInteger(tab?.id)) {
    await showProfileError("source-unavailable");
    return;
  }

  let source;
  try {
    source = mode === "group"
      ? await selectedGroup(tab)
      : { tabs: mode === "tab" ? await selectedTabs(tab) : [{ id: tab.id, url: info.pageUrl ?? tab.url }] };
  } catch (error) {
    let code = "selection-changed";
    if (mode === "group") {
      code = tab.groupId == null || tab.groupId === -1 ? "not-in-group" : "group-changed";
    }
    await showProfileError(code);
    return;
  }
  const sourceTabs = source.tabs;
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
    const request = source.group
      ? { type: "openGroup", profileDirectory, urls, group: {
        title: source.group.title ?? "", color: source.group.color, collapsed: source.group.collapsed,
      } }
      : urls.length === 1
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
    const closed = await closeSourceTabs(sourceTabs, source.group);
    if (closed && source.group && response.grouped === false) {
      await showProfileError("group-opened-ungrouped");
    }
  } else if (response?.error === "profile_not_found") {
    void refreshProfileMenu();
    await showProfileError("profile-changed");
  } else if ((sourceTabs.length > 1 || source.group) && response?.error === "invalid_request") {
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
  return highlighted.sort((a, b) => a.index - b.index);
}

async function selectedGroup(clickedTab) {
  if (!Number.isInteger(clickedTab?.groupId) || clickedTab.groupId === -1
      || !Number.isInteger(clickedTab.windowId)) {
    throw new Error("The clicked tab is not in a group.");
  }
  const [group, tabs] = await Promise.all([
    chrome.tabGroups.get(clickedTab.groupId),
    chrome.tabs.query({ groupId: clickedTab.groupId, windowId: clickedTab.windowId }),
  ]);
  if (tabs.length === 0 || !tabs.some(({ id }) => id === clickedTab.id)) {
    throw new Error("The clicked tab left its group.");
  }
  return { group, tabs: tabs.sort((a, b) => a.index - b.index) };
}

async function closeSourceTabs(sourceTabs, group) {
  try {
    if (group) {
      let currentGroup;
      try {
        currentGroup = await selectedGroup(sourceTabs[0]);
      } catch (error) {
        await showProfileError("source-changed");
        return false;
      }
      if (currentGroup.tabs.length !== sourceTabs.length
          || currentGroup.tabs.some((tab, index) => tab.id !== sourceTabs[index].id)
          || currentGroup.group.title !== group.title
          || currentGroup.group.color !== group.color
          || currentGroup.group.collapsed !== group.collapsed) {
        await showProfileError("source-changed");
        return false;
      }
    }
    const current = await Promise.all(sourceTabs.map(({ id }) => chrome.tabs.get(id)));
    if (current.some((tab, index) => tab.url !== sourceTabs[index].url || tab.pendingUrl)) {
      await showProfileError("source-changed");
      return false;
    }
    await chrome.tabs.remove(sourceTabs.map(({ id }) => id));
    return true;
  } catch (error) {
    console.error("Could not close the original tab:", error);
    await showProfileError("close-failed");
    return false;
  }
}

function showProfileError(code) {
  return chrome.tabs.create({ url: chrome.runtime.getURL(`integration-status.html#${code}`) });
}
