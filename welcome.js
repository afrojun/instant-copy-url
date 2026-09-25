const status = document.querySelector("#status");
const shortcutHeading = document.querySelector("#shortcut-heading");
const shortcutIntro = document.querySelector("#shortcut-intro");
const shortcutSteps = document.querySelector("#shortcut-steps");
const fallback = document.querySelector("#fallback");
const openShortcuts = document.querySelector("#open-shortcuts");
const shortcutKeys = document.querySelector("#shortcut-keys");
const shortcutModifier = document.querySelector("#shortcut-modifier");
const profileBarSection = document.querySelector(".profilebar");
const profileBarButton = document.querySelector("#enable-profilebar");
const profileBarStatus = document.querySelector("#profilebar-status");
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

profileBarButton.addEventListener("click", () => {
  profileBarButton.disabled = true;
  void chrome.permissions.request({ permissions: ["nativeMessaging"] })
    .then((granted) => {
      if (granted) return showProfileBarStatus();
      profileBarButton.disabled = false;
      profileBarStatus.textContent = "Access was not enabled. You can try again.";
    })
    .catch((error) => {
      console.error("Could not enable ProfileBar access:", error);
      profileBarButton.disabled = false;
      profileBarStatus.textContent = "Chrome could not request access. Try the Move tab to profile menu.";
    });
});

window.addEventListener("focus", () => Promise.all([
  showShortcutStatus(),
  showProfileBarStatus(),
]));
void showShortcutStatus();
void showProfileBarStatus();
void showPlatform();

async function showPlatform() {
  const { os } = await platformInfo;
  shortcutModifier.textContent = os === "mac" ? "⌘" : "Ctrl";
  shortcutKeys.setAttribute("aria-label", os === "mac" ? "Command Shift C" : "Control Shift C");
  profileBarSection.hidden = os !== "mac";
}

async function showProfileBarStatus() {
  if (!globalThis.chrome?.permissions?.contains) {
    profileBarButton.disabled = true;
    profileBarStatus.textContent = "Open this page from the installed extension to enable access.";
    return;
  }

  const { os } = await platformInfo;
  if (os !== "mac") {
    profileBarButton.hidden = true;
    profileBarStatus.textContent = "ProfileBar is available on macOS.";
    return;
  }

  const enabled = await chrome.permissions.contains({ permissions: ["nativeMessaging"] });
  profileBarButton.hidden = enabled;
  profileBarButton.disabled = false;
  profileBarStatus.textContent = enabled
    ? "Access enabled. Choose Move tab to profile from a page or tab menu."
    : "Access is optional. Chrome will ask when you enable it.";
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
