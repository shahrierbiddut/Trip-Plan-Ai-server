import { Request, Response } from "express";
import { Db } from "mongodb";

export const getDashboardData = (db: Db) => async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    let dbTrips = [];
    if (userId) {
      dbTrips = await db.collection("trips").find({ userId }).sort({ createdAt: -1 }).toArray();
    } else {
      dbTrips = await db.collection("trips").find().sort({ createdAt: -1 }).limit(10).toArray();
    }

    // Format DB trips for the dashboard
    const formattedTrips = dbTrips.map(t => {
      // Basic fallback to ensure it renders if fields are missing
      const startDate = t.startDate ? new Date(t.startDate) : new Date();
      const endDate = t.endDate ? new Date(t.endDate) : new Date();
      
      const startDay = startDate.getDate().toString().padStart(2, '0');
      const endDay = endDate.getDate().toString().padStart(2, '0');
      const month = startDate.toLocaleString('en-US', { month: 'long' });
      const year = startDate.getFullYear();

      return {
        id: t._id.toString(),
        title: t.name || t.title || "My Trip",
        destination: t.destination?.name || t.destination || "Destination",
        image: t.destination?.image || t.image || "/assets/Sajek/cover-2.jpg",
        startDate: startDay,
        endDate: `${endDay} ${month} ${year}`,
        durationString: t.duration || "3 Days",
        travelStyle: t.travelStyle || "Adventure",
        budget: t.budget?.total || t.budget || 15000,
        status: t.status || "Upcoming",
        aiMatch: t.aiMatch || 90,
      };
    });

    const myTrips = formattedTrips.length > 0 ? formattedTrips : [
      // Fallback only if the db is completely empty
      {
        id: "trip-1",
        title: "3 Days in Sajek Valley",
        destination: "Sajek Valley",
        image: "/assets/Sajek/cover-2.jpg",
        startDate: "18",
        endDate: "20 September 2026",
        durationString: "3 Days",
        travelStyle: "Adventure",
        budget: 12500,
        status: "Upcoming",
        aiMatch: 91,
      }
    ];

    const savedForLater = [
      {
        id: "dest-1",
        name: "Saint Martin",
        region: "Chattogram",
        image: "/assets/Saintmartin/cover-1.jpg",
        match: 93,
      },
      {
        id: "dest-2",
        name: "Sundarban",
        region: "Khulna",
        image: "/assets/Sundarban/cover-1.jpg",
        match: 89,
      },
      {
        id: "dest-3",
        name: "Bandarban",
        region: "Chattogram",
        image: "/assets/Sundarban/cover-1.jpg",
        match: 95,
      }
    ];

    const recentActivity = dbTrips.slice(0, 4).map((trip: any, index: number) => {
      // Fake timestamps for recent items for demo purposes based on index
      const times = ["Just now", "2 hours ago", "Yesterday", "3 days ago"];
      const timeLabel = times[index] || "Recently";
      return {
        id: `act-${trip._id}`,
        timeLabel,
        description: `TripPlan AI generated a new itinerary for **${trip.destination?.name || trip.destination || 'a trip'}**.`,
        type: "generated",
      };
    });

    if (recentActivity.length === 0) {
      recentActivity.push({
        id: "act-fallback",
        timeLabel: "Welcome",
        description: "Start exploring and creating new trips with TripPlan AI!",
        type: "generated",
      });
    }
    const dashboardData = {
      user: {
        name: "Rifat Ahmed",
        firstName: "Rifat",
        role: "Traveler",
        avatar: "https://ui-avatars.com/api/?name=Rifat+Ahmed&background=F4A934&color=073D31",
      },
      stats: {
        upcomingTrips: { count: myTrips.filter(t => t.status === "Upcoming").length, detail: "Next trip in 3 days" },
        savedDestinations: { count: savedForLater.length, detail: "+3 this month" },
        tripsCompleted: { count: myTrips.filter(t => t.status === "Completed").length, detail: "Since joining TripPlan AI" },
        totalBudget: { amount: "৳86,500", detail: "Across 8 trips" },
      },
      nextAdventure: {
        destination: "Cox's Bazar",
        startDate: "24",
        endDate: "26 August 2026",
        duration: "3 Days • 2 Nights",
        group: "Family Trip",
        budget: "৳15,000 – ৳18,000",
        aiMatch: 94,
        image: "/assets/Coxs/cover-4.jpg",
      },
      quickSuggestions: [
        "Weekend Escape",
        "Mountain Adventure",
        "Beach Getaway",
        "Nature Retreat",
      ],
      myTrips,
      savedForLater,
      recentActivity,
      budgetOverview: {
        total: 25000,
        spent: 17450,
        remaining: 7550,
        usedPercentage: 72,
        breakdown: [
          { category: "Accommodation", amount: 8000, percentage: 32, color: "#F4A934" },
          { category: "Transport", amount: 4500, percentage: 18, color: "#E89425" },
          { category: "Food", amount: 2950, percentage: 12, color: "#087F5B" },
          { category: "Activities", amount: 2000, percentage: 8, color: "#8FE0C2" },
          { category: "Other", amount: 0, percentage: 0, color: "#1F4F42" },
        ],
      },
      aiInsight: {
        title: "Your AI Travel Insight ✨",
        description:
          "Based on your previous trips, you usually prefer 3–5 day nature escapes with a mid-range budget.",
        recommendation: {
          name: "Bandarban",
          match: 96,
          tags: ["Nature", "Adventure", "Mid-range", "3–5 Days"],
          image: "/assets/Bandarban/images 2.jfif",
        },
      },
    };

    res.status(200).json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
