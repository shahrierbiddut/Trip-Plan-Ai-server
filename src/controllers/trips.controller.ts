import { Request, Response } from "express";
import { Db, ObjectId } from "mongodb";

export const getTrips = (db: Db) => async (req: Request, res: Response) => {
  try {
    const trips = await db.collection("trips").find().toArray();
    res.status(200).json({
      success: true,
      message: "Trips fetched successfully",
      data: trips,
    });
  } catch (error) {
    console.error("Failed to fetch trips:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getTripById = (db: Db) => async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let query;
    try {
      query = { _id: new ObjectId(id) };
    } catch (e) {
      query = { localId: id };
    }
    const trip = await db.collection("trips").findOne(query);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }
    res.status(200).json({ success: true, data: trip });
  } catch (error) {
    console.error("Failed to fetch trip by id:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getUserTrips = (db: Db) => async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const trips = await db.collection("trips").find({ userId }).toArray();
    res.status(200).json({
      success: true,
      message: "User trips fetched successfully",
      data: trips,
    });
  } catch (error) {
    console.error("Failed to fetch user trips:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const createTrip = (db: Db) => async (req: Request, res: Response) => {
  try {
    const data = req.body;
    
    if (data.id && typeof data.id === "string") {
      data.localId = data.id;
      delete data.id;
    }
    
    data.createdAt = new Date().toISOString();
    
    const result = await db.collection("trips").insertOne(data);
    res.status(201).json({
      success: true,
      message: "Trip saved successfully",
      data: { _id: result.insertedId, ...data },
    });
  } catch (error) {
    console.error("Failed to save trip:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const updateTrip = (db: Db) => async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    delete data._id; // prevent updating _id
    
    let query;
    try {
      query = { _id: new ObjectId(id) };
    } catch (e) {
      query = { localId: id };
    }
    
    const result = await db.collection("trips").updateOne(
      query,
      { $set: data }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: "Not Found" });
    }
    
    res.status(200).json({ success: true, message: "Trip updated" });
  } catch (error) {
    console.error("Failed to update trip:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const deleteTrip = (db: Db) => async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    let query;
    try {
      query = { _id: new ObjectId(id) };
    } catch (e) {
      query = { localId: id };
    }
    
    const result = await db.collection("trips").deleteOne(query);
    
    if (result.deletedCount === 0) {
      const altResult = await db.collection("trips").deleteOne({ localId: id });
      if (altResult.deletedCount === 0) {
        return res.status(404).json({ success: false, message: "Not Found" });
      }
    }
    
    res.status(200).json({ success: true, message: "Trip deleted" });
  } catch (error) {
    console.error("Failed to delete trip:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
