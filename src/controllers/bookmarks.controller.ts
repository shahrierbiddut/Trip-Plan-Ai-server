import { Request, Response } from "express";
import { Db, ObjectId } from "mongodb";

export const getUserBookmarks = (db: Db) => async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const bookmarks = await db.collection("bookmarks").find({ userId }).toArray();
    res.status(200).json({
      success: true,
      message: "Bookmarks fetched successfully",
      data: bookmarks,
    });
  } catch (error) {
    console.error("Failed to fetch bookmarks:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const createBookmark = (db: Db) => async (req: Request, res: Response) => {
  try {
    const { userId, destinationSlug, destinationData } = req.body;
    if (typeof userId !== "string" || !userId.trim() ||
        typeof destinationSlug !== "string" || !destinationSlug.trim() ||
        !destinationData || typeof destinationData !== "object" || Array.isArray(destinationData)) {
      return res.status(400).json({ success: false, message: "Invalid bookmark data" });
    }

    // Repeated clicks or retries should not create duplicate saved destinations.
    const collection = db.collection("bookmarks");
    await collection.updateOne(
      { userId, destinationSlug },
      { $setOnInsert: { userId, destinationSlug, destinationData, createdAt: new Date() } },
      { upsert: true },
    );
    const bookmark = await collection.findOne({ userId, destinationSlug });
    res.status(201).json({
      success: true,
      message: "Bookmark saved",
      data: bookmark,
    });
  } catch (error) {
    console.error("Failed to save bookmark:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const deleteBookmark = (db: Db) => async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await db.collection("bookmarks").deleteOne({ _id: new ObjectId(id as string) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "Not Found" });
    }
    
    res.status(200).json({ success: true, message: "Bookmark deleted" });
  } catch (error) {
    console.error("Failed to delete bookmark:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
