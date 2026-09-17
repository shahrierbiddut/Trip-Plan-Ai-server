import { Router } from "express";
import { Db } from "mongodb";
import { getDashboardData } from '../controllers/dashboard.controller.js';

export const dashboardRouter = (db: Db) => {
  const router = Router();

  router.get("/", getDashboardData(db));

  return router;
};
