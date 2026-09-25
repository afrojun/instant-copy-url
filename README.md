# Instant Copy URL

A Chrome extension that instantly copies the active tab URL when you press
`Command+Shift+C` on macOS or `Ctrl+Shift+C` elsewhere, then confirms the copy
with a small in-page toast.

With [ProfileBar](https://github.com/afrojun/profilebar) installed on macOS,
right-click a page or tab and choose **Move tab to profile** to open its URL in
another Chrome profile and close the original tab after ProfileBar reports
success. Enable ProfileBar access on the setup page or from that menu; Chrome
then asks for the optional native messaging permission. The copy
shortcut works without ProfileBar or that permission.

The setup page can request optional ProfileBar access on macOS. You can also
enable it from **Move tab to profile** in the right-click menu. The setup and
error pages link to the [tab-move guide](https://afrojun.dev/instant-copy-url/#move-tabs),
[ProfileBar setup](https://afrojun.dev/profilebar/#move-tabs), and
[help & feedback](https://github.com/afrojun/instant-copy-url/issues/new/choose).
When ProfileBar is missing, the right-click menu opens the setup guide.

## Privacy

The extension has:

- No host permissions.
- No network access from the extension.
- No storage or analytics.
- Access to the current URL after you invoke the shortcut or choose a profile
  from the right-click menu.
- No access to previously visited pages.

When you choose a profile, the extension sends that URL and the selected profile
directory to ProfileBar through Chrome's local native messaging channel.
ProfileBar passes them to Chrome to open the page. The URL is not stored by
either component. Chrome 150 and later show the menu on tabs as well as pages;
older supported versions show it on pages.

This moves the URL, not the tab's browsing history, form contents, scroll
position, pinned state, or group membership. If ProfileBar cannot open the URL,
the original tab stays open. If the original tab changes during the handoff,
the extension leaves it open and explains what happened.

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
The optional ProfileBar connection uses a separate development native host.
Give the dev extension ID shown by Chrome to `PROFILEBAR_DEV_EXTENSION_ID`
when launching ProfileBar Dev.

The published extension suggests its copy shortcut automatically. If Chrome
does not assign it, open the setup page that appears after installation and
follow its instructions. You can reopen that page later from the extension's
**Details** page by selecting **Extension options**. The same setup page
introduces the optional ProfileBar integration on macOS.

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

- `activeTab`: read the current tab URL only after the keyboard command.
- `clipboardWrite`: place that URL on the clipboard.
- `offscreen`: host the minimal document required for clipboard access from a
  Manifest V3 background service worker.
- `scripting`: show the local confirmation toast on the active page after a
  successful copy.
- `contextMenus`: add the right-click profile menu.
- Optional `nativeMessaging`: send a selected page URL and profile directory
  to ProfileBar on this Mac. Chrome asks only if you enable the integration.
