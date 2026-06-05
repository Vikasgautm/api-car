"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const master_data_controller_1 = require("../controllers/master-data.controller");
const router = (0, express_1.Router)();
// All master-data routes require auth + admin
router.use(auth_middleware_1.protect);
router.use((0, auth_middleware_1.restrictTo)('admin', 'super_admin'));
router.get('/categories', master_data_controller_1.MasterDataController.getCategories);
router.get('/all', master_data_controller_1.MasterDataController.getAllOptions);
router.get('/options/:categoryKey', master_data_controller_1.MasterDataController.getOptions);
router.post('/options/:categoryKey', master_data_controller_1.MasterDataController.createOption);
router.put('/options/:categoryKey/:optionId', master_data_controller_1.MasterDataController.updateOption);
router.delete('/options/:categoryKey/:optionId', master_data_controller_1.MasterDataController.deleteOption);
router.patch('/options/:categoryKey/:optionId/toggle', master_data_controller_1.MasterDataController.toggleActive);
router.patch('/options/:categoryKey/reorder', master_data_controller_1.MasterDataController.reorderOptions);
router.post('/seed', master_data_controller_1.MasterDataController.seedDefaults);
// Unknown value review queue
router.get('/unknown-values', master_data_controller_1.MasterDataController.getUnknownValues);
router.patch('/unknown-values/:unknownId/resolve', master_data_controller_1.MasterDataController.resolveUnknownValue);
router.patch('/unknown-values/:unknownId/dismiss', master_data_controller_1.MasterDataController.dismissUnknownValue);
router.post('/unknown-values/:unknownId/promote', master_data_controller_1.MasterDataController.promoteUnknownToMaster);
exports.default = router;
//# sourceMappingURL=master-data.routes.js.map