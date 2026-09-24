# Chrome Web Store listing

## Store listing

**Name:** Instant Copy URL

**Summary:** Copy a tab URL with a shortcut, or move it to another Chrome profile with ProfileBar on Mac.

**Category:** Productivity

**Language:** English

**Detailed description:**

Choose Command+Shift+C on macOS or Ctrl+Shift+C on Windows and Linux during the
one-time setup. Once assigned, the shortcut skips the address bar and shows a
clear confirmation when the URL is ready to paste.

On macOS, install ProfileBar to move a page URL to another Chrome profile from
its right-click menu. The original tab closes after ProfileBar reports a
successful handoff. The setup page introduces this optional feature, and
the native messaging permission is requested only when you enable it from the
menu. The copy shortcut still works on its own.

Everything happens on your device. For a selected profile action, the URL is
sent only to the local ProfileBar app, which asks Chrome to open it. The
extension stores no URLs and has no analytics, ads, tracking, accounts, remote
code, or network requests.
Its source code is available under the MIT License.

**Website:** https://afrojun.dev/instant-copy-url/

**Support:** https://github.com/afrojun/instant-copy-url/issues

**Privacy policy:**
https://github.com/afrojun/instant-copy-url/blob/main/PRIVACY.md

## Privacy

**Single purpose:** Let the user act on the current tab URL: copy it to the
clipboard or move it to a chosen Chrome profile.

**Permission justifications:**

- `activeTab`: Read the active tab's URL only after the user invokes the
  extension's keyboard shortcut.
- `clipboardWrite`: Write the active tab's URL to the user's clipboard.
- `offscreen`: Provide the local document required to access the clipboard from
  a Manifest V3 extension service worker.
- `scripting`: Insert the local confirmation message into the active page after
  the URL has been copied.
- `contextMenus`: Show the user-selected profile action in the right-click menu.
- Optional `nativeMessaging`: Exchange profile names and a selected URL with
  the local ProfileBar app after the user enables the integration.

**Remote code:** No. All executable code is included in the extension package.

**Data handling:** The extension handles the active tab URL, which is web
browsing activity. It processes the URL locally after the user invokes the
shortcut or chooses a profile from the right-click menu. The URL is sent only
to the local ProfileBar app for the selected profile action. It is not retained
by the extension or ProfileBar, and neither component collects other user data.

Certify the limited-use declarations in the Dashboard. Check the Dashboard's
current wording before submission because Google may change the available data
categories.

## Distribution

- Free
- Public
- All regions
- Non-trader

## Test instructions

1. Install the extension.
2. If the setup page says the shortcut is not assigned, use its button to open
   Chrome's shortcut settings and assign the displayed shortcut.
3. Open a normal HTTPS page.
4. Invoke the shortcut.
5. Confirm that the active tab URL is on the clipboard and that the blue
   “URL copied” message appears at the top left of the page.
6. On macOS with ProfileBar installed, enable its optional integration. Right-click
   an HTTP page or tab, choose **Move tab to profile**, and select another
   profile. Confirm the page opens there and the original tab closes. If the
   helper cannot open it, confirm the original tab stays open.

Chrome does not allow scripts on protected pages such as `chrome://` pages. The
URL is still copied there, but the confirmation message cannot be shown.

## Assets

- Store icon: `icons/icon-128.png`
- Lead screenshot: `store-assets/url-copied.png`
- Setup screenshot: `store-assets/setup.png`
- Small promo tile: `store-assets/small-promo.png`
- Marquee promo tile: `store-assets/marquee-promo.png`
