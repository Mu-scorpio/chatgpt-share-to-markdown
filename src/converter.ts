import {
	ChatGPTAttachment,
	ChatGPTContentReference,
	ChatGPTLoaderData,
	ChatGPTMessage,
} from "./types";

/**
 * Convert parsed ChatGPT shared data to Markdown.
 */
export function convertToMarkdown(data: ChatGPTLoaderData): string {
	const post = data.postWithProfile?.post;
	if (!post) return "";

	const title = post.text || post.og_title || "ChatGPT Conversation";
	const lines: string[] = [];

	// Frontmatter
	lines.push("---");
	lines.push(`title: "${escapeYaml(title)}"`);
	lines.push(`source: "${post.permalink || ""}"`);
	lines.push(`date: ${post.posted_at ? new Date(post.posted_at * 1000).toISOString().split("T")[0] : ""}`);
	lines.push("---");
	lines.push("");
	lines.push(`# ${title}`);
	lines.push("");

	// Process each attachment
	if (post.attachments) {
		for (const attachment of post.attachments) {
			const content = processAttachment(attachment, data);
			if (content) {
				lines.push(content);
			}
		}
	}

	return lines.join("\n");
}

function escapeYaml(str: string): string {
	return str.replace(/"/g, '\\"');
}

function processAttachment(
	attachment: ChatGPTAttachment,
	_data: ChatGPTLoaderData
): string | null {
	switch (attachment.kind) {
		case "message_slice":
			return processMessageSlice(attachment.messages || []);
		case "deep_research":
			return processDeepResearch(attachment.messages || []);
		case "code_block":
			return processCodeBlock(attachment.content || "", attachment.language);
		case "media_generation":
			return `[Image]`;
		default:
			return null;
	}
}

function processMessageSlice(messages: ChatGPTMessage[]): string {
	const lines: string[] = [];
	const conversationMessages = filterConversationMessages(messages);

	for (const msg of conversationMessages) {
		const role = msg.author?.role;
		let content = extractMessageContent(msg);

		if (!content) continue;

		// Ensure proper line breaks in the content
		content = ensureProperLineBreaks(content);

		if (role === "user") {
			lines.push("## User");
			lines.push("");
			lines.push(content);
			lines.push("");
		} else if (role === "assistant") {
			lines.push("## Assistant");
			lines.push("");
			lines.push(content);
			lines.push("");
		}
	}

	return lines.join("\n");
}

function processDeepResearch(messages: ChatGPTMessage[]): string {
	const lines: string[] = [];
	const conversationMessages = filterConversationMessages(messages);

	for (const msg of conversationMessages) {
		const role = msg.author?.role;
		let content = extractMessageContent(msg);

		if (!content) continue;

		// Ensure proper line breaks in the content
		content = ensureProperLineBreaks(content);

		if (role === "user") {
			lines.push("## User");
			lines.push("");
			lines.push(content);
			lines.push("");
		} else if (role === "assistant") {
			lines.push("## Assistant");
			lines.push("");
			lines.push(content);
			lines.push("");
		}
	}

	return lines.join("\n");
}

function processCodeBlock(content: string, language?: string): string {
	const lang = language || "";
	return `\`\`\`${lang}\n${content}\n\`\`\``;
}

/**
 * Filter messages to only include user and assistant conversation messages.
 * Excludes tool calls, search results, and internal system messages.
 */
function filterConversationMessages(messages: ChatGPTMessage[]): ChatGPTMessage[] {
	return messages.filter((msg) => {
		const role = msg.author?.role;
		if (role === "user") return true;
		if (role === "assistant") {
			// Include assistant messages that have actual text content
			// Exclude tool call messages (code content_type with search queries)
			const contentType = msg.content?.content_type;
			if (contentType === "code") {
				const text = msg.content?.text || "";
				// Exclude internal search query construction
				if (text.includes("system1_search_query")) return false;
				return true;
			}
			return true;
		}
		return false;
	});
}

/**
 * Convert citation markers to Markdown links when ChatGPT provides source metadata.
 * Falls back to removing unresolved citation artifacts.
 */
function cleanCitations(text: string, msg: ChatGPTMessage): string {
	let cleaned = text;
	const citationLinks = buildCitationLinkMap(msg.metadata?.content_references || []);

	for (const [marker, link] of citationLinks) {
		if (isCitationRefId(marker)) continue;

		cleaned = cleaned.replace(
			new RegExp(escapeRegExp(marker), "g"),
			formatInlineCitationLink(link)
		);
	}

	cleaned = cleaned.replace(
		/citation:(turn\d+search\d+)/g,
		(_match, refId: string) => {
			const link = citationLinks.get(refId);
			return link ? formatInlineCitationLink(link) : "";
		}
	);
	cleaned = cleaned.replace(
		/NciteÖ(turn\d+search\d+)Ő/g,
		(_match, refId: string) => {
			const link = citationLinks.get(refId);
			return link ? formatInlineCitationLink(link) : "";
		}
	);
	cleaned = cleaned.replace(
		/cite(turn\d+search\d+)/g,
		(_match, refId: string) => {
			const link = citationLinks.get(refId);
			return link ? formatInlineCitationLink(link) : "";
		}
	);

	// Collapse multiple spaces into single spaces, but keep newlines intact
	return cleaned.replace(/[ \t]+/g, " ").trim();
}

function buildCitationLinkMap(
	references: ChatGPTContentReference[]
): Map<string, string> {
	const links = new Map<string, string>();

	for (const reference of references) {
		const matchedText = reference.matched_text;
		const link = getReferenceMarkdownLink(reference);
		if (!matchedText || !link) continue;

		links.set(matchedText, link);

		const refId = extractCitationRefId(matchedText);
		if (refId) {
			links.set(refId, link);
		}
	}

	return links;
}

function formatInlineCitationLink(link: string): string {
	return ` ${link}`;
}

function getReferenceMarkdownLink(reference: ChatGPTContentReference): string | null {
	const alt = reference.alt?.trim();
	if (alt) {
		return stripOuterParentheses(alt);
	}

	const item = reference.items?.find((entry) => entry.url);
	const url = item?.url || reference.safe_urls?.[0];
	if (!url) return null;

	const title = item?.attribution || item?.title || url;
	return `[${escapeMarkdownLinkText(title)}](${url})`;
}

function stripOuterParentheses(text: string): string {
	const match = text.match(/^\((\[[^\]]+\]\([^)]+\))\)$/);
	return match ? match[1] : text;
}

function extractCitationRefId(text: string): string | null {
	const match = text.match(/turn\d+search\d+/);
	return match ? match[0] : null;
}

function isCitationRefId(text: string): boolean {
	return /^turn\d+search\d+$/.test(text);
}

function escapeRegExp(text: string): string {
	return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeMarkdownLinkText(text: string): string {
	return text.replace(/([\\\]])/g, "\\$1");
}

/**
 * Extract readable text content from a message.
 */
function extractMessageContent(msg: ChatGPTMessage): string | null {
	const content = msg.content;
	if (!content) return null;

	if (content.content_type === "text") {
		const parts = content.parts;
		if (Array.isArray(parts)) {
			const cleaned = parts
				.filter((p) => p && p.trim())
				.map((p) => cleanCitations(p, msg));
			// Join parts with newlines preserved, ensuring proper markdown formatting
			return cleaned.join("\n\n");
		}
		return null;
	}

	if (content.content_type === "code") {
		const text = content.text || "";
		// Skip internal search query messages
		if (text.includes("system1_search_query")) return null;
		const lang = content.language || "";
		return `\`\`\`${lang}\n${text}\n\`\`\``;
	}

	return null;
}

/**
 * Ensure proper line breaks in markdown output.
 * ChatGPT sometimes uses single newlines that should be preserved.
 */
function ensureProperLineBreaks(text: string): string {
	// Replace multiple consecutive newlines with proper markdown line breaks
	// Single newlines within paragraphs should become double newlines for markdown
	return text
		// Replace multiple newlines with proper spacing
		.replace(/\n{3,}/g, "\n\n")
		// Ensure each paragraph is separated by two newlines
		.replace(/([^\n])\n([^\n])/g, "$1\n\n$2");
}
