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
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab?.url) {
      throw new Error("The active tab does not expose a URL.");
    }

    await copyUrl(tab.url);

    if (tab.id !== undefined) {
      await showToast(tab.id);
    }
  } catch (error) {
    console.error("Could not copy the current URL:", error);
  }
});

let creatingOffscreen;

async function copyUrl(url) {
  await ensureOffscreenDocument();

  const result = await chrome.runtime.sendMessage({
    target: "offscreen",
    type: "copy-text",
    text: url,
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
        justification: "Copy the active tab URL after the keyboard command.",
      })
      .finally(() => {
        creatingOffscreen = undefined;
      });
  }

  await creatingOffscreen;
}

async function showToast(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["toast.js"],
    });
  } catch (error) {
    console.debug("Copied the URL without showing a toast:", error);
  }
}

try {
  importScripts("profile-menu.js");
} catch (error) {
  console.error("Could not load the profile menu:", error);
}
