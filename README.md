# ChatGPT Share to Markdown

An Obsidian desktop plugin that imports ChatGPT shared conversation links and saves them as Markdown notes.

## Features

- Import a ChatGPT shared link from the clipboard.
- Import a ChatGPT shared link by entering the URL manually.
- Parse ChatGPT shared-page loader data directly from the page HTML.
- Preserve assistant/user turns as Markdown sections.
- Convert ChatGPT citation markers into normal Markdown links when source metadata is available.
- Filter internal search/tool messages from the exported note.

## Installation

Download the latest release zip, then copy these files into your Obsidian vault plugin folder:

```text
<vault>/.obsidian/plugins/chatgpt-share-to-markdown/
```

Required files:

```text
main.js
manifest.json
```

Restart Obsidian or reload plugins, then enable **ChatGPT Share to Markdown** in Community plugins.

## Usage

Use either command from the Obsidian command palette:

- **Import ChatGPT shared link**: reads a ChatGPT shared link from your clipboard.
- **Import ChatGPT shared link (enter URL)**: opens a prompt where you can paste the shared link.

The plugin creates a Markdown note named after the shared conversation title.

## Development

Install dependencies:

```bash
npm install
```

Build the plugin:

```bash
npm run build
```

The production build is copied into `dist/` so the folder can be copied directly into an Obsidian plugin directory.

## License

MIT

