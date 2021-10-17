let timers;
let backgroundMessageReceived = false;
let htmlInjectionFinshed = false;
let interval;

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  timers = request.timers;
  const host = window.location.host;
  if (!(host in timers)) timers[host] = 0;

  console.log("background message received");
  backgroundMessageReceived = true;
  startTimer();

  sendResponse({ host });
});

let timerElement;

const renderTimers = () => {
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

    if (host == window.location.host) {
      timerElement = timeCell;
      row.classList.add("current");
      timerElement.classList.add("current-timer");
    }
  }
  timerContainer.appendChild(table);
};
const updateTimer = () => {
  timers[window.location.host] += 1000;

  const formattedTime = Math.round(timers[window.location.host] / 1000);
  timerElement.innerText = formattedTime;
};

const startTimer = () => {
  if (!backgroundMessageReceived || !htmlInjectionFinshed) return;
  if (interval) clearInterval(interval);
  renderTimers();
  interval = setInterval(updateTimer, 1000);
};

document.addEventListener(
  "visibilitychange",
  () => (timerElement.innerText = "-")
);

fetch(chrome.runtime.getURL("timer.html"))
  .then((r) => r.text())
  .then((html) => {
    document.body.insertAdjacentHTML("afterbegin", html);
  })
  .then(() => {
    console.log("html injection finished");
    htmlInjectionFinshed = true;
    startTimer();
  });
