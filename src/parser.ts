import { ChatGPTLoaderData } from "./types";

function extractEnqueueData(html: string): string | null {
	const marker = 'streamController.enqueue("';
	const chunks: string[] = [];
	let searchStart = 0;

	while (true) {
		const idx = html.indexOf(marker, searchStart);
		if (idx < 0) break;

		const dataStart = idx + marker.length;
		let pos = dataStart;
		while (pos < html.length) {
			if (html[pos] === "\\") {
				pos += 2;
				continue;
			}
			if (html[pos] === '"') {
				break;
			}
			pos++;
		}

		if (pos < html.length) {
			chunks.push(html.substring(dataStart, pos));
			searchStart = pos + 1;
		}
	}

	if (chunks.length === 0) return null;

	return chunks.join("")
		.replace(/\\"/g, '"')
		.replace(/\\\\/g, "\\");
}

function extractSerializedData(html: string): unknown[] | null {
	const combined = extractEnqueueData(html);
	if (!combined) return null;

	let depth = 0;
	let end = 0;
	for (let i = 0; i < combined.length; i++) {
		if (combined[i] === "[") depth++;
		else if (combined[i] === "]") {
			depth--;
			if (depth === 0) {
				end = i + 1;
				break;
			}
		}
	}

	if (end === 0) return null;

	try {
		return JSON.parse(combined.substring(0, end));
	} catch {
		return null;
	}
}

function resolveValue(data: unknown[], val: unknown, depth = 0): unknown {
	if (depth > 50) return "<max depth>";
	if (val === null || val === undefined) return val;
	if (typeof val === "boolean") return val;
	if (typeof val === "string") return val;

	if (typeof val === "number") {
		if (val < 0) return null;
		if (val < data.length) {
			return resolveValue(data, data[val], depth + 1);
		}
		return val;
	}

	if (Array.isArray(val)) {
		return val.map((v) => resolveValue(data, v, depth + 1));
	}

	if (typeof val === "object") {
		const result: Record<string, unknown> = {};
		const obj = val as Record<string, unknown>;
		for (const [k, v] of Object.entries(obj)) {
			if (k.startsWith("_")) {
				const keyIdx = parseInt(k.substring(1), 10);
				if (keyIdx >= 0 && keyIdx < data.length) {
					const keyName = resolveValue(data, data[keyIdx], depth + 1);
					if (typeof keyName === "string") {
						result[keyName] = resolveValue(data, v, depth + 1);
					}
				}
			} else {
				result[k] = resolveValue(data, v, depth + 1);
			}
		}
		return result;
	}

	return val;
}

export function parseSharedPage(html: string): ChatGPTLoaderData | null {
	const data = extractSerializedData(html);
	if (!data) return null;

	const routeIdx = data.indexOf("routes/share.$shareId.($action)");
	if (routeIdx >= 0) {
		const routeRef = data[routeIdx + 1];
		if (routeRef && typeof routeRef === "object") {
			const resolved = resolveValue(data, routeRef) as Record<string, unknown>;
			return resolved as unknown as ChatGPTLoaderData;
		}
	}

	const oldRouteIdx = data.indexOf("routes/s.$postId");
	if (oldRouteIdx >= 0) {
		const routeRef = data[oldRouteIdx + 1];
		if (routeRef && typeof routeRef === "object") {
			const resolved = resolveValue(data, routeRef) as Record<string, unknown>;
			return resolved as unknown as ChatGPTLoaderData;
		}
	}

	return null;
}
