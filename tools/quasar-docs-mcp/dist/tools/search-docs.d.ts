import { z } from "zod";
export declare const searchDocsSchema: z.ZodObject<{
    query: z.ZodString;
    section: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
    includeContent: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    query: string;
    limit: number;
    includeContent: boolean;
    section?: string | undefined;
}, {
    query: string;
    section?: string | undefined;
    limit?: number | undefined;
    includeContent?: boolean | undefined;
}>;
export type SearchDocsInput = z.infer<typeof searchDocsSchema>;
export declare function searchDocs(input: SearchDocsInput): Promise<string>;
//# sourceMappingURL=search-docs.d.ts.map