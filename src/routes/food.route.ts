import { Router } from "express";
import { Db } from "mongodb";
import { getFood, getFoodBySlug } from "../controllers/food.controller";

export const foodRouter = (db: Db) => {
  const router = Router();

  router.get("/", getFood(db));
  router.get("/:slug", getFoodBySlug(db));

  return router;
};
