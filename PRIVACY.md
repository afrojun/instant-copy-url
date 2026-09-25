# Privacy Policy

Effective date: 25 September 2026

Instant Copy URL accesses a URL when you invoke its keyboard shortcut or choose
**Move tab to profile** from the right-click menu. The shortcut copies the URL
to your clipboard and shows a confirmation message.

When you choose **Enable selected tab moves…**, Chrome asks for optional tab
access. The extension uses it to read selected tabs' URLs when you move them
together. The copy shortcut does not need this access.

If you enable the optional ProfileBar integration, the extension reads the
Chrome profile list from ProfileBar through Chrome's local native messaging
channel. When you select a profile, it sends the selected URLs and profile
directory to ProfileBar on the same device. ProfileBar asks Chrome to open the
URLs in that profile, then closes the original tabs when the handoff succeeds.
Neither component stores the URLs. The extension makes no
network requests and has no analytics, advertising, tracking, accounts, or
remote code. Chrome may load the selected URLs in the destination profile.

Use of information received from Google APIs will adhere to the Chrome Web
Store User Data Policy, including the Limited Use requirements.

## Permissions

- `activeTab` gives temporary access to the current page after you invoke the
  shortcut, so the extension can read its URL and show the confirmation.
- `clipboardWrite` copies that URL to your clipboard.
- `offscreen` provides the local document Chrome requires for clipboard access
  from an extension service worker.
- `scripting` shows the confirmation message on the active page.
- `contextMenus` adds the right-click profile menu.
- Optional `nativeMessaging` connects to ProfileBar on this Mac when you
  enable the integration.
- Optional `tabs` reads the URLs of multiple selected tabs when you choose to
  move them together.

## Changes

Material changes to this policy will be published here with a new effective
date.

## Contact

For privacy questions, email
[extensions@afrojun.dev](mailto:extensions@afrojun.dev).
