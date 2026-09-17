import { Request, Response } from "express";
import { Db } from "mongodb";

export const createSupportTicket = (db: Db) => async (req: Request, res: Response) => {
  try {
    const { userId, name, email, subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ success: false, message: "Subject and message are required" });
    }

    const ticket = {
      userId,
      name: name || "Anonymous",
      email: email || "No email provided",
      subject,
      message,
      status: "Open",
      createdAt: new Date()
    };

    const result = await db.collection("support-tickets").insertOne(ticket);

    res.status(201).json({
      success: true,
      message: "Support ticket created successfully",
      data: {
        _id: result.insertedId,
        ...ticket
      }
    });
  } catch (error) {
    console.error("Failed to create support ticket:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
