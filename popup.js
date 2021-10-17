let currentStatus = chrome.storage.local.get(
  "status",
  (result) => (currentStatus = result.status)
);

const main = () => {
  const startButton = document.getElementById("start");
  const pauseButton = document.getElementById("pause");
  const resetButton = document.getElementById("reset");

  const setButtonVisibility = (currentStatus) => {
    startButton.style.display = currentStatus === "running" ? "none" : "block";
    pauseButton.style.display = currentStatus === "paused" ? "none" : "block";
  };

  setButtonVisibility(currentStatus);

  startButton.onclick = () => {
    console.log("start");
    chrome.runtime.sendMessage({ action: "start" });
    currentStatus = "running";
    setButtonVisibility(currentStatus);
  };
  pauseButton.onclick = () => {
    chrome.runtime.sendMessage({ action: "pause" });
    currentStatus = "paused";
    setButtonVisibility(currentStatus);
  };
  resetButton.onclick = () => chrome.runtime.sendMessage({ action: "reset" });
};

window.addEventListener("DOMContentLoaded", main);
