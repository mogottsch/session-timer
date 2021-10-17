const main = () => {
  const startButton = document.getElementById("start");
  const pauseButton = document.getElementById("pause");
  const resetButton = document.getElementById("reset");

  startButton.onclick = () => {
    chrome.runtime.sendMessage({ action: "start" });
  };
  pauseButton.onclick = () => chrome.runtime.sendMessage({ action: "pause" });
  resetButton.onclick = () => chrome.runtime.sendMessage({ action: "reset" });
};

window.addEventListener("DOMContentLoaded", main);
