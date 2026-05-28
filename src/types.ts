export interface ChatGPTContentReference {
	matched_text?: string;
	alt?: string;
	safe_urls?: string[];
	items?: Array<{
		title?: string;
		url?: string;
		attribution?: string;
	}>;
	type?: string;
}

export interface ChatGPTMessage {
	id: string;
	author: {
		role: "user" | "assistant" | "tool" | "system";
		name?: string | null;
		metadata?: Record<string, unknown>;
	};
	create_time: number | null;
	update_time: number | null;
	content: {
		content_type: string;
		parts?: string[];
		text?: string;
		language?: string;
	};
	status: string;
	end_turn: boolean | null;
	weight: number;
	metadata?: Record<string, unknown> & {
		content_references?: ChatGPTContentReference[];
	};
	recipient?: string;
	channel?: string;
}

export interface ChatGPTAttachment {
	id: string;
	tags: string[];
	kind: string;
	messages?: ChatGPTMessage[];
	group_chat_id?: string | null;
	// deep_research type
	task?: unknown;
	turns?: unknown;
	// code_block type
	content?: string;
	language?: string;
}

export interface ChatGPTPost {
	id: string;
	posted_at: number;
	text: string;
	og_title?: string;
	og_description?: string;
	attachments: ChatGPTAttachment[];
	preview_image_url?: string;
	permalink?: string;
}

export interface ChatGPTPostWithProfile {
	post: ChatGPTPost;
	profile?: {
		user_id: string;
		username: string;
		display_name?: string;
		profile_picture_url?: string;
	};
}

export interface ChatGPTLoaderData {
	kind: string;
	postWithProfile: ChatGPTPostWithProfile;
	referrer?: string;
	preferIntrinsicAspectRatioForOgImage?: boolean;
	enforceRenderedOgImg?: boolean;
	defaultOgDescription?: string;
}
