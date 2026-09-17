import { Router } from "express";
import { Db } from "mongodb";
import {
  getDashboardStats,
  getAnalyticsStats,
} from "../controllers/stats.controller";

export const statsRouter = (db: Db) => {
  const router = Router();

  router.get("/dashboard", getDashboardStats(db));
  router.get("/analytics", getAnalyticsStats(db));

  return router;
};
