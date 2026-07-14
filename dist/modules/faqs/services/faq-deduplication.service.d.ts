export declare class FAQDeduplicationService {
    static normalizeQuestion(question: string): string;
    static computeJaccard(a: string, b: string): number;
    static areSimilar(q1: string, q2: string, threshold?: number): boolean;
    static deduplicateFAQs<T extends {
        question: string;
        priority_score?: number;
    }>(faqs: T[]): T[];
    static checkDuplicateInDB(question: string, excludeId?: string): Promise<{
        isDuplicate: boolean;
        similarFaqId?: string;
        similarQuestion?: string;
        similarity?: number;
    }>;
    static findAllDuplicates(): Promise<Array<{
        faq_ids: string[];
        questions: string[];
        similarity: number;
    }>>;
}
