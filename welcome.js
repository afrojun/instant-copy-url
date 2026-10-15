const status = document.querySelector("#status");
const shortcutHeading = document.querySelector("#shortcut-heading");
const shortcutIntro = document.querySelector("#shortcut-intro");
const shortcutSteps = document.querySelector("#shortcut-steps");
const fallback = document.querySelector("#fallback");
const openShortcuts = document.querySelector("#open-shortcuts");
const shortcutKeys = document.querySelector("#shortcut-keys");
const shortcutModifier = document.querySelector("#shortcut-modifier");
const previewPlatform = globalThis.navigator?.userAgentData?.platform
  ?? globalThis.navigator?.platform;
const platformInfo = globalThis.chrome?.runtime?.getPlatformInfo?.() ?? Promise.resolve({
  os: previewPlatform === "macOS" || previewPlatform?.startsWith("Mac") ? "mac" : "other",
});

openShortcuts.addEventListener("click", async () => {
  try {
    await chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
  } catch (error) {
    console.error("Could not open Chrome shortcut settings:", error);
    fallback.hidden = false;
  }
});

window.addEventListener("focus", showShortcutStatus);
void showShortcutStatus();
void showPlatform();

async function showPlatform() {
  const { os } = await platformInfo;
  shortcutModifier.textContent = os === "mac" ? "⌘" : "Ctrl";
  shortcutKeys.setAttribute("aria-label", os === "mac" ? "Command Shift C" : "Control Shift C");
}

async function showShortcutStatus() {
  if (!globalThis.chrome?.commands?.getAll) {
    status.textContent = "Open this page from the installed extension to check your shortcut.";
    return;
  }

  const commands = await chrome.commands.getAll();
  const copyCommand = commands.find(({ name }) => name === "copy-current-url");

  if (copyCommand?.shortcut) {
    status.dataset.state = "ready";
    status.textContent = `Assigned: ${formatShortcut(copyCommand.shortcut)}`;
    shortcutHeading.textContent = "Shortcut assigned";
    shortcutIntro.textContent = "Try it on one tab, or select several to copy their URLs in tab order. You can change the shortcut in Chrome’s settings.";
    shortcutSteps.hidden = true;
    openShortcuts.textContent = "Change shortcut";
    return;
  }

  status.dataset.state = "missing";
  status.textContent = "Shortcut not assigned";
  shortcutHeading.textContent = "Choose a copy shortcut";
  shortcutIntro.textContent = "No shortcut is assigned. Choose one in Chrome’s shortcut settings.";
  shortcutSteps.hidden = false;
  openShortcuts.textContent = "Open shortcut settings";
}

function formatShortcut(shortcut) {
  return shortcut
    .replace("Command", "⌘")
    .replace("MacCtrl", "⌃")
    .replace("Option", "⌥")
    .replace("Alt", "⌥")
    .replace("Shift", "⇧")
    .replaceAll("+", " ");
}
