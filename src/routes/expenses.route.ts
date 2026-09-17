import { Router } from "express";
import { Db } from "mongodb";
import {
  getExpensesByTrip,
  createExpense,
  deleteExpense,
} from "../controllers/expenses.controller";

export const expensesRouter = (db: Db) => {
  const router = Router();

  router.get("/trip/:tripId", getExpensesByTrip(db));
  router.post("/", createExpense(db));
  router.delete("/:id", deleteExpense(db));

  return router;
};
