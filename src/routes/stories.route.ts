import { Router } from "express";
import { Db } from "mongodb";
import {
  getStories,
  getPublishedStories,
  getPublishedStoryBySlug,
  getUserStories,
  createStory,
  updateStoryStatus,
  deleteStory,
} from "../controllers/stories.controller.js";

export const storiesRouter = (db: Db) => {
  const router = Router();

  router.get("/published", getPublishedStories(db));
  router.get("/published/:slug", getPublishedStoryBySlug(db));
  router.get("/user/:userId", getUserStories(db));
  router.get("/", getStories(db));
  router.post("/", createStory(db));
  router.put("/:id", updateStoryStatus(db));
  router.delete("/:id", deleteStory(db));

  return router;
};
