# Privacy Policy

Effective date: 26 September 2026

Chrome grants Instant Copy URL access to open tabs' URLs when the extension is
installed or updated. The extension reads the highlighted tabs in the current
window when you invoke its keyboard shortcut, then copies their URLs to your
clipboard in tab order and shows a confirmation. It reads the clicked tab or
highlighted tabs when you choose **Move tab to profile** from the right-click
menu, or the tabs in a group when you choose **Copy group URLs** or **Move group
to profile**. For a group move, it reads the group's title, colour, and collapsed
state. It does not scan tabs in the background.

If you enable the optional ProfileBar integration, the extension reads the
Chrome profile list from ProfileBar through Chrome's local native messaging
channel. ProfileBar may read the focused Chrome window title to identify the
current profile and omit it from the destination menu. When it cannot identify
the profile, the extension shows every destination. When you select a profile,
it sends the selected URLs and profile directory to ProfileBar on the same
device. ProfileBar asks Chrome to open the
URLs in that profile, then closes the original tabs when the handoff succeeds.
For group moves, a temporary local relay lets the destination extension
recreate the visible group details. If that extension is unavailable, ProfileBar
opens the URLs without a group. Neither component stores the URLs. The
extension makes no network requests and has no analytics, advertising,
tracking, accounts, or remote code. Chrome may load the selected URLs in the
destination profile.

Use of information received from Google APIs will adhere to the Chrome Web
Store User Data Policy, including the Limited Use requirements.

## Permissions

- `activeTab` gives temporary access to the current page after you invoke the
  shortcut so the extension can show the confirmation.
- `tabs` lets the extension read URLs of highlighted tabs for copying or moving.
- `tabGroups` lets it read a selected group's visible details and recreate them
  after an explicit move to another profile.
- `clipboardWrite` copies the selected URLs to your clipboard.
- `offscreen` provides the local document Chrome requires for clipboard access
  from an extension service worker.
- `scripting` shows the confirmation message on the active page.
- `contextMenus` adds the right-click copy and profile menus.
- Optional `nativeMessaging` connects to ProfileBar on this Mac when you
  enable the integration.

## Changes

Material changes to this policy will be published here with a new effective
date.

## Contact

For privacy questions, email
[extensions@afrojun.dev](mailto:extensions@afrojun.dev).
