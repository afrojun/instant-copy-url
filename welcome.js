const status = document.querySelector("#status");
const fallback = document.querySelector("#fallback");
const openShortcuts = document.querySelector("#open-shortcuts");

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

async function showShortcutStatus() {
  const commands = await chrome.commands.getAll();
  const copyCommand = commands.find(({ name }) => name === "copy-current-url");

  if (copyCommand?.shortcut) {
    status.dataset.state = "ready";
    status.textContent = `Ready: ${formatShortcut(copyCommand.shortcut)}`;
    return;
  }

  status.dataset.state = "missing";
  status.textContent = "Shortcut not assigned";
}

function formatShortcut(shortcut) {
  return shortcut
    .replace("Command", "⌘")
    .replace("MacCtrl", "⌃")
    .replace("Ctrl", "⌃")
    .replace("Option", "⌥")
    .replace("Alt", "⌥")
    .replace("Shift", "⇧")
    .replaceAll("+", " ");
}
