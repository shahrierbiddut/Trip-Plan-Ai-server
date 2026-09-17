import { Request, Response } from "express";
import { Db, ObjectId } from "mongodb";

export const getUsers = (db: Db) => async (req: Request, res: Response) => {
  try {
    const users = await db.collection("user").find().toArray();
    res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: users,
    });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getUserById = (db: Db) => async (req: Request, res: Response) => {
  try {
    const  id  = String(req.params.id);
    
    // Attempt to find user by string id first (better-auth uses string IDs)
    let user = await db.collection<any>("user").findOne({ _id: id });
    
    if (!user) {
      // Fallback to ObjectId just in case
      try {
        user = await db.collection<any>("user").findOne({ _id: new ObjectId(id) });
      } catch {
        // invalid object id, ignore
      }
    }

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Get aggregated stats
    const [tripsCount, bookmarksCount, reviewsCount, storiesCount] = await Promise.all([
      db.collection("trips").countDocuments({ userId: id }),
      db.collection("savedDestinations").countDocuments({ userId: id }).catch(() => 0), // Assuming savedDestinations or bookmarks
      db.collection("reviews").countDocuments({ userId: id }),
      db.collection("stories").countDocuments({ userId: id })
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...user,
        stats: {
          tripsCount,
          bookmarksCount,
          reviewsCount,
          storiesCount
        }
      }
    });
  } catch (error) {
    console.error("Failed to fetch user by id:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const createUser = (db: Db) => async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      phone,
      location,
      role = "Registered User",
      status = "Active",
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required",
      });
    }

    // Check duplicate email
    const existingUser = await db.collection("user").findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists",
      });
    }

    const newUser = {
      name,
      email,
      phone: phone || "",
      location: location || "",
      role,
      status,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("user").insertOne(newUser);

    const createdUser = await db.collection("user").findOne({
      _id: result.insertedId,
    });

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: createdUser,
    });
  } catch (error) {
    console.error("Failed to create user:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const updateUserProfile = (db: Db) => async (
  req: Request,
  res: Response
) => {
  try {
    const id = String(req.params.id);

    const {
      name,
      email,
      phone,
      bio,
      location,
      image,
      coverImage,
      passportNationality,
      emergencyContact,
      travelPreferences,
      socialLinks,
      role,
      status,
    } = req.body;

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    if (image !== undefined) updateData.image = image;
    if (coverImage !== undefined) updateData.coverImage = coverImage;
    if (passportNationality !== undefined) {
      updateData.passportNationality = passportNationality;
    }
    if (emergencyContact !== undefined) {
      updateData.emergencyContact = emergencyContact;
    }
    if (travelPreferences !== undefined) {
      updateData.travelPreferences = travelPreferences;
    }
    if (socialLinks !== undefined) {
      updateData.socialLinks = socialLinks;
    }
    if (role !== undefined) updateData.role = role;
    if (status !== undefined) updateData.status = status;

    // First try Better Auth string ID
    let result = await db.collection<any>("user").findOneAndUpdate(
      { _id: id },
      { $set: updateData },
      { returnDocument: "after" }
    );

    // If not found, try MongoDB ObjectId
    if (!result && ObjectId.isValid(id)) {
      result = await db.collection<any>("user").findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: "after" }
      );
    }

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Failed to update user profile:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const updateUserRole = (db: Db) => async (
  req: Request,
  res: Response
) => {
  try {
    const id = String(req.params.id);
    const { role } = req.body;

    let result = await db.collection<any>("user").updateOne(
      { _id: id },
      { $set: { role, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0 && ObjectId.isValid(id)) {
      result = await db.collection("user").updateOne(
        { _id: new ObjectId(id) },
        { $set: { role, updatedAt: new Date() } }
      );
    }

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: `User role updated to ${role}`,
    });
  } catch (error) {
    console.error("Failed to update user role:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};


export const updateUserStatus = (db: Db) => async (
  req: Request,
  res: Response
) => {
  try {
    const id = String(req.params.id);
    const { status } = req.body;

    let result = await db.collection<any>("user").updateOne(
      { _id: id },
      {
        $set: {
          status,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0 && ObjectId.isValid(id)) {
      result = await db.collection("user").updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            status,
            updatedAt: new Date(),
          },
        }
      );
    }

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: `User status updated to ${status}`,
    });
  } catch (error) {
    console.error("Failed to update user status:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const deleteUser = (db: Db) => async (
  req: Request,
  res: Response
) => {
  try {
    const id = String(req.params.id);

    let result = await db.collection<any>("user").deleteOne({
      _id: id,
    });

    if (result.deletedCount === 0 && ObjectId.isValid(id)) {
      result = await db.collection("user").deleteOne({
        _id: new ObjectId(id),
      });
    }

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await db.collection("session").deleteMany({
      userId: id,
    });

    await db.collection("account").deleteMany({
      userId: id,
    });

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete user:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
