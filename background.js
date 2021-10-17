let lastActivation = new Date();

const onTabUpdated = async (tabId) => {
  const timers = getUpdatedTimers(await getTimersData());
  saveToStorage({ timers, lastActivation: Date.now() });
  sendTimers(tabId);
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

const sendTimers = async (tabId) => {
  const timers = (await getFromStorage("timers"))["timers"] ?? {};
  chrome.tabs.sendMessage(tabId, { timers, action: "start" }, (response) => {
    if (!response?.host) return;
    saveToStorage({ activeTimer: response.host });
  });
};

const getTimersData = async () =>
  await getFromStorage(["timers", "lastActivation", "activeTimer"]);

const saveToStorage = async (data) => {
  chrome.storage.local.set(data);
};

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

const getFromStorage = (key) => {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => {
      resolve(result);
    });
  });
};

getCurrentTab = async () => {
  const queryOptions = { active: true, currentWindow: true };
  const [tab] = await chrome.tabs.query(queryOptions);
  return tab;
};

const start = async () => {
  const currentTab = await getCurrentTab();
  const url = new URL(currentTab.url);
  saveToStorage({
    lastActivation: Date.now(),
    activeTimer: url.host,
  });
  sendTimers(currentTab.id);
  saveToStorage({ paused: false });
};

const pause = async () => {
  const timers = getUpdatedTimers(await getTimersData());

  const message = { action: "pause", timers };
  chrome.tabs.query({}, (tabs) =>
    tabs.forEach((tab) => chrome.tabs.sendMessage(tab.id, message))
  );

  saveToStorage({
    paused: true,
    timers,
    lastActivation: Date.now(),
  });
};
const reset = () => {};

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "start") start();
  if (request.action === "pause") pause();
  if (request.action === "reset") reset();
});
