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
```

The Node tests cover the manifest, copy flow, offscreen clipboard write, setup
page, and profile-move handoff, including failure and source-tab behavior. They
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
   macOS shows Command+Shift+C and the ProfileBar section; Windows/Linux show
   Ctrl+Shift+C and hide that section. On macOS, check that the profile-move
   example shows the divider and stays readable in a narrow window. Check that
   the shortcut keys press in sequence, and that reduced-motion mode keeps
   both the keys and profile-move example still.
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
5. Repeat on a protected page such as `chrome://extensions`. The URL should
   still copy, but Chrome does not allow the on-page toast there.
6. On macOS with ProfileBar Dev installed, click **Enable ProfileBar access**
   on the setup page. Confirm Chrome requests the native messaging permission
   only then and the page reports access enabled. Confirm the profile menu
   updates without using **Refresh profiles**. Select another profile from an
   HTTP page and confirm the destination opens before the source tab closes.
   Revoking permission should return the menu to its enable action.
7. With the development native host unavailable, try again. Confirm the
   original tab stays open and the extension offers setup guidance. Repeat the
   copy shortcut to confirm it still works without ProfileBar.
8. If the source tab navigates during the handoff, confirm it stays open and
   the extension explains that the destination also opened.
9. Select two HTTP tabs in the same Chrome window, right-click one selected
   tab, and choose **Enable selected tab moves…**. Confirm Chrome asks for
   optional tab access. Choose a destination; both pages should open in
   tab-strip order, and both originals should close. Repeat after denying
   access; neither original should close. Repeat with a selected
   `chrome://` tab; neither page should move.

Check keyboard focus and reduced-motion behavior when changing the setup page
or toast. A successful Node test run alone does not establish that Chrome
assigned the shortcut or that clipboard access worked in the browser.

## Package check

After the checks above, run `./scripts/package.sh`, then validate the reported
archive with `unzip -t path/to/archive.zip`. The archive must contain the
runtime files listed in `scripts/package.sh`; source assets, tests, and store
screenshots are not part of the extension upload.
