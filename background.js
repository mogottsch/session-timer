// messages
const sendStart = async ({ tabId, timers }) => {
  chrome.tabs.sendMessage(tabId, { timers, action: "start" }, (response) => {
    if (!response?.host) return;
    console.log(response.host);
    saveToStorage({ activeTimer: response.host });
  });
};

const sendPause = async ({ tabId, timers }) => {
  chrome.tabs.sendMessage(tabId, { timers, action: "pause" });
};
// end messages

// utils
const getFromStorage = (key) => {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => {
      resolve(result);
    });
  });
};

const getCurrentTab = async () => {
  const queryOptions = { active: true, currentWindow: true };
  const [tab] = await chrome.tabs.query(queryOptions);
  return tab;
};

const saveToStorage = async (data) => {
  chrome.storage.local.set(data);
};
// end utils

// timer
const getUpdatedTimers = ({
  lastActivation: lastActivationRaw,
  timers: timersRaw,
  activeTimer,
}) => {
  const lastActivation = lastActivationRaw
    ? new Date(lastActivationRaw)
    : new Date();
  const timers = timersRaw ?? {};

  if (!activeTimer) return;

  const now = new Date();
  const diff = now - lastActivation;
  timers[activeTimer] = (timers[activeTimer] ?? 0) + diff;

  return timers;
};

const getTimersData = async () =>
  await getFromStorage(["timers", "lastActivation", "activeTimer"]);
// end timer

//controls
const start = async () => {
  const currentTab = await getCurrentTab();
  console.log(currentTab);
  saveToStorage({
    lastActivation: Date.now(),
    paused: false,
  });
  const { timers } = await getTimersData();
  sendStart({ tabId: currentTab.id, timers });
};

const pause = async () => {
  const timers = getUpdatedTimers(await getTimersData());

  chrome.tabs.query({}, (tabs) =>
    tabs.forEach((tab) => sendPause({ tabId: tab.id, timers }))
  );

  saveToStorage({
    paused: true,
    timers,
    lastActivation: Date.now(),
  });
};

const reset = () => {};
// end controls

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "start") start();
  if (request.action === "pause") pause();
  if (request.action === "reset") reset();
});

const onTabUpdated = async (tabId) => {
  const timers = getUpdatedTimers(await getTimersData());
  saveToStorage({ timers, lastActivation: Date.now() });
  sendStart({ tabId, timers });
};

chrome.tabs.onActivated.addListener(async function ({ tabId, windowId }) {
  // check if paused
  onTabUpdated(tabId);
});

chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
  // check if paused
  if (changeInfo.status === "complete") {
    onTabUpdated(tabId);
  }
});
