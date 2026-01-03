import dotenv from 'dotenv';
import http from 'http';

/**
 * Phase 3 Tagging Verification Script
 * 
 * Tests the SongLabel join API:
 * 1. Create test song
 * 2. Create REGULAR label
 * 3. Create SUPER label
 * 4. Add REGULAR label to song → 201
 * 5. Add same REGULAR label again → 200 (idempotent)
 * 6. Try adding SUPER label → 400 (rejected)
 * 7. GET song labels → only REGULAR
 * 8. DELETE label from song → count 1
 * 9. DELETE again → count 0 (idempotent)
 * 10. Cleanup all test data
 */

dotenv.config();

const PORT = process.env.PORT || 5050;
const LIBRARY_ID = process.env.DEFAULT_LIBRARY_ID;

if (!LIBRARY_ID) {
  console.error('❌ FAIL: DEFAULT_LIBRARY_ID not found in .env');
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
 * Run full tagging verification
 */
async function verifyTagging() {
  console.log('🚀 Starting Phase 3 Tagging Verification...\n');

  const createdIds = {
    songs: [],
    labels: [],
  };

  try {
    const timestamp = Date.now();

    // TEST 1: Create test song
    console.log('📝 TEST 1: Create test song...');
    const songResponse = await makeRequest(
      'POST',
      `/api/libraries/${LIBRARY_ID}/songs`,
      {
        displayTitle: `Tagging Test Song ${timestamp}`,
        displayArtist: 'Test Artist',
      }
    );

    if (songResponse.status !== 201) {
      throw new Error(`Expected 201, got ${songResponse.status}`);
    }

    const song = songResponse.data.song;
    createdIds.songs.push(song.songId);
    console.log(`✅ Song created: ${song.songId}\n`);

    // TEST 2: Create REGULAR label
    console.log('📝 TEST 2: Create REGULAR label...');
    const regularLabelResponse = await makeRequest(
      'POST',
      `/api/libraries/${LIBRARY_ID}/labels`,
      { name: `test_regular_${timestamp}` }
    );

    if (regularLabelResponse.status !== 201) {
      throw new Error(`Expected 201, got ${regularLabelResponse.status}`);
    }

    const regularLabel = regularLabelResponse.data.label;
    createdIds.labels.push(regularLabel.labelId);
    console.log(`✅ REGULAR label created: ${regularLabel.labelId}\n`);

    // TEST 3: Create SUPER label
    console.log('📝 TEST 3: Create SUPER label...');
    const superLabelResponse = await makeRequest(
      'POST',
      `/api/libraries/${LIBRARY_ID}/labels/super`,
      {
        name: `test_super_${timestamp}`,
        componentLabelIds: [regularLabel.labelId],
      }
    );

    if (superLabelResponse.status !== 201) {
      throw new Error(`Expected 201, got ${superLabelResponse.status}`);
    }

    const superLabel = superLabelResponse.data.label;
    createdIds.labels.push(superLabel.labelId);
    console.log(`✅ SUPER label created: ${superLabel.labelId}\n`);

    // TEST 4: Add REGULAR label to song
    console.log('📝 TEST 4: POST add REGULAR label to song...');
    const addResponse = await makeRequest(
      'POST',
      `/api/libraries/${LIBRARY_ID}/songs/${song.songId}/labels/${regularLabel.labelId}`
    );

    if (addResponse.status !== 201 && addResponse.status !== 200) {
      throw new Error(`Expected 201 or 200, got ${addResponse.status}`);
    }

    console.log(`✅ REGULAR label added to song (status ${addResponse.status})\n`);

    // TEST 5: Add same REGULAR label again (idempotent)
    console.log('📝 TEST 5: POST add same REGULAR label again (expect 200)...');
    const addAgainResponse = await makeRequest(
      'POST',
      `/api/libraries/${LIBRARY_ID}/songs/${song.songId}/labels/${regularLabel.labelId}`
    );

    if (addAgainResponse.status !== 200) {
      throw new Error(`Expected 200 for idempotent add, got ${addAgainResponse.status}`);
    }

    if (addAgainResponse.data.songLabel.songId !== song.songId) {
      throw new Error('Returned wrong songLabel on idempotent add');
    }

    console.log(`✅ Idempotent add returned 200 with existing join\n`);

    // TEST 6: Try adding SUPER label (should fail)
    console.log('📝 TEST 6: POST add SUPER label to song (expect 400)...');
    const addSuperResponse = await makeRequest(
      'POST',
      `/api/libraries/${LIBRARY_ID}/songs/${song.songId}/labels/${superLabel.labelId}`
    );

    if (addSuperResponse.status !== 400) {
      throw new Error(`Expected 400 for SUPER label, got ${addSuperResponse.status}`);
    }

    console.log(`✅ SUPER label correctly rejected with 400\n`);

    // TEST 7: GET song labels
    console.log('📝 TEST 7: GET song labels...');
    const getLabelsResponse = await makeRequest(
      'GET',
      `/api/libraries/${LIBRARY_ID}/songs/${song.songId}/labels`
    );

    if (getLabelsResponse.status !== 200) {
      throw new Error(`Expected 200, got ${getLabelsResponse.status}`);
    }

    const songLabels = getLabelsResponse.data.songLabels;
    if (!Array.isArray(songLabels)) {
      throw new Error('Expected songLabels array');
    }

    if (songLabels.length !== 1) {
      throw new Error(`Expected 1 label, got ${songLabels.length}`);
    }

    if (songLabels[0].labelId !== regularLabel.labelId) {
      throw new Error('Song has wrong label attached');
    }

    console.log(`✅ Song has correct labels (1 REGULAR, 0 SUPER)\n`);

    // TEST 8: DELETE label from song
    console.log('📝 TEST 8: DELETE label from song...');
    const deleteResponse = await makeRequest(
      'DELETE',
      `/api/libraries/${LIBRARY_ID}/songs/${song.songId}/labels/${regularLabel.labelId}`
    );

    if (deleteResponse.status !== 200) {
      throw new Error(`Expected 200, got ${deleteResponse.status}`);
    }

    if (deleteResponse.data.deletedJoinCount !== 1) {
      throw new Error(`Expected deletedJoinCount 1, got ${deleteResponse.data.deletedJoinCount}`);
    }

    console.log(`✅ Label removed from song (count: 1)\n`);

    // TEST 9: DELETE again (idempotent)
    console.log('📝 TEST 9: DELETE again (expect count 0)...');
    const deleteAgainResponse = await makeRequest(
      'DELETE',
      `/api/libraries/${LIBRARY_ID}/songs/${song.songId}/labels/${regularLabel.labelId}`
    );

    if (deleteAgainResponse.status !== 200) {
      throw new Error(`Expected 200, got ${deleteAgainResponse.status}`);
    }

    if (deleteAgainResponse.data.deletedJoinCount !== 0) {
      throw new Error(`Expected deletedJoinCount 0, got ${deleteAgainResponse.data.deletedJoinCount}`);
    }

    console.log(`✅ Idempotent delete returned count 0\n`);

    // Cleanup
    console.log('🧹 Cleaning up test data...');
    
    // Delete song
    await makeRequest('DELETE', `/api/libraries/${LIBRARY_ID}/songs/${song.songId}`);
    
    // Delete labels
    for (const labelId of createdIds.labels) {
      await makeRequest('DELETE', `/api/libraries/${LIBRARY_ID}/labels/${labelId}`);
    }
    
    console.log('✅ Cleanup complete\n');

    // SUCCESS
    console.log('🎉 PASS: Tagging verified successfully!\n');

  } catch (error) {
    console.error('❌ FAIL: Tagging verification failed');
    console.error(`   Reason: ${error.message}\n`);

    if (error.message.includes('ECONNREFUSED')) {
      console.error('   💡 Make sure the backend server is running on port', PORT);
    }

    // Attempt cleanup
    console.log('🧹 Attempting cleanup...');
    try {
      for (const songId of createdIds.songs) {
        await makeRequest('DELETE', `/api/libraries/${LIBRARY_ID}/songs/${songId}`);
      }
      for (const labelId of createdIds.labels) {
        await makeRequest('DELETE', `/api/libraries/${LIBRARY_ID}/labels/${labelId}`);
      }
      console.log('✅ Cleanup successful\n');
    } catch (cleanupError) {
      console.log('⚠️  Cleanup failed - manual cleanup may be needed\n');
    }

    process.exit(1);
  }
}

// Run verification
verifyTagging();