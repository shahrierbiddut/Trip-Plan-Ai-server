import { Router } from "express";
import { Db } from "mongodb";
import {
  getTrips,
  getTripById,
  getUserTrips,
  createTrip,
  updateTrip,
  deleteTrip,
} from "../controllers/trips.controller";

export const tripsRouter = (db: Db) => {
  const router = Router();

  router.get("/", getTrips(db));
  router.get("/user/:userId", getUserTrips(db));
  router.get("/:id", getTripById(db));
  router.post("/", createTrip(db));
  router.put("/:id", updateTrip(db));
  router.delete("/:id", deleteTrip(db));

  return router;
};
