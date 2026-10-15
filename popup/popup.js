// Popup script for ElevenReader URL Export

const urlList = document.getElementById('urlList');
const statusDiv = document.getElementById('status');
const API_ENDPOINT = 'https://api.elevenlabs.io/v1/reader/reads/add/v2';
const HISTORY_LIMIT = 100;

// Query parameters that commonly carry credentials. They are removed before a
// URL leaves the browser.
const SENSITIVE_PARAMS = new Set([
  'code', 'token', 'access_token', 'id_token', 'refresh_token', 'sig',
  'signature', 'key', 'api_key', 'apikey', 'auth', 'password', 'session'
]);

function isSensitiveParam(name) {
  const lower = name.toLowerCase();
  return SENSITIVE_PARAMS.has(lower) || lower.startsWith('x-amz-');
}

// Returns a sanitized http(s) URL, or null when the URL must not be sent.
function sanitizeUrl(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch (e) {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return null;
  }
  for (const name of [...url.searchParams.keys()]) {
    if (isSensitiveParam(name)) {
      url.searchParams.delete(name);
    }
  }
  // OAuth implicit flows put tokens in the fragment.
  if (url.hash.includes('=')) {
    const fragment = new URLSearchParams(url.hash.slice(1));
    if ([...fragment.keys()].some(isSensitiveParam)) {
      url.hash = '';
    }
  }
  return url.toString();
}

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
    const empty = document.createElement('div');
    empty.className = 'empty-message';
    empty.textContent = 'No URLs sent yet';
    urlList.replaceChildren(empty);
    return;
  }

  urlList.replaceChildren(...urls.slice(-10).reverse().map((item) => {
    const row = document.createElement('div');
    row.className = 'url-item';
    const text = document.createElement('div');
    text.className = 'url-text';
    text.textContent = item.url;
    const status = document.createElement('div');
    status.className = `url-status ${item.success ? 'success' : 'error'}`;
    status.textContent = item.success ? '✓ Sent' : '✗ Failed';
    row.append(text, status);
    return row;
  }));
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
    browser.storage.local.set({ sentUrls: urls.slice(-HISTORY_LIMIT) }).then(() => {
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
    const url = sanitizeUrl(tabs[0].url);
    if (!url) {
      showStatus('✗ Only http(s) pages can be sent', 'error');
      return;
    }
    showStatus('Sending to ElevenReader...', 'info');
    const result = await sendToElevenReader(url);

    if (result.success) {
      showStatus('✓ Sent to ElevenReader!', 'success');
    } else {
      showStatus(`✗ Failed: ${result.error}`, 'error');
    }
  }
});

// Send all tabs: list the sanitized URLs and wait for an explicit confirmation.
const confirmPanel = document.getElementById('confirmAllTabs');
const confirmList = document.getElementById('confirmList');
const confirmCount = document.getElementById('confirmCount');
let pendingUrls = [];

document.getElementById('sendAllTabs').addEventListener('click', async () => {
  const tabs = await browser.tabs.query({ currentWindow: true });
  pendingUrls = [...new Set(tabs.map((tab) => sanitizeUrl(tab.url)).filter(Boolean))];

  if (pendingUrls.length === 0) {
    showStatus('No http(s) tabs to send', 'error');
    return;
  }

  confirmCount.textContent = `Send these ${pendingUrls.length} URLs to ElevenReader?`;
  confirmList.replaceChildren(...pendingUrls.map((url) => {
    const row = document.createElement('div');
    row.className = 'url-text';
    row.textContent = url;
    return row;
  }));
  confirmPanel.hidden = false;
});

document.getElementById('cancelAllTabs').addEventListener('click', () => {
  pendingUrls = [];
  confirmPanel.hidden = true;
});

document.getElementById('confirmSendAllTabs').addEventListener('click', async () => {
  const urls = pendingUrls;
  pendingUrls = [];
  confirmPanel.hidden = true;

  showStatus(`Sending ${urls.length} URLs...`, 'info');

  let successCount = 0;
  let failCount = 0;

  for (const url of urls) {
    const result = await sendToElevenReader(url);
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
