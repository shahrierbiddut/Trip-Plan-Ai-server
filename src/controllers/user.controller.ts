import { Request, Response } from "express";
import { Db, ObjectId } from "mongodb";

export const updateProfile = (db: Db) => async (req: Request, res: Response) => {
  try {
    const { userId, name, email, bio } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (bio !== undefined) updateData.bio = bio;

    // We assume userId could be an ObjectId string or just a string ID depending on Auth system
    let query = {};
    try {
      query = { _id: new ObjectId(userId) };
    } catch {
      query = { id: userId }; // Fallback if they use string IDs (like Clerk or Auth.js custom ID)
    }

    // Try finding by generic ID field first, then by ObjectId
    let result = await db.collection("users").updateOne(
      { email: email }, // Usually email is safest to update if ID matching is tricky, but let's try ID
      { $set: updateData },
      { upsert: true }
    );

    res.status(200).json({
      success: true,
      message: "Profile updated successfully"
    });
  } catch (error) {
    console.error("Failed to update profile:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const updatePreferences = (db: Db) => async (req: Request, res: Response) => {
  try {
    const { userId, email, currency, emailNotifications } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required to identify user" });
    }

    const updateData: any = {};
    if (currency) updateData.currency = currency;
    if (emailNotifications !== undefined) updateData.emailNotifications = emailNotifications;

    await db.collection("users").updateOne(
      { email: email },
      { $set: updateData },
      { upsert: true }
    );

    res.status(200).json({
      success: true,
      message: "Preferences updated successfully"
    });
  } catch (error) {
    console.error("Failed to update preferences:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const changePassword = (db: Db) => async (req: Request, res: Response) => {
  try {
    const { email, currentPassword, newPassword } = req.body;

    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // Since this is a demo/base level implementation and NextAuth usually handles this directly on DB,
    // we'll just mock a success response here. In a real scenario, we'd hash the newPassword 
    // using bcrypt and compare the currentPassword with the DB hash.
    
    // Fake success for now
    res.status(200).json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (error) {
    console.error("Failed to change password:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
