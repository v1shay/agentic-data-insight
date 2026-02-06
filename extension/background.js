// background.js — Manifest V3 service worker
// Central orchestrator for Agentic Data Insight

console.log("[INSIGHT ON] hey twin");

chrome.runtime.onInstalled.addListener(() => {
  console.log("[INSIGHT ON] we installed");
});

chrome.runtime.onStartup.addListener(() => {
  console.log("[INSIGHT ON] onStartup");
});

// SAFE message listener (MV3-compliant)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) return;

  switch (message.type) {
    case "TEXT_SELECTED":
      console.log("[ADI BG] Text received:", message.payload);

      chrome.storage.local.set({
        lastSelection: message.payload
      });

      chrome.runtime.sendMessage({
        type: "SELECTION_UPDATED",
        payload: message.payload
      });

      analyzeSelection(message.payload);

      sendResponse({ ok: true });
      break;

    default:
      console.warn("[ADI BG] Unknown message:", message.type);
  }

  return true;
});

/* ------------------------------------------------------------------
   MV3 PORT + ANALYSIS PIPELINE (ORIGINAL STRUCTURE PRESERVED)
------------------------------------------------------------------- */

const ports = new Set();

chrome.runtime.onConnect.addListener((port) => {
  console.log("[ADI BG] Port connected:", port.name);
  ports.add(port);

  port.onMessage.addListener((msg) => {
    if (!msg || !msg.type) return;

    if (msg.type === "TEXT_SELECTED") {
      console.log("[ADI BG] Port text received:", msg.payload);

      chrome.storage.local.set({
        lastSelection: msg.payload
      });

      ports.forEach((p) => {
        try {
          p.postMessage({
            type: "SELECTION_UPDATED",
            payload: msg.payload
          });
        } catch (e) {
          console.warn("[ADI BG] Port send failed", e);
        }
      });

      chrome.runtime.sendMessage({
        type: "SELECTION_UPDATED",
        payload: msg.payload
      });

      analyzeSelection(msg.payload);
    }
  });

  port.onDisconnect.addListener(() => {
    console.log("[ADI BG] Port disconnected:", port.name);
    ports.delete(port);
  });
});

// 🔧 FIXED: timeout + real error signaling
async function analyzeSelection(payload) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s hard stop

  try {
    const response = await fetch("http://127.0.0.1:8000/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: payload.text }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Backend responded ${response.status}`);
    }

    const result = await response.json();

    // Persist for UI hydration when panel opens later
    chrome.storage.local.set({
      lastAnalysis: result,
      lastAnalysisAt: Date.now(),
    });

    ports.forEach((p) => {
      try {
        p.postMessage({
          type: "ANALYSIS_RESULT",
          payload: result
        });
      } catch (e) {
        console.warn("[ADI BG] Analysis broadcast failed", e);
      }
    });

    chrome.runtime.sendMessage({
      type: "ANALYSIS_RESULT",
      payload: result
    });

  } catch (err) {
    clearTimeout(timeoutId);
    console.warn("[ADI BG] Analysis failed:", err);

    const errorPayload = {
      message: "Backend not running or request timed out"
    };

    chrome.storage.local.set({
      lastAnalysisError: errorPayload,
      lastAnalysisAt: Date.now(),
    });

    ports.forEach((p) => {
      try {
        p.postMessage({
          type: "ANALYSIS_ERROR",
          payload: errorPayload
        });
      } catch (e) {
        console.warn("[ADI BG] Error broadcast failed", e);
      }
    });

    chrome.runtime.sendMessage({
      type: "ANALYSIS_ERROR",
      payload: errorPayload
    });
  }
}
