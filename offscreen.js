const clipboard = document.querySelector("#clipboard");

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.target !== "offscreen" || message.type !== "copy-text") {
    return false;
  }

  let writeRichText;
  try {
    if (typeof message.text !== "string" || !["string", "undefined"].includes(typeof message.html)) {
      throw new TypeError("Clipboard content must be a string.");
    }

    if (message.html !== undefined) {
      writeRichText = (event) => {
        event.clipboardData.setData("text/plain", message.text);
        event.clipboardData.setData("text/html", message.html);
        event.preventDefault();
      };
      document.addEventListener("copy", writeRichText, { once: true });
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
    // Chrome may reject the copy without firing the event; a leftover listener would overwrite the next copy.
    if (writeRichText) document.removeEventListener("copy", writeRichText);
  }
});
