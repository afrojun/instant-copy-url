# Privacy Policy

Effective date: 15 October 2026

Chrome grants Instant Copy URL access to open tabs' URLs when the extension is
installed or updated. The extension reads the highlighted tabs in the current
window when you invoke its keyboard shortcut, then copies their URLs to your
clipboard in tab order and shows a confirmation. When you choose **Copy group
URLs** from a tab's right-click menu, it reads the URLs of the tabs in that
group and copies them the same way. It does not scan tabs in the background.

The extension does not store the URLs or send them anywhere. It makes no
network requests and has no analytics, advertising, tracking, accounts, or
remote code.

Use of information received from Google APIs will adhere to the Chrome Web
Store User Data Policy, including the Limited Use requirements.

## Permissions

- `activeTab` gives temporary access to the current page after you invoke the
  shortcut so the extension can show the confirmation.
- `tabs` lets the extension read URLs of highlighted tabs, or of the clicked
  tab's group, for copying.
- `clipboardWrite` copies the selected URLs to your clipboard.
- `offscreen` provides the local document Chrome requires for clipboard access
  from an extension service worker.
- `scripting` shows the confirmation message on the active page.
- `contextMenus` adds the **Copy group URLs** item to the tab menu.

## Changes

Material changes to this policy will be published here with a new effective
date.

## Contact

For privacy questions, email
[extensions@afrojun.dev](mailto:extensions@afrojun.dev).
