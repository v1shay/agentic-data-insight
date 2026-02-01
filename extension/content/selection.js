console.log("[INSIGHT] content script loaded");

let port = null;

function getPort() {
  if (!port) {
    port = chrome.runtime.connect({ name: "adi-port" });
  }
  return port;
}

document.addEventListener("mouseup", () => {
  const selection = window.getSelection();
  const text = selection ? selection.toString().trim() : "";
  if (!text) return;

  console.log("[INSIGHT] Selected text:", text);

  getPort().postMessage({
    type: "TEXT_SELECTED",
    payload: {
      text,
      url: window.location.href,
      title: document.title
    }
  });
});
