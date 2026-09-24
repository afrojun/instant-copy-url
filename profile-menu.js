const STORE_EXTENSION_ID = "dhalfjnfoocnfpppmkpidbliccemicno";
const NATIVE_HOST = chrome.runtime.id === STORE_EXTENSION_ID
  ? "dev.afrojun.profilebar"
  : "dev.afrojun.profilebar.dev";
const MENU_ROOT = "open-in-profile";
const MENU_ENABLE = "enable-profilebar";
const MENU_SETUP = "setup-profilebar";
const MENU_REFRESH = "refresh-profiles";
const PROFILE_PREFIX = "profile:";
const PROFILEBAR_DOWNLOAD = "https://github.com/afrojun/profilebar/releases/latest";

let menuRefresh = Promise.resolve();

chrome.runtime.onInstalled.addListener(() => {
  void refreshProfileMenu();
});
chrome.runtime.onStartup.addListener(() => {
  void refreshProfileMenu();
});
chrome.permissions.onRemoved.addListener(({ permissions }) => {
  if (permissions.includes("nativeMessaging")) {
    void refreshProfileMenu();
  }
});
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === MENU_ENABLE) {
    void chrome.permissions.request({ permissions: ["nativeMessaging"] })
      .then((granted) => {
        if (granted) return refreshProfileMenu();
      })
      .catch((error) => console.error("Could not enable ProfileBar integration:", error));
    return;
  }
  if (info.menuItemId === MENU_SETUP) {
    void chrome.tabs.create({ url: PROFILEBAR_DOWNLOAD });
    return;
  }
  if (info.menuItemId === MENU_REFRESH) {
    void refreshProfileMenu();
    return;
  }
  if (typeof info.menuItemId === "string" && info.menuItemId.startsWith(PROFILE_PREFIX)) {
    void openInProfile(info, tab);
  }
});

function refreshProfileMenu() {
  menuRefresh = menuRefresh.catch(() => {}).then(buildProfileMenu).catch((error) => {
    console.error("Could not update the profile menu:", error);
  });
  return menuRefresh;
}

async function buildProfileMenu() {
  const contexts = ["page"];
  if (chrome.contextMenus.ContextType?.TAB) contexts.push("tab");

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
  await createMenu({ id: MENU_ROOT, title: "Open tab in profile", contexts });
  if (state === "unsupported") {
    await createMenu({ id: "mac-only", parentId: MENU_ROOT, title: "ProfileBar requires macOS", enabled: false, contexts });
  } else if (state === "enable") {
    await createMenu({ id: MENU_ENABLE, parentId: MENU_ROOT, title: "Enable ProfileBar integration…", contexts });
  } else if (state === "setup") {
    await createMenu({ id: MENU_SETUP, parentId: MENU_ROOT, title: "Install or open ProfileBar…", contexts });
  } else {
    const nameCounts = new Map();
    for (const profile of profiles) nameCounts.set(profile.name, (nameCounts.get(profile.name) ?? 0) + 1);
    for (const profile of profiles) {
      const title = nameCounts.get(profile.name) > 1 ? `${profile.name} (${profile.directory})` : profile.name;
      await createMenu({
        id: `${PROFILE_PREFIX}${encodeURIComponent(profile.directory)}`,
        parentId: MENU_ROOT,
        title,
        contexts,
      });
    }
    if (profiles.length === 0) {
      await createMenu({ id: "no-profiles", parentId: MENU_ROOT, title: "No Chrome profiles found", enabled: false, contexts });
    }
  }
  if (state !== "unsupported") {
    await createMenu({ id: MENU_REFRESH, parentId: MENU_ROOT, title: "Refresh profiles", contexts });
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

async function openInProfile(info, tab) {
  const url = info.pageUrl ?? tab?.url;
  if (!url || !/^https?:\/\//i.test(url)) {
    await showProfileError("unsupported-url");
    return;
  }

  try {
    const directory = decodeURIComponent(info.menuItemId.slice(PROFILE_PREFIX.length));
    const response = await chrome.runtime.sendNativeMessage(NATIVE_HOST, {
      type: "openURL",
      profileDirectory: directory,
      url,
    });
    if (response?.ok) return;
    if (response?.error === "profile_not_found") {
      void refreshProfileMenu();
      await showProfileError("profile-changed");
    } else {
      await showProfileError("open-failed");
    }
  } catch (error) {
    console.debug("ProfileBar could not open the tab:", error);
    void refreshProfileMenu();
    await showProfileError("profilebar-unavailable");
  }
}

function showProfileError(code) {
  return chrome.tabs.create({ url: chrome.runtime.getURL(`integration-status.html#${code}`) });
}
