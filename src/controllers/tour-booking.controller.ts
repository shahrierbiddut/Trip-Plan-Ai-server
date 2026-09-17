import { Request, Response } from "express";
import { Db, ObjectId } from "mongodb";

export const createTourBooking = (db: Db) => async (req: Request, res: Response) => {
  try {
    const bookingData = req.body;

    if (!bookingData.packageId || !bookingData.customer) {
      return res.status(400).json({ success: false, message: "Missing required booking details" });
    }

    const newBooking = {
      ...bookingData,
      status: "Pending",
      paymentStatus: "Unpaid",
      createdAt: new Date(),
    };

    const result = await db.collection("tour-bookings").insertOne(newBooking);

    res.status(201).json({
      success: true,
      message: "Tour booking created successfully",
      data: {
        _id: result.insertedId,
        ...newBooking
      }
    });
  } catch (error) {
    console.error("Failed to create tour booking:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getBookingById = (db: Db) => async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || !ObjectId.isValid(id as string)) {
      return res.status(400).json({ success: false, message: "Invalid booking ID" });
    }
    const booking = await db.collection("tour-bookings").findOne({ _id: new ObjectId(id as string) });
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }
    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    console.error("Failed to fetch booking by ID:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getUserBookings = (db: Db) => async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const { email } = req.query;

    let query: any = {};
    if (userId) {
      query = { userId: userId };
    } else if (email) {
      query = { "customer.email": email as string };
    }

    const bookings = await db.collection("tour-bookings")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      data: bookings
    });
  } catch (error) {
    console.error("Failed to fetch user bookings:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const initiatePayment = (db: Db) => async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;

    if (!bookingId || !ObjectId.isValid(bookingId as string)) {
      return res.status(400).json({ success: false, message: "Invalid booking ID" });
    }

    const booking = await db.collection("tour-bookings").findOne({ _id: new ObjectId(bookingId as string) });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (booking.paymentStatus === "Paid") {
      return res.status(400).json({ success: false, message: "Booking is already paid" });
    }

    const mockPaymentUrl = `/dashboard/my-bookings?payment=success&bookingId=${bookingId}`;

    await db.collection("tour-bookings").updateOne(
      { _id: new ObjectId(bookingId as string) },
      { $set: { paymentStatus: "Processing" } }
    );

    res.status(200).json({
      success: true,
      paymentUrl: mockPaymentUrl,
      message: "Payment initiated successfully"
    });
  } catch (error) {
    console.error("Failed to initiate payment:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Confirm Payment (Mock Endpoint)
export const confirmPayment = (db: Db) => {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const { bookingId } = req.params;

      const result = await db.collection("tour-bookings").updateOne(
        { _id: new ObjectId(bookingId as string) },
        { 
          $set: { 
            paymentStatus: "Paid",
            status: "Confirmed",
            updatedAt: new Date()
          } 
        }
      );

      if (result.matchedCount === 0) {
        res.status(404).json({ success: false, message: "Booking not found" });
        return;
      }

      res.status(200).json({ success: true, message: "Payment confirmed successfully" });
    } catch (error) {
      console.error("Error confirming payment:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };
};

// Get All Bookings for Admin
export const getAllBookings = (db: Db) => {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const bookings = await db
        .collection("tour-bookings")
        .find()
        .sort({ createdAt: -1 })
        .toArray();
      
      res.status(200).json({ success: true, data: bookings });
    } catch (error) {
      console.error("Error fetching all bookings:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };
};
