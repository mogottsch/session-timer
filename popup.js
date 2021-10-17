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
  const stopButton = document.getElementById("stop");

  const setButtonVisibility = (currentStatus) => {
    startButton.style.display = currentStatus === "running" ? "none" : "block";
    pauseButton.style.display =
      currentStatus === "paused" || currentStatus === "stopped"
        ? "none"
        : "block";
  };

  setButtonVisibility(currentStatus);
  const updateStatus = (status) => {
    currentStatus = status;
    setButtonVisibility(currentStatus);
  };

  startButton.onclick = () => {
    chrome.runtime.sendMessage({ action: "start" });
    updateStatus("running");
  };
  pauseButton.onclick = () => {
    chrome.runtime.sendMessage({ action: "pause" });
    updateStatus("paused");
  };
  resetButton.onclick = () => {
    chrome.runtime.sendMessage({ action: "reset" });
    updateStatus("paused");
  };
  stopButton.onclick = () => {
    chrome.runtime.sendMessage({ action: "stop" });
    updateStatus("stopped");
  };
};

window.addEventListener("DOMContentLoaded", initBackgroundVars);
