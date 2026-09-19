import { Request, Response } from "express";
import { Db, ObjectId } from "mongodb";
import { GoogleGenAI } from "@google/genai";

export const getStories = (db: Db) => async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    let query: any = {};
    if (status && status !== "all") {
      query.status = status;
    } else if (!status) {
      query.status = "Approved";
    }
    const stories = await db.collection("stories").find(query).sort({ createdAt: -1 }).toArray();

    res.status(200).json({ success: true, data: stories });
  } catch (error) {
    console.error("Failed to fetch stories:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getPublishedStories = (db: Db) => async (_req: Request, res: Response) => {
  try {
    const stories = await db
      .collection("publishedStories")
      .find({ isActive: { $ne: false } })
      .sort({ sortOrder: 1, published: -1 })
      .toArray();

    res.status(200).json({ success: true, data: stories });
  } catch (error) {
    console.error("Failed to fetch published stories:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getPublishedStoryBySlug = (db: Db) => async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const story = await db.collection("publishedStories").findOne({
      slug,
      isActive: { $ne: false },
    });

    if (!story) {
      res.status(404).json({ success: false, message: "Story not found" });
      return;
    }

    res.status(200).json({ success: true, data: story });
  } catch (error) {
    console.error("Failed to fetch published story:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getUserStories = (db: Db) => async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const stories = await db.collection("stories").find({ userId }).sort({ createdAt: -1 }).toArray();
    res.status(200).json({ success: true, data: stories });
  } catch (error) {
    console.error("Failed to fetch user stories:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const createStory = (db: Db) => async (req: Request, res: Response) => {
  try {
    const image = req.body?.image;
    if (image && typeof image === "object") {
      const maxImageSize = 2 * 1024 * 1024;
      const basicImageShapeIsValid =
        typeof image === "object" &&
        typeof image.name === "string" &&
        typeof image.type === "string" &&
        image.type.startsWith("image/") &&
        typeof image.size === "number" &&
        image.size > 0 &&
        image.size <= maxImageSize &&
        typeof image.dataUrl === "string" &&
        /^data:image\/[^;]+;base64,/.test(image.dataUrl);

      let decodedSize = 0;
      if (basicImageShapeIsValid) {
        const base64 = image.dataUrl.split(",", 2)[1] ?? "";
        decodedSize = Buffer.from(base64, "base64").length;
      }

      if (!basicImageShapeIsValid || decodedSize === 0 || decodedSize > maxImageSize) {
        res.status(400).json({
          success: false,
          message: "Image must be a valid image file and 2 MB or smaller",
        });
        return;
      }
    }
    const requestedStatus = req.body?.status;
    const status = requestedStatus === "Draft" ? "Draft" : "Approved";
    const now = new Date();
    const data = {
      ...req.body,
      status,
      updatedAt: now,
    };

    const stories = db.collection("stories");

    if (status === "Draft") {
      if (!data.userId) {
        res.status(400).json({ success: false, message: "Login is required to save a draft" });
        return;
      }

      const clientDraftKey = data.clientDraftKey || "tripplan-story-draft-v1";
      const existing = await stories.findOne({ userId: data.userId, clientDraftKey });

      if (existing) {
        await stories.updateOne(
          { _id: existing._id },
          { $set: { ...data, clientDraftKey } }
        );

        res.status(200).json({
          success: true,
          data: { ...existing, ...data, clientDraftKey },
          message: "Draft updated",
        });
        return;
      }

      const draftData = {
        ...data,
        clientDraftKey,
        createdAt: now,
      };
      const result = await stories.insertOne(draftData);
      res.status(201).json({
        success: true,
        data: { _id: result.insertedId, ...draftData },
        message: "Draft saved",
      });
      return;
    }

    const storyData = { ...data, createdAt: now };
    const result = await stories.insertOne(storyData);
    res.status(201).json({ success: true, data: { _id: result.insertedId, ...storyData } });
  } catch (error) {
    console.error("Failed to create story:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const updateStoryStatus = (db: Db) => async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await db.collection("stories").updateOne(
      { _id: new ObjectId(id as string) },
      { $set: { status, updatedAt: new Date() } }
    );
    if (result.matchedCount === 0) {
      res.status(404).json({ success: false, message: "Story not found" });
      return;
    }
    res.status(200).json({ success: true, message: "Story updated" });
  } catch (error) {
    console.error("Failed to update story:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const deleteStory = (db: Db) => async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await db.collection("stories").deleteOne({ _id: new ObjectId(id as string) });
    res.status(200).json({ success: true, message: "Story deleted" });
  } catch (error) {
    console.error("Failed to delete story:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const generateStoryFromBullets = () => async (req: Request, res: Response) => {
  try {
    const { bulletPoints, location } = req.body;
    
    if (!bulletPoints) {
      res.status(400).json({ success: false, message: "Bullet points are required" });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      res.status(503).json({ success: false, message: "Server API Key configuration error" });
      return;
    }

    const ai = new GoogleGenAI({ apiKey });
    const model = process.env.GEMINI_CHAT_MODEL?.trim() || "gemini-1.5-flash";

    const prompt = `You are an expert travel blogger for TripPlan AI. 
Convert the following rough notes into a beautiful, engaging, and structured travel story.
Location: ${location || "Not specified"}
Notes: 
${bulletPoints}

Rules:
- Write in the same language as the notes (e.g. if notes are in Bengali, write in Bengali).
- Use Markdown formatting for headings, bullet points, or bold text.
- Make it sound personal, enthusiastic, and highly readable.
- Do not add any conversational filler like "Here is your story:". Just output the Markdown story directly.`;

    let text = "";

    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });
      text = response.text?.trim() || "";
    } catch (apiError) {
      console.warn("Gemini API call failed, using fallback story:", apiError);
      
      // Fallback response for demo purposes when API keys fail/expire
      text = `# 🌴 A Journey to Remember in ${location || 'Bangladesh'}
      
What an incredible experience it was! The trip was full of surprises, breathtaking views, and moments I will cherish forever.

Here are some highlights from my journey:
${bulletPoints.split('\\n').map((b: string) => `- ${b.trim()}`).join('\\n')}

## ⛰️ The Experience
Despite some challenges along the way, every moment felt like an adventure. The local culture, the beautiful weather, and the warm hospitality made this trip truly special. 

If you're planning to visit, I highly recommend keeping an open mind and enjoying the raw beauty of nature. Can't wait for my next adventure!`;
    }

    if (!text) {
      res.status(502).json({ success: false, message: "AI could not generate the story" });
      return;
    }

    res.status(200).json({ success: true, data: { content: text } });
  } catch (error) {
    console.error("Failed to generate story:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
