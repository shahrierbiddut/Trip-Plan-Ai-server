import { Request, Response } from "express";
import { Db } from "mongodb";

/* =========================================================
   DASHBOARD STATS
========================================================= */

export const getDashboardStats =
  (db: Db) => async (_req: Request, res: Response) => {
    try {
      const [
        totalUsers,
        activeUsers,
        totalTrips,
        totalDestinations,
        totalReviews,
      ] = await Promise.all([
        db.collection("user").countDocuments(),

        db.collection("user").countDocuments({
          status: "Active",
        }),

        db.collection("trips").countDocuments(),

        db.collection("destinations").countDocuments({
          status: "Active",
        }),

        db.collection("reviews").countDocuments({
          status: "Published",
        }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          totalUsers,
          activeUsers,
          totalTrips,
          totalDestinations,
          totalReviews,
        },
      });
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);

      res.status(500).json({
        success: false,
        message: "Server Error",
      });
    }
  };

/* =========================================================
   ANALYTICS STATS
========================================================= */

export const getAnalyticsStats =
  (db: Db) => async (req: Request, res: Response) => {
    try {
      const range = String(req.query.range || "Year");

      const now = new Date();

      /* =====================================================
         CURRENT PERIOD
      ===================================================== */

      let startDate: Date;
      let previousStartDate: Date;
      let previousEndDate: Date;

      if (range === "Week") {
        // Current 7 days
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        startDate.setDate(startDate.getDate() - 6);

        // Previous 7 days
        previousEndDate = new Date(startDate);
        previousEndDate.setMilliseconds(-1);

        previousStartDate = new Date(previousEndDate);
        previousStartDate.setDate(
          previousStartDate.getDate() - 6
        );
        previousStartDate.setHours(0, 0, 0, 0);
      } else if (range === "Month") {
        // Current 30 days
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        startDate.setDate(startDate.getDate() - 29);

        // Previous 30 days
        previousEndDate = new Date(startDate);
        previousEndDate.setMilliseconds(-1);

        previousStartDate = new Date(previousEndDate);
        previousStartDate.setDate(
          previousStartDate.getDate() - 29
        );
        previousStartDate.setHours(0, 0, 0, 0);
      } else {
        // Current year
        startDate = new Date(
          now.getFullYear(),
          0,
          1
        );

        // Previous year
        previousStartDate = new Date(
          now.getFullYear() - 1,
          0,
          1
        );

        previousEndDate = new Date(
          now.getFullYear() - 1,
          11,
          31,
          23,
          59,
          59,
          999
        );
      }

      /* =====================================================
         BASIC ALL-TIME COUNTS
      ===================================================== */

      const [
        totalUsers,
        activeUsers,
        totalTrips,
        totalDestinations,
        totalReviews,
      ] = await Promise.all([
        db.collection("user").countDocuments(),

        db.collection("user").countDocuments({
          status: "Active",
        }),

        db.collection("trips").countDocuments(),

        db.collection("destinations").countDocuments({
          status: "Active",
        }),

        db.collection("reviews").countDocuments({
          status: "Published",
        }),
      ]);

      /* =====================================================
         USER CHART DATA
      ===================================================== */

      const usersByDate = await db
        .collection("user")
        .aggregate([
          {
            $addFields: {
              parsedCreatedAt: {
                $convert: {
                  input: "$createdAt",
                  to: "date",
                  onError: null,
                  onNull: null,
                },
              },
            },
          },

          {
            $match: {
              parsedCreatedAt: {
                $gte: startDate,
                $lte: now,
              },
            },
          },

          {
            $group: {
              _id:
                range === "Year"
                  ? {
                      $month: "$parsedCreatedAt",
                    }
                  : {
                      $dateToString: {
                        format: "%Y-%m-%d",
                        date: "$parsedCreatedAt",
                      },
                    },

              count: {
                $sum: 1,
              },
            },
          },
        ])
        .toArray();

      /* =====================================================
         TRIP CHART DATA
      ===================================================== */

      const tripsByDate = await db
        .collection("trips")
        .aggregate([
          {
            $addFields: {
              parsedStartDate: {
                $convert: {
                  input: "$startDate",
                  to: "date",
                  onError: null,
                  onNull: null,
                },
              },
            },
          },

          {
            $match: {
              parsedStartDate: {
                $gte: startDate,
                $lte: now,
              },
            },
          },

          {
            $group: {
              _id:
                range === "Year"
                  ? {
                      $month: "$parsedStartDate",
                    }
                  : {
                      $dateToString: {
                        format: "%Y-%m-%d",
                        date: "$parsedStartDate",
                      },
                    },

              count: {
                $sum: 1,
              },
            },
          },
        ])
        .toArray();

      /* =====================================================
         CHART DATA
      ===================================================== */

      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      let monthlyData: {
        month: string;
        users: number;
        trips: number;
      }[] = [];

      if (range === "Year") {
        monthlyData = months.map((month, index) => {
          const monthNumber = index + 1;

          const userData = usersByDate.find(
            (item) => item._id === monthNumber
          );

          const tripData = tripsByDate.find(
            (item) => item._id === monthNumber
          );

          return {
            month,
            users: userData?.count || 0,
            trips: tripData?.count || 0,
          };
        });
      } else {
        const totalDays =
          range === "Week" ? 7 : 30;

        for (
          let i = totalDays - 1;
          i >= 0;
          i--
        ) {
          const date = new Date(now);

          date.setDate(
            now.getDate() - i
          );

          date.setHours(0, 0, 0, 0);

          const key = date
            .toISOString()
            .split("T")[0];

          const userData =
            usersByDate.find(
              (item) => item._id === key
            );

          const tripData =
            tripsByDate.find(
              (item) => item._id === key
            );

          monthlyData.push({
            month:
              range === "Week"
                ? date.toLocaleDateString(
                    "en-US",
                    {
                      weekday: "short",
                    }
                  )
                : date.toLocaleDateString(
                    "en-US",
                    {
                      day: "2-digit",
                      month: "short",
                    }
                  ),

            users: userData?.count || 0,
            trips: tripData?.count || 0,
          });
        }
      }

      /* =====================================================
         PERIOD TOTALS
      ===================================================== */

      const periodUsers = monthlyData.reduce(
        (sum, item) =>
          sum + item.users,
        0
      );

      const periodTrips = monthlyData.reduce(
        (sum, item) =>
          sum + item.trips,
        0
      );

      /* =====================================================
         POPULAR DESTINATIONS
      ===================================================== */

      const destinationData = await db
        .collection("trips")
        .aggregate([
          {
            $addFields: {
              parsedStartDate: {
                $convert: {
                  input: "$startDate",
                  to: "date",
                  onError: null,
                  onNull: null,
                },
              },
            },
          },

          {
            $match: {
              parsedStartDate: {
                $gte: startDate,
                $lte: now,
              },

              destination: {
                $exists: true,
                $ne: "",
              },
            },
          },

          {
            $group: {
              _id: "$destination",

              trips: {
                $sum: 1,
              },
            },
          },

          {
            $sort: {
              trips: -1,
            },
          },

          {
            $limit: 6,
          },

          {
            $project: {
              _id: 0,
              name: "$_id",
              trips: 1,
            },
          },
        ])
        .toArray();

      /* =====================================================
         TRAVEL CATEGORIES
      ===================================================== */

      const categoryAggregation =
        await db
          .collection("destinations")
          .aggregate([
            {
              $match: {
                status: "Active",

                category: {
                  $exists: true,
                  $ne: "",
                },
              },
            },

            {
              $group: {
                _id: "$category",

                count: {
                  $sum: 1,
                },
              },
            },

            {
              $sort: {
                count: -1,
              },
            },
          ])
          .toArray();

      const categoryTotal =
        categoryAggregation.reduce(
          (sum, item) =>
            sum + item.count,
          0
        );

      const categoryData =
        categoryAggregation.map(
          (item) => ({
            name: item._id,

            count: item.count,

            value:
              categoryTotal > 0
                ? Math.round(
                    (item.count /
                      categoryTotal) *
                      100
                  )
                : 0,
          })
        );

      /* =====================================================
         REVIEW RATINGS
      ===================================================== */

      const ratingAggregation =
        await db
          .collection("reviews")
          .aggregate([
            {
              $match: {
                status: "Published",

                rating: {
                  $exists: true,
                },
              },
            },

            {
              $group: {
                _id: "$rating",

                reviews: {
                  $sum: 1,
                },
              },
            },
          ])
          .toArray();

      const ratingData = [
        5,
        4,
        3,
        2,
        1,
      ].map((rating) => {
        const found =
          ratingAggregation.find(
            (item) =>
              Number(item._id) ===
              rating
          );

        return {
          rating: `${rating}★`,

          reviews:
            found?.reviews || 0,
        };
      });

      /* =====================================================
         AVERAGE RATING
      ===================================================== */

      const ratingTotal =
        ratingData.reduce(
          (sum, item) =>
            sum + item.reviews,
          0
        );

      const ratingScore =
        ratingData.reduce(
          (sum, item) => {
            const rating = Number(
              item.rating.replace(
                "★",
                ""
              )
            );

            return (
              sum +
              rating *
                item.reviews
            );
          },
          0
        );

      const averageRating =
        ratingTotal > 0
          ? Number(
              (
                ratingScore /
                ratingTotal
              ).toFixed(1)
            )
          : 0;

      /* =====================================================
         REVENUE
      ===================================================== */

      const revenueResult =
        await db
          .collection("trips")
          .aggregate([
            {
              $addFields: {
                parsedStartDate: {
                  $convert: {
                    input:
                      "$startDate",
                    to: "date",
                    onError: null,
                    onNull: null,
                  },
                },
              },
            },

            {
              $match: {
                parsedStartDate: {
                  $gte: startDate,
                  $lte: now,
                },

                amount: {
                  $exists: true,
                },

                paymentStatus: {
                  $in: [
                    "Paid",
                    "Completed",
                    "Success",
                  ],
                },
              },
            },

            {
              $group: {
                _id: null,

                revenue: {
                  $sum: "$amount",
                },
              },
            },
          ])
          .toArray();

      const totalRevenue =
        revenueResult[0]
          ?.revenue || 0;

      /* =====================================================
         PREVIOUS PERIOD USERS
      ===================================================== */

      const previousUsers =
        await db
          .collection("user")
          .countDocuments({
            createdAt: {
              $gte:
                previousStartDate,
              $lte:
                previousEndDate,
            },
          });

      /* =====================================================
         PREVIOUS PERIOD TRIPS
      ===================================================== */

      const previousTripsResult =
        await db
          .collection("trips")
          .aggregate([
            {
              $addFields: {
                parsedStartDate: {
                  $convert: {
                    input:
                      "$startDate",
                    to: "date",
                    onError: null,
                    onNull: null,
                  },
                },
              },
            },

            {
              $match: {
                parsedStartDate: {
                  $gte:
                    previousStartDate,
                  $lte:
                    previousEndDate,
                },
              },
            },

            {
              $count: "count",
            },
          ])
          .toArray();

      const previousTrips =
        previousTripsResult[0]
          ?.count || 0;

      /* =====================================================
         PREVIOUS PERIOD REVENUE
      ===================================================== */

      const previousRevenueResult =
        await db
          .collection("trips")
          .aggregate([
            {
              $addFields: {
                parsedStartDate: {
                  $convert: {
                    input:
                      "$startDate",
                    to: "date",
                    onError: null,
                    onNull: null,
                  },
                },
              },
            },

            {
              $match: {
                parsedStartDate: {
                  $gte:
                    previousStartDate,
                  $lte:
                    previousEndDate,
                },

                amount: {
                  $exists: true,
                },

                paymentStatus: {
                  $in: [
                    "Paid",
                    "Completed",
                    "Success",
                  ],
                },
              },
            },
            

            {
              $group: {
                _id: null,

                revenue: {
                  $sum: "$amount",
                },
              },
            },
          ])
          .toArray();

      const previousRevenue =
        previousRevenueResult[0]
          ?.revenue || 0;

      /* =====================================================
         GROWTH HELPER
      ===================================================== */

      const calculateGrowth = (
        current: number,
        previous: number
      ) => {
        if (previous === 0) {
          return current > 0 ? 100 : 0;
        }

        return Number(
          (
            ((current - previous) /
              previous) *
            100
          ).toFixed(1)
        );
      };

      const userGrowth =
        calculateGrowth(
          periodUsers,
          previousUsers
        );

      const tripGrowth =
        calculateGrowth(
          periodTrips,
          previousTrips
        );

      const revenueGrowth =
        calculateGrowth(
          totalRevenue,
          previousRevenue
        );

      /* =====================================================
         ENGAGEMENT
      ===================================================== */

      const engagement =
        totalUsers > 0
          ? Number(
              (
                (activeUsers /
                  totalUsers) *
                100
              ).toFixed(1)
            )
          : 0;

      /* =====================================================
         RESPONSE
      ===================================================== */

      res.status(200).json({
        success: true,

        data: {
          stats: {
            totalUsers,
            activeUsers,
            totalTrips,
            totalDestinations,
            totalReviews,

            totalRevenue,

            averageRating,

            userGrowth,
            tripGrowth,

            // No reliable createdAt field was provided
            // for destinations/reviews.
            destinationGrowth: 0,
            reviewGrowth: 0,

            revenueGrowth,

            engagement,
          },

          monthlyData,

          destinationData,

          categoryData,

          ratingData,
        },
      });
    } catch (error) {
      console.error(
        "Failed to fetch analytics stats:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Server Error",
      });
    }
  };