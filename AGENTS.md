# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Repository overview
This repo is split into:
- `backend/`: a small FastAPI service (currently a stub) that exposes `POST /analyze` and will eventually host the agentic reasoning loop.
- `extension/`: a Manifest V3 browser extension (plain JS/HTML/CSS) that captures user selections and will display/broker “insights”.
- `docs/`: architecture docs (currently placeholders/headers).

The current end-to-end loop is:
1. Content script captures highlighted text.
2. Background service worker stores it and optionally calls the backend.
3. Results are intended to be broadcast back to connected extension contexts (UI wiring is still mostly stubbed).

## Common commands
### Backend: run the API locally
Note: there is currently no pinned dependency file (`requirements.txt`, `pyproject.toml`, etc.). You’ll need to ensure dependencies are installed in your environment.

From the repo root:
```bash
cd backend/app
python3 -m venv .venv
source .venv/bin/activate
pip install fastapi uvicorn
uvicorn main:app --reload --port 8000
```

Quick smoke test:
```bash
curl -sS http://localhost:8000/analyze \
  -H 'content-type: application/json' \
  -d '{"text":"hello world"}'
```

### Extension: run / load locally
This extension is not bundled; it’s loaded as an unpacked extension.

- Chrome/Chromium: open `chrome://extensions`
- Enable “Developer mode”
- “Load unpacked” → select the `extension/` directory

To observe behavior while developing:
- Inspect the service worker (extension card → “Service worker”) to see logs from `extension/background.js`.
- Open DevTools on a webpage to see logs from the content script (`extension/content/selection.js`).

### Tests and linting
There is currently no test runner or linter configured in this repository.

## High-level architecture
### Backend (FastAPI)
- Entry point: `backend/app/main.py`
  - Defines `app = FastAPI()`.
  - Implements `POST /analyze` which currently returns lightweight stats (word/character counts).
- Agent skeletons: `backend/app/agents/`
  - `orchestrator.py` outlines the intended agent loop (perceive → infer intent → decide → execute → update memory) but is not implemented yet.
  - Other agent files (`perception_agent.py`, `text_agent.py`, `image_agent.py`, `intent_agent.py`) are mostly placeholders.

### Extension (Manifest V3)
- Manifest: `extension/manifest.json`
  - Registers a service worker background script: `extension/background.js`.
  - Registers a content script for `<all_urls>`: `extension/content/selection.js`.
  - Popup UI: `extension/ui/panel.html`.

- Content script: `extension/content/selection.js`
  - On mouseup, reads the current selection and builds a payload `{ text, url, title, timestamp }`.
  - Sends payload to the background via a long-lived port (`chrome.runtime.connect`) with message type `TEXT_SELECTED`.
  - Persists `lastSelection` into `chrome.storage.local` for later UI hydration.

- Background service worker: `extension/background.js`
  - Receives `TEXT_SELECTED` via either `chrome.runtime.onMessage` (short-lived) or `chrome.runtime.onConnect` (ports).
  - Stores `lastSelection` in `chrome.storage.local`.
  - Broadcasts `SELECTION_UPDATED` / `ANALYSIS_RESULT` to connected ports.
  - Calls the backend (`fetch("http://localhost:8000/analyze")`) in `analyzeSelection()` and fan-outs the response.

- UI panel: `extension/ui/panel.html` + `extension/ui/panel.js`
  - Currently a placeholder; it does not yet subscribe to background updates or read `lastSelection` from storage.

## Where to start when changing behavior
- Changing what gets captured from the page: `extension/content/selection.js`
- Changing how selections are routed / backend calls: `extension/background.js`
- Changing API behavior: `backend/app/main.py`
- Implementing the planned agent loop: `backend/app/agents/orchestrator.py` (and related agent modules)
