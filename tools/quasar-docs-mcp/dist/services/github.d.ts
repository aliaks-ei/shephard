export declare function fetchRawFile(path: string): Promise<string | null>;
export type GitHubTreeItem = {
    name: string;
    path: string;
    type: "file" | "dir";
    url: string;
};
export declare function fetchDirectoryContents(path: string): Promise<GitHubTreeItem[]>;
export declare function fetchAllMarkdownFiles(): Promise<string[]>;
export declare function buildQuasarDocsUrl(path: string): string;
export declare function clearCache(): void;
//# sourceMappingURL=github.d.ts.map