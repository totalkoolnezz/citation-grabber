// popup.js
// Controls the CitationGrabber popup UI.
// Sends message to content.js, receives page data, formats citations,
// handles copy/save/load from chrome.storage.local.

// ── state ─────────────────────────────────────────────────────────────────
let currentStyle = "MLA";
let currentData  = null;
let currentCitation = "";
let currentIntext   = "";

// ── element refs ──────────────────────────────────────────────────────────
const genBtn       = document.getElementById("genBtn");
const saveBtn      = document.getElementById("saveBtn");
const status       = document.getElementById("status");
const errorMsg     = document.getElementById("errorMsg");
const missingWarn  = document.getElementById("missingWarn");
const sourceInfo   = document.getElementById("sourceInfo");
const citationCard = document.getElementById("citationCard");
const citationText = document.getElementById("citationText");
const citationStyleLabel = document.getElementById("citationStyleLabel");
const intextRow    = document.getElementById("intextRow");
const intextLabel  = document.getElementById("intextLabel");
const intextText   = document.getElementById("intextText");
const copyMain     = document.getElementById("copyMain");
const copyIntext   = document.getElementById("copyIntext");
const savedSection = document.getElementById("savedSection");
const savedList    = document.getElementById("savedList");
const clearBtn     = document.getElementById("clearBtn");
const savedDivider = document.getElementById("savedDivider");

const siTitle   = document.getElementById("si-title");
const siAuthors = document.getElementById("si-authors");
const siDate    = document.getElementById("si-date");
const siSite    = document.getElementById("si-site");

// ── style buttons ─────────────────────────────────────────────────────────
document.querySelectorAll(".style-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".style-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentStyle = btn.dataset.style;
    if (currentData) renderCitation(currentData);
  });
});

// ── generate ──────────────────────────────────────────────────────────────
genBtn.addEventListener("click", async () => {
  resetUI();
  status.style.display = "block";
  genBtn.disabled = true;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Inject content script if needed (handles edge cases like extensions pages)
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    }).catch(() => {}); // silently ignore if already injected

    chrome.tabs.sendMessage(tab.id, { type: "GET_PAGE_DATA" }, (response) => {
      status.style.display = "none";
      genBtn.disabled = false;

      if (chrome.runtime.lastError || !response) {
        showError("Could not read this page. Try refreshing it first.");
        return;
      }

      currentData = response;
      renderCitation(response);
    });
  } catch (e) {
    status.style.display = "none";
    genBtn.disabled = false;
    showError("Something went wrong. Refresh the page and try again.");
  }
});

// ── render citation ────────────────────────────────────────────────────────
function renderCitation(data) {
  // Show source summary
  siTitle.textContent   = data.title || "—";
  siAuthors.textContent = data.authors.length ? data.authors.join(", ") : "Not found";
  siDate.textContent    = data.published
    ? new Date(data.published).toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric", timeZone:"UTC" })
    : "Not found";
  siSite.textContent    = data.siteName || "—";
  sourceInfo.style.display = "block";

  // Warn about missing fields
  const missing = [];
  if (!data.authors.length) missing.push("author");
  if (!data.published)      missing.push("publish date");
  if (missing.length) {
    missingWarn.textContent =
      `⚠ Could not detect: ${missing.join(", ")}. You may need to fill these in manually.`;
    missingWarn.style.display = "block";
  }

  // Format based on selected style
  let citation = "";
  let intext   = "";
  let label    = "";
  let itLabel  = "";

  if (currentStyle === "MLA") {
    citation = formatMLA(data);
    intext   = mlaInText(data);
    label    = "MLA 9th Edition";
    itLabel  = "In-text:";
  } else if (currentStyle === "APA") {
    citation = formatAPA(data);
    intext   = apaInText(data);
    label    = "APA 7th Edition";
    itLabel  = "In-text:";
  } else {
    citation = formatChicago(data);
    intext   = chicagoFootnote(data);
    label    = "Chicago 17th Edition";
    itLabel  = "Footnote:";
  }

  currentCitation = citation;
  currentIntext   = intext;

  // Render with italics (wrap *text* in <em>)
  citationText.innerHTML = citation.replace(/\*(.*?)\*/g, "<em>$1</em>");
  citationStyleLabel.textContent = label;
  citationCard.style.display = "block";

  intextText.textContent = intext;
  intextLabel.textContent = itLabel;
  intextRow.style.display = "flex";

  saveBtn.style.display = "block";
}

// ── copy buttons ──────────────────────────────────────────────────────────
copyMain.addEventListener("click", () => {
  // Strip markdown italics for clipboard
  const plain = currentCitation.replace(/\*(.*?)\*/g, "$1");
  copyToClipboard(plain, copyMain);
});

copyIntext.addEventListener("click", () => {
  copyToClipboard(currentIntext, copyIntext);
});

function copyToClipboard(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const original = btn.textContent;
    btn.textContent = "Copied!";
    btn.classList.add("copied");
    setTimeout(() => {
      btn.textContent = original;
      btn.classList.remove("copied");
    }, 1800);
  });
}

// ── save citation ─────────────────────────────────────────────────────────
saveBtn.addEventListener("click", () => {
  if (!currentCitation) return;
  const entry = {
    style: currentStyle,
    citation: currentCitation.replace(/\*(.*?)\*/g, "$1"),
    title: currentData?.title || "Untitled",
    url: currentData?.url || "",
    saved: new Date().toISOString()
  };

  chrome.storage.local.get({ saved: [] }, (result) => {
    const updated = [entry, ...result.saved].slice(0, 50); // keep max 50
    chrome.storage.local.set({ saved: updated }, () => {
      renderSavedList(updated);
      saveBtn.textContent = "Saved!";
      setTimeout(() => { saveBtn.textContent = "Save to list"; }, 1500);
    });
  });
});

// ── load saved on open ────────────────────────────────────────────────────
chrome.storage.local.get({ saved: [] }, (result) => {
  if (result.saved.length) renderSavedList(result.saved);
});

function renderSavedList(items) {
  if (!items.length) {
    savedSection.style.display = "none";
    savedDivider.style.display = "none";
    return;
  }

  savedSection.style.display = "block";
  savedDivider.style.display = "block";
  savedList.innerHTML = "";

  items.forEach((item, idx) => {
    const div = document.createElement("div");
    div.className = "saved-item";

    const preview = document.createElement("span");
    preview.className = "saved-item-text";
    preview.textContent = `[${item.style}] ${item.title}`;
    preview.title = item.citation;

    const copyBtn = document.createElement("button");
    copyBtn.className = "saved-copy";
    copyBtn.textContent = "📋";
    copyBtn.title = "Copy citation";
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(item.citation).then(() => {
        copyBtn.textContent = "✅";
        setTimeout(() => { copyBtn.textContent = "📋"; }, 1500);
      });
    });

    const delBtn = document.createElement("button");
    delBtn.className = "saved-copy";
    delBtn.textContent = "🗑";
    delBtn.title = "Delete";
    delBtn.addEventListener("click", () => {
      chrome.storage.local.get({ saved: [] }, (result) => {
        const updated = result.saved.filter((_, i) => i !== idx);
        chrome.storage.local.set({ saved: updated }, () => renderSavedList(updated));
      });
    });

    div.appendChild(preview);
    div.appendChild(copyBtn);
    div.appendChild(delBtn);
    savedList.appendChild(div);
  });
}

// ── clear all saved ───────────────────────────────────────────────────────
clearBtn.addEventListener("click", () => {
  if (!confirm("Clear all saved citations?")) return;
  chrome.storage.local.set({ saved: [] }, () => renderSavedList([]));
});

// ── helpers ───────────────────────────────────────────────────────────────
function resetUI() {
  errorMsg.style.display    = "none";
  missingWarn.style.display = "none";
  sourceInfo.style.display  = "none";
  citationCard.style.display = "none";
  intextRow.style.display   = "none";
  saveBtn.style.display     = "none";
  currentData = null;
}

function showError(msg) {
  errorMsg.textContent    = msg;
  errorMsg.style.display  = "block";
}
