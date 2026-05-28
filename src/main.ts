import { Notice, Plugin, requestUrl } from "obsidian";
import { parseSharedPage } from "./parser";
import { convertToMarkdown } from "./converter";

const CHATGPT_SHARE_REGEX = /https?:\/\/chatgpt\.com\/s\/([a-zA-Z0-9_-]+)/;

export default class ChatGPTShareToMarkdown extends Plugin {
	async onload() {
		// Add ribbon icon that opens URL input modal
		this.addRibbonIcon("download", "ChatGPT Share Importer", () => {
			this.importWithUrlInput();
		});

		this.addCommand({
			id: "import-chatgpt-share",
			name: "Import ChatGPT shared link",
			callback: () => this.importFromClipboard(),
		});

		this.addCommand({
			id: "import-chatgpt-share-url",
			name: "Import ChatGPT shared link (enter URL)",
			callback: () => this.importWithUrlInput(),
		});

		this.registerEvent(
			this.app.workspace.on("editor-paste", (evt, _editor, info) => {
				const infoAny = info as unknown as Record<string, unknown>;
				const plain = infoAny?.plain as string | undefined;
				if (plain) {
					const url = plain.trim();
					if (CHATGPT_SHARE_REGEX.test(url)) {
						evt.preventDefault();
						this.importFromUrl(url);
					}
				}
			})
		);
	}

	async importFromClipboard() {
		try {
			const text = await navigator.clipboard.readText();
			const url = text.trim();
			if (!CHATGPT_SHARE_REGEX.test(url)) {
				new Notice("Clipboard does not contain a valid ChatGPT shared link");
				return;
			}
			await this.importFromUrl(url);
		} catch {
			new Notice("Failed to read clipboard");
		}
	}

	async importWithUrlInput() {
		const modal = new UrlInputModal(this.app, async (url) => {
			await this.importFromUrl(url);
		});
		modal.open();
	}

	async importFromUrl(url: string) {
		const match = url.match(CHATGPT_SHARE_REGEX);
		if (!match) {
			new Notice("Invalid ChatGPT shared link format");
			return;
		}

		const postId = match[1];
		new Notice("Fetching conversation...");

		try {
			const response = await requestUrl({
				url: url,
				method: "GET",
			});

			const html = response.text;
			const data = parseSharedPage(html);

			if (!data || !data.postWithProfile) {
				new Notice("Failed to parse conversation data");
				return;
			}

			const markdown = convertToMarkdown(data);
			const title = data.postWithProfile.post?.text || postId;
			const filename = sanitizeFilename(title) + ".md";

			const vault = this.app.vault;
			const filePath = filename;

			// Check if file already exists
			const existingFile = vault.getAbstractFileByPath(filePath);
			if (existingFile) {
				new Notice(`File "${filename}" already exists`);
				return;
			}

			await vault.create(filePath, markdown);
			new Notice(`Saved as "${filename}"`);

			// Open the file
			const file = vault.getAbstractFileByPath(filePath);
			if (file) {
				await this.app.workspace.openLinkText(filePath, "", false);
			}
		} catch (err) {
			console.error("Failed to import ChatGPT share:", err);
			new Notice("Failed to fetch or parse the shared link");
		}
	}
}

function sanitizeFilename(name: string): string {
	return name
		.replace(/[<>:"/\\|?*]/g, "_")
		.replace(/\s+/g, " ")
		.trim()
		.substring(0, 200);
}

// Simple URL input modal
import { App, Modal } from "obsidian";

class UrlInputModal extends Modal {
	private url: string = "";
	private onSubmit: (url: string) => void;

	constructor(app: App, onSubmit: (url: string) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl("h2", { text: "Enter ChatGPT shared link" });

		const inputEl = contentEl.createEl("input", {
			type: "text",
			placeholder: "https://chatgpt.com/s/...",
			cls: "chatgpt-url-input",
		});
		inputEl.style.width = "100%";
		inputEl.style.marginTop = "10px";

		inputEl.addEventListener("keydown", (evt) => {
			if (evt.key === "Enter") {
				this.url = inputEl.value.trim();
				if (this.url) {
					this.onSubmit(this.url);
					this.close();
				}
			}
		});

		const btnContainer = contentEl.createEl("div");
		btnContainer.style.marginTop = "15px";
		btnContainer.style.display = "flex";
		btnContainer.style.justifyContent = "flex-end";
		btnContainer.style.gap = "10px";

		const cancelBtn = btnContainer.createEl("button", { text: "Cancel" });
		cancelBtn.addEventListener("click", () => this.close());

		const submitBtn = btnContainer.createEl("button", { text: "Import", cls: "mod-cta" });
		submitBtn.addEventListener("click", () => {
			this.url = inputEl.value.trim();
			if (this.url) {
				this.onSubmit(this.url);
				this.close();
			}
		});

		inputEl.focus();
	}

	onClose() {
		this.contentEl.empty();
	}
}
