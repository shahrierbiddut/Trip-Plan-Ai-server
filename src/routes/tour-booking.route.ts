import { Router } from "express";
import { Db } from "mongodb";
import { createTourBooking, getUserBookings, initiatePayment, confirmPayment, getBookingById, getAllBookings } from "../controllers/tour-booking.controller";

export const tourBookingRouter = (db: Db) => {
  const router = Router();

  router.post("/", createTourBooking(db));
  router.get("/all/admin", getAllBookings(db));
  router.get("/:id", getBookingById(db));
  router.get("/user/:userId", getUserBookings(db));
  router.post("/pay/:bookingId", initiatePayment(db));
  router.post("/confirm-payment/:bookingId", confirmPayment(db));

  return router;
};
