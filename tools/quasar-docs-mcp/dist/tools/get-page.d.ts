import { z } from "zod";
export declare const getPageSchema: z.ZodObject<{
    path: z.ZodString;
}, "strip", z.ZodTypeAny, {
    path: string;
}, {
    path: string;
}>;
export type GetPageInput = z.infer<typeof getPageSchema>;
export declare function getPage(input: GetPageInput): Promise<{
    content: string;
    url: string;
} | {
    error: string;
}>;
//# sourceMappingURL=get-page.d.ts.map