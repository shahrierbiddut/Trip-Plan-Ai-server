import { Router } from "express";
import { Db } from "mongodb";
import { createSupportTicket } from '../controllers/support.controller.js';

export const supportRouter = (db: Db) => {
  const router = Router();

  router.post("/ticket", createSupportTicket(db));

  return router;
};
