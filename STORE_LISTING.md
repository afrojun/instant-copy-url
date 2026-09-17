# Chrome Web Store listing

## Store listing

**Name:** Instant Copy URL

**Summary:** Copy the current tab's URL instantly with one keyboard shortcut.

**Category:** Productivity

**Language:** English

**Detailed description:**

Choose Command+Shift+C on macOS or Ctrl+Shift+C on Windows and Linux during the
one-time setup. Once assigned, the shortcut skips the address bar and shows a
clear confirmation when the URL is ready to paste.

Everything happens on your device. The extension never stores or sends URLs
and has no analytics, ads, tracking, accounts, remote code, or network access.
Its source code is available under the MIT License.

**Website:** https://github.com/afrojun/instant-copy-url

**Support:** https://github.com/afrojun/instant-copy-url/issues

**Privacy policy:**
https://github.com/afrojun/instant-copy-url/blob/main/PRIVACY.md

## Privacy

**Single purpose:** Copy the active tab's URL to the clipboard when the user
invokes a keyboard shortcut, then show a local confirmation.

**Permission justifications:**

- `activeTab`: Read the active tab's URL only after the user invokes the
  extension's keyboard shortcut.
- `clipboardWrite`: Write the active tab's URL to the user's clipboard.
- `offscreen`: Provide the local document required to access the clipboard from
  a Manifest V3 extension service worker.
- `scripting`: Insert the local confirmation message into the active page after
  the URL has been copied.

**Remote code:** No. All executable code is included in the extension package.

**Data handling:** The extension handles the active tab URL, which is web
browsing activity. It processes the URL locally after the user invokes the
shortcut. It does not retain or transmit it, and it does not collect any other
user data.

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

Chrome does not allow scripts on protected pages such as `chrome://` pages. The
URL is still copied there, but the confirmation message cannot be shown.

## Assets

- Store icon: `icons/icon-128.png`
- Lead screenshot: `store-assets/url-copied.png`
- Setup screenshot: `store-assets/setup.png`
- Small promo tile: `store-assets/small-promo.png`
- Marquee promo tile: `store-assets/marquee-promo.png`
