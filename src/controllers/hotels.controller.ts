import { Request, Response } from "express";
import { Db } from "mongodb";
import { destinations, hotels } from "../data/hotels";

export const getHotels = (db: Db) => async (req: Request, res: Response) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        destinations,
        hotels
      }
    });
  } catch (error) {
    console.error("Failed to fetch hotels:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getHotelBySlug = (db: Db) => async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const hotel = hotels.find((h) => h.slug === slug);
    if (!hotel) {
      return res.status(404).json({ success: false, message: "Hotel not found" });
    }
    res.status(200).json({ success: true, data: hotel });
  } catch (error) {
    console.error("Failed to fetch hotel by slug:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
