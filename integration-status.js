const messages = {
  "unsupported-url": "Only HTTP and HTTPS pages can be opened in another Chrome profile.",
  "profile-changed": "That Chrome profile is no longer available. Right-click the tab and choose Refresh profiles, then try again.",
  "profilebar-unavailable": "Open or install ProfileBar, then right-click the tab and choose Refresh profiles.",
  "open-failed": "ProfileBar could not open the page in that profile. Try again or check that Chrome can open the profile.",
};

document.querySelector("#detail").textContent = messages[location.hash.slice(1)] ?? messages["open-failed"];
