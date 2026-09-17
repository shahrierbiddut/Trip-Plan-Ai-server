import { Router } from "express";
import { Db } from "mongodb";
import { getHotels, getHotelBySlug } from "../controllers/hotels.controller";

export const hotelsRouter = (db: Db) => {
  const router = Router();

  router.get("/", getHotels(db));
  router.get("/:slug", getHotelBySlug(db));

  return router;
};
