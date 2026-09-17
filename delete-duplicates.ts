import { MongoClient } from "mongodb";
import "dotenv/config";

const MONGODB_URI = process.env.MONGODB_URI as string;
const DB_NAME = process.env.DB_NAME as string;

async function run() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const bookingsCol = db.collection("tour-bookings");

    const bookings = await bookingsCol.find({}).sort({ createdAt: -1 }).toArray();
    console.log(`Found ${bookings.length} bookings.`);

    const seenEmails = new Set<string>();
    const toDelete: any[] = [];
    const toKeep: any[] = [];

    for (const booking of bookings) {
      const email = booking.customer?.email;
      if (!email) {
        toDelete.push(booking._id);
        continue;
      }

      if (seenEmails.has(email)) {
        toDelete.push(booking._id);
      } else {
        seenEmails.add(email);
        toKeep.push(booking._id);
      }
    }

    console.log(`Keeping ${toKeep.length} bookings (unique emails).`);
    console.log(`Deleting ${toDelete.length} duplicate/extra bookings.`);

    if (toDelete.length > 0) {
      await bookingsCol.deleteMany({ _id: { $in: toDelete } });
      console.log("Deleted duplicates successfully.");
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

run();
