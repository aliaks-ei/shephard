import { z } from "zod";
export declare const getComponentSchema: z.ZodObject<{
    component: z.ZodString;
}, "strip", z.ZodTypeAny, {
    component: string;
}, {
    component: string;
}>;
export type GetComponentInput = z.infer<typeof getComponentSchema>;
export declare function getComponent(input: GetComponentInput): Promise<{
    content: string;
    url: string;
} | {
    error: string;
}>;
//# sourceMappingURL=get-component.d.ts.map