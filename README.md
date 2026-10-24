# Instant Copy URL

A Chrome extension that copies the current tab URL, or all highlighted tab
URLs, when you press `Command+Shift+C` on macOS or `Ctrl+Shift+C` elsewhere.
Multiple URLs are copied in tab order, one per line. A small in-page toast
confirms the copy.

In Chrome 150 and later, right-click a tab and choose **Copy tab URLs** to copy
the selected tabs, or **Copy group URLs** to copy its whole group in tab order.
A group copies with its name and each page's title: apps that accept rich text
get linked titles, and plain-text apps get each title above its URL.
**Copy group URLs** appears while the focused window has a tab group. If
something goes wrong, a short help page explains what happened.

Moving tabs between Chrome profiles on a Mac is available in
[ProfileBar for Chrome](https://afrojun.dev/profilebar/).

## Privacy

The extension has:

- No host permissions.
- No network access from the extension.
- No storage or analytics.
- Permission to read tab URLs. The extension reads highlighted tabs for the
  copy shortcut and **Copy tab URLs**, and the clicked tab's group for
  **Copy group URLs**.
- No access to previously visited pages.

URLs stay on your device. The extension copies them to the clipboard and
nothing else.

## Install

For the published extension, use the Chrome Web Store. For a separate local
development copy:

```sh
./scripts/build-dev.py
```

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode**.
3. Select **Load unpacked**.
4. Choose `dist/instant-copy-url-dev` from the command output.

Chrome lists this copy as **Instant Copy URL Dev**. Its fixed folder keeps its
extension ID stable across rebuilds. After rebuilding, select **Reload** for
Instant Copy URL Dev in `chrome://extensions` to pick up new code and icons.
The dev copy does not claim the production copy shortcut; assign a separate
shortcut under `chrome://extensions/shortcuts` if you want to test copying.

The published extension suggests its copy shortcut automatically. If Chrome
does not assign it, open the setup page that appears after installation and
follow its instructions. You can reopen that page later from the extension's
**Details** page by selecting **Extension options**.

## Test

```sh
node --test
```

Before a release, also follow the live browser and package checks in
[`docs/testing.md`](docs/testing.md).

## Package

```sh
./scripts/package.sh
```

The Chrome Web Store upload is written to `dist/`. Store listing copy and
submission notes are in [`STORE_LISTING.md`](STORE_LISTING.md).

## Release

The [release workflow](.github/workflows/release.yml) runs the Node checks and
package check on pull requests and pushes to `main`. Pushing a tag matching the
manifest version (for example, `v1.5.1` for version `1.5.1`) also uploads that
package to the Chrome Web Store and submits it for automatic publication after
review. It does not update store listing text or images.

Before the first tagged release, complete the one-time setup in
[`docs/releasing.md`](docs/releasing.md). Do not tag the already published
`1.5.0` version: the Web Store requires a higher version for an update.

## Permissions

- `activeTab`: get temporary access to the current page after the keyboard
  command to show the confirmation toast.
- `tabs`: read the URLs of highlighted tabs, or the titles and URLs of the
  clicked tab's group, for copying. This core permission is requested when the
  extension is installed or updated.
- `tabGroups`: read the copied group's name, and notice groups being created or
  removed to show **Copy group URLs** only when the window has one.
- `clipboardWrite`: place the selected URLs on the clipboard.
- `offscreen`: host the minimal document required for clipboard access from a
  Manifest V3 background service worker.
- `scripting`: show the local confirmation toast on the active page after a
  successful copy.
- `contextMenus`: add the **Copy tab URLs** and **Copy group URLs** items to
  the tab menu.
