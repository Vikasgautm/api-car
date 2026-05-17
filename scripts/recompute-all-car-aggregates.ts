/**
 * Backfill: walk every non-deleted car and run CarAggregationService.recomputeFullAggregates.
 * Use after deploying the Batch 1+2 schema changes so the new aggregate fields
 * (power_min/max, torque_min/max, engine_options, feature_availability flags,
 * AI intelligence flags, etc.) get populated for the existing dataset.
 *
 * Run: npx ts-node scripts/recompute-all-car-aggregates.ts
 *
 * Idempotent — safe to re-run. Logs progress every 50 cars.
 */
import mongoose from 'mongoose';
import { Car } from '../src/models/car.model';
import { CarAggregationService } from '../src/shared/services/car-aggregation.service';

async function main() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('Missing MONGODB_URI / MONGO_URI env var');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB. Starting backfill…');

  const cars = await Car.find({ is_deleted: false }).select('car_id name').lean();
  console.log(`Found ${cars.length} non-deleted cars to recompute.`);

  let recomputed = 0;
  let failed = 0;
  const failures: Array<{ car_id: string; name: string; error: string }> = [];

  const started = Date.now();

  for (const car of cars) {
    try {
      await CarAggregationService.recomputeFullAggregates(car.car_id);
      recomputed++;
    } catch (err: any) {
      failed++;
      failures.push({ car_id: car.car_id, name: car.name, error: err?.message ?? String(err) });
    }

    if ((recomputed + failed) % 50 === 0) {
      const elapsed = ((Date.now() - started) / 1000).toFixed(1);
      console.log(`Progress: ${recomputed + failed} / ${cars.length} (${elapsed}s elapsed)`);
    }
  }

  const elapsed = ((Date.now() - started) / 1000).toFixed(1);
  console.log('\n── Backfill complete ──');
  console.log(`Scanned:    ${cars.length}`);
  console.log(`Recomputed: ${recomputed}`);
  console.log(`Failed:     ${failed}`);
  console.log(`Elapsed:    ${elapsed}s`);

  if (failures.length > 0) {
    console.log('\nFailures:');
    for (const f of failures) {
      console.log(`  - ${f.name} (${f.car_id}): ${f.error}`);
    }
  }

  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
