import { Router } from "express";
import { Db } from "mongodb";
import { updateProfile, updatePreferences, changePassword } from "../controllers/user.controller";

export const userRouter = (db: Db) => {
  const router = Router();

  router.put("/profile", updateProfile(db));
  router.put("/preferences", updatePreferences(db));
  router.put("/password", changePassword(db));

  return router;
};
