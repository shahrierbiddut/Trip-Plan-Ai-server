import { Request, Response } from "express";
import { Db } from "mongodb";

export const getTravelGuides = (db: Db) => async (_req: Request, res: Response) => {
  try {
    const guides = await db
      .collection("travelGuides")
      .find({ isActive: { $ne: false } })
      .sort({ sortOrder: 1, _id: 1 })
      .toArray();

    res.status(200).json({ success: true, data: guides });
  } catch (error) {
    console.error("Failed to fetch travel guides:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch travel guides",
    });
  }
};
