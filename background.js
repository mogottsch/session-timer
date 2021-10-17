const timers = {};
let activeTimer;
let lastActivation;

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
    console.log(timers);
  });
};

const updateTimers = () => {
  const now = new Date();
  const diff = now - lastActivation;
  timers[activeTimer] += diff;
  lastActivation = now;
};
