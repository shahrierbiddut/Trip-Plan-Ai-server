import { Router } from "express";
import { Db } from "mongodb";
import {
  getUserBookmarks,
  createBookmark,
  deleteBookmark,
} from "../controllers/bookmarks.controller";

export const bookmarksRouter = (db: Db) => {
  const router = Router();

  router.get("/:userId", getUserBookmarks(db));
  router.post("/", createBookmark(db));
  router.delete("/:id", deleteBookmark(db));

  return router;
};
