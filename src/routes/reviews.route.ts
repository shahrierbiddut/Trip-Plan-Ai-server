import { NextFunction, Request, Response, Router } from "express";
import { Db } from "mongodb";
import multer from "multer";
import {
  getReviews,
  getAdminReviews,
  getMyReviews,
  getReviewInsights,
  getReviewStats,
  getFeaturedReviews,
  createReview,
  updateReviewStatus,
  deleteReview,
} from '../controllers/reviews.controller.js';

const reviewImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024,
    files: 5,
  },
  fileFilter: (_req, file, callback) => {
    if (!file.mimetype.startsWith("image/")) {
      callback(new Error("Only image files are allowed."));
      return;
    }

    callback(null, true);
  },
});

const uploadReviewImages = (req: Request, res: Response, next: NextFunction) => {
  reviewImageUpload.array("images", 5)(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        res.status(413).json({
          success: false,
          message: "Each image must be 2 MB or smaller.",
        });
        return;
      }

      if (error.code === "LIMIT_FILE_COUNT" || error.code === "LIMIT_UNEXPECTED_FILE") {
        res.status(400).json({
          success: false,
          message: "You can upload up to 5 images.",
        });
        return;
      }
    }

    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Invalid image upload.",
    });
  });
};

export const reviewsRouter = (db: Db) => {
  const router = Router();

  router.get("/admin", getAdminReviews(db));
  router.get("/", getReviews(db));
  router.get("/my", getMyReviews(db));
  router.get("/insights", getReviewInsights(db));
  router.get("/stats", getReviewStats(db));
  router.get("/featured", getFeaturedReviews(db));
  router.post("/", uploadReviewImages, createReview(db));
  router.put("/:id/status", updateReviewStatus(db));
  router.delete("/:id", deleteReview(db));

  return router;
};
