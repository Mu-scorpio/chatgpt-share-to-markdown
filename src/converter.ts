import {
	ChatGPTAttachment,
	ChatGPTContentReference,
	ChatGPTLoaderData,
	ChatGPTMappingNode,
	ChatGPTMessage,
} from "./types";

export function convertToMarkdown(data: ChatGPTLoaderData): string {
	if (data.serverResponse?.data) {
		return convertNewFormat(data);
	}
	
	const post = data.postWithProfile?.post;
	if (!post) return "";

	const title = post.text || post.og_title || "ChatGPT Conversation";
	const lines: string[] = [];

	lines.push("---");
	lines.push(`title: "${escapeYaml(title)}"`);
	lines.push(`source: "${post.permalink || ""}"`);
	lines.push(`date: ${post.posted_at ? new Date(post.posted_at * 1000).toISOString().split("T")[0] : ""}`);
	lines.push("---");
	lines.push("");
	lines.push(`# ${title}`);
	lines.push("");

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

function convertNewFormat(data: ChatGPTLoaderData): string {
	const conversation = data.serverResponse!.data!;
	const title = conversation.title || "ChatGPT Conversation";
	const lines: string[] = [];

	lines.push("---");
	lines.push(`title: "${escapeYaml(title)}"`);
	lines.push(`source: "https://chatgpt.com/share/${data.sharedConversationId || ""}"`);
	lines.push(`date: ${conversation.create_time ? new Date(conversation.create_time * 1000).toISOString().split("T")[0] : ""}`);
	lines.push("---");
	lines.push("");
	lines.push(`# ${title}`);
	lines.push("");

	const messages = extractMessagesFromMapping(conversation.mapping);
	
	for (const msg of messages) {
		const role = msg.author?.role;
		let content = extractMessageContent(msg);

		if (!content) continue;

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

function extractMessagesFromMapping(mapping: Record<string, ChatGPTMappingNode>): ChatGPTMessage[] {
	const messages: ChatGPTMessage[] = [];
	
	const root = mapping["client-created-root"];
	if (!root) return messages;

	function visit(nodeId: string) {
		const node = mapping[nodeId];
		if (!node) return;
		
		if (node.message) {
			const role = node.message.author?.role;
			const contentType = node.message.content?.content_type;
			if ((role === "user" || role === "assistant") && (contentType === "text" || contentType === "code")) {
				messages.push(node.message);
			}
		}
		
		if (node.children) {
			for (const childId of node.children) {
				visit(childId);
			}
		}
	}

	if (root.children) {
		for (const childId of root.children) {
			visit(childId);
		}
	}

	return messages;
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
	return processMessageSlice(messages);
}

function processCodeBlock(content: string, language?: string): string {
	const lang = language || "";
	return `\`\`\`${lang}\n${content}\n\`\`\``;
}

function filterConversationMessages(messages: ChatGPTMessage[]): ChatGPTMessage[] {
	return messages.filter((msg) => {
		const role = msg.author?.role;
		if (role === "user") return true;
		if (role === "assistant") {
			const contentType = msg.content?.content_type;
			if (contentType === "code") {
				const text = msg.content?.text || "";
				if (text.includes("system1_search_query")) return false;
				return true;
			}
			return true;
		}
		return false;
	});
}

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
		/\uFFFDcite\uFFFD(turn\d+search\d+)\uFFFD/g,
		(_match, refId: string) => {
			const link = citationLinks.get(refId);
			return link ? formatInlineCitationLink(link) : "";
		}
	);
	cleaned = cleaned.replace(
		/\u3000cite\u3002(turn\d+search\d+)\u3001/g,
		(_match, refId: string) => {
			const link = citationLinks.get(refId);
			return link ? formatInlineCitationLink(link) : "";
		}
	);

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

function extractMessageContent(msg: ChatGPTMessage): string | null {
	const content = msg.content;
	if (!content) return null;

	if (content.content_type === "text") {
		const parts = content.parts;
		if (Array.isArray(parts)) {
			const cleaned = parts
				.filter((p) => p && p.trim())
				.map((p) => cleanCitations(p, msg));
			return cleaned.join("\n\n");
		}
		return null;
	}

	if (content.content_type === "code") {
		const text = content.text || "";
		if (text.includes("system1_search_query")) return null;
		const lang = content.language || "";
		return `\`\`\`${lang}\n${text}\n\`\`\``;
	}

	return null;
}

function ensureProperLineBreaks(text: string): string {
	return text
		.replace(/\n{3,}/g, "\n\n")
		.replace(/([^\n])\n([^\n])/g, "$1\n\n$2");
}
