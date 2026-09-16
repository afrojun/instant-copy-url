document.querySelector("#copy-current-url-toast")?.remove();

const host = document.createElement("div");
host.id = "copy-current-url-toast";

const shadow = host.attachShadow({ mode: "closed" });
const style = document.createElement("style");
style.textContent = `
  :host {
    all: initial;
    position: fixed;
    top: max(20px, calc(env(safe-area-inset-top) + 8px));
    left: 20px;
    z-index: 2147483647;
    pointer-events: none;
  }

  .toast {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 11px 14px;
    color: #ffffff;
    background: #0b57d0;
    border: 1px solid #a8c7fa;
    border-radius: 11px;
    box-shadow:
      0 10px 28px rgb(8 28 58 / 40%),
      0 0 0 3px rgb(168 199 250 / 18%);
    font: 700 15px/20px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    letter-spacing: 0;
    pointer-events: auto;
    animation:
      copy-url-toast-in 160ms ease-out,
      copy-url-toast-out 180ms ease-in 4000ms forwards;
  }

  .check {
    display: grid;
    width: 22px;
    height: 22px;
    place-items: center;
    color: #0b57d0;
    background: #ffffff;
    border-radius: 50%;
    font-size: 14px;
    line-height: 1;
  }

  .close {
    all: unset;
    display: grid;
    width: 24px;
    height: 24px;
    margin: -2px -5px -2px 2px;
    place-items: center;
    color: #e8f0fe;
    border-radius: 50%;
    cursor: pointer;
    font: 400 20px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .close:hover {
    color: #ffffff;
    background: rgb(255 255 255 / 12%);
  }

  .close:focus-visible {
    color: #ffffff;
    outline: 2px solid #a8c7fa;
    outline-offset: 1px;
  }

  .toast.leaving {
    animation: copy-url-toast-out 120ms ease-in forwards;
  }

  @keyframes copy-url-toast-in {
    from { opacity: 0; transform: translateY(-6px) scale(0.96); }
  }

  @keyframes copy-url-toast-out {
    to { opacity: 0; transform: translateY(-4px) scale(0.98); }
  }

  @media (prefers-reduced-motion: reduce) {
    .toast {
      animation: copy-url-toast-out 1ms linear 4000ms forwards;
    }
  }
`;

const toast = document.createElement("div");
toast.className = "toast";

const check = document.createElement("span");
check.className = "check";
check.setAttribute("aria-hidden", "true");
check.textContent = "✓";

const message = document.createElement("span");
message.setAttribute("role", "status");
message.setAttribute("aria-live", "polite");
message.textContent = "URL copied";

const close = document.createElement("button");
close.className = "close";
close.type = "button";
close.setAttribute("aria-label", "Dismiss copied message");
close.textContent = "×";

toast.append(check, message, close);
shadow.append(style, toast);
document.documentElement.append(host);

const removeToast = () => host.remove();
const dismissToast = () => toast.classList.add("leaving");
close.addEventListener("click", dismissToast);
toast.addEventListener("animationend", ({ animationName }) => {
  if (animationName === "copy-url-toast-out") {
    removeToast();
  }
});
setTimeout(removeToast, 4500);
