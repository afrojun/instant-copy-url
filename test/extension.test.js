const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");

function runScript(file, context) {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  vm.runInNewContext(source, context);
}

test("manifest keeps native messaging optional while adding profile menus", () => {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(root, "manifest.json"), "utf8"),
  );

  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.name, "Instant Copy URL");
  assert.equal(
    manifest.description,
    "Copy a tab URL with a shortcut, or move it to another Chrome profile with ProfileBar on Mac.",
  );
  assert.deepEqual(manifest.icons, {
    16: "icons/icon-16.png",
    32: "icons/icon-32.png",
    48: "icons/icon-48.png",
    128: "icons/icon-128.png",
  });
  assert.deepEqual(manifest.permissions, [
    "activeTab",
    "clipboardWrite",
    "offscreen",
    "scripting",
    "contextMenus",
  ]);
  assert.deepEqual(manifest.optional_permissions, ["nativeMessaging"]);
  assert.equal(
    manifest.commands["copy-current-url"].suggested_key.mac,
    "Command+Shift+C",
  );
  assert.equal(
    manifest.commands["copy-current-url"].suggested_key.default,
    "Ctrl+Shift+C",
  );
  assert.deepEqual(manifest.options_ui, {
    page: "welcome.html",
    open_in_tab: true,
  });
  assert.equal(manifest.host_permissions, undefined);
});

test("the background opens setup on install and copies the active tab URL", async () => {
  let commandListener;
  let installListener;
  let createdDocument;
  let sentMessage;
  let scriptInjection;
  let optionsPageOpens = 0;

  const chrome = {
    commands: {
      onCommand: {
        addListener(listener) {
          commandListener = listener;
        },
      },
    },
    tabs: {
      async query() {
        return [{ id: 42, url: "https://example.com/path?query=value" }];
      },
    },
    runtime: {
      onInstalled: {
        addListener(listener) {
          installListener = listener;
        },
      },
      async openOptionsPage() {
        optionsPageOpens += 1;
      },
      getURL(file) {
        return `chrome-extension://test/${file}`;
      },
      async getContexts() {
        return [];
      },
      async sendMessage(message) {
        sentMessage = message;
        return { ok: true };
      },
    },
    offscreen: {
      async createDocument(options) {
        createdDocument = options;
      },
    },
    scripting: {
      async executeScript(options) {
        scriptInjection = options;
      },
    },
  };

  runScript("background.js", { chrome, console, importScripts() {} });

  installListener({ reason: "update" });
  assert.equal(optionsPageOpens, 0);

  installListener({ reason: "install" });
  assert.equal(optionsPageOpens, 1);

  await commandListener("copy-current-url");

  assert.equal(createdDocument.url, "offscreen.html");
  assert.equal(createdDocument.reasons.join(","), "CLIPBOARD");
  assert.equal(
    createdDocument.justification,
    "Copy the active tab URL after the keyboard command.",
  );
  assert.equal(sentMessage.target, "offscreen");
  assert.equal(sentMessage.type, "copy-text");
  assert.equal(sentMessage.text, "https://example.com/path?query=value");
  assert.equal(scriptInjection.target.tabId, 42);
  assert.equal(scriptInjection.files.join(","), "toast.js");
});

test("the offscreen document writes received text to the clipboard", () => {
  let messageListener;
  let selected = false;
  let copied = false;
  let response;

  const textarea = {
    value: "",
    select() {
      selected = true;
    },
  };
  const document = {
    querySelector() {
      return textarea;
    },
    execCommand(command) {
      copied = command === "copy" && selected;
      return copied;
    },
  };
  const chrome = {
    runtime: {
      onMessage: {
        addListener(listener) {
          messageListener = listener;
        },
      },
    },
  };

  runScript("offscreen.js", { chrome, document });

  const listenerResult = messageListener(
    { target: "offscreen", type: "copy-text", text: "https://example.com" },
    {},
    (value) => {
      response = value;
    },
  );

  assert.equal(listenerResult, undefined);
  assert.equal(copied, true);
  assert.equal(response.ok, true);
  assert.equal(textarea.value, "");
});

test("the setup page reports shortcut state and opens Chrome settings", async () => {
  const listeners = {};
  let commands = [{ name: "copy-current-url", shortcut: "" }];
  let openedUrl;
  let profileAccess = false;
  let grantProfileAccess = false;
  let permissionRequests = 0;

  const elements = {
    "#status": { dataset: {}, textContent: "" },
    "#shortcut-heading": { textContent: "" },
    "#shortcut-intro": { textContent: "" },
    "#shortcut-steps": { hidden: false },
    "#fallback": { hidden: true },
    "#shortcut-keys": {
      setAttribute(name, value) { this[name] = value; },
    },
    "#shortcut-modifier": { textContent: "" },
    ".profilebar": { hidden: true },
    "#open-shortcuts": {
      addEventListener(event, listener) {
        listeners.shortcutClick = listener;
      },
    },
    "#enable-profilebar": {
      disabled: false,
      hidden: false,
      addEventListener(event, listener) {
        listeners.profileClick = listener;
      },
    },
    "#profilebar-status": { textContent: "" },
  };
  const document = {
    querySelector(selector) {
      return elements[selector];
    },
  };
  const window = {
    addEventListener(event, listener) {
      listeners[event] = listener;
    },
  };
  const chrome = {
    commands: {
      async getAll() {
        return commands;
      },
    },
    tabs: {
      async create({ url }) {
        openedUrl = url;
      },
    },
    permissions: {
      async contains() { return profileAccess; },
      async request({ permissions }) {
        assert.deepEqual(Array.from(permissions), ["nativeMessaging"]);
        permissionRequests += 1;
        profileAccess = grantProfileAccess;
        return grantProfileAccess;
      },
    },
    runtime: {
      async getPlatformInfo() { return { os: "mac" }; },
    },
  };

  runScript("welcome.js", { chrome, console, document, window });
  await new Promise(setImmediate);

  assert.equal(elements["#status"].dataset.state, "missing");
  assert.equal(elements["#status"].textContent, "Shortcut not assigned");
  assert.equal(elements["#shortcut-heading"].textContent, "Choose a copy shortcut");
  assert.equal(elements["#shortcut-steps"].hidden, false);
  assert.equal(elements["#shortcut-modifier"].textContent, "⌘");
  assert.equal(elements["#shortcut-keys"]["aria-label"], "Command Shift C");
  assert.equal(elements[".profilebar"].hidden, false);
  assert.equal(elements["#enable-profilebar"].hidden, false);

  listeners.profileClick();
  assert.equal(permissionRequests, 1);
  await new Promise(setImmediate);
  assert.match(elements["#profilebar-status"].textContent, /not enabled/);
  assert.equal(elements["#enable-profilebar"].disabled, false);

  grantProfileAccess = true;
  listeners.profileClick();
  assert.equal(permissionRequests, 2);
  await new Promise(setImmediate);
  assert.equal(elements["#enable-profilebar"].hidden, true);
  assert.match(elements["#profilebar-status"].textContent, /Access enabled/);

  commands = [{ name: "copy-current-url", shortcut: "Command+Shift+C" }];
  await listeners.focus();
  assert.equal(elements["#status"].dataset.state, "ready");
  assert.equal(elements["#status"].textContent, "Assigned: ⌘ ⇧ C");
  assert.equal(elements["#shortcut-heading"].textContent, "Shortcut assigned");
  assert.equal(elements["#shortcut-steps"].hidden, true);
  assert.equal(elements["#open-shortcuts"].textContent, "Change shortcut");

  await listeners.shortcutClick();
  assert.equal(openedUrl, "chrome://extensions/shortcuts");
});

test("the setup page shows the Windows and Linux shortcut without alternate copy", async () => {
  const elements = {
    "#status": { dataset: {}, textContent: "" },
    "#shortcut-heading": { textContent: "" },
    "#shortcut-intro": { textContent: "" },
    "#shortcut-steps": { hidden: false },
    "#fallback": { hidden: true },
    "#shortcut-keys": { setAttribute(name, value) { this[name] = value; } },
    "#shortcut-modifier": { textContent: "" },
    ".profilebar": { hidden: true },
    "#open-shortcuts": { addEventListener() {} },
    "#enable-profilebar": { addEventListener() {} },
    "#profilebar-status": { textContent: "" },
  };
  const chrome = {
    commands: { async getAll() { return [{ name: "copy-current-url", shortcut: "Ctrl+Shift+C" }]; } },
    runtime: { async getPlatformInfo() { return { os: "win" }; } },
    permissions: { async contains() { return false; } },
  };
  runScript("welcome.js", {
    chrome,
    document: { querySelector(selector) { return elements[selector]; } },
    window: { addEventListener() {} },
  });
  await new Promise(setImmediate);

  assert.equal(elements["#shortcut-modifier"].textContent, "Ctrl");
  assert.equal(elements["#shortcut-keys"]["aria-label"], "Control Shift C");
  assert.equal(elements[".profilebar"].hidden, true);
  assert.equal(elements["#status"].textContent, "Assigned: Ctrl ⇧ C");
  assert.equal(elements["#enable-profilebar"].hidden, true);
});

test("the local Mac preview shows ProfileBar without offering a permission prompt", async () => {
  const elements = {
    "#status": { dataset: {}, textContent: "" },
    "#shortcut-heading": { textContent: "" },
    "#shortcut-intro": { textContent: "" },
    "#shortcut-steps": { hidden: false },
    "#fallback": { hidden: true },
    "#shortcut-keys": { setAttribute() {} },
    "#shortcut-modifier": { textContent: "" },
    ".profilebar": { hidden: true },
    "#open-shortcuts": { addEventListener() {} },
    "#enable-profilebar": { addEventListener() {}, disabled: false },
    "#profilebar-status": { textContent: "" },
  };
  runScript("welcome.js", {
    navigator: { platform: "MacIntel" },
    document: { querySelector(selector) { return elements[selector]; } },
    window: { addEventListener() {} },
  });
  await new Promise(setImmediate);

  assert.equal(elements[".profilebar"].hidden, false);
  assert.equal(elements["#enable-profilebar"].disabled, true);
  assert.match(elements["#profilebar-status"].textContent, /installed extension/);
});
