const messages = {
  "unsupported-url": "Only HTTP and HTTPS pages can be moved to another Chrome profile.",
  "source-unavailable": "Chrome did not identify the original tab, so nothing was moved.",
  "source-changed": "The page opened in the selected profile, but the original tab changed during the move and was left open.",
  "close-failed": "The page opened in the selected profile, but Chrome could not close the original tab. Close it manually.",
  "profile-changed": "That Chrome profile is no longer available. Right-click the tab and choose Refresh profiles, then try again.",
  "profilebar-unavailable": "Open or install ProfileBar, then right-click the tab and choose Refresh profiles.",
  "open-failed": "ProfileBar could not open the page in that profile. Try again or check that Chrome can open the profile.",
};

document.querySelector("#detail").textContent = messages[location.hash.slice(1)] ?? messages["open-failed"];
