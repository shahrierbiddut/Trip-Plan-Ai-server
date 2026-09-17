import { Request, Response } from "express";
import { Db, ObjectId } from "mongodb";

export const getReviews = (db: Db) => async (req: Request, res: Response) => {
  try {
    const reviews = await db.collection("reviews").find().toArray();
    res.status(200).json({
      success: true,
      message: "Reviews fetched successfully",
      data: reviews,
    });
  } catch (error) {
    console.error("Failed to fetch reviews:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getReviewInsights = (db: Db) => async (req: Request, res: Response) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        highlights: [
          { icon: "Waves", title: "Beautiful Beaches", percentage: 96, color: "emerald" },
          { icon: "Sun", title: "Stunning Sunsets", percentage: 89, color: "gold" },
          { icon: "Utensils", title: "Fresh Seafood", percentage: 91, color: "emerald" },
          { icon: "Camera", title: "Scenic Photography", percentage: 87, color: "gold" },
        ],
        concerns: [
          { icon: "Users", title: "Peak-season Crowds", percentage: 32 },
          { icon: "Car", title: "Weekend Traffic", percentage: 28 },
          { icon: "Clock3", title: "Long Waiting Times", percentage: 19 },
          { icon: "CircleAlert", title: "Weather Changes", percentage: 16 },
        ],
        categories: [
          { label: "Overall Experience", score: 4.9 },
          { label: "Family Experience", score: 4.9 },
          { label: "Food & Dining", score: 4.7 },
          { label: "Transportation", score: 4.8 },
          { label: "Accommodation", score: 4.6 },
          { label: "Value for Money", score: 4.5 },
        ]
      }
    });
  } catch (error) {
    console.error("Failed to fetch review insights:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getFeaturedReviews = (db: Db) => async (req: Request, res: Response) => {
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
    const data = req.body;
    data.date = new Date().toISOString();
    data.status = "Pending";
    
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
      { _id: new ObjectId(id) },
      { $set: { status } }
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
    const result = await db.collection("reviews").deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "Not Found" });
    }
    
    res.status(200).json({ success: true, message: "Review deleted" });
  } catch (error) {
    console.error("Failed to delete review:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
