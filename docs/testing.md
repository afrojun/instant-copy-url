# Testing Instant Copy URL

Use Node.js for the automated checks, Chrome for the live check, and `zip` and
`unzip` for packaging. The extension needs no dependency install or compilation.

## Automated checks

From the repository root, run:

```sh
node --test
node --check background.js
node --check offscreen.js
node --check toast.js
node --check welcome.js
node --check tab-menu.js
node --check copy-error.js
```

The Node tests cover the manifest, copy flow, toast, offscreen clipboard write,
setup page, and the tab menu items, including their error paths. They
do not run the extension inside Chrome.

## Live Chrome check

Run `./scripts/build-dev.py`, then load `dist/instant-copy-url-dev` in Chrome
(`chrome://extensions` → **Developer mode** → **Load unpacked**). Reload
**Instant Copy URL Dev** there after rebuilding. Before a release, check the
full flow:

1. On a fresh install, confirm the setup page opens. Check that it reports
   whether the shortcut is assigned. The Dev copy has no suggested shortcut;
   Chrome may also leave the published copy's suggestion unassigned. Check that
   an assigned shortcut shows its key combination and hides the manual steps, while
   an unassigned shortcut shows the steps and shortcut settings button. Check that
   macOS shows Command+Shift+C and Windows/Linux show Ctrl+Shift+C. Check that
   the page stays readable in a narrow window, that the shortcut keys press in
   sequence, and that reduced-motion mode keeps the keys still.
2. If needed, use the setup page's button to open
   `chrome://extensions/shortcuts` and assign the command. On macOS, try
   Command+Shift+C; on Windows and Linux, try Ctrl+Shift+C. If Chrome reserves
   that combination, choose another one and verify that the setup page shows
   the assigned shortcut when focused again.
3. Open a normal HTTPS page, invoke the assigned shortcut, and paste into a
   text field. The pasted text should equal the active tab's full URL.
4. Confirm the blue **URL copied** toast appears at the top left. Close it
   early, then copy again and let it disappear on its own after about four
   seconds.
5. Highlight two tabs in the same window and invoke the shortcut. Paste into
   a text field: their URLs should appear in tab-strip order, one per line.
   Confirm the toast says **2 URLs copied**.
6. Repeat on a protected page such as `chrome://extensions`. The URL should
   still copy, but Chrome does not allow the on-page toast there.
7. In Chrome 150 or later, select three tabs, right-click one of them, and
   choose **Copy tab URLs**. Confirm the clipboard has their URLs in tab order
   and the toast appears on the active tab. Right-click a tab outside the
   selection and confirm only that tab's URL copies.
8. In a window with a named group, right-click a tab in the group and choose
   **Copy group URLs**. Paste into a Google Doc or Slack message: it should
   show the group name, then each page title linked to its URL, in tab order.
   Paste into a plain-text editor: it should show the group name, then each
   title above its URL. The toast should report the number of pages copied.
9. Right-click an ungrouped tab in the same window and choose
   **Copy group URLs**. Confirm nothing is copied and a help page explains that
   the tab is not in a group.
10. In a window with no groups, confirm the tab menu does not offer
    **Copy group URLs**. Create a group and confirm it appears without
    reloading the extension.

Check keyboard focus and reduced-motion behavior when changing the setup page
or toast. A successful Node test run alone does not establish that Chrome
assigned the shortcut or that clipboard access worked in the browser.

## Package check

After the checks above, run `./scripts/package.sh`, then validate the reported
archive with `unzip -t path/to/archive.zip`. The archive must contain the
runtime files listed in `scripts/package.sh`; source assets, tests, and store
screenshots are not part of the extension upload.
