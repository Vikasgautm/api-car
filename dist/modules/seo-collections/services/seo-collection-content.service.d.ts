import { ISeoCollection } from '../../../models/seo-collection.model';
export declare class SeoCollectionContentService {
    private static buildContext;
    private static budgetLabel;
    static generateH1(collection: Partial<ISeoCollection>): Promise<string>;
    static generateMetaTitle(collection: Partial<ISeoCollection>): Promise<string>;
    static generateMetaDescription(collection: Partial<ISeoCollection>): Promise<string>;
    static generateIntro(collection: Partial<ISeoCollection>): Promise<string>;
    static generateAll(collection: Partial<ISeoCollection>): Promise<{
        h1: string;
        meta_title: string;
        meta_description: string;
        intro_content: string;
    }>;
}
//# sourceMappingURL=seo-collection-content.service.d.ts.map