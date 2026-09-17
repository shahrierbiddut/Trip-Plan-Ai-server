import { Request, Response } from "express";
import { Db } from "mongodb";

export const getDashboardStats = (db: Db) => async (req: Request, res: Response) => {
  try {
    const [usersCount, tripsCount, destinationsCount, reviewsCount] = await Promise.all([
      db.collection("user").countDocuments(),
      db.collection("trips").countDocuments(),
      db.collection("destinations").countDocuments(),
      db.collection("reviews").countDocuments()
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers: usersCount,
        totalTrips: tripsCount,
        totalDestinations: destinationsCount,
        totalReviews: reviewsCount
      }
    });
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getAnalyticsStats = (db: Db) => async (req: Request, res: Response) => {
  try {
    const year = new Date().getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);

    // Aggregate Users by Month
    const usersAggregation = await db.collection("user").aggregate([
      { $match: { createdAt: { $gte: startOfYear, $lte: endOfYear } } },
      { $group: { _id: { $month: "$createdAt" }, count: { $sum: 1 } } }
    ]).toArray();

    // Aggregate Trips by Month
    const tripsAggregation = await db.collection("trips").aggregate([
      { $match: { startDate: { $exists: true } } },
      { 
        $project: { 
          month: { 
            $month: { 
              $dateFromString: { dateString: "$startDate", onError: new Date() } 
            } 
          } 
        } 
      },
      { $group: { _id: "$month", count: { $sum: 1 } } }
    ]).toArray();

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    const monthlyData = months.map((month, index) => {
      const monthNum = index + 1;
      const userStat = usersAggregation.find(u => u._id === monthNum);
      const tripStat = tripsAggregation.find(t => t._id === monthNum);
      
      return {
        month,
        users: userStat ? userStat.count : 0,
        trips: tripStat ? tripStat.count : 0
      };
    });

    res.status(200).json({
      success: true,
      data: monthlyData
    });
  } catch (error) {
    console.error("Failed to fetch analytics stats:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
