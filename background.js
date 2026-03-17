let activeTabId = null;
let startTime = null;
let activeTabTitle = "";
let activeTabUrl = "";
let isBlockedSite = false; // Track if current site is blocked

// cache and snooze tracking
let cachedBlockList = [];
let isSnoozed = false;           // when true, evaluation is paused
let snoozeStart = null;         // timestamp when snooze began
let totalSnooze = 0;            // accumulated seconds snoozed
const snoozeRecords = [];       // log of individual snooze sessions with date and duration
// track last state sent to avoid noisy periodic messages
let lastSentState = null;

// Initialize cache and restore snooze state
chrome.storage.local.get(["blockList", "isSnoozed", "snoozeStart", "totalSnooze", "snoozeRecords"], (data) => {
  cachedBlockList = data.blockList || [];
  isSnoozed = !!data.isSnoozed;
  snoozeStart = data.snoozeStart || null;
  totalSnooze = data.totalSnooze || 0;
  if(data.snoozeRecords) {
      snoozeRecords.push(...data.snoozeRecords);
  }
});

// Update cache on changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "local" && changes.blockList) {
    cachedBlockList = changes.blockList.newValue || [];
  }
});


// function that calculate the time spent in each tab
function logTimeSpent() {
  if (activeTabId && startTime) {
    const endTime = Date.now();
    const durationSeconds = Math.round((endTime - startTime) / 1000);
    console.log(`Tab: "${activeTabTitle}" | Duration: ${durationSeconds} seconds`);
    return durationSeconds;
  }
  return 0;
}

//  Evaluate State & Notify Content Script
async function evaluateState() {
  // if user has snoozed, skip evaluation entirely
  if (isSnoozed || !activeTabId) return;

  try {
    const tab = await chrome.tabs.get(activeTabId);
    activeTabUrl = tab.url || "unknown";
    activeTabTitle = tab.title || "unknown";

    const blockList = cachedBlockList;

    // Default to the new 'default' state until we evaluate
    let state = "default";

    const blockedSite = blockList.find(site => activeTabUrl.includes(site));
    console.log("Blocked site match:", blockedSite);

    if (blockedSite) {
      isBlockedSite = true;

      // Protect against missing startTime
      const timeSpent = startTime ? (Date.now() - startTime) / 1000 : 0;

      // Toggle between dfault and out of path only (for now)
      if (timeSpent > 60) {  // 1 min = 60 s , so 5 min = 300 s
        state = "out_of_path";
        console.log("User in blocked site", { site: blockedSite, timeSpent: Math.round(timeSpent) });
      } else {
        state = "default";
      }
    } else {
      isBlockedSite = false;
      state = "default";
    }

    // Send only the simplified state to the content script when it changes
    if (state !== lastSentState) {
      chrome.tabs.sendMessage(activeTabId, {
        type: "STATE_UPDATE",
        state: state
      }).catch(err => console.log("Content script not ready yet", err));
      lastSentState = state;
    }

  } catch (e) {
    console.error("Error evaluating state:", e);
  }
}

// listen for snooze toggle messages from the widget
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'SNOOZE_TOGGLE') {
    isSnoozed = !!msg.isSnoozed;
    if (isSnoozed) {
      snoozeStart = Date.now();
      console.log('Snooze started');
    } else {
      if (snoozeStart) {
        const duration = Math.round((Date.now() - snoozeStart) / 1000);
        const when = new Date().toISOString();
        console.log(`Snooze ended: ${duration}s at ${when}`);
        snoozeRecords.push({ date: when, duration });
        totalSnooze += duration;
        console.log('Total snooze duration now', totalSnooze, 'seconds');
        snoozeStart = null;
      }
      // after waking from snooze, re-evaluate to update state immediately
      // force send on wake
      lastSentState = null;
      evaluateState();
    }
    // Save state to storage
    chrome.storage.local.set({
      isSnoozed,
      snoozeStart,
      totalSnooze,
      snoozeRecords
    });
  }
});

// --- LISTENERS ---

// 1. Tab Switch
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  logTimeSpent(); 

  activeTabId = activeInfo.tabId;
  startTime = Date.now();
  // force send for a new active tab
  lastSentState = null;
  evaluateState();
});

// 2. URL/Title Update
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tabId === activeTabId && (changeInfo.title || changeInfo.url)) {
    logTimeSpent();
    startTime = Date.now(); // Reset timer for new URL/Title
    // force send for URL/title changes
    lastSentState = null;
    evaluateState();
  }
});

// 3. Idle Detection (Sleepy State)
chrome.idle.onStateChanged.addListener((idleState) => {
  if (isSnoozed) return; // don't override state while snoozed
  if (idleState === "idle" || idleState === "locked") {
    chrome.tabs.sendMessage(activeTabId, { type: "STATE_UPDATE", state: "sleepy" });
  } else {
    evaluateState(); // Re-evaluate when they wake up
  }
});

// 4. Tab Closure
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === activeTabId) {
    logTimeSpent();
    activeTabId = null;
    startTime = null;
  }
});

// Heartbeat: Check periodically to see if a "focused" tab has turned "distracted" by time limit
// Using alarms for Manifest V3 reliability
chrome.alarms.create("heartbeat", { periodInMinutes: 5 / 60 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "heartbeat") {
    evaluateState();
  }
});