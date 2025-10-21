// Background script for ElevenReader URL Export
// This script handles extension lifecycle and message passing

browser.runtime.onInstalled.addListener(() => {
  console.log('ElevenReader URL Export extension installed');
});

// Listen for messages from popup
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'exportUrls') {
    // Handle URL export logic here
    console.log('Export URLs requested');
  }
});
