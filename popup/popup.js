// Popup script for ElevenReader URL Export

const urlList = document.getElementById('urlList');
const statusDiv = document.getElementById('status');
const API_ENDPOINT = 'https://api.elevenlabs.io/v1/reader/reads/add/v2';

// Load and display history
function loadHistory() {
  browser.storage.local.get('sentUrls').then((result) => {
    const urls = result.sentUrls || [];
    displayHistory(urls);
  });
}

// Display URLs in the history list
function displayHistory(urls) {
  if (urls.length === 0) {
    urlList.innerHTML = '<div class="empty-message">No URLs sent yet</div>';
    return;
  }

  urlList.innerHTML = urls.slice(-10).reverse().map((item, index) =>
    `<div class="url-item">
      <div class="url-text">${item.url}</div>
      <div class="url-status ${item.success ? 'success' : 'error'}">${item.success ? '✓ Sent' : '✗ Failed'}</div>
    </div>`
  ).join('');
}

// Show status message
function showStatus(message, type = 'success') {
  statusDiv.textContent = message;
  statusDiv.className = `status show ${type}`;
  setTimeout(() => {
    statusDiv.classList.remove('show');
  }, 3000);
}

// Add URL to history
function addToHistory(url, success) {
  browser.storage.local.get('sentUrls').then((result) => {
    const urls = result.sentUrls || [];
    urls.push({ url, success, timestamp: new Date().toISOString() });
    browser.storage.local.set({ sentUrls: urls }).then(() => {
      loadHistory();
    });
  });
}

// Get authentication token from elevenreader.io localStorage
async function getAuthToken() {
  try {
    // Find a tab with elevenreader.io
    const tabs = await browser.tabs.query({ url: "https://elevenreader.io/*" });

    if (tabs.length === 0) {
      console.error('No elevenreader.io tab found. Please open elevenreader.io and log in.');
      return null;
    }

    // Send message to content script running on elevenreader.io
    const response = await browser.tabs.sendMessage(tabs[0].id, { action: 'getAuthToken' });

    if (response && response.token) {
      return response.token;
    } else {
      console.error('Failed to get token:', response?.error);
      return null;
    }
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return null;
  }
}

// Send URL to ElevenReader API
async function sendToElevenReader(url) {
  try {
    // Get auth token
    const authToken = await getAuthToken();

    if (!authToken) {
      addToHistory(url, false);
      return { success: false, error: 'Please open elevenreader.io in a tab and log in first.' };
    }

    // Create FormData
    const formData = new FormData();
    formData.append('from_url', url);

    // Prepare headers
    const headers = {
      'Authorization': `Bearer ${authToken}`
    };

    // Make the API request
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: headers,
      body: formData,
      credentials: 'include'
    });

    if (response.ok) {
      addToHistory(url, true);
      return { success: true };
    } else {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      addToHistory(url, false);
      return { success: false, error: `API returned ${response.status}` };
    }
  } catch (error) {
    console.error('Request failed:', error);
    addToHistory(url, false);
    return { success: false, error: error.message };
  }
}

// Send current tab
document.getElementById('sendCurrentTab').addEventListener('click', async () => {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });

  if (tabs[0]) {
    showStatus('Sending to ElevenReader...', 'info');
    const result = await sendToElevenReader(tabs[0].url);

    if (result.success) {
      showStatus('✓ Sent to ElevenReader!', 'success');
    } else {
      showStatus(`✗ Failed: ${result.error}`, 'error');
    }
  }
});

// Send all tabs
document.getElementById('sendAllTabs').addEventListener('click', async () => {
  const tabs = await browser.tabs.query({ currentWindow: true });

  showStatus(`Sending ${tabs.length} URLs...`, 'info');

  let successCount = 0;
  let failCount = 0;

  for (const tab of tabs) {
    const result = await sendToElevenReader(tab.url);
    if (result.success) {
      successCount++;
    } else {
      failCount++;
    }
    // Small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  showStatus(`✓ ${successCount} sent, ${failCount} failed`, successCount > 0 ? 'success' : 'error');
});

// Clear history
document.getElementById('clearHistory').addEventListener('click', () => {
  if (confirm('Clear all history?')) {
    browser.storage.local.set({ sentUrls: [] }).then(() => {
      loadHistory();
      showStatus('History cleared');
    });
  }
});

// Load history on popup open
loadHistory();
