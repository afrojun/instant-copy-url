# Privacy Policy

Effective date: 24 September 2026

Instant Copy URL accesses a URL when you invoke its keyboard shortcut or choose
**Open tab in profile** from the right-click menu. The shortcut copies the URL
to your clipboard and shows a confirmation message.

If you enable the optional ProfileBar integration, the extension reads the
Chrome profile list from ProfileBar through Chrome's local native messaging
channel. When you select a profile, it sends that URL and the selected profile
directory to ProfileBar on the same device. ProfileBar asks Chrome to open the
URL in that profile. Neither component stores the URL. The extension makes no
network requests and has no analytics, advertising, tracking, accounts, or
remote code. Chrome may load the selected URL in the destination profile.

Use of information received from Google APIs will adhere to the Chrome Web
Store User Data Policy, including the Limited Use requirements.

## Permissions

- `activeTab` reads the active tab's URL after you invoke the shortcut.
- `clipboardWrite` copies that URL to your clipboard.
- `offscreen` provides the local document Chrome requires for clipboard access
  from an extension service worker.
- `scripting` shows the confirmation message on the active page.
- `contextMenus` adds the right-click profile menu.
- Optional `nativeMessaging` connects to ProfileBar on this Mac when you
  enable the integration.

## Changes

Material changes to this policy will be published here with a new effective
date.

## Contact

For privacy questions, email
[extensions@afrojun.dev](mailto:extensions@afrojun.dev).
