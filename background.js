const COPY_COMMAND = "copy-current-url";
const OFFSCREEN_PAGE = "offscreen.html";

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === "install") {
    void chrome.runtime.openOptionsPage();
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== COPY_COMMAND) {
    return;
  }

  try {
    const tabs = await chrome.tabs.query({
      highlighted: true,
      currentWindow: true,
    });

    if (tabs.length === 0 || tabs.some((tab) => !tab.url)) {
      throw new Error("A selected tab does not expose a URL.");
    }

    tabs.sort((a, b) => a.index - b.index);
    await copyUrls(tabs.map((tab) => tab.url));

    const activeTab = tabs.find((tab) => tab.active);
    if (activeTab?.id !== undefined) {
      await showToast(activeTab.id, tabs.length);
    }
  } catch (error) {
    console.error("Could not copy the selected tab URLs:", error);
  }
});

let creatingOffscreen;

async function copyUrls(urls) {
  await ensureOffscreenDocument();

  const result = await chrome.runtime.sendMessage({
    target: "offscreen",
    type: "copy-text",
    text: urls.join("\n"),
  });

  if (!result?.ok) {
    throw new Error(result?.error ?? "The clipboard write failed.");
  }
}

async function ensureOffscreenDocument() {
  const pageUrl = chrome.runtime.getURL(OFFSCREEN_PAGE);
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [pageUrl],
  });

  if (contexts.length > 0) {
    return;
  }

  if (!creatingOffscreen) {
    creatingOffscreen = chrome.offscreen
      .createDocument({
        url: OFFSCREEN_PAGE,
        reasons: ["CLIPBOARD"],
        justification: "Copy the selected tab URLs after the keyboard command.",
      })
      .finally(() => {
        creatingOffscreen = undefined;
      });
  }

  await creatingOffscreen;
}

async function showToast(tabId, count) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["toast.js"],
    });
    await chrome.tabs.sendMessage(tabId, { type: "copy-toast", count });
  } catch (error) {
    console.debug("Copied the URL without showing a toast:", error);
  }
}

try {
  importScripts("profile-menu.js");
} catch (error) {
  console.error("Could not load the profile menu:", error);
}
