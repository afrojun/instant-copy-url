# Instant Copy URL

A Chrome extension that instantly copies the active tab URL when you press
`Command+Shift+C` on macOS or `Ctrl+Shift+C` elsewhere, then confirms the copy
with a small in-page toast.

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

Chrome should assign the shortcut automatically. If it does not, open the setup
page that appears after installation and follow its instructions. You can reopen
that page later from the extension's **Details** page by selecting **Extension
options**.

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
