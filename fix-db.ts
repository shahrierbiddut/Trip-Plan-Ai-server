import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

async function fixDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("No MONGODB_URI");
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(process.env.DB_NAME);
  
  const result = await db.collection("user").updateMany(
    {},
    { $set: { emailVerified: true } }
  );
  console.log(`Updated ${result.modifiedCount} users to emailVerified: true`);
  await client.close();
}
fixDb().catch(console.error);
