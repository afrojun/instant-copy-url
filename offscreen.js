const clipboard = document.querySelector("#clipboard");

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.target !== "offscreen" || message.type !== "copy-text") {
    return false;
  }

  try {
    if (typeof message.text !== "string" || !["string", "undefined"].includes(typeof message.html)) {
      throw new TypeError("Clipboard content must be a string.");
    }

    if (message.html !== undefined) {
      document.addEventListener("copy", (event) => {
        event.clipboardData.setData("text/plain", message.text);
        event.clipboardData.setData("text/html", message.html);
        event.preventDefault();
      }, { once: true });
    }
    clipboard.value = message.text;
    clipboard.select();

    if (!document.execCommand("copy")) {
      throw new Error("Chrome rejected the clipboard write.");
    }

    sendResponse({ ok: true });
  } catch (error) {
    sendResponse({ ok: false, error: error.message });
  } finally {
    clipboard.value = "";
  }
});
