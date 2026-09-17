import { Router } from "express";
import { Db } from "mongodb";
import {
  getTravelCategories,
  createTravelCategory,
  updateTravelCategory,
  deleteTravelCategory,
} from "../controllers/travel-categories.controller";

export const categoriesRouter = (db: Db) => {
  const router = Router();

  router.get("/", getTravelCategories(db));
  router.post("/", createTravelCategory(db));
  router.put("/:id", updateTravelCategory(db));
  router.delete("/:id", deleteTravelCategory(db));

  return router;
};
