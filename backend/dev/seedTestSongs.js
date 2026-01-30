import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createSong } from '../services/SongService.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
const LIBRARY_ID = process.env.DEFAULT_LIBRARY_ID || 'lib_default';
const COUNT = Number(process.env.SEED_COUNT || 20);

if (!MONGODB_URI) {
  console.error('❌ Missing MONGODB_URI in .env');
  process.exit(1);
}

async function main() {
  await mongoose.connect(MONGODB_URI);

  let created = 0;
  let skipped = 0;

  for (let i = 1; i <= COUNT; i += 1) {
    const displayTitle = `Test Song ${i}`;
    const displayArtist = 'Test Artist';

    try {
      await createSong(LIBRARY_ID, {
        displayTitle,
        displayArtist,
        metadata: { seeded: true, seedGroup: 'phase7', seedIndex: i },
      });
      created += 1;
    } catch (error) {
      if (error?.status === 409) {
        skipped += 1;
        continue;
      }
      console.error(`❌ Failed creating "${displayTitle}"`, error);
      process.exitCode = 1;
      break;
    }
  }

  console.log(`✅ Seed complete for libraryId=${LIBRARY_ID}`);
  console.log(`   created: ${created}`);
  console.log(`   skipped (duplicates): ${skipped}`);

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error('❌ Seed script failed', error);
  process.exit(1);
});
