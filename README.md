# ElevenReader URL Export

A Firefox extension to collect and export URLs for use with ElevenReader.

## Features

- Export current tab URL
- Export all open tabs at once
- Store URLs locally in the browser
- Download URLs as a text file
- Avoid duplicate URLs
- Clean, simple interface

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

1. Click the extension icon in your Firefox toolbar
2. Choose an action:
   - **Export Current URL**: Save the currently active tab's URL
   - **Export All URLs**: Save all open tabs in the current window
   - **Clear All**: Remove all saved URLs
   - **Download as File**: Export all saved URLs to a text file

## File Structure

```
elevenreader-url-export/
├── manifest.json          # Extension configuration
├── background.js          # Background script
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
- `storage`: To save URLs locally
- `downloads`: To export URLs as a file (added automatically when using download API)

## Technical Details

- Manifest Version: 2
- Storage: Uses `browser.storage.local` API
- Download: Uses Firefox Downloads API
- No external dependencies

## Development

To modify the extension:
1. Edit the source files
2. Reload the extension in `about:debugging`
3. Test your changes

## License

MIT
