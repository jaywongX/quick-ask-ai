# Quick Search AI

A browser extension that allows you to quickly send selected text to various AI assistants for queries.

## Features

- Supports multiple mainstream AI assistants:
  - ChatGPT
  - DeepSeek AI
  - Qianwen
  - Google Gemini
  - Perplexity
  - Grok
  - Microsoft Copilot
  - Baidu ERNIE Bot
  - Kimi

- Easy to use:
  1. Select any text
  2. Right-click
  3. Choose your preferred AI assistant
  4. Automatically opens the AI assistant and sends the query

## Installation

1. Download the source code
2. Open Chrome browser, go to extensions page (chrome://extensions/)
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the source code folder

## Usage

1. Select any text on a webpage
2. Right-click and select "Quick Search AI" from the menu
3. Choose your preferred AI assistant
4. The extension will automatically open a new tab and send the selected text to the AI assistant

## Notes

- Some AI assistants require login
- Ensure you have access to the respective AI assistants
- The extension handles text input and sending automatically

## Version History

### v1.0.4
* feat(i18n): improve internationalization implementation

### v1.0.3
* feat(tab): add tab behavior setting for each AI assistant
- Add option to reuse existing tab or create new tab
- Add tab behavior selector in assistant edit dialog
- Implement tab reuse logic in background script

### v1.0.2
- chatgpt The reason mode can be set
- deepseek Allows you to set the deepthink and search modes
- kimi supports the thinking and search mode

### v1.0.1
- Implement the plug-in UI
- Support AI assistant disable, edit, delete functions
- Added query mode. You can add, delete and modify the query mode. The default query mode is provided
- New feedback and donation mechanism

### v1.0.0
- Initial release
- Support for 9 mainstream AI assistants
- Basic text selection and sending functionality

## Technical Implementation

- Uses Chrome Extension Manifest V3
- Supports DOM operation adaptation for different AI assistants
- Asynchronous handling of page loading and element finding

## License

[Add license information]

## Contributing

Issues and Pull Requests are welcome to help improve this project.

## Author

[Add author information] 