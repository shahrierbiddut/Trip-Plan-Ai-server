import { Request, Response } from "express";
import { Db, ObjectId } from "mongodb";

export const getDestinations = (db: Db) => async (req: Request, res: Response) => {
  try {
    const destinations = await db.collection("destinations").find().toArray();
    res.status(200).json({
      success: true,
      message: "Destinations fetched successfully",
      data: destinations,
    });
  } catch (error) {
    console.error("Failed to fetch destinations:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getDestination = (db: Db) => async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const destination = await db.collection("destinations").findOne({ slug });
    if (!destination) {
      return res.status(404).json({ success: false, message: "Not Found" });
    }
    res.status(200).json({
      success: true,
      data: destination,
    });
  } catch (error) {
    console.error("Failed to fetch destination:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
export const createDestination =
  (db: Db) => async (req: Request, res: Response) => {
    try {
      const {
        name,
        location,
        category = "Nature",
        rating = 0,
        views = 0,
        status = "Active",
        featured = false,
        image = "",
        description = "",
      } = req.body;

      if (!name || !location) {
        return res.status(400).json({
          success: false,
          message:
            "Destination name and location are required",
        });
      }

      const slug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const existingDestination =
        await db
          .collection("destinations")
          .findOne({ slug });

      if (existingDestination) {
        return res.status(409).json({
          success: false,
          message:
            "A destination with this name already exists",
        });
      }

      const newDestination = {
        name: name.trim(),
        slug,
        location: location.trim(),
        category,
        rating: Number(rating) || 0,
        views: Number(views) || 0,
        status,
        featured: Boolean(featured),
        image,
        description,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db
        .collection("destinations")
        .insertOne(newDestination);

      return res.status(201).json({
        success: true,
        message: "Destination created successfully",
        data: {
          _id: result.insertedId,
          ...newDestination,
        },
      });
    } catch (error) {
      console.error(
        "Failed to create destination:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Server Error",
      });
    }
  };

export const updateDestination =
  (db: Db) => async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);

      if (!id || !ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid destination ID",
        });
      }

      const data = { ...req.body };

      delete data._id;

      const result = await db
        .collection("destinations")
        .updateOne(
          {
            _id: new ObjectId(id),
          },
          {
            $set: {
              ...data,
              updatedAt: new Date(),
            },
          }
        );

      if (result.matchedCount === 0) {
        return res.status(404).json({
          success: false,
          message: "Destination not found",
        });
      }

      const updatedDestination =
        await db
          .collection("destinations")
          .findOne({
            _id: new ObjectId(id),
          });

      return res.status(200).json({
        success: true,
        message: "Destination updated successfully",
        data: updatedDestination,
      });
    } catch (error) {
      console.error(
        "Failed to update destination:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Server Error",
      });
    }
  };
export const deleteDestination =
  (db: Db) => async (req: Request, res: Response) => {
    try {
      const  id  = String(req.params.id);

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid destination ID",
        });
      }

      const result = await db
        .collection("destinations")
        .deleteOne({
          _id: new ObjectId(id),
        });

      if (result.deletedCount === 0) {
        return res.status(404).json({
          success: false,
          message: "Destination not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Destination deleted successfully",
      });
    } catch (error) {
      console.error(
        "Failed to delete destination:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Server Error",
      });
    }
  };

export const getPlaceBySlug = (db: Db) => async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    // Find the destination that contains this place
    const destination = await db.collection("destinations").findOne({
      "placesToExplore.slug": slug
    });

    if (!destination) {
      return res.status(404).json({ success: false, message: "Not Found" });
    }

    const place = destination.placesToExplore.find((p: any) => p.slug === slug);
    
    res.status(200).json({
      success: true,
      data: {
        place,
        destination: {
          slug: destination.slug,
          name: destination.name
        }
      }
    });
  } catch (error) {
    console.error("Failed to fetch place:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
