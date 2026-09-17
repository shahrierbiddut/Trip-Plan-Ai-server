import { Request, Response } from "express";
import { Db } from "mongodb";

export const getSettings = (db: Db) => async (req: Request, res: Response) => {
  try {
    const settings = await db.collection("settings").findOne({ type: "global_admin_settings" });
    
    if (!settings) {
      return res.status(200).json({
        success: true,
        data: {
          emailNotifications: true,
          pushNotifications: true,
          reviewNotifications: true,
          userNotifications: true,
          darkMode: false,
          twoFactor: false,
          language: "English",
          timezone: "Asia/Dhaka",
        }
      });
    }

    res.status(200).json({
      success: true,
      data: settings.config
    });
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const updateSettings = (db: Db) => async (req: Request, res: Response) => {
  try {
    const config = req.body;
    
    await db.collection("settings").updateOne(
      { type: "global_admin_settings" },
      { $set: { config, updatedAt: new Date() } },
      { upsert: true }
    );
    
    res.status(200).json({ success: true, message: "Settings updated" });
  } catch (error) {
    console.error("Failed to update settings:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
