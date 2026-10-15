const messages = {
  "not-in-group": "This tab is not in a group. Right-click a tab inside the group and try again.",
  "group-changed": "The group changed before its URLs could be copied. Right-click a tab inside the group and try again.",
  "copy-failed": "Chrome could not copy those URLs. Try again.",
};

document.querySelector("#detail").textContent = messages[location.hash.slice(1)] ?? messages["copy-failed"];
