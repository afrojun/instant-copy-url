const COPY_TABS_MENU = "copy-tab-urls";
const COPY_GROUP_MENU = "copy-group-urls";
const NO_GROUP = -1;

let menuUpdate = Promise.resolve();

chrome.runtime.onInstalled.addListener(createTabMenu);
chrome.runtime.onStartup.addListener(createTabMenu);
// Chrome does not say which tab was right-clicked before it shows the menu, so the group item
// appears while the focused window has a group.
for (const event of [
  chrome.tabGroups.onCreated,
  chrome.tabGroups.onRemoved,
  chrome.tabs.onAttached,
  chrome.tabs.onDetached,
  chrome.windows.onFocusChanged,
]) {
  event.addListener(() => {
    void updateGroupMenu();
  });
}
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === COPY_TABS_MENU) {
    void copySelectedTabUrls(tab);
  } else if (info.menuItemId === COPY_GROUP_MENU) {
    void copyGroupUrls(tab);
  }
});

function hasTabMenu() {
  // Chrome added the tab context in version 150. Older versions reject it.
  return Boolean(chrome.contextMenus.ContextType?.TAB);
}

function createTabMenu() {
  return queueMenuUpdate(async () => {
    await menuCall((done) => chrome.contextMenus.removeAll(done));
    await menuCall((done) => chrome.contextMenus.create(
      { id: COPY_TABS_MENU, title: "Copy tab URLs", contexts: ["tab"] }, done,
    ));
    const visible = await focusedWindowHasGroup();
    await menuCall((done) => chrome.contextMenus.create(
      { id: COPY_GROUP_MENU, title: "Copy group URLs", contexts: ["tab"], visible }, done,
    ));
  });
}

function updateGroupMenu() {
  return queueMenuUpdate(async () => {
    const visible = await focusedWindowHasGroup();
    // The item does not exist yet if Chrome has not finished starting the extension.
    await menuCall((done) => chrome.contextMenus.update(COPY_GROUP_MENU, { visible }, done)).catch(() => {});
  });
}

// Menu changes run one at a time, so a visibility check always applies after the menu it updates.
function queueMenuUpdate(update) {
  if (!hasTabMenu()) {
    return menuUpdate;
  }
  menuUpdate = menuUpdate.then(update).catch((error) => {
    console.error("Could not update the tab menu:", error);
  });
  return menuUpdate;
}

function menuCall(call) {
  return new Promise((resolve, reject) => {
    call(() => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve();
      }
    });
  });
}

async function focusedWindowHasGroup() {
  const groups = await chrome.tabGroups.query({ windowId: chrome.windows.WINDOW_ID_CURRENT });
  return groups.length > 0;
}

async function copySelectedTabUrls(clickedTab) {
  try {
    const highlighted = await chrome.tabs.query({ highlighted: true, windowId: clickedTab.windowId });
    // Right-clicking outside the selection copies only the clicked tab, as Chrome's own tab actions do.
    const tabs = highlighted.some(({ id }) => id === clickedTab.id) ? highlighted : [clickedTab];
    if (tabs.some(({ url }) => !url)) {
      await showCopyError("copy-failed");
      return;
    }
    tabs.sort(byStripOrder);
    await copyUrls(tabs.map(({ url }) => url));
    await confirmCopy(tabs, clickedTab);
  } catch (error) {
    console.error("Could not copy the selected tab URLs:", error);
    await showCopyError("copy-failed");
  }
}

async function copyGroupUrls(clickedTab) {
  const groupId = clickedTab?.groupId ?? NO_GROUP;
  if (groupId === NO_GROUP) {
    await showCopyError("not-in-group");
    return;
  }

  try {
    const [group, tabs] = await Promise.all([chrome.tabGroups.get(groupId), chrome.tabs.query({ groupId })]);
    if (!tabs.some(({ id }) => id === clickedTab.id) || tabs.some(({ url }) => !url)) {
      await showCopyError("group-changed");
      return;
    }
    tabs.sort(byStripOrder);
    const { text, html } = groupClipboardContent(group.title, tabs);
    await copyToClipboard(text, html);
    await confirmCopy(tabs, clickedTab);
  } catch (error) {
    console.error("Could not copy the group URLs:", error);
    await showCopyError("copy-failed");
  }
}

function byStripOrder(a, b) {
  return a.index - b.index;
}

// The group name, then each page as a title and URL. Rich text links each title to its page.
function groupClipboardContent(groupTitle, tabs) {
  const pages = tabs.map(({ title, url }) => ({ title: title?.trim() ?? "", url }));
  const textEntries = pages.map(({ title, url }) => (title ? `${title}\n${url}` : url));
  const htmlItems = pages.map(
    ({ title, url }) => `<li><a href="${escapeHtml(url)}">${escapeHtml(title || url)}</a></li>`,
  );
  const heading = groupTitle?.trim() ?? "";
  return {
    text: [heading, ...textEntries].filter(Boolean).join("\n\n"),
    html: `${heading ? `<p><strong>${escapeHtml(heading)}</strong></p>` : ""}<ul>${htmlItems.join("")}</ul>`,
  };
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => `&#${character.charCodeAt(0)};`);
}

async function confirmCopy(tabs, clickedTab) {
  // The clicked tab may be in the background, so confirm on the visible tab when it was copied.
  const toastTab = tabs.find(({ active }) => active) ?? clickedTab;
  await showToast(toastTab.id, tabs.length);
}

function showCopyError(code) {
  return chrome.tabs.create({ url: chrome.runtime.getURL(`copy-error.html#${code}`) });
}
