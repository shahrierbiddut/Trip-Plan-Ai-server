import { Request, Response } from "express";
import { Db, ObjectId } from "mongodb";

// GET /api/notifications/:userId
export const getUserNotifications = (db: Db) => async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const notifications = await db.collection("notifications")
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// GET /api/notifications/:userId/unread
export const getUnreadCount = (db: Db) => async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const count = await db.collection("notifications").countDocuments({ userId, isRead: false });

    res.status(200).json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error("Failed to fetch unread count:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// PATCH /api/notifications/:id/read
export const markAsRead = (db: Db) => async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let result = await db.collection("notifications").updateOne(
      { _id: new ObjectId(id) },
      { $set: { isRead: true } }
    );
    
    if (result.matchedCount === 0) {
       result = await db.collection("notifications").updateOne(
         { _id: id as any },
         { $set: { isRead: true } }
       );
    }

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    res.status(200).json({ success: true, message: "Marked as read" });
  } catch (error) {
    console.error("Failed to mark as read:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// PATCH /api/notifications/user/:userId/read-all
export const markAllAsRead = (db: Db) => async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    await db.collection("notifications").updateMany(
      { userId, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({ success: true, message: "All marked as read" });
  } catch (error) {
    console.error("Failed to mark all as read:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// DELETE /api/notifications/:id
export const deleteNotification = (db: Db) => async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let result = await db.collection("notifications").deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      result = await db.collection("notifications").deleteOne({ _id: id as any });
    }

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    res.status(200).json({ success: true, message: "Notification deleted" });
  } catch (error) {
    console.error("Failed to delete notification:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// POST /api/notifications/test
export const createTestNotification = (db: Db) => async (req: Request, res: Response) => {
  try {
    const { userId, title, message, type, link } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: "userId is required" });
    }
    
    const notification = {
      userId,
      title: title || "Welcome to TripPlan AI!",
      message: message || "Your profile has been successfully set up. Start planning your next adventure today.",
      type: type || "success",
      isRead: false,
      createdAt: new Date(),
      link: link || "/dashboard/plan"
    };

    const result = await db.collection("notifications").insertOne(notification);

    res.status(201).json({ 
      success: true, 
      message: "Test notification generated",
      data: { ...notification, _id: result.insertedId }
    });
  } catch (error) {
    console.error("Failed to generate test notification:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
