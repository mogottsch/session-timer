let paused;
paused = chrome.storage.local.get("paused", (result) => {
  paused = result.paused;
});

const main = (initialPaused) => {
  const startButton = document.getElementById("start");
  const pauseButton = document.getElementById("pause");
  const resetButton = document.getElementById("reset");

  const setButtonVisibility = (paused) => {
    startButton.style.display = paused ? "block" : "none";
    pauseButton.style.display = paused ? "none" : "block";
  };

  setButtonVisibility(paused);

  const toggle = () => {
    paused = !paused;
    setButtonVisibility(paused);
  };

  startButton.onclick = () => {
    chrome.runtime.sendMessage({ action: "start" });
    toggle();
  };
  pauseButton.onclick = () => {
    chrome.runtime.sendMessage({ action: "pause" });
    toggle();
  };
  resetButton.onclick = () => chrome.runtime.sendMessage({ action: "reset" });
};

window.addEventListener("DOMContentLoaded", main);
