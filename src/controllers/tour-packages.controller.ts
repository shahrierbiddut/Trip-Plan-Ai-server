import { Db } from "mongodb";
import { Request, Response } from "express";

export const getTourPackages = (db: Db) => async (req: Request, res: Response) => {
  try {
    const { featured, upcoming } = req.query;
    
    let query: any = { active: true };
    if (featured === 'true') query.featured = true;
    if (upcoming === 'true') query.upcoming = true;

    const packages = await db.collection("tour-packages").find(query).sort({ sortOrder: 1 }).toArray();
    
    res.json({ success: true, data: packages });
  } catch (error) {
    console.error("Error fetching tour packages:", error);
    res.status(500).json({ success: false, message: "Failed to fetch tour packages" });
  }
};

export const getTourPackageBySlug = (db: Db) => async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const tourPackage = await db.collection("tour-packages").findOne({ slug, active: true });
    
    if (!tourPackage) {
      res.status(404).json({ success: false, message: "Tour package not found" });
      return;
    }
    
    res.json({ success: true, data: tourPackage });
  } catch (error) {
    console.error("Error fetching tour package:", error);
    res.status(500).json({ success: false, message: "Failed to fetch tour package details" });
  }
};
