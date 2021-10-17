const timers = {};
let activeTimer;
let lastActivation = new Date();

chrome.tabs.onActivated.addListener(function ({ tabId, windowId }) {
  updateTimers();
  sendTimers(tabId);
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status === "complete") {
    updateTimers();
    sendTimers(tabId);
  }
});

const sendTimers = (tabId) => {
  chrome.tabs.sendMessage(tabId, { timers }, function (response) {
    if (!response?.host) return;
    if (!(response.host in timers)) timers[response.host] = 0;
    activeTimer = response.host;
  });
};

const updateTimers = () => {
  if (!activeTimer) return;
  const now = new Date();
  const diff = now - lastActivation;
  timers[activeTimer] += diff;
  lastActivation = now;
};
