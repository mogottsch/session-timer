let timers;
let backgroundMessageReceived = false;
let htmlInjectionFinshed = false;
let interval;
let timerElement;
const currentHost = window.location.host;

const onStart = () => {
  timers = request.timers;
  if (!(currentHost in timers)) timers[currentHost] = 0;

  backgroundMessageReceived = true;
  startTimer(timers);

  sendResponse({ currentHost });
};

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action !== "start") return;
  onStart();
});

const renderTimers = (timers) => {
  const timerContainer = document.getElementById("timer-content");
  timerContainer.innerHTML = "";

  const table = document.createElement("table");
  for (const host in timers) {
    const row = document.createElement("tr");

    const hostCell = document.createElement("td");
    hostCell.innerText = host;
    const timeCell = document.createElement("td");
    timeCell.innerText = Math.round(timers[host] / 1000);

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

  const formattedTime = Math.round(timers[currentHost] / 1000);
  timerElement.innerText = formattedTime;
};

const startTimer = (timers) => {
  if (!backgroundMessageReceived || !htmlInjectionFinshed) return;
  if (interval) clearInterval(interval);
  renderTimers(timers);
  interval = setInterval(updateTimer, 1000);
};

const stopTimer = () => {
  if (interval) clearInterval(interval);
  interval = null;
};

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log(request);
  if (request.action == "pause") stopTimer();
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
