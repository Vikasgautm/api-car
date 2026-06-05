"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedMasterData = void 0;
const logger_1 = require("../utils/logger");
const master_data_service_1 = require("../modules/master-data/services/master-data.service");
// Runs unconditionally on every startup.
// seedDefaults() uses bulkWrite with upsert — existing options are skipped via
// the unique (category_key, value) index, so this is always safe to call.
const seedMasterData = async () => {
    try {
        const result = await master_data_service_1.MasterDataService.seedDefaults();
        if (result.created > 0) {
            logger_1.logger.info(`Master data seeded: ${result.created} created, ${result.skipped} skipped`);
        }
    }
    catch (err) {
        logger_1.logger.error('Master data seed failed (non-fatal):', err);
    }
};
exports.seedMasterData = seedMasterData;
//# sourceMappingURL=master-data.seed.js.map