import { z } from "zod";
export declare const listSectionsSchema: z.ZodObject<{
    section: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    section?: string | undefined;
}, {
    section?: string | undefined;
}>;
export type ListSectionsInput = z.infer<typeof listSectionsSchema>;
export declare function listSections(input: ListSectionsInput): Promise<string>;
//# sourceMappingURL=list-sections.d.ts.map