# Chrome Web Store listing

## Store listing

**Name:** Instant Copy URL

**Summary:** Copy tab URLs in one shortcut. On Mac, move tabs and groups between profiles with ProfileBar.

**Category:** Productivity

**Language:** English

**Detailed description:**

Copy one link or a whole selection of tabs with one shortcut. Instant Copy URL
puts their URLs on your clipboard in tab order, one per line, and confirms the
copy. Paste them into a message, document, or note without selecting the
address bar. Right-click a tab inside a group to copy every URL in that group.

On macOS, Instant Copy URL also works with ProfileBar to move pages between
Chrome profiles. Right-click a page, choose a destination profile, and its URL
opens there. In Chrome 150 and later, you can select several tabs and move them
together from the tab menu. The original tabs close after ProfileBar reports a
successful handoff. Keep work, personal, and side project pages in the profile
where they belong.

You can also right-click a tab inside a group and choose **Move group to
profile**. When the destination profile has the current Instant Copy URL with
ProfileBar access enabled, it recreates the group's title, colour, and collapsed state.
Otherwise, the URLs still open in the chosen profile without a group.

Copying works on Mac, Windows, and Linux without ProfileBar. Chrome may assign
Command+Shift+C on Mac or Ctrl+Shift+C on Windows and Linux; if it does not,
the setup page helps you choose a shortcut. Chrome asks for tab URL access when
you install or update the extension because copying selected tabs is a core
feature. Moving tabs is optional and requires ProfileBar on macOS; Chrome asks
separately for that local connection when you enable it.

The extension stores no URLs and has no analytics, ads, tracking, accounts,
remote code, or network requests. When you move tabs, their URLs go only to
ProfileBar on your device. The source code is available under the MIT License.

**Website:** https://afrojun.dev/instant-copy-url/

**Support:** https://github.com/afrojun/instant-copy-url/issues

**Privacy policy:**
https://github.com/afrojun/instant-copy-url/blob/main/PRIVACY.md

## Privacy

**Single purpose:** Let the user copy tab URLs, including selected tabs or a
chosen group, and move selected tabs or a group to a chosen Chrome profile.

**Permission justifications:**

- `activeTab`: Give temporary access to the current page when the user invokes
  the shortcut, so the extension can show the confirmation.
- `tabs`: Read the highlighted tabs' URLs in the current window for the copy
  shortcut, or the clicked, highlighted, or grouped tabs for an explicit menu
  action. The extension does not scan tabs in the background.
- `tabGroups`: Read the chosen group's title, colour, and collapsed state, then
  recreate those details after an explicit move to an enabled profile.
- `clipboardWrite`: Write the selected URLs to the user's clipboard.
- `offscreen`: Provide the local document required to access the clipboard from
  a Manifest V3 extension service worker.
- `scripting`: Insert the local confirmation message into the active page after
  the URL has been copied.
- `contextMenus`: Show the group copy and profile actions in the right-click menu.
- Optional `nativeMessaging`: Exchange profile names and selected URLs with
  the local ProfileBar app after the user enables the integration.

**Remote code:** No. All executable code is included in the extension package.

**Data handling:** The extension handles selected tab URLs, which are web
browsing activity. It processes URLs locally after the user invokes the copy
shortcut or chooses a profile from the right-click menu. URLs go to the local
ProfileBar app only for a profile move. Neither component retains them or
collects other user data.

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
6. Highlight multiple tabs in one window and invoke the shortcut. Confirm the
   clipboard contains their URLs in tab order, one per line, and the toast
   reports the number copied.
7. On macOS with ProfileBar installed, enable its optional integration. Right-click
   an HTTP page, choose **Move tab to profile**, and select another profile.
   From a tab, choose **Copy or move tabs**, then **Move tab to [profile]**.
   Confirm the page opens there and the original tab closes. If the
   helper cannot open it, confirm the original tab stays open.
8. Select multiple HTTP tabs in one window and right-click one selected tab.
   Choose a profile and confirm all selected URLs open there before the
   originals close.
9. Right-click a tab inside a group, then choose **Copy or move tabs** and
   **Copy group URLs**. Confirm all group URLs copy in tab order. Then choose
   **Move group to [profile]** and confirm the title, colour, and collapsed
   state are recreated when the destination
   extension is enabled; otherwise, confirm the URLs open without a group.

Chrome does not allow scripts on protected pages such as `chrome://` pages. The
URL is still copied there, but the confirmation message cannot be shown.

## Assets

- Store icon: `icons/icon-128.png`
- Lead screenshot: `store-assets/url-copied.png`
- Setup screenshot: `store-assets/setup.png`
- Small promo tile: `store-assets/small-promo.png`
- Marquee promo tile: `store-assets/marquee-promo.png`
