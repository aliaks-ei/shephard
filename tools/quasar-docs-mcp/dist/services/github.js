const GITHUB_RAW_BASE = "https://raw.githubusercontent.com/quasarframework/quasar/dev/docs/src/pages";
const GITHUB_API_BASE = "https://api.github.com/repos/quasarframework/quasar/contents/docs/src/pages";
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const cache = new Map();
function getCached(key) {
    const entry = cache.get(key);
    if (!entry)
        return null;
    if (Date.now() > entry.expiresAt) {
        cache.delete(key);
        return null;
    }
    return entry.content;
}
function setCache(key, content) {
    const entry = {
        content,
        fetchedAt: Date.now(),
        expiresAt: Date.now() + CACHE_TTL_MS,
    };
    cache.set(key, entry);
}
export async function fetchRawFile(path) {
    const cacheKey = `raw:${path}`;
    const cached = getCached(cacheKey);
    if (cached)
        return cached;
    const url = `${GITHUB_RAW_BASE}/${path}`;
    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "quasar-docs-mcp/1.0.0",
            },
        });
        if (!response.ok) {
            return null;
        }
        const content = await response.text();
        setCache(cacheKey, content);
        return content;
    }
    catch {
        return null;
    }
}
export async function fetchDirectoryContents(path) {
    const cacheKey = `dir:${path}`;
    const cached = getCached(cacheKey);
    if (cached)
        return JSON.parse(cached);
    const url = path ? `${GITHUB_API_BASE}/${path}` : GITHUB_API_BASE;
    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "quasar-docs-mcp/1.0.0",
                Accept: "application/vnd.github.v3+json",
            },
        });
        if (!response.ok) {
            return [];
        }
        const data = (await response.json());
        const items = data.map((item) => ({
            name: item.name,
            path: item.path.replace("docs/src/pages/", ""),
            type: item.type,
            url: item.url,
        }));
        setCache(cacheKey, JSON.stringify(items));
        return items;
    }
    catch {
        return [];
    }
}
export async function fetchAllMarkdownFiles() {
    const allFiles = [];
    async function crawlDirectory(dirPath) {
        const items = await fetchDirectoryContents(dirPath);
        for (const item of items) {
            if (item.type === "dir") {
                await crawlDirectory(item.path);
            }
            else if (item.name.endsWith(".md")) {
                allFiles.push(item.path);
            }
        }
    }
    await crawlDirectory("");
    return allFiles;
}
export function buildQuasarDocsUrl(path) {
    // Convert file path to quasar.dev URL
    // e.g., "vue-components/btn.md" -> "https://quasar.dev/vue-components/btn"
    const cleanPath = path.replace(/\.md$/, "").replace(/\/index$/, "");
    return `https://quasar.dev/${cleanPath}`;
}
export function clearCache() {
    cache.clear();
}
//# sourceMappingURL=github.js.map