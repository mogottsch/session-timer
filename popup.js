let currentStatus;

const initBackgroundVars = () => {
  currentStatus = chrome.storage.local.get("currentStatus", (result) => {
    currentStatus = result.currentStatus;
    main();
  });
};

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

window.addEventListener("DOMContentLoaded", initBackgroundVars);
