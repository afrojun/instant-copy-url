const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "profile-menu.js"), "utf8");
const storeID = "dhalfjnfoocnfpppmkpidbliccemicno";

function menuHarness({ granted = false, hostResponse = { ok: true, profiles: [] }, tabContext = true, os = "mac" } = {}) {
  const listeners = {};
  const menus = [];
  const nativeMessages = [];
  const openedTabs = [];
  let hasPermission = granted;
  let nativeError;
  const chrome = {
    runtime: {
      id: storeID,
      onInstalled: { addListener(listener) { listeners.installed = listener; } },
      onStartup: { addListener(listener) { listeners.startup = listener; } },
      getURL(file) { return `chrome-extension://${storeID}/${file}`; },
      async getPlatformInfo() { return { os }; },
      async sendNativeMessage(host, message) {
        nativeMessages.push({ host, message });
        if (nativeError) throw nativeError;
        return hostResponse;
      },
    },
    permissions: {
      onRemoved: { addListener(listener) { listeners.removed = listener; } },
      async contains() { return hasPermission; },
      async request() { hasPermission = true; return true; },
    },
    contextMenus: {
      ContextType: tabContext ? { TAB: "tab" } : {},
      onClicked: { addListener(listener) { listeners.clicked = listener; } },
      removeAll(callback) { menus.length = 0; callback(); },
      create(item, callback) { menus.push(item); callback(); },
    },
    tabs: {
      async create(tab) { openedTabs.push(tab); },
    },
  };
  const context = vm.createContext({ chrome, console: { debug() {}, error: console.error } });
  vm.runInContext(source, context);
  return {
    listeners,
    menus,
    nativeMessages,
    openedTabs,
    refresh: () => vm.runInContext("refreshProfileMenu()", context),
    setNativeError(error) { nativeError = error; },
  };
}

test("profile menu starts with optional enablement and keeps a page fallback", async () => {
  const harness = menuHarness({ tabContext: false });
  await harness.refresh();

  assert.deepEqual(harness.menus.map((item) => item.id), [
    "open-in-profile", "enable-profilebar", "refresh-profiles",
  ]);
  assert.equal(harness.menus[0].contexts.join(","), "page");
  assert.equal(harness.nativeMessages.length, 0);
});

test("non-macOS users see availability without a permission request", async () => {
  const harness = menuHarness({ os: "win" });
  await harness.refresh();
  assert.ok(harness.menus.some((item) => item.id === "mac-only" && item.enabled === false));
  assert.ok(!harness.menus.some((item) => item.id === "enable-profilebar"));
  assert.equal(harness.nativeMessages.length, 0);
});

test("enabling integration lists profiles and opens the clicked tab in the selected profile", async () => {
  const harness = menuHarness({
    hostResponse: { ok: true, profiles: [
      { directory: "Default", name: "Work" },
      { directory: "Profile 2", name: "Work" },
    ] },
  });
  await harness.refresh();
  harness.listeners.clicked({ menuItemId: "enable-profilebar" });
  await new Promise(setImmediate);
  await harness.refresh();

  const profiles = harness.menus.filter((item) => item.id.startsWith("profile:"));
  assert.deepEqual(profiles.map((item) => item.title), ["Work (Default)", "Work (Profile 2)"]);
  assert.equal(harness.menus[0].contexts.join(","), "page,tab");

  harness.listeners.clicked(
    { menuItemId: "profile:Profile%202", pageUrl: "https://example.com/from-tab" },
    { url: "https://example.com/other" },
  );
  await new Promise(setImmediate);
  assert.equal(harness.nativeMessages.at(-1).host, "dev.afrojun.profilebar");
  assert.equal(harness.nativeMessages.at(-1).message.type, "openURL");
  assert.equal(harness.nativeMessages.at(-1).message.profileDirectory, "Profile 2");
  assert.equal(harness.nativeMessages.at(-1).message.url, "https://example.com/from-tab");
  assert.equal(harness.openedTabs.length, 0);
});

test("missing helper and unsupported pages fail without opening another profile", async () => {
  const harness = menuHarness({ granted: true });
  harness.setNativeError(new Error("Specified native messaging host not found"));
  await harness.refresh();
  assert.ok(harness.menus.some((item) => item.id === "setup-profilebar"));

  harness.listeners.clicked({ menuItemId: "profile:Default", pageUrl: "chrome://settings" });
  await new Promise(setImmediate);
  assert.equal(harness.openedTabs.length, 1);
  assert.match(harness.openedTabs[0].url, /unsupported-url$/);
  assert.equal(harness.nativeMessages.length, 1);
});

test("a malformed profile list shows the setup action", async () => {
  const harness = menuHarness({ granted: true, hostResponse: { ok: true, profiles: [null] } });
  await harness.refresh();
  assert.ok(harness.menus.some((item) => item.id === "setup-profilebar"));
});
