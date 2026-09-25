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
  const removedTabs = [];
  const errors = [];
  const tabs = new Map();
  let hasPermission = granted;
  let nativeError;
  let closeError;
  let openGate;
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
        if (message.type === "openURL" && openGate) await openGate;
        return hostResponse;
      },
    },
    permissions: {
      onAdded: { addListener(listener) { listeners.added = listener; } },
      onRemoved: { addListener(listener) { listeners.removed = listener; } },
      async contains() { return hasPermission; },
      async request() {
        hasPermission = true;
        listeners.added?.({ permissions: ["nativeMessaging"] });
        return true;
      },
    },
    contextMenus: {
      ContextType: tabContext ? { TAB: "tab" } : {},
      onClicked: { addListener(listener) { listeners.clicked = listener; } },
      removeAll(callback) { menus.length = 0; callback(); },
      create(item, callback) { menus.push(item); callback(); },
    },
    tabs: {
      async create(tab) { openedTabs.push(tab); },
      async get(id) {
        if (!tabs.has(id)) throw new Error("Tab not found");
        return tabs.get(id);
      },
      async remove(id) {
        if (closeError) throw closeError;
        removedTabs.push(id);
        tabs.delete(id);
      },
    },
  };
  const context = vm.createContext({ chrome, console: { debug() {}, error(...args) { errors.push(args); } } });
  vm.runInContext(source, context);
  return {
    listeners,
    menus,
    nativeMessages,
    openedTabs,
    removedTabs,
    errors,
    refresh: () => vm.runInContext("refreshProfileMenu()", context),
    setNativeError(error) { nativeError = error; },
    setCloseError(error) { closeError = error; },
    setOpenGate(gate) { openGate = gate; },
    setTab(tab) { tabs.set(tab.id, tab); },
  };
}

test("profile menu starts with optional enablement and keeps a page fallback", async () => {
  const harness = menuHarness({ tabContext: false });
  await harness.refresh();

  assert.deepEqual(harness.menus.map((item) => item.id), [
    "move-to-profile", "enable-profilebar", "refresh-profiles",
  ]);
  assert.equal(harness.menus[0].contexts.join(","), "page");
  assert.equal(harness.nativeMessages.length, 0);
});

test("granting permission from the setup page refreshes the profile menu", async () => {
  const harness = menuHarness({ granted: true, hostResponse: {
    ok: true,
    profiles: [{ directory: "Default", name: "Personal" }],
  } });
  harness.listeners.added({ permissions: ["nativeMessaging"] });
  await new Promise(setImmediate);

  assert.ok(harness.menus.some((item) => item.id === "profile:Default"));
  assert.ok(!harness.menus.some((item) => item.id === "enable-profilebar"));
});

test("non-macOS users see availability without a permission request", async () => {
  const harness = menuHarness({ os: "win" });
  await harness.refresh();
  assert.ok(harness.menus.some((item) => item.id === "mac-only" && item.enabled === false));
  assert.ok(!harness.menus.some((item) => item.id === "enable-profilebar"));
  assert.equal(harness.nativeMessages.length, 0);
});

test("a successful handoff closes the clicked tab after opening it in the selected profile", async () => {
  const harness = menuHarness({
    hostResponse: { ok: true, profiles: [
      { directory: "Default", name: "Work" },
      { directory: "Profile 2", name: "Work" },
    ] },
  });
  await harness.refresh();
  harness.listeners.clicked({ menuItemId: "enable-profilebar" });
  await new Promise(setImmediate);

  const profiles = harness.menus.filter((item) => item.id.startsWith("profile:"));
  assert.deepEqual(profiles.map((item) => item.title), ["Work (Default)", "Work (Profile 2)"]);
  assert.equal(harness.menus[0].contexts.join(","), "page,tab");
  assert.deepEqual(harness.menus.slice(-2).map((item) => item.id), ["profiles-refresh-divider", "refresh-profiles"]);
  assert.equal(harness.menus.at(-2).type, "separator");

  harness.setTab({ id: 42, url: "https://example.com/from-tab" });
  harness.listeners.clicked(
    { menuItemId: "profile:Profile%202", pageUrl: "https://example.com/from-tab" },
    { id: 42, url: "https://example.com/from-tab" },
  );
  await new Promise(setImmediate);
  assert.equal(harness.nativeMessages.at(-1).host, "dev.afrojun.profilebar");
  assert.equal(harness.nativeMessages.at(-1).message.type, "openURL");
  assert.equal(harness.nativeMessages.at(-1).message.profileDirectory, "Profile 2");
  assert.equal(harness.nativeMessages.at(-1).message.url, "https://example.com/from-tab");
  assert.equal(harness.openedTabs.length, 0);
  assert.deepEqual(harness.removedTabs, [42]);
});

test("the source tab stays open until ProfileBar confirms the handoff", async () => {
  const harness = menuHarness({ granted: true });
  let confirmOpen;
  harness.setOpenGate(new Promise((resolve) => { confirmOpen = resolve; }));
  harness.setTab({ id: 42, url: "https://example.com/" });
  harness.listeners.clicked(
    { menuItemId: "profile:Default", pageUrl: "https://example.com/" },
    { id: 42, url: "https://example.com/" },
  );
  await new Promise(setImmediate);
  assert.deepEqual(harness.removedTabs, []);
  confirmOpen();
  await new Promise(setImmediate);
  assert.deepEqual(harness.removedTabs, [42]);
});

test("missing helper and unsupported pages leave the source tab in place", async () => {
  const harness = menuHarness({ granted: true });
  harness.setNativeError(new Error("Specified native messaging host not found"));
  await harness.refresh();
  assert.ok(harness.menus.some((item) => item.id === "setup-profilebar"));
  harness.listeners.clicked({ menuItemId: "setup-profilebar" });
  await new Promise(setImmediate);
  assert.equal(harness.openedTabs[0].url, "https://afrojun.dev/profilebar/#move-tabs");

  harness.setTab({ id: 42, url: "chrome://settings" });
  harness.listeners.clicked({ menuItemId: "profile:Default", pageUrl: "chrome://settings" }, { id: 42 });
  await new Promise(setImmediate);
  assert.equal(harness.openedTabs.length, 2);
  assert.match(harness.openedTabs[1].url, /unsupported-url$/);
  assert.equal(harness.nativeMessages.length, 1);
  assert.deepEqual(harness.removedTabs, []);
});

test("a changed source tab remains open after the destination opens", async () => {
  const harness = menuHarness({ granted: true });
  harness.setTab({ id: 42, url: "https://example.com/next" });
  harness.listeners.clicked(
    { menuItemId: "profile:Default", pageUrl: "https://example.com/original" },
    { id: 42, url: "https://example.com/original" },
  );
  await new Promise(setImmediate);
  assert.deepEqual(harness.removedTabs, []);
  assert.match(harness.openedTabs[0].url, /source-changed$/);
});

test("an unidentified source tab is not opened elsewhere", async () => {
  const harness = menuHarness({ granted: true });
  harness.listeners.clicked({ menuItemId: "profile:Default", pageUrl: "https://example.com/" });
  await new Promise(setImmediate);
  assert.deepEqual(harness.removedTabs, []);
  assert.equal(harness.nativeMessages.length, 0);
  assert.match(harness.openedTabs[0].url, /source-unavailable$/);
});

test("a failed handoff leaves the source tab in place", async () => {
  const harness = menuHarness({ granted: true });
  harness.setNativeError(new Error("ProfileBar unavailable"));
  harness.setTab({ id: 42, url: "https://example.com/" });
  harness.listeners.clicked(
    { menuItemId: "profile:Default", pageUrl: "https://example.com/" },
    { id: 42, url: "https://example.com/" },
  );
  await new Promise(setImmediate);
  assert.deepEqual(harness.removedTabs, []);
  assert.match(harness.openedTabs[0].url, /profilebar-unavailable$/);
});

test("a close failure reports that the destination opened and source remains", async () => {
  const harness = menuHarness({ granted: true });
  harness.setCloseError(new Error("Could not close tab"));
  harness.setTab({ id: 42, url: "https://example.com/" });
  harness.listeners.clicked(
    { menuItemId: "profile:Default", pageUrl: "https://example.com/" },
    { id: 42, url: "https://example.com/" },
  );
  await new Promise(setImmediate);
  assert.deepEqual(harness.removedTabs, []);
  assert.match(harness.openedTabs[0].url, /close-failed$/);
  assert.equal(harness.errors.length, 1);
});

test("a malformed profile list shows the setup action", async () => {
  const harness = menuHarness({ granted: true, hostResponse: { ok: true, profiles: [null] } });
  await harness.refresh();
  assert.ok(harness.menus.some((item) => item.id === "setup-profilebar"));
});
