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

const sendTimers = async (tabId) => {
  const timers = (await getFromStorageSync("timers"))["timers"] ?? {};
  chrome.tabs.sendMessage(tabId, { timers }, function (response) {
    if (!response?.host) return;
    activeTimer = response.host;
  });
};

const updateTimers = async () => {
  if (!activeTimer) return;

  const storageResponse = await getFromStorageSync([
    "timers",
    "lastActivation",
  ]);
  console.log(storageResponse);
  const lastActivation = storageResponse["lastActivation"]
    ? new Date(storageResponse["lastActivation"])
    : new Date();
  const timers = storageResponse["timers"] ?? {};

  const now = new Date();
  const diff = now - lastActivation;
  timers[activeTimer] = (timers[activeTimer] ?? 0) + diff;

  chrome.storage.local.set({ timers, lastActivation: Date.now() });
  console.log({ toSave: timers });
};

const getFromStorageSync = (key) => {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => {
      resolve(result);
    });
  });
};
