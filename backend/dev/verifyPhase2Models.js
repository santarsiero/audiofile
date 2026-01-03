import dotenv from 'dotenv';
import mongoose from 'mongoose';
import crypto from 'crypto';

// Load environment variables
dotenv.config();

// Import models
import User from '../models/User.js';
import Library from '../models/Library.js';
import Song from '../models/Song.js';
import Label from '../models/Label.js';
import SongLabel from '../models/SongLabel.js';
import SuperLabelComponent from '../models/SuperLabelComponent.js';
import SongSource from '../models/SongSource.js';
import LabelMode from '../models/LabelMode.js';
import LabelModeLabel from '../models/LabelModeLabel.js';

function makeId(prefix) {
  const id = crypto.randomUUID().replace(/-/g, '').slice(0, 10);
  return `${prefix}_${id}`;
}

/**
 * Phase 2 Model Verification Script
 * 
 * Tests:
 * 1. Database connection
 * 2. User and Library creation
 * 3. Song creation with auto-normalization
 * 4. Label creation (REGULAR and SUPER)
 * 5. SongLabel join (linking song to REGULAR label)
 * 6. SuperLabelComponent (linking SUPER to REGULAR)
 * 7. LabelMode and LabelModeLabel creation
 * 8. Unique constraint enforcement (duplicate rejection)
 * 9. Cross-library isolation (same names allowed in different libraries)
 */

async function verifyPhase2Models() {
  console.log('🚀 Starting Phase 2 Model Verification...\n');

  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const defaultUserId = process.env.DEFAULT_USER_ID;
    const defaultLibraryId = process.env.DEFAULT_LIBRARY_ID;

    if (defaultUserId || defaultLibraryId) {
      console.log('🧹 Cleaning up existing DEFAULT_* test data (if any)...');
      await Promise.all([
        defaultUserId ? User.deleteMany({ userId: defaultUserId }) : Promise.resolve(),
        defaultLibraryId ? Library.deleteMany({ libraryId: defaultLibraryId }) : Promise.resolve(),
        defaultLibraryId ? Song.deleteMany({ libraryId: defaultLibraryId }) : Promise.resolve(),
        defaultLibraryId ? Label.deleteMany({ libraryId: defaultLibraryId }) : Promise.resolve(),
        defaultLibraryId ? SongLabel.deleteMany({ libraryId: defaultLibraryId }) : Promise.resolve(),
        defaultLibraryId ? SuperLabelComponent.deleteMany({ libraryId: defaultLibraryId }) : Promise.resolve(),
        defaultLibraryId ? SongSource.deleteMany({ libraryId: defaultLibraryId }) : Promise.resolve(),
        defaultLibraryId ? LabelMode.deleteMany({ libraryId: defaultLibraryId }) : Promise.resolve(),
        defaultLibraryId ? LabelModeLabel.deleteMany({ libraryId: defaultLibraryId }) : Promise.resolve(),
      ]);
      console.log('✅ Cleanup complete\n');
    }

    // Track created IDs for cleanup
    const createdIds = {
      users: [],
      libraries: [],
      songs: [],
      labels: [],
      songLabels: [],
      superLabelComponents: [],
      songSources: [],
      labelModes: [],
      labelModeLabels: [],
    };

    // ===== TEST 1: Create User =====
    console.log('📝 TEST 1: Creating User...');
    const userId = process.env.DEFAULT_USER_ID || makeId('user');
    const userEmail = process.env.DEFAULT_USER_EMAIL || `${makeId('test')}@audiofile.dev`;
    
    const user = await User.create({
      userId,
      email: userEmail,
    });
    createdIds.users.push(user.userId);
    console.log(`✅ User created: ${user.userId} (${user.email})\n`);

    // ===== TEST 2: Create Library =====
    console.log('📝 TEST 2: Creating Library...');
    const libraryId = process.env.DEFAULT_LIBRARY_ID || makeId('lib');
    const libraryName = process.env.DEFAULT_LIBRARY_NAME || 'Test Library';
    
    const library = await Library.create({
      libraryId,
      ownerUserId: user.userId,
      name: libraryName,
    });
    createdIds.libraries.push(library.libraryId);
    console.log(`✅ Library created: ${library.libraryId} ("${library.name}")\n`);

    // ===== TEST 3: Create Song with Auto-Normalization =====
    console.log('📝 TEST 3: Creating Song with auto-normalization...');
    const songId = makeId('song');
    
    const song = await Song.create({
      libraryId: library.libraryId,
      songId,
      displayTitle: "Can't Stop (Won't Stop) — 2024 Mix!",
      displayArtist: 'Tëst Àrtist #1',
      metadata: { genre: 'House', bpm: 128 },
    });
    createdIds.songs.push(song.songId);
    
    console.log(`✅ Song created: ${song.songId}`);
    console.log(`   Display: "${song.displayTitle}" by "${song.displayArtist}"`);
    console.log(`   Normalized: normTitle="${song.normTitle}", normArtist="${song.normArtist}"`);
    console.log(`   normKey="${song.normKey}"\n`);

    // ===== TEST 4: Create REGULAR Label =====
    console.log('📝 TEST 4: Creating REGULAR label...');
    const regularLabelId = makeId('label');
    
    const regularLabel = await Label.create({
      libraryId: library.libraryId,
      labelId: regularLabelId,
      name: 'Deep House',
      type: 'REGULAR',
    });
    createdIds.labels.push(regularLabel.labelId);
    
    console.log(`✅ REGULAR label created: ${regularLabel.labelId}`);
    console.log(`   Name: "${regularLabel.name}", normName: "${regularLabel.normName}"\n`);

    // ===== TEST 5: Create SUPER Label =====
    console.log('📝 TEST 5: Creating SUPER label...');
    const superLabelId = makeId('label');
    
    const superLabel = await Label.create({
      libraryId: library.libraryId,
      labelId: superLabelId,
      name: 'Dance Music',
      type: 'SUPER',
    });
    createdIds.labels.push(superLabel.labelId);
    
    console.log(`✅ SUPER label created: ${superLabel.labelId}`);
    console.log(`   Name: "${superLabel.name}", normName: "${superLabel.normName}"\n`);

    // ===== TEST 6: Create SongLabel (link song to REGULAR label) =====
    console.log('📝 TEST 6: Creating SongLabel (song ↔ REGULAR label)...');
    
    const songLabel = await SongLabel.create({
      libraryId: library.libraryId,
      songId: song.songId,
      labelId: regularLabel.labelId,
    });
    createdIds.songLabels.push(songLabel._id);
    
    console.log(`✅ SongLabel created: Song "${song.displayTitle}" linked to label "${regularLabel.name}"\n`);

    // ===== TEST 7: Create SuperLabelComponent (link SUPER to REGULAR) =====
    console.log('📝 TEST 7: Creating SuperLabelComponent (SUPER ↔ REGULAR)...');
    
    const superComponent = await SuperLabelComponent.create({
      libraryId: library.libraryId,
      superLabelId: superLabel.labelId,
      regularLabelId: regularLabel.labelId,
    });
    createdIds.superLabelComponents.push(superComponent._id);
    
    console.log(`✅ SuperLabelComponent created: SUPER "${superLabel.name}" contains REGULAR "${regularLabel.name}"\n`);

    // ===== TEST 8: Create LabelMode =====
    console.log('📝 TEST 8: Creating LabelMode...');
    const modeId = makeId('mode');
    
    const labelMode = await LabelMode.create({
      libraryId: library.libraryId,
      modeId,
      name: 'House Mode',
    });
    createdIds.labelModes.push(labelMode.modeId);
    
    console.log(`✅ LabelMode created: ${labelMode.modeId} ("${labelMode.name}")\n`);

    // ===== TEST 9: Create LabelModeLabel =====
    console.log('📝 TEST 9: Creating LabelModeLabel...');
    
    const labelModeLabel = await LabelModeLabel.create({
      libraryId: library.libraryId,
      modeId: labelMode.modeId,
      labelId: regularLabel.labelId,
    });
    createdIds.labelModeLabels.push(labelModeLabel._id);
    
    console.log(`✅ LabelModeLabel created: Mode "${labelMode.name}" includes label "${regularLabel.name}"\n`);

    // ===== TEST 10: Duplicate Rejection (Unique Constraints) =====
    console.log('📝 TEST 10: Testing unique constraint enforcement...');
    
    // Try to create duplicate user
    try {
      await User.create({
        userId: makeId('user'),
        email: user.email, // Same email
      });
      console.log('❌ FAIL: Duplicate user email was allowed');
    } catch (error) {
      if (error.code === 11000) {
        console.log('✅ PASS: Duplicate user email rejected');
      } else {
        throw error;
      }
    }

    // Try to create duplicate label in same library
    try {
      await Label.create({
        libraryId: library.libraryId,
        labelId: makeId('label'),
        name: 'Deep House', // Same normName in same library
        type: 'REGULAR',
      });
      console.log('❌ FAIL: Duplicate label name in same library was allowed');
    } catch (error) {
      if (error.code === 11000) {
        console.log('✅ PASS: Duplicate label name in same library rejected');
      } else {
        throw error;
      }
    }

    // Try to create duplicate song in same library
    try {
      await Song.create({
        libraryId: library.libraryId,
        songId: makeId('song'),
        displayTitle: song.displayTitle, // Same normKey in same library
        displayArtist: song.displayArtist,
      });
      console.log('❌ FAIL: Duplicate song normKey in same library was allowed');
    } catch (error) {
      if (error.code === 11000) {
        console.log('✅ PASS: Duplicate song normKey in same library rejected');
      } else {
        throw error;
      }
    }

    console.log();

    // ===== TEST 11: Cross-Library Isolation =====
    console.log('📝 TEST 11: Testing cross-library isolation...');
    
    // Create second library
    const library2Id = makeId('lib');
    const library2 = await Library.create({
      libraryId: library2Id,
      ownerUserId: user.userId,
      name: 'Second Test Library',
    });
    createdIds.libraries.push(library2.libraryId);

    // Create label with same name in different library
    try {
      const crossLibLabel = await Label.create({
        libraryId: library2.libraryId,
        labelId: makeId('label'),
        name: 'Deep House', // Same name as in library1
        type: 'REGULAR',
      });
      createdIds.labels.push(crossLibLabel.labelId);
      console.log('✅ PASS: Same label name allowed in different library');
    } catch (error) {
      console.log('❌ FAIL: Cross-library label creation failed');
      throw error;
    }

    // Create song with same normKey in different library
    try {
      const crossLibSong = await Song.create({
        libraryId: library2.libraryId,
        songId: makeId('song'),
        displayTitle: song.displayTitle, // Same as library1 song
        displayArtist: song.displayArtist,
      });
      createdIds.songs.push(crossLibSong.songId);
      console.log('✅ PASS: Same song normKey allowed in different library');
    } catch (error) {
      console.log('❌ FAIL: Cross-library song creation failed');
      throw error;
    }

    console.log();

    // ===== Summary =====
    console.log('🎉 Phase 2 Model Verification Complete!\n');
    console.log('Created test data:');
    console.log(`  - Users: ${createdIds.users.length}`);
    console.log(`  - Libraries: ${createdIds.libraries.length}`);
    console.log(`  - Songs: ${createdIds.songs.length}`);
    console.log(`  - Labels: ${createdIds.labels.length}`);
    console.log(`  - SongLabels: ${createdIds.songLabels.length}`);
    console.log(`  - SuperLabelComponents: ${createdIds.superLabelComponents.length}`);
    console.log(`  - LabelModes: ${createdIds.labelModes.length}`);
    console.log(`  - LabelModeLabels: ${createdIds.labelModeLabels.length}`);
    console.log();
    console.log('📋 Test data IDs (for manual cleanup if needed):');
    console.log(JSON.stringify(createdIds, null, 2));

  } catch (error) {
    console.error('\n❌ Verification failed:');
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n📡 Disconnected from MongoDB');
  }
}

// Run verification
verifyPhase2Models();