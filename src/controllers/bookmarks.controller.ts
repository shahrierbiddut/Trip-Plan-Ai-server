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
    const data = req.body;
    const result = await db.collection("bookmarks").insertOne(data);
    res.status(201).json({
      success: true,
      message: "Bookmark saved",
      data: { _id: result.insertedId, ...data },
    });
  } catch (error) {
    console.error("Failed to save bookmark:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const deleteBookmark = (db: Db) => async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await db.collection("bookmarks").deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "Not Found" });
    }
    
    res.status(200).json({ success: true, message: "Bookmark deleted" });
  } catch (error) {
    console.error("Failed to delete bookmark:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
