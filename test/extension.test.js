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

test("manifest grants only the permissions required for active-tab copying", () => {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(root, "manifest.json"), "utf8"),
  );

  assert.equal(manifest.manifest_version, 3);
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
  ]);
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

  runScript("background.js", { chrome, console });

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

  const elements = {
    "#status": { dataset: {}, textContent: "" },
    "#fallback": { hidden: true },
    "#open-shortcuts": {
      addEventListener(event, listener) {
        listeners[event] = listener;
      },
    },
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
  };

  runScript("welcome.js", { chrome, console, document, window });
  await new Promise(setImmediate);

  assert.equal(elements["#status"].dataset.state, "missing");
  assert.equal(elements["#status"].textContent, "Shortcut not assigned");

  commands = [{ name: "copy-current-url", shortcut: "Command+Shift+C" }];
  await listeners.focus();
  assert.equal(elements["#status"].dataset.state, "ready");
  assert.equal(elements["#status"].textContent, "Ready: ⌘ ⇧ C");

  await listeners.click();
  assert.equal(openedUrl, "chrome://extensions/shortcuts");
});
