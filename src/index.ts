import "dotenv/config";
import { aiRouter } from "./routes/ai.route";
import express, { NextFunction, Request, Response } from "express";
import { MongoClient, Db } from "mongodb";
import cors from "cors";
import { getAuth } from "./config/auth";
import { destinationsRouter } from "./routes/destinations.route";
import { reviewsRouter } from "./routes/reviews.route";
import { tripsRouter } from "./routes/trips.route";
import { categoriesRouter } from "./routes/travel-categories.route";
import { bookmarksRouter } from "./routes/bookmarks.route";
import { usersRouter } from "./routes/users.route";
import { statsRouter } from "./routes/stats.route";
import { expensesRouter } from "./routes/expenses.route";
import { storiesRouter } from "./routes/stories.route";
import { settingsRouter } from "./routes/settings.route";
import { hotelsRouter } from "./routes/hotels.route";
import { foodRouter } from "./routes/food.route";
import { notificationsRouter } from "./routes/notifications.route";
import { supportRouter } from "./routes/support.route";
import { userRouter } from "./routes/user.route";
import { tourBookingRouter } from "./routes/tour-booking.route";
import { getFeaturedReviews } from "./controllers/reviews.controller";
import { tourPackagesRouter } from "./routes/tour-packages.route";

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI as string;
const DB_NAME = process.env.DB_NAME as string;

app.use(cors({
  origin: function (origin, callback) {
    callback(null, true); // Allow any origin in development
  },
  credentials: true
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use((req, _res, next) => {
  console.log("[Request]", req.method, req.url, req.originalUrl);
  next();
});

app.all("/api/auth/*path", async (req, res, next) => {
  try {
    const { toNodeHandler } = await import("better-auth/node");
    const auth = await getAuth();
    await toNodeHandler(auth)(req, res);
  } catch (error) {
    console.error("[Better Auth Error]", error);
    next(error);
  }
});

app.use((error: unknown, req: Request, res: Response, next: NextFunction) => {
  if (!req.path.startsWith("/api/auth")) {
    next();
    return;
  }

  console.error("[Auth Error Response]", error);
  res.status(500).json({
    code: "INTERNAL_SERVER_ERROR",
    message: "The authentication service could not complete the request.",
  });
});

let db: Db;

app.get("/", (_req: Request, res: Response) => {
  res.json('foo, bar! updated V2');
});
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", db: db ? "connected" : "disconnected" });
});
app.get("/api/ck", (_req: Request, res: Response) => {
  res.json({ status: "ok", db: db ? "chandan connected" : "chandan disconnected" });
});

let dbPromise: Promise<Db> | null = null;

async function getDb(): Promise<Db> {
  if (db) return db;
  if (!dbPromise) {
    const client = new MongoClient(MONGODB_URI);
    dbPromise = client.connect().then(() => {
      console.log("MongoDB connected");
      db = client.db(DB_NAME);
      // Mount AI router dynamically once DB is connected
      app.use("/api/ai", aiRouter(db));
      return db;
    }).catch(err => {
      console.error("Failed to connect to MongoDB:", err);
      dbPromise = null;
      throw err;
    });
  }
  return dbPromise;
}

// Global middleware to ensure DB is connected before processing API requests
app.use(async (req, res, next) => {
  if (req.path.startsWith("/api/")) {
    try {
      await getDb();
    } catch (err) {
      return next(err);
    }
  }
  next();
});

import { dashboardRouter } from "./routes/dashboard.route";

// Mount routers

app.use("/api/dashboard", (req, res, next) => dashboardRouter(db)(req, res, next));
app.use("/api/destinations", (req, res, next) => destinationsRouter(db)(req, res, next));
app.use("/api/reviews", (req, res, next) => reviewsRouter(db)(req, res, next));
app.use("/api/featured-reviews", (req, res, next) => {
  getFeaturedReviews(db)(req, res).catch(next);
});
app.use("/api/trips", (req, res, next) => tripsRouter(db)(req, res, next));
app.use("/api/travel-categories", (req, res, next) => categoriesRouter(db)(req, res, next));
app.use("/api/bookmarks", (req, res, next) => bookmarksRouter(db)(req, res, next));
app.use("/api/users", (req, res, next) => usersRouter(db)(req, res, next));
app.use("/api/stats", (req, res, next) => statsRouter(db)(req, res, next));
app.use("/api/expenses", (req, res, next) => expensesRouter(db)(req, res, next));
app.use("/api/stories", (req, res, next) => storiesRouter(db)(req, res, next));
app.use("/api/settings", (req, res, next) => settingsRouter(db)(req, res, next));
app.use("/api/hotels", (req, res, next) => hotelsRouter(db)(req, res, next));
app.use("/api/food", (req, res, next) => foodRouter(db)(req, res, next));
app.use("/api/notifications", (req, res, next) => notificationsRouter(db)(req, res, next));
app.use("/api/support", (req, res, next) => supportRouter(db)(req, res, next));
app.use("/api/user", (req, res, next) => userRouter(db)(req, res, next));
app.use("/api/tour-bookings", (req, res, next) => tourBookingRouter(db)(req, res, next));
app.use("/api/tour-packages", (req, res, next) => tourPackagesRouter(db)(req, res, next));

// Original routers are already mounted with the lazy db reference.
// The middleware above guarantees db is populated before they execute.

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT as number, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

export default app;
