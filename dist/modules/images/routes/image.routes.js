"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const upload_middleware_1 = require("../../../middlewares/upload.middleware");
const catchAsync_1 = require("../../../utils/catchAsync");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.post('/upload', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)('admin'), upload_middleware_1.upload.single('image'), (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ status: 'fail', message: 'No file uploaded' });
    }
    res.status(200).json({
        status: 'success',
        data: {
            url: `/uploads/${req.file.filename}`,
            filename: req.file.filename,
        },
    });
}));
exports.default = router;
//# sourceMappingURL=image.routes.js.map