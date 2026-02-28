let activeTabId = null;
let startTime = null;
let activeTabTitle = "";
let activeTabUrl = "";
let isBlockedSite = false; // Track if current site is blocked

// snooze tracking
let isSnoozed = false;           // when true, evaluation is paused
let snoozeStart = null;         // timestamp when snooze began
let totalSnooze = 0;            // accumulated seconds snoozed
const snoozeRecords = [];       // log of individual snooze sessions with date and duration


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

    const data = await chrome.storage.local.get(["blockList"]);
    const blockList = data.blockList || [];

    // Default to focused
    let state = "focused";

    const blockedSite = blockList.find(site => activeTabUrl.includes(site));
    console.log("Blocked site match:", blockedSite);

    if (blockedSite) {
      isBlockedSite = true;

      // Protect against missing startTime
      const timeSpent = startTime ? (Date.now() - startTime) / 1000 : 0;

      // Toggle between focused and distracted only (for now)
      if (timeSpent > 300) {
        state = "distracted";
        console.log("User distracted on blocked site", { site: blockedSite, timeSpent: Math.round(timeSpent) });
      } else {
        state = "focused";
      }
    } else {
      isBlockedSite = false;
      state = "focused";
    }

    // Send only the simplified state to the content script
    chrome.tabs.sendMessage(activeTabId, {
      type: "STATE_UPDATE",
      state: state
    }).catch(err => console.log("Content script not ready yet", err));

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
      evaluateState();
    }
  }
});

// --- LISTENERS ---

// 1. Tab Switch
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  logTimeSpent(); 

  activeTabId = activeInfo.tabId;
  startTime = Date.now();
  
  evaluateState();
});

// 2. URL/Title Update
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tabId === activeTabId && (changeInfo.title || changeInfo.url)) {
    logTimeSpent();
    startTime = Date.now(); // Reset timer for new URL/Title
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

// Heartbeat: Check every 5 seconds to see if a "focused" tab has turned "distracted" by time limit
setInterval(() => {
  evaluateState();
}, 5000);