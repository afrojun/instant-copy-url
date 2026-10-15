const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "group-menu.js"), "utf8");

function menuHarness({ tabContext = true, tabs = [] } = {}) {
  const listeners = {};
  const menus = [];
  const openedTabs = [];
  const copied = [];
  const toasts = [];
  const chrome = {
    runtime: {
      onInstalled: { addListener(listener) { listeners.installed = listener; } },
      onStartup: { addListener(listener) { listeners.startup = listener; } },
      getURL(file) { return `chrome-extension://test/${file}`; },
    },
    contextMenus: {
      ContextType: tabContext ? { TAB: "tab" } : {},
      onClicked: { addListener(listener) { listeners.clicked = listener; } },
      removeAll(callback) { menus.length = 0; callback(); },
      create(item, callback) { menus.push(item); callback(); },
    },
    tabs: {
      async create(tab) { openedTabs.push(tab); },
      async query({ groupId }) { return tabs.filter((tab) => tab.groupId === groupId); },
    },
  };
  vm.runInNewContext(source, {
    chrome,
    copyUrls: async (urls) => copied.push([...urls]),
    showToast: async (id, count) => toasts.push({ id, count }),
    console: { error() {} },
  });
  return { listeners, menus, openedTabs, copied, toasts };
}

async function click(harness, tab) {
  harness.listeners.clicked({ menuItemId: "copy-group-urls" }, tab);
  await new Promise(setImmediate);
}

test("the tab menu has a single Copy group URLs item", () => {
  const harness = menuHarness();
  harness.listeners.installed({ reason: "install" });
  harness.listeners.startup();

  assert.deepEqual(JSON.parse(JSON.stringify(harness.menus)), [
    { id: "copy-group-urls", title: "Copy group URLs", contexts: ["tab"] },
  ]);
});

test("Chrome without tab menus gets no group item", () => {
  const harness = menuHarness({ tabContext: false });
  harness.listeners.installed({ reason: "install" });

  assert.equal(harness.menus.length, 0);
});

test("copy group URLs includes every member in strip order", async () => {
  const harness = menuHarness({ tabs: [
    { id: 2, groupId: 8, index: 1, url: "https://example.com/second" },
    { id: 1, groupId: 8, index: 0, url: "https://example.com/first" },
    { id: 3, groupId: -1, index: 2, url: "https://example.com/other" },
  ] });

  await click(harness, { id: 2, groupId: 8 });

  assert.deepEqual(harness.copied, [["https://example.com/first", "https://example.com/second"]]);
  assert.deepEqual(harness.toasts, [{ id: 2, count: 2 }]);
  assert.equal(harness.openedTabs.length, 0);
});

test("an ungrouped tab opens the copy error page without copying", async () => {
  const harness = menuHarness();

  await click(harness, { id: 3, groupId: -1 });

  assert.deepEqual(harness.copied, []);
  assert.deepEqual(harness.openedTabs.map(({ url }) => url), ["chrome-extension://test/copy-error.html#not-in-group"]);
});

test("a group tab without a URL copies nothing", async () => {
  const harness = menuHarness({ tabs: [
    { id: 1, groupId: 8, index: 0, url: "https://example.com/first" },
    { id: 2, groupId: 8, index: 1 },
  ] });

  await click(harness, { id: 1, groupId: 8 });

  assert.deepEqual(harness.copied, []);
  assert.deepEqual(harness.openedTabs.map(({ url }) => url), ["chrome-extension://test/copy-error.html#group-changed"]);
});
