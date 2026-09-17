import { Request, Response } from "express";
import { Db, ObjectId } from "mongodb";

export const getTravelCategories = (db: Db) => async (req: Request, res: Response) => {
  try {
    const categories = await db.collection("TravelCategories").find().toArray();
    res.status(200).json({
      success: true,
      message: "Categories fetched successfully",
      data: categories,
    });
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const createTravelCategory = (db: Db) => async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const result = await db.collection("TravelCategories").insertOne(data);
    res.status(201).json({
      success: true,
      message: "Category created",
      data: { _id: result.insertedId, ...data },
    });
  } catch (error) {
    console.error("Failed to create category:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const updateTravelCategory = (db: Db) => async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    delete data._id; // prevent updating _id
    
    const result = await db.collection("TravelCategories").updateOne(
      { _id: new ObjectId(id) },
      { $set: data }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: "Not Found" });
    }
    
    res.status(200).json({ success: true, message: "Category updated" });
  } catch (error) {
    console.error("Failed to update category:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const deleteTravelCategory = (db: Db) => async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await db.collection("TravelCategories").deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "Not Found" });
    }
    
    res.status(200).json({ success: true, message: "Category deleted" });
  } catch (error) {
    console.error("Failed to delete category:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
