const COPY_GROUP_MENU = "copy-group-urls";
const NO_GROUP = -1;

chrome.runtime.onInstalled.addListener(createGroupMenu);
chrome.runtime.onStartup.addListener(createGroupMenu);
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === COPY_GROUP_MENU) {
    void copyGroupUrls(tab);
  }
});

function createGroupMenu() {
  // Chrome added the tab context in version 150. Older versions reject it.
  if (!chrome.contextMenus.ContextType?.TAB) {
    return;
  }

  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create(
      { id: COPY_GROUP_MENU, title: "Copy group URLs", contexts: ["tab"] },
      () => {
        if (chrome.runtime.lastError) {
          console.error("Could not create the group menu:", chrome.runtime.lastError.message);
        }
      },
    );
  });
}

async function copyGroupUrls(clickedTab) {
  const groupId = clickedTab?.groupId ?? NO_GROUP;
  if (groupId === NO_GROUP) {
    await showCopyError("not-in-group");
    return;
  }

  try {
    const tabs = await chrome.tabs.query({ groupId });
    if (!tabs.some(({ id }) => id === clickedTab.id) || tabs.some(({ url }) => !url)) {
      await showCopyError("group-changed");
      return;
    }

    tabs.sort((a, b) => a.index - b.index);
    await copyUrls(tabs.map(({ url }) => url));
    await showToast(clickedTab.id, tabs.length);
  } catch (error) {
    console.error("Could not copy the group URLs:", error);
    await showCopyError("copy-failed");
  }
}

function showCopyError(code) {
  return chrome.tabs.create({ url: chrome.runtime.getURL(`copy-error.html#${code}`) });
}
