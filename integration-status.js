const messages = {
  "unsupported-url": "Only HTTP and HTTPS pages can be moved to another Chrome profile. Nothing was moved.",
  "source-unavailable": "Chrome did not identify the original tab, so nothing was moved.",
  "source-changed": "The destination opened, but an original tab changed during the move. The source tabs were left open.",
  "selection-changed": "The selected tabs changed before the move began. Nothing was moved. Select the tabs and try again.",
  "close-failed": "The destination opened, but Chrome could not close all original tabs. Close any remaining source tabs manually.",
  "profile-changed": "That Chrome profile is no longer available. Right-click the tab and choose Refresh profiles, then try again.",
  "profilebar-unavailable": "Open or install ProfileBar, then right-click the tab and choose Refresh profiles.",
  "open-failed": "ProfileBar could not open the selected pages in that profile. Try again or check that Chrome can open the profile.",
  "tabs-permission": "Chrome needs access to the selected tabs' URLs to move them together. Nothing was moved. Right-click a tab, choose Move tab to profile → Enable selected tab moves, then try again.",
  "profilebar-update-required": "Update ProfileBar to move multiple tabs together. The original tabs are still open.",
  "batch-too-large": "This selection is too large to move at once. Select fewer tabs and try again; nothing was moved.",
};

document.querySelector("#detail").textContent = messages[location.hash.slice(1)] ?? messages["open-failed"];
