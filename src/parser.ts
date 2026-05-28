import { ChatGPTLoaderData } from "./types";

/**
 * Extract the serialized data string from ChatGPT shared page HTML.
 * The data is in streamController.enqueue("...") calls with escaped quotes.
 */
function extractEnqueueData(html: string): string | null {
	const marker = 'streamController.enqueue("';
	const chunks: string[] = [];
	let searchStart = 0;

	while (true) {
		const idx = html.indexOf(marker, searchStart);
		if (idx < 0) break;

		const dataStart = idx + marker.length;

		// Find the closing ") - scan for unescaped quote followed by )
		let pos = dataStart;
		while (pos < html.length) {
			if (html[pos] === "\\") {
				pos += 2; // skip escaped character
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

	// Join all chunks and unescape JavaScript string escapes
	// Order matters: unescape \\" first (becomes "), then \\\\ (becomes \)
	return chunks.join("")
		.replace(/\\"/g, '"')
		.replace(/\\\\/g, "\\");
}

/**
 * Extract and parse the React Router serialized data from ChatGPT shared page HTML.
 */
function extractSerializedData(html: string): unknown[] | null {
	const combined = extractEnqueueData(html);
	if (!combined) return null;

	// Find the correct end of the JSON array by tracking bracket depth
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

/**
 * Recursively resolve the Turbopack serialized references.
 * Objects use _N keys where N is an index into the data array for the key name.
 * Integer values that are valid indices are also resolved to their data array values.
 * Negative integers (-5, -7) are special values representing null.
 */
function resolveValue(data: unknown[], val: unknown, depth = 0): unknown {
	if (depth > 50) return "<max depth>";
	if (val === null || val === undefined) return val;
	if (typeof val === "boolean") return val;
	if (typeof val === "string") return val;

	if (typeof val === "number") {
		// Negative numbers are special values (null-like)
		if (val < 0) return null;
		// Positive numbers that are valid indices should be resolved
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

/**
 * Parse the HTML of a ChatGPT shared page and extract the loader data.
 */
export function parseSharedPage(html: string): ChatGPTLoaderData | null {
	const data = extractSerializedData(html);
	if (!data) return null;

	// Find the route data for "routes/s.$postId"
	const routeIdx = data.indexOf("routes/s.$postId");
	if (routeIdx < 0) return null;

	const routeRef = data[routeIdx + 1];
	if (!routeRef || typeof routeRef !== "object") return null;

	// Resolve the route data
	const resolved = resolveValue(data, routeRef) as Record<string, unknown>;
	return resolved as unknown as ChatGPTLoaderData;
}
