const q = sel => document.querySelector(sel);
const activeList = q("#activeList");
const completedList = q("#completedList");
const startBtn = q("#startBtn");
const clearCompletedBtn = q("#clearCompletedBtn");
const hint = q("#hint");

function fmtMs(ms, now = Date.now()) {
  const remain = Math.max(0, ms - now);
  const s = Math.round(remain / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function ts(dt) {
  return new Date(dt).toLocaleTimeString();
}

function liTimer(t, now) {
  const root = document.createElement("li");
  root.className = "item";

  const left = document.createElement("div");
  const title = document.createElement("a");
  title.href = "#";
  title.className = "rowlink";
  title.textContent = t.tabTitle || "(untitled tab)";
  title.addEventListener("click", async (e) => {
    e.preventDefault();
    await chrome.runtime.sendMessage({ type: "focusTimerTab", payload: { id: t.id } });
    window.close(); // close popup so Chrome focuses the tab
  });

  const meta = document.createElement("div");
  meta.className = "meta";

  if (t.status === "active") {
    meta.textContent = `Due in ${fmtMs(t.dueAt, now)} • Due at ${ts(t.dueAt)}`;
  } else {
    meta.textContent = `Completed at ${ts(t.dueAt)}`;
  }

  left.appendChild(title);
  left.appendChild(meta);

  const actions = document.createElement("div");
  actions.className = "actions";

  const remove = document.createElement("button");
  remove.className = "smallbtn";
  remove.textContent = "Remove";
  remove.addEventListener("click", async () => {
    await chrome.runtime.sendMessage({ type: "removeTimer", payload: { id: t.id } });
    await refresh();
  });

  actions.appendChild(remove);

  root.appendChild(left);
  root.appendChild(actions);
  return root;
}

async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function refresh() {
  const { timers, now } = await chrome.runtime.sendMessage({ type: "getTimers" });

  activeList.innerHTML = "";
  completedList.innerHTML = "";

  timers
    .slice()
    .sort((a, b) => a.dueAt - b.dueAt)
    .forEach(t => {
      const node = liTimer(t, now);
      if (t.status === "active") activeList.appendChild(node);
      else completedList.appendChild(node);
    });
}

async function tick() {
  await refresh();
  // Update every second so countdowns look alive
  setTimeout(tick, 1000);
}

startBtn.addEventListener("click", async () => {
  const mins = parseInt(q("#mins").value || "0", 10);
  const secs = parseInt(q("#secs").value || "0", 10);
  const label = q("#label").value;

  const durationMs = (Math.max(0, mins) * 60 + Math.max(0, Math.min(59, secs))) * 1000;
  if (durationMs <= 0) {
    hint.textContent = "Please enter a duration greater than 0.";
    return;
  }

  const tab = await getCurrentTab();
  await chrome.runtime.sendMessage({
    type: "createTimer",
    payload: {
      tabId: tab.id,
      tabTitle: tab.title,
      tabURL: tab.url,
      durationMs,
      label
    }
  });

  q("#label").value = "";
  hint.textContent = `Timer started for "${tab.title}" — due at ${new Date(Date.now() + durationMs).toLocaleTimeString()}`;
  await refresh();
});

clearCompletedBtn.addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "clearCompleted" });
  await refresh();
});

// Ask for notifications permission if needed (once)
(async () => {
  const granted = await chrome.notifications.getPermissionLevel();
  if (granted !== "granted") {
    // There's no direct prompt API; opening an example notification after first timer is fine.
    // The first real notification will prompt the user.
  }
})();

// Initial load
tick();
