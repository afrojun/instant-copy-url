# Testing Instant Copy URL

Use Node.js for the automated checks, Chrome for the live check, and `zip` and
`unzip` for packaging. The extension itself has no install or build step.

## Automated checks

From the repository root, run:

```sh
node --test
node --check background.js
node --check offscreen.js
node --check toast.js
node --check welcome.js
```

The Node tests cover the manifest, copy flow, offscreen clipboard write, and
setup page logic. They do not run the extension inside Chrome.

## Live Chrome check

Use Chrome with an unpacked copy of this directory (`chrome://extensions` →
**Developer mode** → **Load unpacked**). Reload the extension there after code
changes. Before a release, check the full flow:

1. On a fresh install, confirm the setup page opens. Check that it reports
   whether the shortcut is assigned. Chrome may leave the suggested shortcut
   unassigned.
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

Check keyboard focus and reduced-motion behavior when changing the setup page
or toast. A successful Node test run alone does not establish that Chrome
assigned the shortcut or that clipboard access worked in the browser.

## Package check

After the checks above, run `./scripts/package.sh`, then validate the reported
archive with `unzip -t path/to/archive.zip`. The archive must contain the
runtime files listed in `scripts/package.sh`; source assets, tests, and store
screenshots are not part of the extension upload.
