console.log("[ADI UI] panel loaded");

const selectionEl = document.getElementById("selection");

hydrate();

chrome.runtime.onMessage.addListener((msg) => {
  if (!msg || !msg.type) return;

  if (msg.type === "SELECTION_UPDATED") {
    renderSelection(msg.payload);
    return;
  }

  if (msg.type === "ANALYSIS_RESULT") {
    renderAnalysis(msg.payload);
    return;
  }

  if (msg.type === "ANALYSIS_ERROR") {
    renderError(msg.payload);
  }
});

function hydrate() {
  chrome.storage.local.get(
    ["lastSelection", "lastAnalysis", "lastAnalysisError"],
    (res) => {
      if (res.lastSelection?.text) {
        renderSelection(res.lastSelection);
      } else {
        selectionEl.textContent = "Highlight text on a page";
      }

      if (res.lastAnalysis?.summary && Array.isArray(res.lastAnalysis?.insights)) {
        renderAnalysis(res.lastAnalysis);
      } else if (res.lastAnalysisError?.message) {
        renderError(res.lastAnalysisError);
      }
    }
  );
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#039;");
}

function renderSelection(payload) {
  const title = payload?.title ? escapeHtml(payload.title) : "";
  const text = payload?.text ? escapeHtml(payload.text.slice(0, 300)) : "";

  selectionEl.innerHTML = `
    <em>${text}</em>
    ${title ? `<br /><small>${title}</small>` : ""}
    <br />
    <span style="opacity: 0.7;">Analyzing…</span>
  `;
}

function renderAnalysis(result) {
  const summary = escapeHtml(result.summary);
  const items = (result.insights || []).map((i) => `<li>${escapeHtml(i)}</li>`).join("");

  selectionEl.innerHTML = `
    <strong>${summary}</strong>
    <ul>${items}</ul>
  `;
}

function renderError(err) {
  const msg = err?.message ? escapeHtml(err.message) : "Unknown analysis error";
  selectionEl.innerHTML = `<strong>Analysis error</strong><br /><small>${msg}</small>`;
}
