import { Router } from "express";
import { Db } from "mongodb";
import { getTourPackages, getTourPackageBySlug } from '../controllers/tour-packages.controller.js';

export const tourPackagesRouter = (db: Db) => {
  const router = Router();

  router.get("/", getTourPackages(db));
  router.get("/:slug", getTourPackageBySlug(db));

  return router;
};
