import type { DocIndex, DocPage, SearchResult } from "../types/index.js";
export declare function searchIndex(index: DocIndex, query: string, limit?: number): SearchResult[];
export declare function searchContent(query: string, paths: string[], limit?: number): Promise<SearchResult[]>;
export declare function filterBySection(index: DocIndex, section: string): DocPage[];
//# sourceMappingURL=search.d.ts.map