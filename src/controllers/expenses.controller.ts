import { Request, Response } from "express";
import { Db, ObjectId } from "mongodb";

export const getExpensesByTrip = (db: Db) => async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;
    const expenses = await db.collection("expenses").find({ tripId }).toArray();
    res.status(200).json({ success: true, data: expenses });
  } catch (error) {
    console.error("Failed to fetch expenses:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const createExpense = (db: Db) => async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const result = await db.collection("expenses").insertOne(data);
    res.status(201).json({ success: true, data: { _id: result.insertedId, ...data } });
  } catch (error) {
    console.error("Failed to create expense:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const deleteExpense = (db: Db) => async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await db.collection("expenses").deleteOne({ _id: new ObjectId(id) });
    res.status(200).json({ success: true, message: "Expense deleted" });
  } catch (error) {
    console.error("Failed to delete expense:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
