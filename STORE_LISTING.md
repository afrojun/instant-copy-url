# Chrome Web Store listing

## Store listing

**Name:** Instant Copy URL

**Summary:** Copy a tab URL with a shortcut, or move it to another Chrome profile with ProfileBar on Mac.

**Category:** Productivity

**Language:** English

**Detailed description:**

Copy the link to your current tab with one shortcut. Instant Copy URL puts the
full URL on your clipboard and shows a small confirmation, ready to paste into
a message, document, or note. No need to select the address bar.

On macOS, Instant Copy URL also works with ProfileBar to move pages between
Chrome profiles. Right-click a page, choose a destination profile, and its URL
opens there. In Chrome 150 and later, you can select several tabs and move them
together from the tab menu. The original tabs close after ProfileBar reports a
successful handoff. Keep work, personal, and side project pages in the profile
where they belong.

Copying works on Mac, Windows, and Linux without ProfileBar. Chrome may assign
Command+Shift+C on Mac or Ctrl+Shift+C on Windows and Linux; if it does not,
the setup page helps you choose a shortcut. Moving tabs is optional and
requires ProfileBar on macOS. Chrome asks for access when you enable that
connection, and separately when you enable moves for selected tabs.

The extension stores no URLs and has no analytics, ads, tracking, accounts,
remote code, or network requests. When you move tabs, their URLs go only to
ProfileBar on your device. The source code is available under the MIT License.

**Website:** https://afrojun.dev/instant-copy-url/

**Support:** https://github.com/afrojun/instant-copy-url/issues

**Privacy policy:**
https://github.com/afrojun/instant-copy-url/blob/main/PRIVACY.md

## Privacy

**Single purpose:** Let the user copy the current tab URL or move one or more
selected tab URLs to a chosen Chrome profile.

**Permission justifications:**

- `activeTab`: Give temporary access to the current page when the user invokes
  the shortcut, so the extension can read its URL and show the confirmation.
- `clipboardWrite`: Write the active tab's URL to the user's clipboard.
- `offscreen`: Provide the local document required to access the clipboard from
  a Manifest V3 extension service worker.
- `scripting`: Insert the local confirmation message into the active page after
  the URL has been copied.
- `contextMenus`: Show the user-selected profile action in the right-click menu.
- Optional `nativeMessaging`: Exchange profile names and selected URLs with
  the local ProfileBar app after the user enables the integration.
- Optional `tabs`: Read the URLs of other selected tabs after the user enables
  selected tab moves. This permission does not allow the confirmation to be
  shown on a page.

**Remote code:** No. All executable code is included in the extension package.

**Data handling:** The extension handles the active tab URL, or selected tab
URLs for a multi-tab move, which is web browsing activity. It processes URLs
locally after the user invokes the shortcut or chooses a profile from the
right-click menu. The URLs are sent only to the local ProfileBar app for the
selected profile action. Neither component retains them or collects other user
data.

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
7. Select multiple HTTP tabs in one window and right-click one selected tab.
   Choose **Enable selected tab moves…**, allow optional tab access, choose a
   profile, and confirm all selected URLs open there before the originals close.

Chrome does not allow scripts on protected pages such as `chrome://` pages. The
URL is still copied there, but the confirmation message cannot be shown.

## Assets

- Store icon: `icons/icon-128.png`
- Lead screenshot: `store-assets/url-copied.png`
- Setup screenshot: `store-assets/setup.png`
- Small promo tile: `store-assets/small-promo.png`
- Marquee promo tile: `store-assets/marquee-promo.png`
