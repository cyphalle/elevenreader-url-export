# ElevenReader URL Export

A Firefox extension to send article URLs directly to your ElevenReader library.

## Features

- Send current tab URL to ElevenReader with one click
- Send all open tabs at once
- Direct API integration - no copy/paste needed
- View history of sent URLs with success/failure status
- Clean, simple interface
- Works seamlessly when logged into ElevenReader

## Installation

### For Development

1. Open Firefox and navigate to `about:debugging`
2. Click "This Firefox" in the left sidebar
3. Click "Load Temporary Add-on"
4. Navigate to the extension directory and select `manifest.json`

### For Production

1. Package the extension as a ZIP file
2. Submit to Mozilla Add-ons for review

## Usage

**Important Requirements**:
1. You must be logged into [elevenreader.io](https://elevenreader.io)
2. Keep at least one elevenreader.io tab open in your browser (the extension needs to access your login session)

**How to use**:
1. Open elevenreader.io and log in
2. Keep that tab open (you can minimize or switch tabs)
3. Navigate to any article you want to send
4. Click the extension icon in your Firefox toolbar
5. Choose an action:
   - **Send Current Tab**: Send the active tab's URL to ElevenReader
   - **Send All Tabs**: Send all open tabs to ElevenReader
   - **Clear History**: Clear the history of sent URLs

The extension will show you whether each URL was successfully sent or if there was an error.

## File Structure

```
elevenreader-url-export/
├── manifest.json          # Extension configuration
├── background.js          # Background script
├── content.js             # Content script (runs on elevenreader.io)
├── popup/
│   ├── popup.html        # Popup interface
│   ├── popup.css         # Popup styling
│   └── popup.js          # Popup logic
├── icons/                # Extension icons (add your own)
│   ├── icon-48.png
│   └── icon-96.png
└── README.md             # This file
```

## Adding Icons

You'll need to add icon files to the `icons/` directory:
- `icon-48.png` (48x48 pixels)
- `icon-96.png` (96x96 pixels)

You can create simple icons or use any image editing tool.

## Permissions

This extension requires the following permissions:
- `tabs`: To access tab information and URLs
- `activeTab`: To get the current active tab
- `storage`: To save history locally
- `cookies`: To authenticate with ElevenReader
- `https://api.elevenlabs.io/*`: To send URLs to ElevenReader API
- `https://elevenreader.io/*`: To access ElevenReader authentication

## Technical Details

- **Manifest Version**: 2
- **API Endpoint**: `https://api.elevenlabs.io/v1/reader/reads/add/v2`
- **Authentication**: Uses your existing ElevenReader session cookies
- **Storage**: Uses `browser.storage.local` API to keep history
- **Rate Limiting**: 500ms delay between batch requests to avoid overwhelming the API
- **No external dependencies**

## How It Works

1. A content script runs on elevenreader.io pages and can access the page's localStorage
2. When you click "Send", the popup asks the content script for your authentication token
3. The content script reads the Firebase auth token from localStorage and sends it back
4. The extension uses Firefox's `fetch` API to send authenticated requests to the ElevenLabs API
5. It creates a `multipart/form-data` request with the URL in the `from_url` field and includes the Bearer token
6. The API processes the URL and adds it to your library
7. The extension displays success/failure status and keeps a local history

**Why do I need to keep elevenreader.io open?**
The authentication token is stored in the webpage's localStorage, which the extension can only access through a content script running on that page. Keeping a tab open ensures the content script can retrieve your authentication token.

## Development

To modify the extension:
1. Edit the source files
2. Reload the extension in `about:debugging`
3. Test your changes

## License

MIT
