# Chrome Web Store listing

## Store listing

**Name:** Instant Copy URL

**Summary:** Copy tab URLs instantly. One shortcut or a right-click copies the current or selected tabs, or a whole tab group.

**Category:** Make Chrome yours › Functionality and UI

**Language:** English (United Kingdom)

**Detailed description:**

Copy one link or a whole selection of tabs with one shortcut. Instant Copy URL
puts their URLs on your clipboard in tab order, one per line, and confirms the
copy. Paste them into a message, document, or note without selecting the
address bar. In Chrome 150 and later, right-click a tab to copy the selected
tabs, or a whole tab group. A group copies with its name and each page's title,
so it pastes as linked titles in documents, chat, and email.

Copying works on Mac, Windows, and Linux. Chrome may assign Command+Shift+C on
Mac or Ctrl+Shift+C on Windows and Linux. If it does not, the setup page helps
you choose a shortcut. Chrome asks for tab URL access when you install or
update the extension because copying selected tabs is a core feature.

The extension stores no URLs and has no analytics, ads, tracking, accounts,
remote code, or network requests. The source code is available under the MIT
License.

Need to move tabs between Chrome profiles on a Mac? Try ProfileBar for Chrome
at https://afrojun.dev/profilebar/.

**Website:** https://afrojun.dev/instant-copy-url/

**Support:** https://github.com/afrojun/instant-copy-url/issues

**Privacy policy:**
https://github.com/afrojun/instant-copy-url/blob/main/PRIVACY.md

## Privacy

**Single purpose:** Let the user copy tab URLs, including selected tabs or a
chosen tab group, to the clipboard.

**Permission justifications:**

- `activeTab`: Give temporary access to the current page when the user invokes
  the shortcut, so the extension can show the confirmation.
- `tabs`: Read the highlighted tabs' URLs when the user invokes the copy
  shortcut or chooses **Copy tab URLs**, or the titles and URLs of the clicked
  tab's group when the user chooses **Copy group URLs**. Check whether the
  focused window has a group, without reading URLs, to show **Copy group URLs**
  only when it applies. The extension does not collect tab data in the
  background.
- `tabGroups`: Read the name of the group the user copies, and watch for groups
  being created or removed so **Copy group URLs** appears only when the window
  has a group.
- `clipboardWrite`: Write the selected URLs to the user's clipboard.
- `offscreen`: Provide the local document required to access the clipboard from
  a Manifest V3 extension service worker.
- `scripting`: Insert the local confirmation message into the active page after
  the URL has been copied.
- `contextMenus`: Show the **Copy tab URLs** and **Copy group URLs** items in
  the tab right-click menu.

**Remote code:** No. All executable code is included in the extension package.

**Data handling:** The extension handles selected tab URLs, which are web
browsing activity. It processes URLs locally after the user invokes the copy
shortcut or chooses a copy item from the tab menu, and only writes them to the
clipboard.
It does not retain them or collect other user data.

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
7. In Chrome 150 or later, select several tabs, right-click one, and choose
   **Copy tab URLs**. Confirm their URLs copy in tab order.
8. Right-click a tab inside a group and choose **Copy group URLs**. Confirm
   the group name and each page's title and URL copy in tab order, and the
   toast reports the number copied.

Chrome does not allow scripts on protected pages such as `chrome://` pages. The
URL is still copied there, but the confirmation message cannot be shown.

## Assets

- Store icon: `icons/icon-128.png`
- Lead screenshot: `store-assets/url-copied.png`
- Setup screenshot: `store-assets/setup.png`
- Small promo tile: `store-assets/small-promo.png`
- Marquee promo tile: `store-assets/marquee-promo.png`
