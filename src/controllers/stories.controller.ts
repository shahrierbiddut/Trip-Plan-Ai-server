import { Request, Response } from "express";
import { Db, ObjectId } from "mongodb";

const dummyStories = [
  {
    id: "weekend-by-the-sea",
    title: "A Weekend by the Sea",
    destination: "Cox's Bazar",
    duration: "2 Days",
    travelStyle: "Family",
    budget: "৳12,500",
    rating: 4.8,
    story:
      "A simple weekend escape filled with sunset walks, fresh seafood and scenic Marine Drive moments.",
    travelerName: "Nusrat Jahan",
    travelerLocation: "Dhaka, Bangladesh",
    travelerAvatar: "/assets/avatar-1.svg",
    image: "/assets/Coxs/cover-3.jpg",
    href: "/inspiration/stories",
  },
  {
    id: "into-the-hills",
    title: "Into the Hills",
    destination: "Bandarban",
    duration: "3 Days",
    travelStyle: "Adventure",
    budget: "৳9,800",
    rating: 4.9,
    story:
      "Mountain trails, quiet viewpoints and one of our most memorable adventures in the hills of Bandarban.",
    travelerName: "Rifat Ahmed",
    travelerLocation: "Chattogram, Bangladesh",
    travelerAvatar: "/assets/avatar-2.svg",
    image: "/assets/Bandarban/images 1.jfif",
    href: "/inspiration/stories",
  },
  {
    id: "slow-days-in-sajek",
    title: "Slow Days in Sajek",
    destination: "Sajek Valley",
    duration: "3 Days",
    travelStyle: "Nature",
    budget: "৳11,200",
    rating: 4.8,
    story:
      "Peaceful mornings, cloudy hills and the perfect escape from city life. Sajek offers pure tranquility.",
    travelerName: "Tahmid Hasan",
    travelerLocation: "Dhaka, Bangladesh",
    travelerAvatar: "/assets/avatar-1.svg",
    image: "/assets/Sajek/cover-3.jpg",
    href: "/inspiration/stories",
  },
];

export const getStories = (db: Db) => async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const stories = await db.collection("stories").find(query).sort({ createdAt: -1 }).toArray();
    
    if (stories.length === 0) {
      return res.status(200).json({ success: true, data: dummyStories });
    }

    res.status(200).json({ success: true, data: stories });
  } catch (error) {
    console.error("Failed to fetch stories:", error);
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
    const data = { ...req.body, status: "Pending", createdAt: new Date() };
    const result = await db.collection("stories").insertOne(data);
    res.status(201).json({ success: true, data: { _id: result.insertedId, ...data } });
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
      { _id: new ObjectId(id) },
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
    await db.collection("stories").deleteOne({ _id: new ObjectId(id) });
    res.status(200).json({ success: true, message: "Story deleted" });
  } catch (error) {
    console.error("Failed to delete story:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
