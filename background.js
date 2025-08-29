// Utilities
const STORAGE_KEY = "timers"; // [{ id, tabId, tabTitle, tabURL, createdAt, dueAt, durationMs, status:"active"|"completed" }]
const ALARM_PREFIX = "timer:"; // alarm name = timer:<id>
const NOTIF_PREFIX = "timer:"; // notificationId = timer:<id>

async function getAllTimers() {
  const { [STORAGE_KEY]: timers } = await chrome.storage.local.get(STORAGE_KEY);
  return Array.isArray(timers) ? timers : [];
}

async function saveAllTimers(timers) {
  await chrome.storage.local.set({ [STORAGE_KEY]: timers });
}

function alarmNameFor(id) {
  return `${ALARM_PREFIX}${id}`;
}

function idFromAlarmOrNotif(name) {
  return name?.startsWith(ALARM_PREFIX) ? name.slice(ALARM_PREFIX.length)
       : name?.startsWith(NOTIF_PREFIX) ? name.slice(NOTIF_PREFIX.length)
       : null;
}

async function scheduleAlarm(id, whenMs) {
  await chrome.alarms.create(alarmNameFor(id), { when: whenMs });
}

async function clearAlarm(id) {
  await chrome.alarms.clear(alarmNameFor(id));
}

async function focusTab(tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);
    await chrome.windows.update(tab.windowId, { focused: true });
    await chrome.tabs.update(tabId, { active: true });
  } catch (e) {
    // Tab may be gone; ignore
  }
}

async function notifyTimerDone(timer) {
  const notificationId = `${NOTIF_PREFIX}${timer.id}`;
  const whenStr = new Date(timer.dueAt).toLocaleTimeString();
  await chrome.notifications.create(notificationId, {
    type: "basic",
    iconUrl: "icon128.png", // optional; add an icon file or change/remove this line
    title: "Timer done",
    message: `${timer.tabTitle || "This tab"} — finished at ${whenStr}`,
    contextMessage: (new URL(timer.tabURL || "https://example.com")).hostname,
    priority: 2
  });
}

// Message handlers from popup
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    if (msg?.type === "getTimers") {
      sendResponse({ timers: await getAllTimers(), now: Date.now() });
    }

    if (msg?.type === "createTimer") {
      const { tabId, tabTitle, tabURL, durationMs, label } = msg.payload;
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const createdAt = Date.now();
      const dueAt = createdAt + durationMs;

      const timers = await getAllTimers();
      const timer = {
        id,
        tabId,
        tabTitle: label?.trim() ? `${label} — ${tabTitle}` : tabTitle,
        tabURL,
        createdAt,
        dueAt,
        durationMs,
        status: "active"
      };
      timers.push(timer);
      await saveAllTimers(timers);
      await scheduleAlarm(id, dueAt);
      sendResponse({ ok: true, timer });
    }

    if (msg?.type === "removeTimer") {
      const { id } = msg.payload;
      const timers = await getAllTimers();
      const idx = timers.findIndex(t => t.id === id);
      if (idx !== -1) {
        const [t] = timers.splice(idx, 1);
        await saveAllTimers(timers);
        await clearAlarm(id);
        sendResponse({ ok: true, removed: t });
      } else {
        sendResponse({ ok: false });
      }
    }

    if (msg?.type === "focusTimerTab") {
      const { id } = msg.payload;
      const timers = await getAllTimers();
      const t = timers.find(x => x.id === id);
      if (t?.tabId != null) await focusTab(t.tabId);
      sendResponse({ ok: true });
    }

    if (msg?.type === "clearCompleted") {
      let timers = await getAllTimers();
      timers = timers.filter(t => t.status !== "completed");
      await saveAllTimers(timers);
      sendResponse({ ok: true });
    }
  })();

  // Return true to allow async sendResponse
  return true;
});

// Alarms -> mark completed + notify
chrome.alarms.onAlarm.addListener(async (alarm) => {
  const id = idFromAlarmOrNotif(alarm.name);
  if (!id) return;

  const timers = await getAllTimers();
  const idx = timers.findIndex(t => t.id === id);
  if (idx === -1) return;

  // Mark completed (idempotent)
  const t = timers[idx];
  if (t.status !== "completed") {
    t.status = "completed";
    await saveAllTimers(timers);
    await notifyTimerDone(t);
  }
});

// Clicking the notification focuses the original tab
chrome.notifications.onClicked.addListener(async (notificationId) => {
  const id = idFromAlarmOrNotif(notificationId);
  if (!id) return;

  const timers = await getAllTimers();
  const t = timers.find(x => x.id === id);
  if (t?.tabId != null) await focusTab(t.tabId);
  // Optional: auto-dismiss the notification
  try { await chrome.notifications.clear(notificationId); } catch {}
});

// Setup: ensure array exists
chrome.runtime.onInstalled.addListener(async () => {
  const { [STORAGE_KEY]: timers } = await chrome.storage.local.get(STORAGE_KEY);
  if (!Array.isArray(timers)) await chrome.storage.local.set({ [STORAGE_KEY]: [] });
});
