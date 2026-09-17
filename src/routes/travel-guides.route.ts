import { Router } from "express";
import { Db } from "mongodb";
import { getTravelGuides } from "../controllers/travel-guides.controller.js";

export const travelGuidesRouter = (db: Db) => {
  const router = Router();

  router.get("/", getTravelGuides(db));

  return router;
};
