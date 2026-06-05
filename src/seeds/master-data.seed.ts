import { logger } from '../utils/logger';
import { MasterDataService } from '../modules/master-data/services/master-data.service';

// Runs unconditionally on every startup.
// seedDefaults() uses bulkWrite with upsert — existing options are skipped via
// the unique (category_key, value) index, so this is always safe to call.
export const seedMasterData = async (): Promise<void> => {
  try {
    const result = await MasterDataService.seedDefaults();
    if (result.created > 0) {
      logger.info(`Master data seeded: ${result.created} created, ${result.skipped} skipped`);
    }
  } catch (err) {
    logger.error('Master data seed failed (non-fatal):', err);
  }
};
