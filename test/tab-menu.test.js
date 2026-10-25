const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "tab-menu.js"), "utf8");

function menuHarness({ tabContext = true, tabs = [], groups = {}, windowGroups = [], asyncMenus = false } = {}) {
  const menuUpdates = [];
  const richCopies = [];
  const listeners = {};
  const menus = [];
  const openedTabs = [];
  const copied = [];
  const toasts = [];
  // Chrome reports menu errors through runtime.lastError while the callback runs.
  function finish(callback, error) {
    const run = () => {
      chrome.runtime.lastError = error ? { message: error } : undefined;
      callback();
      chrome.runtime.lastError = undefined;
    };
    if (asyncMenus) setImmediate(run);
    else run();
  }
  const chrome = {
    runtime: {
      onInstalled: { addListener(listener) { listeners.installed = listener; } },
      onStartup: { addListener(listener) { listeners.startup = listener; } },
      getURL(file) { return `chrome-extension://test/${file}`; },
    },
    contextMenus: {
      ContextType: tabContext ? { TAB: "tab" } : {},
      onClicked: { addListener(listener) { listeners.clicked = listener; } },
      removeAll(callback) { menus.length = 0; finish(callback); },
      create(item, callback) { menus.push({ ...item }); finish(callback); },
      update(id, properties, callback) {
        const item = menus.find((menu) => menu.id === id);
        if (item) {
          Object.assign(item, properties);
          menuUpdates.push({ id, ...properties });
        }
        finish(callback, item ? undefined : `Cannot find menu item with id ${id}`);
      },
    },
    windows: {
      WINDOW_ID_CURRENT: -2,
      onFocusChanged: { addListener(listener) { listeners.focusChanged = listener; } },
    },
    tabGroups: {
      onCreated: { addListener(listener) { listeners.groupCreated = listener; } },
      onRemoved: { addListener(listener) { listeners.groupRemoved = listener; } },
      async get(id) { return groups[id]; },
      async query({ windowId }) {
        assert.equal(windowId, -2, "group visibility should follow the current window");
        return [...windowGroups];
      },
    },
    tabs: {
      onAttached: { addListener(listener) { listeners.attached = listener; } },
      onDetached: { addListener(listener) { listeners.detached = listener; } },
      async create(tab) { openedTabs.push(tab); },
      async query({ active, highlighted, groupId, windowId }) {
        return tabs.filter((tab) => (!active || tab.active) && (!highlighted || tab.highlighted)
          && (groupId === undefined || tab.groupId === groupId)
          && (windowId === undefined || tab.windowId === windowId));
      },
    },
  };
  const context = vm.createContext({
    chrome,
    copyUrls: async (urls) => copied.push([...urls]),
    copyToClipboard: async (text, html) => richCopies.push({ text, html }),
    showToast: async (id, count) => toasts.push({ id, count }),
    console: { error() {} },
  });
  vm.runInContext(source, context);
  return {
    settle: () => vm.runInContext("menuUpdate", context),
    listeners, menus, menuUpdates, openedTabs, copied, richCopies, toasts, windowGroups };
}

async function click(harness, tab, menuItemId = "copy-group-urls") {
  harness.listeners.clicked({ menuItemId }, tab);
  await new Promise(setImmediate);
}

test("the tab menu copies tabs, and offers the group only while the window has a group", async () => {
  const harness = menuHarness();
  await harness.listeners.installed({ reason: "install" });
  await harness.listeners.startup();

  assert.deepEqual(JSON.parse(JSON.stringify(harness.menus)), [
    { id: "copy-tab-urls", title: "Copy tab URLs", contexts: ["tab"] },
    { id: "copy-group-urls", title: "Copy group URLs", contexts: ["tab"], visible: false },
  ]);
});

test("the group item follows whether the focused window has a group", async () => {
  const harness = menuHarness();
  await harness.listeners.startup();

  harness.windowGroups.push({ id: 8 });
  harness.listeners.groupCreated({ id: 8 });
  await harness.settle();
  harness.windowGroups.length = 0;
  harness.listeners.groupRemoved({ id: 8 });
  await harness.settle();

  assert.deepEqual(harness.menuUpdates, [
    { id: "copy-group-urls", visible: true },
    { id: "copy-group-urls", visible: false },
  ]);
});

test("a group created while the menu is being built still shows the group item", async () => {
  const harness = menuHarness({ asyncMenus: true });
  void harness.listeners.startup();
  await new Promise(setImmediate);
  harness.windowGroups.push({ id: 8 });
  harness.listeners.groupCreated({ id: 8 });
  await harness.settle();

  assert.equal(harness.menus.find(({ id }) => id === "copy-group-urls").visible, true);
});

test("a group event before the menu exists is ignored without an error", async () => {
  const harness = menuHarness();
  harness.windowGroups.push({ id: 8 });
  harness.listeners.groupCreated({ id: 8 });
  await harness.settle();

  assert.equal(harness.menuUpdates.length, 0);
  assert.equal(harness.menus.length, 0);
});

test("Chrome without tab menus gets no tab items", async () => {
  const harness = menuHarness({ tabContext: false });
  await harness.listeners.installed({ reason: "install" });
  harness.listeners.groupCreated({ id: 8 });
  await harness.settle();

  assert.equal(harness.menus.length, 0);
  assert.equal(harness.menuUpdates.length, 0);
});

test("copy tab URLs copies the selection in strip order and confirms on the visible tab", async () => {
  const harness = menuHarness({ tabs: [
    { id: 3, windowId: 1, index: 2, highlighted: true, url: "https://example.com/third" },
    { id: 1, windowId: 1, index: 0, highlighted: true, active: true, url: "https://example.com/first" },
    { id: 2, windowId: 1, index: 1, highlighted: false, url: "https://example.com/unselected" },
    { id: 4, windowId: 2, index: 0, highlighted: true, url: "https://example.com/other-window" },
  ] });

  await click(harness, { id: 3, windowId: 1, url: "https://example.com/third" }, "copy-tab-urls");

  assert.deepEqual(harness.copied, [["https://example.com/first", "https://example.com/third"]]);
  assert.deepEqual(harness.toasts, [{ id: 1, count: 2 }]);
});

test("copy tab URLs outside the selection copies only the clicked tab", async () => {
  const harness = menuHarness({ tabs: [
    { id: 1, windowId: 1, index: 0, highlighted: true, active: true, url: "https://example.com/first" },
    { id: 2, windowId: 1, index: 1, highlighted: false, url: "https://example.com/clicked" },
  ] });

  await click(harness, { id: 2, windowId: 1, index: 1, url: "https://example.com/clicked" }, "copy-tab-urls");

  assert.deepEqual(harness.copied, [["https://example.com/clicked"]]);
  assert.deepEqual(harness.toasts, [{ id: 2, count: 1 }]);
});

test("copy tab URLs copies nothing when a selected tab has no URL", async () => {
  const harness = menuHarness({ tabs: [
    { id: 1, windowId: 1, index: 0, highlighted: true, url: "https://example.com/first" },
    { id: 2, windowId: 1, index: 1, highlighted: true },
  ] });

  await click(harness, { id: 1, windowId: 1, url: "https://example.com/first" }, "copy-tab-urls");

  assert.deepEqual(harness.copied, []);
  assert.deepEqual(harness.openedTabs.map(({ url }) => url), ["chrome-extension://test/copy-error.html#copy-failed"]);
});

test("copy group URLs copies the group name and linked page titles in strip order", async () => {
  const harness = menuHarness({
    groups: { 8: { id: 8, title: "Research" } },
    tabs: [
      { id: 2, groupId: 8, index: 1, url: "https://example.com/b?x=1&y=2" },
      { id: 1, groupId: 8, index: 0, title: "Tom & <Jerry>", url: "https://example.com/a" },
      { id: 3, groupId: -1, index: 2, title: "Other", url: "https://example.com/other" },
    ],
  });

  await click(harness, { id: 2, groupId: 8 });

  assert.deepEqual(harness.richCopies, [{
    text: "Research\n\nTom & <Jerry>\nhttps://example.com/a\n\nhttps://example.com/b?x=1&y=2",
    html: "<p><strong>Research</strong></p><ul>"
      + "<li><a href=\"https://example.com/a\">Tom &#38; &#60;Jerry&#62;</a></li>"
      + "<li><a href=\"https://example.com/b?x=1&#38;y=2\">https://example.com/b?x=1&#38;y=2</a></li></ul>",
  }]);
  assert.deepEqual(harness.toasts, [{ id: 2, count: 2 }]);
  assert.equal(harness.openedTabs.length, 0);
});

test("an unnamed group copies its pages without a heading", async () => {
  const harness = menuHarness({
    groups: { 8: { id: 8, title: "" } },
    tabs: [{ id: 1, groupId: 8, index: 0, title: "Only", url: "https://example.com/" }],
  });

  await click(harness, { id: 1, groupId: 8 });

  assert.equal(harness.richCopies[0].text, "Only\nhttps://example.com/");
  assert.equal(harness.richCopies[0].html, "<ul><li><a href=\"https://example.com/\">Only</a></li></ul>");
});

test("an ungrouped tab opens the copy error page without copying", async () => {
  const harness = menuHarness();

  await click(harness, { id: 3, groupId: -1 });

  assert.deepEqual(harness.copied, []);
  assert.deepEqual(harness.openedTabs.map(({ url }) => url), ["chrome-extension://test/copy-error.html#not-in-group"]);
});

test("a group tab without a URL copies nothing", async () => {
  const harness = menuHarness({ groups: { 8: { id: 8, title: "" } }, tabs: [
    { id: 1, groupId: 8, index: 0, url: "https://example.com/first" },
    { id: 2, groupId: 8, index: 1 },
  ] });

  await click(harness, { id: 1, groupId: 8 });

  assert.deepEqual(harness.richCopies, []);
  assert.deepEqual(harness.openedTabs.map(({ url }) => url), ["chrome-extension://test/copy-error.html#group-changed"]);
});
