# Privacy Policy

Effective date: 25 October 2026

Chrome grants Instant Copy URL access to open tabs' URLs when the extension is
installed or updated. The extension reads the highlighted tabs in the current
window when you invoke its keyboard shortcut, then copies their URLs to your
clipboard in tab order and shows a confirmation. **Copy tab URLs** in a tab's
right-click menu copies the selected tabs the same way. **Copy group URLs**
reads the name of the clicked tab's group and the titles and URLs of its tabs,
and copies them. To show **Copy group URLs** only when it applies, the
extension checks whether the focused window has a tab group, without reading
any URLs. It does not collect tab data in the background.

The extension does not store the URLs, titles, or group names, or send them
anywhere. It makes no
network requests and has no analytics, advertising, tracking, accounts, or
remote code.

Use of information received from Google APIs will adhere to the Chrome Web
Store User Data Policy, including the Limited Use requirements.

## Permissions

- `activeTab` gives temporary access to the current page after you invoke the
  shortcut so the extension can show the confirmation.
- `tabs` lets the extension read URLs of highlighted tabs, or the titles and
  URLs of the clicked tab's group, for copying.
- `tabGroups` reads the name of the group you copy, and checks whether the
  focused window has a group so the menu can show **Copy group URLs**.
- `clipboardWrite` copies the selected URLs to your clipboard.
- `offscreen` provides the local document Chrome requires for clipboard access
  from an extension service worker.
- `scripting` shows the confirmation message on the active page.
- `contextMenus` adds the **Copy tab URLs** and **Copy group URLs** items to
  the tab menu.

## Changes

Material changes to this policy will be published here with a new effective
date.

## Contact

For privacy questions, email
[extensions@afrojun.dev](mailto:extensions@afrojun.dev).
