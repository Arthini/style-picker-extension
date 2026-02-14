let isPicking = false;
let hoverEl = null;
let selectedEl = null;
let dialog = null;

/* ---------------- ACTIVATE PICKER ---------------- */
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "pick") {
    isPicking = true;
    document.body.style.cursor = "crosshair";
    removeDialog();
  }
});

/* ---------------- HELPERS ---------------- */

function findStyleOwner(el) {
  let current = el;

  while (current && current !== document.body) {
    const cs = getComputedStyle(current);

    const hasVisualStyle =
      cs.borderTopWidth !== "0px" ||
      cs.outlineWidth !== "0px" ||
      cs.boxShadow !== "none" ||
      cs.borderRadius !== "0px" ||
      (cs.filter && cs.filter.includes("drop-shadow"));

    if (hasVisualStyle) return current;
    current = current.parentElement;
  }
  return el;
}

function getElementType(el) {
  const tag = el.tagName.toLowerCase();

  if (tag === "button" || el.getAttribute("role") === "button") {
    return "button";
  }

  if (
    ["p", "span", "a", "label", "h1", "h2", "h3", "h4", "h5", "h6"].includes(tag)
  ) {
    return "text";
  }

  return "container";
}

/* ---------------- HOVER ---------------- */
document.addEventListener(
  "mouseover",
  (e) => {
    if (!isPicking) return;
    if (e.target.closest("#style-picker-dialog")) return;

    hoverEl = e.target;
    hoverEl.dataset._sp_outline = hoverEl.style.outline;
    hoverEl.style.outline = "2px solid #6D28D9";
  },
  true
);

document.addEventListener(
  "mouseout",
  () => {
    if (!isPicking) return;
    if (hoverEl) {
      hoverEl.style.outline = hoverEl.dataset._sp_outline || "";
      hoverEl = null;
    }
  },
  true
);

/* ---------------- PICK ---------------- */
document.addEventListener(
  "click",
  (e) => {
    if (!isPicking) return;
    if (e.target.closest("#style-picker-dialog")) return;

    e.preventDefault();
    e.stopPropagation();

    const rawEl = e.target;
    const el = findStyleOwner(rawEl);
    const cs = getComputedStyle(el);

    selectedEl = el;

    const type = getElementType(rawEl);

    let cssText = "";
    let displayHTML = "";

    /* ---------- TEXT ---------- */
    if (type === "text") {
      cssText = `
font-size: ${cs.fontSize};
font-family: ${cs.fontFamily};
font-weight: ${cs.fontWeight};
color: ${cs.color};
line-height: ${cs.lineHeight};
background-color: ${cs.backgroundColor};
`.trim();

      displayHTML = `
<div><b>Type:</b> Text</div>
<div>Font size: ${cs.fontSize}</div>
<div>Font family: ${cs.fontFamily}</div>
<div>Font weight: ${cs.fontWeight}</div>
<div>Color: ${cs.color}</div>
<div>Line height: ${cs.lineHeight}</div>
<div>Background: ${cs.backgroundColor}</div>
`;
    }

    /* ---------- BUTTON ---------- */
    if (type === "button") {
      cssText = `
font-size: ${cs.fontSize};
font-family: ${cs.fontFamily};
font-weight: ${cs.fontWeight};
color: ${cs.color};
background-color: ${cs.backgroundColor};
padding: ${cs.padding};
border-width: ${cs.borderTopWidth};
border-color: ${cs.borderTopColor};
border-radius: ${cs.borderRadius};
box-shadow: ${cs.boxShadow !== "none" ? cs.boxShadow : cs.filter};
`.trim();

      displayHTML = `
<div><b>Type:</b> Button</div>
<div>Font size: ${cs.fontSize}</div>
<div>Text color: ${cs.color}</div>
<div>Background: ${cs.backgroundColor}</div>
<div>Padding: ${cs.padding}</div>
<div>Border width: ${cs.borderTopWidth}</div>
<div>Border color: ${cs.borderTopColor}</div>
<div>Border radius: ${cs.borderRadius}</div>
<div>Shadow: ${cs.boxShadow !== "none" ? cs.boxShadow : cs.filter}</div>
`;
    }

    /* ---------- CONTAINER ---------- */
    if (type === "container") {
      cssText = `
padding: ${cs.padding};
background-color: ${cs.backgroundColor};
border-width: ${cs.borderTopWidth};
border-color: ${cs.borderTopColor};
border-radius: ${cs.borderRadius};
box-shadow: ${cs.boxShadow !== "none" ? cs.boxShadow : cs.filter};
`.trim();

      displayHTML = `
<div><b>Type:</b> Container</div>
<div>Padding: ${cs.padding}</div>
<div>Background: ${cs.backgroundColor}</div>
<div>Border width: ${cs.borderTopWidth}</div>
<div>Border color: ${cs.borderTopColor}</div>
<div>Border radius: ${cs.borderRadius}</div>
<div>Shadow: ${cs.boxShadow !== "none" ? cs.boxShadow : cs.filter}</div>
`;
    }

    el.style.outline = el.dataset._sp_outline || "";

    showDialog(el, displayHTML, cssText);

    isPicking = false;
    document.body.style.cursor = "default";
  },
  true
);

/* ---------------- DIALOG ---------------- */
function showDialog(el, html, cssText) {
  removeDialog();

  dialog = document.createElement("div");
  dialog.id = "style-picker-dialog";

  dialog.innerHTML = `
  <div class="sp-header">
    <strong>Style Picker</strong>
    <span class="sp-close">✕</span>
  </div>
  <div class="sp-body">${html}</div>
  <button class="sp-copy">Copy CSS</button>
  `;

  document.body.appendChild(dialog);

  const r = el.getBoundingClientRect();
  dialog.style.top = `${window.scrollY + r.bottom + 8}px`;
  dialog.style.left = `${window.scrollX + r.left}px`;

  dialog.querySelector(".sp-close").onclick = removeDialog;
  dialog.querySelector(".sp-copy").onclick = () => {
    navigator.clipboard.writeText(cssText);
    showCopiedToast(dialog);
  };
}

/* ---------------- COPIED TOAST ---------------- */
function showCopiedToast(dialog) {
  const old = dialog.querySelector(".sp-toast");
  if (old) old.remove();

  const toast = document.createElement("div");
  toast.className = "sp-toast";
  toast.textContent = "COPIED";

  dialog.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 10);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 1200);
}

/* ---------------- CLEANUP ---------------- */
function removeDialog() {
  if (dialog) dialog.remove();
  dialog = null;

  if (selectedEl) {
    selectedEl.style.outline = selectedEl.dataset._sp_outline || "";
    selectedEl = null;
  }
}

/* ---------------- STYLES ---------------- */
const style = document.createElement("style");
style.textContent = `
#style-picker-dialog {
  position: absolute;
  z-index: 999999;
  width: 320px;
  background: #fff;
  border-radius: 12px;
  
  box-shadow: 0 12px 30px rgba(0,0,0,.15);
  // font-family: system-ui, sans-serif;
    font-family: Outfit, sans-serif;
    font-weight:500;
  font-size: 16px;
  color: #0F172A;
}

#style-picker-dialog .sp-header {
  display: flex;
  justify-content: space-between;
  padding:20px;
  border-bottom: 1px solid #E5E7EB;
   background: #F5F3FF;
   border-top-left-radius:12px;
   border-top-right-radius:12px;
}

#style-picker-dialog .sp-body {
  padding:20px;
  color: #334155;
}

#style-picker-dialog button {
  width: calc(100% - 40px);
  margin: 20px;
  padding: 10px;
  border: none;
  background: #692477;
  color: #fff;
  border-radius: 8px;
  cursor: pointer;
}
.sp-header strong {
  color: #692477;
}



#style-picker-dialog button:hover {
  background: #B455E;
}

#style-picker-dialog .sp-close {
  cursor: pointer;
  color: #64748B;
}

/* COPIED TOAST */
.sp-toast {
  position: absolute;
  bottom: 52px;
  right: 16px;
  background: #A47DAB;
  color: #ebf5ef;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 6px;
  opacity: 0;
  transform: translateY(6px);
  transition: all 0.25s ease;
  pointer-events: none;
}

.sp-toast::after {
  content: "";
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  border-width: 5px 5px 0 5px;
  border-style: solid;
  border-color: #A47DAB  transparent transparent transparent;
}

.sp-toast.show {
  opacity: 1;
  transform: translateY(0);
}
`;
document.head.appendChild(style);
