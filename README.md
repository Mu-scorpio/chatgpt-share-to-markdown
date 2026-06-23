# ChatGPT Share to Markdown

An Obsidian plugin that parses ChatGPT shared conversation links and saves them as Markdown files.

## Features

- Import ChatGPT shared conversations via URL
- Support for both `/s/` and `/share/` URL formats
- Automatic conversion to clean Markdown with frontmatter
- Preserves conversation structure (User/Assistant turns)
- Handles citations and references

## Installation

1. Download `main.js` and `manifest.json`
2. Place them in your Obsidian vault's `.obsidian/plugins/chatgpt-share-to-markdown/` directory
3. Enable the plugin in Obsidian settings

## Usage

### Ribbon Icon
Click the download icon in the left ribbon to open the URL input modal.

### Command Palette
- `Import ChatGPT shared link` - Import from clipboard
- `Import ChatGPT shared link (enter URL)` - Enter URL manually

### Paste Detection
Paste a ChatGPT share URL in the editor to automatically import it.

## Supported URL Formats

- `https://chatgpt.com/s/[id]`
- `https://chatgpt.com/share/[id]`

## Changelog

### v0.2.0
- Added support for new `/share/` URL format
- Updated parser for new ChatGPT page structure
- Fixed message extraction using tree traversal
- Improved citation handling

### v0.1.0
- Initial release
- Support for `/s/` URL format
