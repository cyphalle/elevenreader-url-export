// Popup script for ElevenReader URL Export

const urlList = document.getElementById('urlList');
const statusDiv = document.getElementById('status');

// Load and display saved URLs
function loadUrls() {
  browser.storage.local.get('savedUrls').then((result) => {
    const urls = result.savedUrls || [];
    displayUrls(urls);
  });
}

// Display URLs in the list
function displayUrls(urls) {
  if (urls.length === 0) {
    urlList.innerHTML = '<div class="empty-message">No URLs saved yet</div>';
    return;
  }

  urlList.innerHTML = urls.map((url, index) =>
    `<div class="url-item">${index + 1}. ${url}</div>`
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

// Save URL to storage
function saveUrl(url) {
  browser.storage.local.get('savedUrls').then((result) => {
    const urls = result.savedUrls || [];

    // Avoid duplicates
    if (!urls.includes(url)) {
      urls.push(url);
      browser.storage.local.set({ savedUrls: urls }).then(() => {
        loadUrls();
        showStatus('URL saved successfully!');
      });
    } else {
      showStatus('URL already saved', 'error');
    }
  });
}

// Save multiple URLs
function saveUrls(newUrls) {
  browser.storage.local.get('savedUrls').then((result) => {
    const urls = result.savedUrls || [];
    let addedCount = 0;

    newUrls.forEach(url => {
      if (!urls.includes(url)) {
        urls.push(url);
        addedCount++;
      }
    });

    browser.storage.local.set({ savedUrls: urls }).then(() => {
      loadUrls();
      showStatus(`${addedCount} URL(s) saved!`);
    });
  });
}

// Export current tab
document.getElementById('exportCurrentTab').addEventListener('click', () => {
  browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
    if (tabs[0]) {
      saveUrl(tabs[0].url);
    }
  });
});

// Export all tabs
document.getElementById('exportAllTabs').addEventListener('click', () => {
  browser.tabs.query({ currentWindow: true }).then((tabs) => {
    const urls = tabs.map(tab => tab.url);
    saveUrls(urls);
  });
});

// Clear all URLs
document.getElementById('clearUrls').addEventListener('click', () => {
  if (confirm('Are you sure you want to clear all saved URLs?')) {
    browser.storage.local.set({ savedUrls: [] }).then(() => {
      loadUrls();
      showStatus('All URLs cleared');
    });
  }
});

// Download URLs as file
document.getElementById('downloadUrls').addEventListener('click', () => {
  browser.storage.local.get('savedUrls').then((result) => {
    const urls = result.savedUrls || [];

    if (urls.length === 0) {
      showStatus('No URLs to download', 'error');
      return;
    }

    const content = urls.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

    browser.downloads.download({
      url: url,
      filename: `elevenreader-urls-${timestamp}.txt`,
      saveAs: true
    }).then(() => {
      showStatus('URLs downloaded successfully!');
      URL.revokeObjectURL(url);
    }).catch((error) => {
      showStatus('Download failed', 'error');
      console.error('Download error:', error);
    });
  });
});

// Load URLs on popup open
loadUrls();
