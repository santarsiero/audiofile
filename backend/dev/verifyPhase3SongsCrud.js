import dotenv from 'dotenv';
import http from 'http';

/**
 * Phase 3 Songs CRUD Verification Script
 * 
 * Tests the full Songs CRUD flow:
 * 1. POST create song
 * 2. GET list songs
 * 3. GET by songId
 * 4. PUT update song
 * 5. POST duplicate → expect 409
 * 6. DELETE song → cleanup
 * 7. GET deleted song → expect 404
 */

dotenv.config();

const PORT = process.env.PORT || 5050;
const LIBRARY_ID = process.env.DEFAULT_LIBRARY_ID;

if (!LIBRARY_ID) {
  console.error('❌ FAIL: DEFAULT_LIBRARY_ID not found in .env');
  console.error('   Run Phase 2 verification first to create test library');
  process.exit(1);
}

/**
 * Make HTTP request
 */
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsedData = data ? JSON.parse(data) : null;
          resolve({
            status: res.statusCode,
            data: parsedData,
          });
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

/**
 * Run full CRUD verification
 */
async function verifySongsCrud() {
  console.log('🚀 Starting Phase 3 Songs CRUD Verification...\n');

  let createdSongId = null;

  try {
    // TEST 1: Create song
    console.log('📝 TEST 1: POST create song...');
    const timestamp = Date.now();
    const createPayload = {
      displayTitle: `Test Song ${timestamp}`,
      displayArtist: 'Test Artist',
      metadata: { genre: 'Test', bpm: 120 },
    };

    const createResponse = await makeRequest(
      'POST',
      `/api/libraries/${LIBRARY_ID}/songs`,
      createPayload
    );

    if (createResponse.status !== 201) {
      throw new Error(`Expected 201, got ${createResponse.status}`);
    }

    if (!createResponse.data.song || !createResponse.data.song.songId) {
      throw new Error('Response missing song or songId');
    }

    createdSongId = createResponse.data.song.songId;
    console.log(`✅ Song created: ${createdSongId}`);
    console.log(`   Title: "${createResponse.data.song.displayTitle}"`);
    console.log(`   Artist: "${createResponse.data.song.displayArtist}"`);
    console.log(`   normKey: "${createResponse.data.song.normKey}"\n`);

    // TEST 2: List songs
    console.log('📝 TEST 2: GET list songs...');
    const listResponse = await makeRequest('GET', `/api/libraries/${LIBRARY_ID}/songs`);

    if (listResponse.status !== 200) {
      throw new Error(`Expected 200, got ${listResponse.status}`);
    }

    if (!Array.isArray(listResponse.data.songs)) {
      throw new Error('Expected songs array');
    }

    const foundInList = listResponse.data.songs.find(s => s.songId === createdSongId);
    if (!foundInList) {
      throw new Error('Created song not found in list');
    }

    console.log(`✅ Song found in list (total songs: ${listResponse.data.songs.length})\n`);

    // TEST 3: Get by songId
    console.log('📝 TEST 3: GET song by songId...');
    const getResponse = await makeRequest(
      'GET',
      `/api/libraries/${LIBRARY_ID}/songs/${createdSongId}`
    );

    if (getResponse.status !== 200) {
      throw new Error(`Expected 200, got ${getResponse.status}`);
    }

    if (getResponse.data.song.songId !== createdSongId) {
      throw new Error('Retrieved song has wrong songId');
    }

    console.log(`✅ Song retrieved by ID\n`);

    // TEST 4: Update song
    console.log('📝 TEST 4: PUT update song...');
    const updatePayload = {
      displayTitle: `Updated Test Song ${timestamp}`,
    };

    const updateResponse = await makeRequest(
      'PUT',
      `/api/libraries/${LIBRARY_ID}/songs/${createdSongId}`,
      updatePayload
    );

    if (updateResponse.status !== 200) {
      throw new Error(`Expected 200, got ${updateResponse.status}`);
    }

    if (updateResponse.data.song.displayTitle !== updatePayload.displayTitle) {
      throw new Error('Song title not updated');
    }

    console.log(`✅ Song updated`);
    console.log(`   New title: "${updateResponse.data.song.displayTitle}"\n`);

    // TEST 5: Create duplicate (should fail with 409)
    console.log('📝 TEST 5: POST duplicate song (expect 409)...');
    const duplicatePayload = {
      displayTitle: updateResponse.data.song.displayTitle,
      displayArtist: updateResponse.data.song.displayArtist,
    };

    const duplicateResponse = await makeRequest(
      'POST',
      `/api/libraries/${LIBRARY_ID}/songs`,
      duplicatePayload
    );

    if (duplicateResponse.status !== 409) {
      throw new Error(`Expected 409 for duplicate, got ${duplicateResponse.status}`);
    }

    console.log(`✅ Duplicate correctly rejected with 409\n`);

    // TEST 6: Delete song
    console.log('📝 TEST 6: DELETE song...');
    const deleteResponse = await makeRequest(
      'DELETE',
      `/api/libraries/${LIBRARY_ID}/songs/${createdSongId}`
    );

    if (deleteResponse.status !== 200) {
      throw new Error(`Expected 200, got ${deleteResponse.status}`);
    }

    if (deleteResponse.data.deletedSongId !== createdSongId) {
      throw new Error('Wrong songId in delete response');
    }

    if (!('deleted' in deleteResponse.data)) {
      throw new Error('Missing deleted counts in response');
    }

    console.log(`✅ Song deleted: ${createdSongId}`);
    console.log(`   Cleanup: ${deleteResponse.data.deleted.songLabels} songLabels, ${deleteResponse.data.deleted.songSources} songSources\n`);

    // Clear the ID since it's deleted
    createdSongId = null;

    // TEST 7: Get deleted song (should 404)
    console.log('📝 TEST 7: GET deleted song (expect 404)...');
    const getDeletedResponse = await makeRequest(
      'GET',
      `/api/libraries/${LIBRARY_ID}/songs/${deleteResponse.data.deletedSongId}`
    );

    if (getDeletedResponse.status !== 404) {
      throw new Error(`Expected 404 for deleted song, got ${getDeletedResponse.status}`);
    }

    console.log(`✅ Deleted song correctly returns 404\n`);

    // SUCCESS
    console.log('🎉 PASS: Songs CRUD verified successfully!\n');

  } catch (error) {
    console.error('❌ FAIL: Songs CRUD verification failed');
    console.error(`   Reason: ${error.message}\n`);

    if (error.message.includes('ECONNREFUSED')) {
      console.error('   💡 Make sure the backend server is running on port', PORT);
    }

    // Cleanup: try to delete created song if it exists
    if (createdSongId) {
      console.log('🧹 Attempting cleanup...');
      try {
        await makeRequest('DELETE', `/api/libraries/${LIBRARY_ID}/songs/${createdSongId}`);
        console.log('✅ Cleanup successful\n');
      } catch (cleanupError) {
        console.log('⚠️  Cleanup failed - manual cleanup may be needed\n');
      }
    }

    process.exit(1);
  }
}

// Run verification
verifySongsCrud();