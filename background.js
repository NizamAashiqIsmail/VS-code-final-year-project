let activeTabId = null;
let startTime = null;
let activeTabTitle = "";
let activeTabUrl = "";

// Function to log time spent (Your existing logic)
function logTimeSpent() {
  if (activeTabId && startTime) {
    const endTime = Date.now();
    const durationSeconds = Math.round((endTime - startTime) / 1000);
    console.log(`Tab: "${activeTabTitle}" | Duration: ${durationSeconds} seconds`);
    return durationSeconds;
  }
  return 0;
}

// --- NEW: Evaluate State & Notify Content Script ---
async function evaluateState() {
  if (!activeTabId) return;

  try {
    const tab = await chrome.tabs.get(activeTabId);
    activeTabUrl = tab.url || "";
    activeTabTitle = tab.title || "Unknown";

    // 1. Get Blocklist and Avatar settings from storage
    const data = await chrome.storage.local.get(["blockList"]);
    const blockList = data.blockList || [];
    
    // 2. Determine State
    let state = "focused"; // Default
    
    // Check if current URL is in block list
    const blockedSite = blockList.find(site => activeTabUrl.includes(site.url));
    
    if (blockedSite) {
      const timeSpent = (Date.now() - startTime) / 1000;
      // If user spent more than the allowed limit
      if (timeSpent > blockedSite.limit) {
        state = "distracted";
      }
    } else if (activeTabUrl.startsWith("chrome://") || activeTabUrl.startsWith("about:")) {
      state = "out_of_path";
    }

    // 3. Send message to the Content Script in the current tab
    chrome.tabs.sendMessage(activeTabId, { 
      type: "STATE_UPDATE", 
      state: state 
    }).catch(err => console.log("Content script not ready yet"));

  } catch (e) {
    console.error("Error evaluating state:", e);
  }
}

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