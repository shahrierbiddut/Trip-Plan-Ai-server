import { Router } from "express";
import { Db } from "mongodb";
import {
  getReviews,
  getReviewInsights,
  getFeaturedReviews,
  createReview,
  updateReviewStatus,
  deleteReview,
} from "../controllers/reviews.controller";

export const reviewsRouter = (db: Db) => {
  const router = Router();

  router.get("/", getReviews(db));
  router.get("/insights", getReviewInsights(db));
  router.get("/featured", getFeaturedReviews(db));
  router.post("/", createReview(db));
  router.put("/:id/status", updateReviewStatus(db));
  router.delete("/:id", deleteReview(db));

  return router;
};
