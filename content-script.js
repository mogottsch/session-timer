let timers;
let backgroundMessageReceived = false;
let htmlInjectionFinshed = false;
let interval;
let timerElement;
const currentHost = window.location.host;

const onStart = (request, sendResponse) => {
  timers = request.timers;
  if (!(currentHost in timers)) timers[currentHost] = 0;

  backgroundMessageReceived = true;
  startTimer(timers);

  sendResponse({ host: currentHost });
};

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action !== "start") return;
  onStart(request, sendResponse);
});

// format time in milliseconds to hh:mm:ss
const formatTime = (time, maxTime) => {
  console.log(time, maxTime, maxTime > 1000 * 60);
  const h = Math.floor(time / (1000 * 60 * 60));
  const m = Math.floor((time % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((time % (1000 * 60)) / 1000);

  // add leading zero
  const hDisplay = h < 10 ? "0" + h : h;
  const mDisplay = m < 10 ? "0" + m : m;
  const sDisplay = s < 10 ? "0" + s : s;

  // display depending on size of max time
  if (maxTime > 1000 * 60 * 60) {
    return `${hDisplay}:${mDisplay}:${sDisplay}`;
  }
  if (maxTime > 1000 * 60) {
    return `${mDisplay}:${sDisplay}`;
  }
  return sDisplay;
};

const renderTimers = () => {
  const timerContainer = document.getElementById("timer-content");
  timerContainer.innerHTML = "";

  const table = document.createElement("table");
  const hosts = Object.keys(timers).sort();
  const maxTime = Math.max(...Object.values(timers));

  for (const host of hosts) {
    const row = document.createElement("tr");

    const hostCell = document.createElement("td");
    hostCell.innerText = host;
    const timeCell = document.createElement("td");
    timeCell.innerText = formatTime(timers[host], maxTime);

    row.appendChild(hostCell);
    row.appendChild(timeCell);

    table.appendChild(row);

    if (host == currentHost) {
      timerElement = timeCell;
      row.classList.add("current");
      timerElement.classList.add("current-timer");
    }
  }
  timerContainer.appendChild(table);
};

const updateTimer = () => {
  timers[currentHost] += 1000;

  renderTimers();
};

const startTimer = () => {
  if (!backgroundMessageReceived || !htmlInjectionFinshed) return;
  if (interval) clearInterval(interval);
  renderTimers();
  interval = setInterval(updateTimer, 1000);
};

const stopTimer = () => {
  if (interval) clearInterval(interval);
  interval = null;
};

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action == "pause") stopTimer();
  timers = request.timers;
  renderTimers();
});

fetch(chrome.runtime.getURL("timer.html"))
  .then((r) => r.text())
  .then((html) => {
    document.body.insertAdjacentHTML("afterbegin", html);
  })
  .then(() => {
    htmlInjectionFinshed = true;
    startTimer();
  });
