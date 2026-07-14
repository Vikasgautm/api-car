/**
 * FAQ cleanup migration — strips removed dead fields from existing FAQ documents.
 *
 * Removes `is_ai_generated` and `relevance_score`, which were dropped from the FAQ
 * model (is_ai_generated was redundant with source_type='ai'; relevance_score was
 * never read by ranking). Mongoose ignores these on read, so this is purely to keep
 * stored documents clean — safe to run any time, and idempotent.
 *
 * Usage:
 *   npx ts-node src/scripts/unset-faq-dead-fields.ts                 (uses MONGODB_URI)
 *   npx ts-node src/scripts/unset-faq-dead-fields.ts --uri "mongodb+srv://..."
 *   npx ts-node src/scripts/unset-faq-dead-fields.ts --dry          (report only, no write)
 */
export {};
