# ChatGPT Share to Markdown

An Obsidian plugin that imports ChatGPT shared conversation links and saves them as Markdown files.

## Features

- Import ChatGPT shared conversations by URL
- Support for both `/s/` and `/share/` URL formats
- Convert conversations to clean Markdown with frontmatter
- Preserve user and assistant turns
- Handle citations and references

## Installation

Download the latest release files from GitHub Releases:

- `main.js`
- `manifest.json`

Place them in your vault at:

```text
.obsidian/plugins/chatgpt-share-to-markdown/
```

Then enable **ChatGPT Share to Markdown** in Obsidian's community plugin settings.

## Usage

### Ribbon Icon

Click the download icon in the left ribbon to enter a ChatGPT share URL.

### Command Palette

- `Import ChatGPT shared link`: import from clipboard
- `Import ChatGPT shared link (enter URL)`: enter a URL manually

### Paste Detection

Paste a ChatGPT share URL in the editor to import it automatically.

## Supported URL Formats

- `https://chatgpt.com/s/[id]`
- `https://chatgpt.com/share/[id]`

## Development

```bash
npm install
npm run dev
```

For a production build:

```bash
npm run build
```

The build generates `main.js` in the project root. This file is ignored by Git and should be uploaded with `manifest.json` as a release asset.

## Release

1. Update `manifest.json` and `package.json` to the new version.
2. Run `npm run version` to update `versions.json`.
3. Commit the changes.
4. Create and push a tag such as `0.2.0`.

The GitHub Actions release workflow builds the plugin and uploads release assets.

## License

MIT
