# Copy Current URL

A local Chrome extension that copies the active tab URL when you press
`Command+Shift+C` on macOS and confirms the copy with a small in-page toast.

## Privacy

The extension has:

- No host permissions.
- No network access.
- No storage or analytics.
- Temporary access to the active tab only after you invoke the shortcut.
- No access to other tabs or previously visited pages.

## Install

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode**.
3. Select **Load unpacked**.
4. Choose this directory.

Chrome should assign `Command+Shift+C` automatically. If it does not, open
the setup page that appears after installation and follow its instructions. You
can reopen that page later from the extension's **Details** page by selecting
**Extension options**.

## Test

```sh
node --test
```

## Permissions

- `activeTab`: read the current tab URL only after the keyboard command.
- `clipboardWrite`: place that URL on the clipboard.
- `offscreen`: host the minimal document required for clipboard access from a
  Manifest V3 background service worker.
- `scripting`: show the local confirmation toast on the active page after a
  successful copy.
