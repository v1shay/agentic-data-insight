console.log(" BACKGROUND SERVICE WORKER LOADED 🔥");

chrome.runtime.onInstalled.addListener(() => {
  console.log("onInstalled fired");
});

chrome.runtime.onStartup.addListener(() => {
  console.log("onStartup fired");
});
