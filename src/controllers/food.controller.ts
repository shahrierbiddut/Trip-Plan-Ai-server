import { Request, Response } from "express";
import { Db } from "mongodb";
import { foodDestinations, restaurantSpotlights } from "../data/food";

export const getFood = (db: Db) => async (req: Request, res: Response) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        destinations: foodDestinations,
        restaurants: restaurantSpotlights
      }
    });
  } catch (error) {
    console.error("Failed to fetch food:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getFoodBySlug = (db: Db) => async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const restaurant = restaurantSpotlights.find((r) => r.slug === slug);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurant not found" });
    }
    res.status(200).json({ success: true, data: restaurant });
  } catch (error) {
    console.error("Failed to fetch food by slug:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
