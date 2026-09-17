import { Router } from "express";
import { Db } from "mongodb";
import { getSettings, updateSettings } from '../controllers/settings.controller.js';

export const settingsRouter = (db: Db) => {
  const router = Router();

  router.get("/", getSettings(db));
  router.put("/", updateSettings(db));

  return router;
};
