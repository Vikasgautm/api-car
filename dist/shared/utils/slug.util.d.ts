export declare class SlugUtil {
    static generate(text: string): string;
    static generateUnique(baseText: string, existingSlugs: string[]): string;
    static validate(slug: string): boolean;
    static sanitize(text: string): string;
    static fromId(id: string, prefix?: string): string;
}
//# sourceMappingURL=slug.util.d.ts.map