import { FAQ } from '../../../models/faq.model';

export class FAQDeduplicationService {
  static normalizeQuestion(question: string): string {
    return question
      .toLowerCase()
      .replace(/<[^>]*>/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  static computeJaccard(a: string, b: string): number {
    const setA = new Set(a.split(' '));
    const setB = new Set(b.split(' '));
    const intersection = new Set([...setA].filter((w) => setB.has(w)));
    const union = new Set([...setA, ...setB]);
    return union.size === 0 ? 0 : intersection.size / union.size;
  }

  // Returns true if two questions are likely duplicates (similarity > threshold)
  static areSimilar(q1: string, q2: string, threshold = 0.6): boolean {
    const n1 = FAQDeduplicationService.normalizeQuestion(q1);
    const n2 = FAQDeduplicationService.normalizeQuestion(q2);
    if (n1 === n2) return true;
    return FAQDeduplicationService.computeJaccard(n1, n2) >= threshold;
  }

  // Deduplicate a list — keeps highest-priority item when duplicates found
  static deduplicateFAQs<T extends { question: string; priority_score?: number }>(
    faqs: T[],
  ): T[] {
    const kept: T[] = [];
    for (const faq of faqs) {
      const isDupe = kept.some((k) => FAQDeduplicationService.areSimilar(k.question, faq.question));
      if (!isDupe) {
        kept.push(faq);
      }
    }
    return kept;
  }

  // Check if a new question is too similar to existing published FAQs in the DB
  static async checkDuplicateInDB(
    question: string,
    excludeId?: string,
  ): Promise<{ isDuplicate: boolean; similarFaqId?: string; similarQuestion?: string; similarity?: number }> {
    const normalised = FAQDeduplicationService.normalizeQuestion(question);
    const words = normalised.split(' ').filter((w) => w.length > 3);

    if (words.length === 0) return { isDuplicate: false };

    const candidates = await FAQ.find({
      is_deleted: false,
      ...(excludeId ? { faq_id: { $ne: excludeId } } : {}),
      $text: { $search: words.slice(0, 5).join(' ') },
    })
      .select('faq_id question normalized_question')
      .limit(20)
      .lean();

    let highestSim = 0;
    let mostSimilar: any = null;

    for (const candidate of candidates) {
      const candidateNorm =
        (candidate as any).normalized_question ||
        FAQDeduplicationService.normalizeQuestion((candidate as any).question);

      const sim = FAQDeduplicationService.computeJaccard(normalised, candidateNorm);
      if (sim > highestSim) {
        highestSim = sim;
        mostSimilar = candidate;
      }
    }

    if (highestSim >= 0.7 && mostSimilar) {
      return {
        isDuplicate: true,
        similarFaqId: (mostSimilar as any).faq_id,
        similarQuestion: (mostSimilar as any).question,
        similarity: highestSim,
      };
    }

    return { isDuplicate: false };
  }

  // Find all duplicate groups in published FAQs (for health checker)
  static async findAllDuplicates(): Promise<Array<{ faq_ids: string[]; questions: string[]; similarity: number }>> {
    const faqs = await FAQ.find({ is_deleted: false, is_published: true })
      .select('faq_id question normalized_question')
      .limit(500)
      .lean();

    const groups: Array<{ faq_ids: string[]; questions: string[]; similarity: number }> = [];
    const processed = new Set<string>();

    for (let i = 0; i < faqs.length; i++) {
      const faqA = faqs[i] as any;
      if (processed.has(faqA.faq_id)) continue;

      const duplicates: any[] = [faqA];

      for (let j = i + 1; j < faqs.length; j++) {
        const faqB = faqs[j] as any;
        if (processed.has(faqB.faq_id)) continue;

        const normA =
          faqA.normalized_question ||
          FAQDeduplicationService.normalizeQuestion(faqA.question);
        const normB =
          faqB.normalized_question ||
          FAQDeduplicationService.normalizeQuestion(faqB.question);

        const sim = FAQDeduplicationService.computeJaccard(normA, normB);
        if (sim >= 0.7) {
          duplicates.push(faqB);
          processed.add(faqB.faq_id);
        }
      }

      if (duplicates.length > 1) {
        processed.add(faqA.faq_id);
        groups.push({
          faq_ids: duplicates.map((f) => f.faq_id),
          questions: duplicates.map((f) => f.question),
          similarity: 0.7,
        });
      }
    }

    return groups;
  }
}
