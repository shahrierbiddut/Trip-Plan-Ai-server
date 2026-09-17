import { Router } from "express";
import { Db } from "mongodb";
import {
  getStories,
  getUserStories,
  createStory,
  updateStoryStatus,
  deleteStory,
} from "../controllers/stories.controller";

export const storiesRouter = (db: Db) => {
  const router = Router();

  router.get("/", getStories(db));
  router.get("/user/:userId", getUserStories(db));
  router.post("/", createStory(db));
  router.put("/:id", updateStoryStatus(db));
  router.delete("/:id", deleteStory(db));

  return router;
};
