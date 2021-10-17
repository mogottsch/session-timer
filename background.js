chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ currentStatus: "paused", timers: {} });
});

// messages
const sendStart = async ({ tabId, timers }) => {
  chrome.tabs.sendMessage(
    tabId,
    { timers: timers ?? {}, action: "start" },
    (response) => {
      if (!response?.host) return;
      saveToStorage({ activeTimer: response.host });
    }
  );
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

const saveToStorage = (data) => {
  return new Promise((resolve) => {
    chrome.storage.local.set(data, resolve);
  });
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
  const currentStatus = (await getFromStorage("currentStatus"))[
    "currentStatus"
  ];
  if (currentStatus === "running") return;
  const currentTab = await getCurrentTab();
  saveToStorage({
    lastActivation: Date.now(),
    currentStatus: "running",
  });
  const { timers } = await getTimersData();
  sendStart({ tabId: currentTab.id, timers });
};

const pause = async () => {
  const currentStatus = (await getFromStorage("currentStatus"))[
    "currentStatus"
  ];
  if (currentStatus === "paused") return;
  const timers = getUpdatedTimers(await getTimersData());

  pauseAllTabs(timers);

  await saveToStorage({
    currentStatus: "paused",
    timers,
    lastActivation: Date.now(),
  });
};

const pauseAllTabs = (timers) => {
  chrome.tabs.query({}, (tabs) =>
    tabs.forEach((tab) => sendPause({ tabId: tab.id, timers }))
  );
};

const reset = () => {
  saveToStorage({
    currentStatus: "paused",
    timers: {},
  });
  pauseAllTabs({});
};

const stop = async () => {
  saveToStorage({
    currentStatus: "stopped",
    timers: {},
  });
  pauseAllTabs({});
};
// end controls

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "start") start();
  if (request.action === "pause") pause();
  if (request.action === "reset") reset();
  if (request.action === "stop") stop();
});

const onTabUpdated = async (tabId) => {
  const timers = getUpdatedTimers(await getTimersData());
  if (await isPaused()) {
    pauseAllTabs(timers);
    return;
  }

  saveToStorage({ timers, lastActivation: Date.now() });
  sendStart({ tabId, timers });
};

const isPaused = async () => {
  const currentStatus = (await getFromStorage("currentStatus"))[
    "currentStatus"
  ];

  return currentStatus === "paused";
};

chrome.tabs.onActivated.addListener(async function ({ tabId, windowId }) {
  onTabUpdated(tabId);
});

chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
  if (changeInfo.status === "complete") {
    onTabUpdated(tabId);
  }
});

chrome.storage.onChanged.addListener(function (changes, namespace) {
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    console.log(
      `Storage key "${key}" in namespace "${namespace}" changed.`,
      `Old value was "${oldValue}", new value is "${newValue}".`
    );
  }
});
