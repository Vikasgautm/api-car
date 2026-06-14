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

import mongoose from 'mongoose';

function getArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

const TARGET_URI = getArg('--uri') || process.env.MONGODB_URI;
const DRY_RUN = process.argv.includes('--dry');

const DEAD_FIELDS = ['is_ai_generated', 'relevance_score'] as const;

function maskUri(uri: string): string {
  return uri.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@');
}

async function run() {
  if (!TARGET_URI) {
    console.error('❌  No connection string. Set MONGODB_URI or pass --uri "mongodb+srv://..."');
    process.exit(1);
  }

  console.log(`\n🎯  Target : ${maskUri(TARGET_URI)}`);
  console.log('🔌  Connecting…');
  await mongoose.connect(TARGET_URI);
  console.log('✅  Connected\n');

  const collection = mongoose.connection.collection('faqs');

  // Count docs that still carry at least one dead field.
  const matchFilter = { $or: DEAD_FIELDS.map((f) => ({ [f]: { $exists: true } })) };
  const affected = await collection.countDocuments(matchFilter);
  console.log(`ℹ️   FAQs carrying a removed field: ${affected}`);

  if (affected === 0) {
    console.log('\n✅  Nothing to clean — all FAQ documents are already up to date.');
    await mongoose.disconnect();
    process.exit(0);
  }

  if (DRY_RUN) {
    console.log(`\n✅  Dry run — would $unset [${DEAD_FIELDS.join(', ')}] on ${affected} document(s). No data written.`);
    await mongoose.disconnect();
    process.exit(0);
  }

  const unset = DEAD_FIELDS.reduce<Record<string, ''>>((acc, f) => { acc[f] = ''; return acc; }, {});
  const result = await collection.updateMany(matchFilter, { $unset: unset });

  console.log('\n' + '─'.repeat(48));
  console.log('✅  Cleanup complete');
  console.log(`   Matched  : ${result.matchedCount}`);
  console.log(`   Modified : ${result.modifiedCount}`);
  console.log(`   Removed  : ${DEAD_FIELDS.join(', ')}`);
  console.log('─'.repeat(48) + '\n');

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
