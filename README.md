
<div align="center">

# Neural Lens

### Select once, understand instantly


<img width="800" height="500" alt="Adobe Express - neurallens (1)" src="https://github.com/user-attachments/assets/5c5854f4-6cba-4e47-a2bd-999c65fd90bd" />

---

Neural Lens is an MV3-compliant Chrome extension built on edge-execution.

Instantaneously understand any text with <500ms latency through user selection on any web page.

</div>

---

## Features

- Capture user-selected content directly from any webpage
- Preserve surrounding page context during analysis
- Run structured analysis through a FastAPI backend
- Use a modular pipeline that can support new models or tools
- Display results without forcing copy-paste or tab switching
- Analyze articles, papers, documentation, and technical content in place

## Architecture

| Layer | Purpose | Stack |
|---|---|---|
| Extension | Browser capture, page state, and popup UI | Chrome Extension / Manifest V3 |
| Context | Selection extraction and page-aware payloads | JavaScript |
| Backend | Request handling and analysis routing | FastAPI |
| Analysis | Modular response generation pipeline | Python analyzers |
| Interface | In-page answers and user-facing results | Extension UI |
| Shared | Common schemas and communication logic | Shared utilities |

## Anatomy

```txt
neural-lens/
├── extension/       # Chrome extension UI and browser logic
├── backend/         # FastAPI server and request routing
├── analyzers/       # modular analysis tools and model logic
├── shared/          # shared schemas and utilities
├── data/            # optional cached page or analysis data
└── README.md        # project documentation
```

## Install

```bash
git clone https://github.com/v1shay/neural-lens.git
cd neural-lens
npm install
```

## Backend 

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

## Extension

```txt
cd extension
# open chrome://extensions
# enable developer mode
# load unpacked → select this folder
```
