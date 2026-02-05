// background.js — Manifest V3 service worker
// Central orchestrator for Agentic Data Insight

// This log confirms the service worker was registered
console.log("[INSIGHT ON] hey twin");

// Fired when the extension is installed or reloaded
chrome.runtime.onInstalled.addListener(() => {
  console.log("[INSIGHT ON] we installed");
});

// Fired when Chrome starts
chrome.runtime.onStartup.addListener(() => {
  console.log("[INSIGHT ON] onStartup");
});

// SAFE message listener (MV3-compliant)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) return;

  switch (message.type) {
    case "TEXT_SELECTED":
      // Centralized handling point for selection data
      // (AI + vision will plug in here later)
      console.log("[ADI BG] Text received:", message.payload);

      // Store latest selection for UI hydration
      chrome.storage.local.set({
        lastSelection: message.payload
      });

      // Forward to panel (if open)
      chrome.runtime.sendMessage({
        type: "SELECTION_UPDATED",
        payload: message.payload
      });

      // Acknowledge receipt (prevents MV3 race errors)
      sendResponse({ ok: true });
      break;

    default:
      console.warn("[ADI BG] Unknown message:", message.type);
  }

  // REQUIRED in MV3 if sendResponse is used
  return true;
});

/* ------------------------------------------------------------------
   ADDITIONS BELOW — MV3 PORT + ANALYSIS PIPELINE
   (NO CHANGES ABOVE)
------------------------------------------------------------------- */

// Persistent ports (content scripts / panel)
const ports = new Set();

// Handle long-lived connections (MV3-safe)
chrome.runtime.onConnect.addListener((port) => {
  console.log("[ADI BG] Port connected:", port.name);
  ports.add(port);

  port.onMessage.addListener((msg) => {
    if (!msg || !msg.type) return;

    if (msg.type === "TEXT_SELECTED") {
      console.log("[ADI BG] Port text received:", msg.payload);

      // Persist
      chrome.storage.local.set({
        lastSelection: msg.payload
      });

      // Fan-out to all connected contexts
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

      // OPTIONAL: backend hook (stub-safe)
      analyzeSelection(msg.payload);
    }
  });

  port.onDisconnect.addListener(() => {
    console.log("[ADI BG] Port disconnected:", port.name);
    ports.delete(port);
  });
});

// Lightweight analysis stub (upgrade later to agents)
async function analyzeSelection(payload) {
  try {
    const response = await fetch("http://localhost:8000/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    // Broadcast analysis results
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
  } catch (err) {
    console.warn("[ADI BG] Analysis unavailable", err);
  }
}
