import { Request, Response } from "express";
import { Db, ObjectId } from "mongodb";
import { getAuth } from "../config/auth.js";

type ReviewDocument = {
  _id?: ObjectId;
  displayOrder?: number;
  name?: string;
  avatar?: string;
  location?: string;
  rating?: number;
  title?: string;
  text?: string;
  reviewText?: string;
  destination?: string;
  tripType?: string;
  date?: string;
  helpful?: number;
  verified?: boolean;
  status?: string;
  sentiment?: "positive" | "neutral" | "negative";
  wouldRecommend?: boolean;
  topics?: string[];
  concerns?: string[];
  aiMatch?: number;
  recommendationImage?: string;
  categoryRatings?: {
    experience?: number;
    food?: number;
    family?: number;
    transportation?: number;
    accommodation?: number;
    cleanliness?: number;
    value?: number;
    safety?: number;
  };
  userId?: string;
  userEmail?: string;
  travelMonth?: string;
  loved?: string;
  concernsText?: string;
  images?: Array<{
    name: string;
    mimeType: string;
    size: number;
    data: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
};

const approvedReviewQuery = {
  $or: [
    { status: { $regex: /^approved$/i } },
    { status: { $regex: /^published$/i } },
    { status: { $exists: false } },
  ],
};

const round = (value: number, digits = 1) => {
  const factor = Math.pow(10, digits);
  return Math.round(value * factor) / factor;
};

const average = (values: number[]) => {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const percentage = (part: number, total: number) => {
  if (!total) return 0;
  return Math.round((part / total) * 100);
};

const sentimentFromRating = (rating = 0): "positive" | "neutral" | "negative" => {
  if (rating >= 4) return "positive";
  if (rating >= 3) return "neutral";
  return "negative";
};

const topicIcon = (label: string) => {
  const value = label.toLowerCase();
  if (value.includes("beach") || value.includes("water")) return "Waves";
  if (value.includes("sun")) return "Sun";
  if (value.includes("food") || value.includes("seafood")) return "Utensils";
  if (value.includes("mountain") || value.includes("hill") || value.includes("scenic")) return "Mountain";
  if (value.includes("family")) return "Baby";
  if (value.includes("photo")) return "Camera";
  if (value.includes("nature") || value.includes("green")) return "Leaf";
  return "Sparkles";
};

const concernIcon = (label: string) => {
  const value = label.toLowerCase();
  if (value.includes("crowd")) return "Users";
  if (value.includes("traffic") || value.includes("transport")) return "Car";
  if (value.includes("weather") || value.includes("rain")) return "CloudSun";
  if (value.includes("holiday") || value.includes("availability")) return "CalendarDays";
  if (value.includes("price") || value.includes("cost")) return "Wallet";
  return "CircleAlert";
};

const getTopList = (
  reviews: ReviewDocument[],
  field: "topics" | "concerns",
  limit: number,
  iconFor: (label: string) => string,
) => {
  const counts: Record<string, number> = {};

  reviews.forEach((review) => {
    const values = Array.isArray(review[field]) ? review[field] : [];
    values.forEach((value) => {
      const label = String(value).trim();
      if (!label) return;
      counts[label] = (counts[label] || 0) + 1;
    });
  });

  return Object.keys(counts)
    .map((label) => ({
      icon: iconFor(label),
      label,
      percentage: percentage(counts[label], reviews.length),
      count: counts[label],
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit)
    .map(({ icon, label, percentage: itemPercentage }) => ({
      icon,
      label,
      percentage: itemPercentage,
    }));
};

export const getReviews = (db: Db) => async (req: Request, res: Response) => {
  try {
    const rawPage = Number(req.query.page);
    const rawLimit = Number(req.query.limit);

    const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
    const limit = Number.isFinite(rawLimit) && rawLimit > 0
      ? Math.min(Math.floor(rawLimit), 50)
      : 10;

    const total = await db.collection("reviews").countDocuments(approvedReviewQuery);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, totalPages);
    const skip = (safePage - 1) * limit;

    const reviews = await db
      .collection("reviews")
      .find(approvedReviewQuery)
      .sort({ displayOrder: 1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    res.status(200).json({
      success: true,
      message: "Reviews fetched successfully",
      data: {
        reviews,
        total,
        page: safePage,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Failed to fetch reviews:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getAdminReviews = (db: Db) => async (_req: Request, res: Response) => {
  try {
    const reviews = await db
      .collection("reviews")
      .find()
      .sort({ createdAt: -1, _id: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      message: "Admin reviews fetched successfully",
      data: reviews,
    });
  } catch (error) {
    console.error("Failed to fetch admin reviews:", error);
    res.status(500).json({ success: false, message: "Server Error", data: [] });
  }
};

export const getMyReviews = (db: Db) => async (req: Request, res: Response) => {
  try {
    const { fromNodeHeaders } = await import("better-auth/node");
    const auth = await getAuth();
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session?.user) {
      res.status(401).json({
        success: false,
        message: "Please login to view your reviews.",
        data: [],
      });
      return;
    }

    const userId = String(session.user.id || "");
    const userEmail = String(session.user.email || "").trim();

    const ownerConditions: Record<string, string>[] = [];

    if (userId) {
      ownerConditions.push({ userId });
    }

    if (userEmail) {
      ownerConditions.push({ userEmail });
    }

    if (!ownerConditions.length) {
      res.status(200).json({
        success: true,
        message: "No reviews found for this user.",
        data: [],
      });
      return;
    }

    const reviews = await db
      .collection("reviews")
      .find({ $or: ownerConditions })
      .sort({ createdAt: -1, _id: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      message: "Your reviews fetched successfully",
      data: reviews,
    });
  } catch (error) {
    console.error("Failed to fetch user reviews:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      data: [],
    });
  }
};

export const getReviewStats = (db: Db) => async (_req: Request, res: Response) => {
  try {
    const reviews = (await db
      .collection("reviews")
      .find(approvedReviewQuery)
      .toArray()) as ReviewDocument[];

    const total = reviews.length;
    const ratings = reviews
      .map((review) => Number(review.rating || 0))
      .filter((rating) => rating > 0);

    const overallRating = round(average(ratings), 1);
    const destinations = new Set(
      reviews.map((review) => review.destination).filter(Boolean),
    ).size;
    const recommendCount = reviews.filter(
      (review) => review.wouldRecommend === true || (review.wouldRecommend == null && Number(review.rating || 0) >= 4),
    ).length;

    const ratingBars = [5, 4, 3, 2, 1].map((stars) => {
      const count = ratings.filter((rating) => Math.round(rating) === stars).length;
      return { stars, percentage: percentage(count, ratings.length) };
    });

    const categoryAverage = (key: keyof NonNullable<ReviewDocument["categoryRatings"]>) => {
      const values: number[] = [];
      reviews.forEach((review) => {
        const value = review.categoryRatings && review.categoryRatings[key];
        if (typeof value === "number") values.push(value);
      });
      return round(average(values), 1);
    };

    const data = {
      stats: [
        {
          id: 1,
          value: overallRating,
          suffix: "/5",
          decimals: 1,
          label: "Overall Rating",
          description: "Average rating from verified travelers",
          icon: "Star",
          accent: "gold",
        },
        {
          id: 2,
          value: total,
          suffix: "",
          label: "Traveler Reviews",
          description: "Authentic experiences shared by travelers",
          icon: "Users",
          accent: "emerald",
        },
        {
          id: 3,
          value: destinations,
          suffix: "",
          label: "Destinations Reviewed",
          description: "Places explored and reviewed by our community",
          icon: "MapPin",
          accent: "emerald",
        },
        {
          id: 4,
          value: percentage(recommendCount, total),
          suffix: "%",
          label: "Would Recommend",
          description: "Travelers who would recommend their experience",
          icon: "BadgeCheck",
          accent: "gold",
        },
      ],
      ratingOverview: {
        average: overallRating,
        totalLabel: `${total.toLocaleString()} ${total === 1 ? "review" : "reviews"}`,
        ratingBars,
      },
      experienceRatings: [
        { label: "Overall Experience", rating: overallRating, icon: "Sparkles" },
        { label: "Food & Dining", rating: categoryAverage("food"), icon: "Utensils" },
        { label: "Family Experience", rating: categoryAverage("family"), icon: "UsersRound" },
        { label: "Transportation", rating: categoryAverage("transportation"), icon: "Car" },
        { label: "Accommodation", rating: categoryAverage("accommodation"), icon: "Hotel" },
        { label: "Cleanliness", rating: categoryAverage("cleanliness"), icon: "Sparkles" },
        { label: "Value for Money", rating: categoryAverage("value"), icon: "CircleDollarSign" },
        { label: "Safety & Security", rating: categoryAverage("safety"), icon: "ShieldCheck" },
      ],
    };

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Failed to fetch review stats:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getReviewInsights = (db: Db) => async (_req: Request, res: Response) => {
  try {
    const reviews = (await db
      .collection("reviews")
      .find(approvedReviewQuery)
      .toArray()) as ReviewDocument[];

    const total = reviews.length;
    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };

    reviews.forEach((review) => {
      const sentiment = review.sentiment || sentimentFromRating(Number(review.rating || 0));
      sentimentCounts[sentiment] += 1;
    });

    const lovedThings = getTopList(reviews, "topics", 5, topicIcon);
    const concerns = getTopList(reviews, "concerns", 5, concernIcon);

    const topLovedLabels = lovedThings.slice(0, 3).map((item) => item.label);
    const topConcernLabels = concerns.slice(0, 2).map((item) => item.label);

    let summary = "Travelers have shared useful experiences across destinations in Bangladesh.";
    if (topLovedLabels.length) {
      summary = `Travelers most often praise ${topLovedLabels.join(", ")}.`;
    }
    if (topConcernLabels.length) {
      summary += ` Common concerns include ${topConcernLabels.join(" and ")}.`;
    }

    const recommendationTags = lovedThings.slice(0, 4).map((item) => ({
      label: item.label,
      icon: item.icon,
    }));

    const sortedRecommendations = reviews
      .slice()
      .sort((a, b) => {
        const matchDifference = Number(b.aiMatch || 0) - Number(a.aiMatch || 0);
        if (matchDifference !== 0) return matchDifference;
        const ratingDifference = Number(b.rating || 0) - Number(a.rating || 0);
        if (ratingDifference !== 0) return ratingDifference;
        return Number(b.helpful || 0) - Number(a.helpful || 0);
      });

    const recommendations: Array<{
      id: number;
      title: string;
      location: string;
      match: number;
      rating: number;
      description: string;
      type: string;
      date: string;
      image: string;
    }> = [];
    const usedDestinations = new Set<string>();

    for (const review of sortedRecommendations) {
      const destination = String(review.destination || "").trim();
      if (!destination || usedDestinations.has(destination)) continue;
      usedDestinations.add(destination);
      recommendations.push({
        id: recommendations.length + 1,
        title: destination,
        location: review.location || `${destination}, Bangladesh`,
        match: Number(review.aiMatch || Math.min(99, Math.round(Number(review.rating || 0) * 20))),
        rating: Number(review.rating || 0),
        description: review.title || review.text || "Traveler recommended destination",
        type: review.tripType || "Traveler Trip",
        date: review.date || "",
        image: review.recommendationImage || review.avatar || "",
      });
      if (recommendations.length === 3) break;
    }

    const data = {
      reviewsAnalyzed: total.toLocaleString(),
      summary,
      confidence: total >= 8 ? "High" : total >= 4 ? "Medium" : "Low",
      sentiment: {
        positive: percentage(sentimentCounts.positive, total),
        neutral: percentage(sentimentCounts.neutral, total),
        negative: percentage(sentimentCounts.negative, total),
      },
      lovedThings,
      concerns,
      recommendationTags,
      recommendations,
    };

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Failed to fetch review insights:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getFeaturedReviews = (db: Db) => async (_req: Request, res: Response) => {
  try {
    const featuredReviews = await db.collection("feature-review").find().toArray();
    res.status(200).json({
      success: true,
      message: "Featured reviews fetched successfully",
      data: featuredReviews,
    });
  } catch (error) {
    console.error("Failed to fetch featured reviews:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const createReview = (db: Db) => async (req: Request, res: Response) => {
  try {
    const rating = Number(req.body.rating || 0);
    const now = new Date().toISOString();

    let categoryRatings: ReviewDocument["categoryRatings"] = {};
    if (typeof req.body.categoryRatings === "string" && req.body.categoryRatings.trim()) {
      try {
        categoryRatings = JSON.parse(req.body.categoryRatings);
      } catch {
        return res.status(400).json({
          success: false,
          message: "Invalid category ratings data.",
        });
      }
    }

    const splitInsightText = (value: unknown) =>
      String(value || "")
        .split(/[,\n]/)
        .map((item) => item.trim())
        .filter(Boolean);

    const uploadedFiles = Array.isArray(req.files)
      ? (req.files as Express.Multer.File[])
      : [];

    const images = uploadedFiles.map((file) => ({
      name: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      data: `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
    }));

    const recommendValue = String(req.body.wouldRecommend ?? "").trim();
    const wouldRecommend =
      recommendValue === "true"
        ? true
        : recommendValue === "false"
          ? false
          : rating >= 4;

    const data: ReviewDocument = {
      userId: String(req.body.userId || ""),
      userEmail: String(req.body.userEmail || ""),
      name: String(req.body.name || "Traveler"),
      avatar: String(req.body.avatar || ""),
      location: "Bangladesh",
      destination: String(req.body.destination || ""),
      tripType: String(req.body.tripType || ""),
      travelMonth: String(req.body.travelMonth || ""),
      rating,
      title: String(req.body.title || "").trim(),
      reviewText: String(req.body.reviewText || "").trim(),
      text: String(req.body.reviewText || "").trim(),
      loved: String(req.body.loved || "").trim(),
      concernsText: String(req.body.concernsText || "").trim(),
      topics: splitInsightText(req.body.loved),
      concerns: splitInsightText(req.body.concernsText),
      wouldRecommend,
      categoryRatings,
      images,
      helpful: 0,
      verified: false,
      status: "Pending",
      sentiment: sentimentFromRating(rating),
      date: String(req.body.travelMonth || "").trim() || now,
      createdAt: now,
      updatedAt: now,
    };

    if (!data.destination || !data.tripType || !data.rating || !data.title || !data.reviewText) {
      return res.status(400).json({
        success: false,
        message: "Destination, trip type, rating, title and review are required.",
      });
    }

    if (data.rating < 1 || data.rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5.",
      });
    }

    const result = await db.collection("reviews").insertOne(data);

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      data: { _id: result.insertedId, ...data },
    });
  } catch (error) {
    console.error("Failed to submit review:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const updateReviewStatus = (db: Db) => async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await db.collection("reviews").updateOne(
      { _id: new ObjectId(id as string) },
      { $set: { status } },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: "Not Found" });
    }

    res.status(200).json({ success: true, message: `Review status updated to ${status}` });
  } catch (error) {
    console.error("Failed to update review status:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const deleteReview = (db: Db) => async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await db.collection("reviews").deleteOne({ _id: new ObjectId(id as string) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "Not Found" });
    }

    res.status(200).json({ success: true, message: "Review deleted" });
  } catch (error) {
    console.error("Failed to delete review:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
