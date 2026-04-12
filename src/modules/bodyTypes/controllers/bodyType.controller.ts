import { Request, Response } from "express";
import { AppError } from "../../../middlewares/error.middleware";
import { catchAsync } from "../../../utils/catchAsync";
import { BodyTypeService } from "../services/bodyType.service";

export class BodyTypeController {
  static getAllBodyTypes = catchAsync(async (req: Request, res: Response) => {
    const result = await BodyTypeService.getAllBodyTypes(req.query);
    res.status(200).json({
      status: "success",
      data: result,
    });
  });

  static getBodyTypeBySlug = catchAsync(async (req: Request, res: Response) => {
    const bodyType = await BodyTypeService.getBodyTypeBySlug(req.params.slug as string);
    if (!bodyType) {
      throw new AppError("Body type not found", 404);
    }
    res.status(200).json({
      status: "success",
      data: { body_type: bodyType },
    });
  });

  static createBodyType = catchAsync(async (req: Request, res: Response) => {
    try {
    const bodyType = await BodyTypeService.createBodyType(req.body);
    res.status(201).json({
      status: "success",
      data: { body_type: bodyType },
    });
    } catch (error) {
      console.log(error, "error");
    }
  });

  static updateBodyType = catchAsync(async (req: Request, res: Response) => {
    let updateData = { ...req.body };
    if (updateData.is_published !== undefined) {
      // Handle both string "true"/"false" and boolean true/false
      if (typeof updateData.is_published === "string") {
        updateData.is_published = updateData.is_published === "true";
      }
      // If it's already a boolean, keep it as is
    }
    const bodyType = await BodyTypeService.updateBodyType(
      req.params.id as string,
      updateData,
    );
    if (!bodyType) throw new AppError("Body type not found", 404);
    res.status(200).json({
      status: "success",
      data: { body_type: bodyType },
    });
  });

  static deleteBodyType = catchAsync(async (req: Request, res: Response) => {
    const bodyType = await BodyTypeService.deleteBodyType(req.params.id as string);
    if (!bodyType) throw new AppError("Body type not found", 404);
    res.status(200).json({
      status: "success",
      message: "Body type soft deleted successfully",
    });
  });

  static restoreBodyType = catchAsync(async (req: Request, res: Response) => {
    const bodyType = await BodyTypeService.restoreBodyType(req.params.id as string);
    if (!bodyType) throw new AppError("Body type not found", 404);
    res.status(200).json({
      status: "success",
      message: "Body type restored successfully",
      data: { body_type: bodyType },
    });
  });
}
