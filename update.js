import "dotenv/config";
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI);
client.connect().then(async () => {
  const db = client.db(process.env.DB_NAME);
  const updates = [
    { title: 'Cox’s Bazar Family Escape', image: '/assets/Coxs/cover-1.jpg' },
    { title: 'Cox’s Bazar Weekend Tour', image: '/assets/Coxs/cover-2.jpg' },
    { title: 'Sajek Cloud Adventure', image: '/assets/Sajek/cover-1.jpg' },
    { title: 'Sajek Autumn Group Tour', image: '/assets/Sajek/cover-2.jpg' },
    { title: 'Sylhet Tea Garden Journey', image: '/assets/Sylhet/cover-1.jpg' },
    { title: 'Sylhet Green Escape', image: '/assets/Sylhet/cover-2.jpg' },
    { title: 'Saint Martin Island Retreat', image: '/assets/Saintmartin/cover-1.jpg' },
    { title: 'Bandarban Hill Journey', image: '/assets/Bandarban/images 1.jfif' },
    { title: 'Sundarbans Wildlife Tour', image: '/assets/Sundarban/cover-1.jpg' }
  ];
  for (const update of updates) {
    await db.collection('tour-packages').updateOne({ title: update.title }, { $set: { image: update.image } });
  }
  console.log('Update complete');
  client.close();
});
