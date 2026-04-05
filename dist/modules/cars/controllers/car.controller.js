"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarController = void 0;
const car_service_1 = require("../services/car.service");
const catchAsync_1 = require("../../../utils/catchAsync");
const error_middleware_1 = require("../../../middlewares/error.middleware");
const seo_1 = require("../../../utils/seo");
class CarController {
    static getAllCars = (0, catchAsync_1.catchAsync)(async (req, res) => {
        // If admin is fetching, return all cars, else just published
        const isAdmin = req.user && ["admin", "superadmin"].includes(req.user.role);
        const fetchAsAdmin = isAdmin || req.query.admin === "true";
        const result = await car_service_1.CarService.getAllCars(req.query, fetchAsAdmin);
        res.status(200).json({
            status: 'success',
            data: result,
        });
    });
    static getCarBySlug = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const result = await car_service_1.CarService.getCarBySlug(req.params.slug);
        if (!result) {
            throw new error_middleware_1.AppError('Car not found', 404);
        }
        const metadata = (0, seo_1.generateCarMetadata)(result.car);
        res.status(200).json({
            status: 'success',
            data: {
                ...result,
                seo: metadata,
            },
        });
    });
    static createCar = (0, catchAsync_1.catchAsync)(async (req, res) => {
        let thumbnail = { preview: "", title: req.body.thumbnailTitle || "" };
        let images = [];
        if (req.files?.["thumbnail"]) {
            thumbnail.preview = req.files["thumbnail"][0].path;
        }
        if (req.files?.["images"]) {
            images = req.files["images"].map(f => ({
                preview: f.path,
                title: req.body.imagesTitle || "Car image"
            }));
        }
        const payload = {
            ...req.body,
            thumbnail,
            images,
            latest: req.body.latest === 'true',
            popular: req.body.popular === 'true',
            recommended: req.body.recommended === 'true',
            electric: req.body.electric === 'true',
            is_published: req.body.is_published === 'true',
            upcoming: req.body.upcoming === 'true',
        };
        const car = await car_service_1.CarService.createCar(payload);
        res.status(201).json({
            status: 'success',
            data: { car },
        });
    });
    static updateCar = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const id = req.params.id;
        let payload = { ...req.body };
        if (req.files?.["thumbnail"]) {
            payload.thumbnail = {
                preview: req.files["thumbnail"][0].path,
                title: req.body.thumbnailTitle || ""
            };
        }
        if (req.files?.["images"]) {
            payload.images = req.files["images"].map(f => ({
                preview: f.path,
                title: req.body.imagesTitle || "Car image"
            }));
        }
        // Convert booleans
        const boolFields = ['latest', 'popular', 'recommended', 'electric', 'is_published', 'upcoming'];
        boolFields.forEach(f => {
            if (typeof payload[f] !== 'undefined') {
                payload[f] = payload[f] === 'true' || payload[f] === true;
            }
        });
        const car = await car_service_1.CarService.updateCar(id, payload);
        if (!car)
            throw new error_middleware_1.AppError('Car not found', 404);
        res.status(200).json({
            status: 'success',
            data: { car },
        });
    });
    static deleteCar = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const id = req.params.id;
        const deleted = await car_service_1.CarService.deleteCar(id);
        if (!deleted)
            throw new error_middleware_1.AppError('Car not found', 404);
        res.status(200).json({
            status: 'success',
            message: 'Car soft deleted successfully',
        });
    });
    static restoreCar = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const car = await car_service_1.CarService.restoreCar(req.params.id);
        if (!car)
            throw new error_middleware_1.AppError('Car not found', 404);
        res.status(200).json({
            status: 'success',
            message: 'Car restored successfully',
            data: { car },
        });
    });
}
exports.CarController = CarController;
//# sourceMappingURL=car.controller.js.map