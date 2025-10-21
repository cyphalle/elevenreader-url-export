// Content script for ElevenReader URL Export
// This script runs on elevenreader.io pages and can access localStorage

// Listen for messages from the popup
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getAuthToken') {
    try {
      // Search through localStorage for Firebase auth data
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);

        // Look for Firebase auth user key
        if (key && key.startsWith('firebase:authUser:')) {
          const authData = localStorage.getItem(key);
          if (authData) {
            const parsedData = JSON.parse(authData);

            // Extract access token from stsTokenManager
            if (parsedData.stsTokenManager && parsedData.stsTokenManager.accessToken) {
              sendResponse({ token: parsedData.stsTokenManager.accessToken });
              return true;
            }
          }
        }
      }

      // Token not found
      sendResponse({ token: null, error: 'Authentication token not found' });
    } catch (error) {
      console.error('Error reading auth token:', error);
      sendResponse({ token: null, error: error.message });
    }

    return true; // Keep message channel open for async response
  }
});
