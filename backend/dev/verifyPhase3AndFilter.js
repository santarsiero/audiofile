import dotenv from 'dotenv';
import http from 'http';

/**
 * Phase 3 AND Filter Verification Script
 * 
 * Tests AND-based filtering with SUPER label expansion:
 * - Creates REGULAR labels A, B, C
 * - Creates SUPER label S = [A, B]
 * - Creates 3 songs with different label combinations
 * - Tests various filter scenarios
 * - Cleans up all test data
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
 * Run full AND filter verification
 */
async function verifyAndFilter() {
  console.log('🚀 Starting Phase 3 AND Filter Verification...\n');

  const createdIds = {
    songs: [],
    labels: [],
  };

  try {
    const timestamp = Date.now();

    // Create REGULAR labels A, B, C
    console.log('📝 Creating REGULAR labels A, B, C...');
    
    const labelAResponse = await makeRequest(
      'POST',
      `/api/libraries/${LIBRARY_ID}/labels`,
      { name: `label_A_${timestamp}` }
    );
    const labelA = labelAResponse.data.label;
    createdIds.labels.push(labelA.labelId);

    const labelBResponse = await makeRequest(
      'POST',
      `/api/libraries/${LIBRARY_ID}/labels`,
      { name: `label_B_${timestamp}` }
    );
    const labelB = labelBResponse.data.label;
    createdIds.labels.push(labelB.labelId);

    const labelCResponse = await makeRequest(
      'POST',
      `/api/libraries/${LIBRARY_ID}/labels`,
      { name: `label_C_${timestamp}` }
    );
    const labelC = labelCResponse.data.label;
    createdIds.labels.push(labelC.labelId);

    console.log(`✅ Created labels A, B, C\n`);

    // Create SUPER label S = [A, B]
    console.log('📝 Creating SUPER label S = [A, B]...');
    
    const labelSResponse = await makeRequest(
      'POST',
      `/api/libraries/${LIBRARY_ID}/labels/super`,
      {
        name: `label_S_${timestamp}`,
        componentLabelIds: [labelA.labelId, labelB.labelId],
      }
    );
    const labelS = labelSResponse.data.label;
    createdIds.labels.push(labelS.labelId);

    console.log(`✅ Created SUPER label S\n`);

    // Create song1 tagged with A
    console.log('📝 Creating song1 (tagged with A only)...');
    
    const song1Response = await makeRequest(
      'POST',
      `/api/libraries/${LIBRARY_ID}/songs`,
      {
        displayTitle: `Filter Test Song 1 ${timestamp}`,
        displayArtist: 'Test Artist',
      }
    );
    const song1 = song1Response.data.song;
    createdIds.songs.push(song1.songId);

    await makeRequest(
      'POST',
      `/api/libraries/${LIBRARY_ID}/songs/${song1.songId}/labels/${labelA.labelId}`
    );

    console.log(`✅ Song1 created and tagged with A\n`);

    // Create song2 tagged with A + B
    console.log('📝 Creating song2 (tagged with A + B)...');
    
    const song2Response = await makeRequest(
      'POST',
      `/api/libraries/${LIBRARY_ID}/songs`,
      {
        displayTitle: `Filter Test Song 2 ${timestamp}`,
        displayArtist: 'Test Artist',
      }
    );
    const song2 = song2Response.data.song;
    createdIds.songs.push(song2.songId);

    await makeRequest(
      'POST',
      `/api/libraries/${LIBRARY_ID}/songs/${song2.songId}/labels/${labelA.labelId}`
    );
    await makeRequest(
      'POST',
      `/api/libraries/${LIBRARY_ID}/songs/${song2.songId}/labels/${labelB.labelId}`
    );

    console.log(`✅ Song2 created and tagged with A + B\n`);

    // Create song3 tagged with B + C
    console.log('📝 Creating song3 (tagged with B + C)...');
    
    const song3Response = await makeRequest(
      'POST',
      `/api/libraries/${LIBRARY_ID}/songs`,
      {
        displayTitle: `Filter Test Song 3 ${timestamp}`,
        displayArtist: 'Test Artist',
      }
    );
    const song3 = song3Response.data.song;
    createdIds.songs.push(song3.songId);

    await makeRequest(
      'POST',
      `/api/libraries/${LIBRARY_ID}/songs/${song3.songId}/labels/${labelB.labelId}`
    );
    await makeRequest(
      'POST',
      `/api/libraries/${LIBRARY_ID}/songs/${song3.songId}/labels/${labelC.labelId}`
    );

    console.log(`✅ Song3 created and tagged with B + C\n`);

    // TEST 1: Filter with [A] → should return song1 + song2
    console.log('📝 TEST 1: Filter with [A] (expect song1, song2)...');
    
    const filter1Response = await makeRequest(
      'POST',
      `/api/libraries/${LIBRARY_ID}/songs/filter`,
      { labelIds: [labelA.labelId] }
    );

    if (filter1Response.status !== 200) {
      throw new Error(`Expected 200, got ${filter1Response.status}`);
    }

    const result1 = filter1Response.data;
    const songIds1 = result1.songs.map(s => s.songId).sort();
    const expected1 = [song1.songId, song2.songId].sort();

    if (JSON.stringify(songIds1) !== JSON.stringify(expected1)) {
      throw new Error(`Filter [A] failed: expected [${expected1}], got [${songIds1}]`);
    }

    console.log(`✅ Filter [A] returned song1 and song2\n`);

    // TEST 2: Filter with [B] → should return song2 + song3
    console.log('📝 TEST 2: Filter with [B] (expect song2, song3)...');
    
    const filter2Response = await makeRequest(
      'POST',
      `/api/libraries/${LIBRARY_ID}/songs/filter`,
      { labelIds: [labelB.labelId] }
    );

    const result2 = filter2Response.data;
    const songIds2 = result2.songs.map(s => s.songId).sort();
    const expected2 = [song2.songId, song3.songId].sort();

    if (JSON.stringify(songIds2) !== JSON.stringify(expected2)) {
      throw new Error(`Filter [B] failed: expected [${expected2}], got [${songIds2}]`);
    }

    console.log(`✅ Filter [B] returned song2 and song3\n`);

    // TEST 3: Filter with [A, B] → should return song2 only
    console.log('📝 TEST 3: Filter with [A, B] (expect song2 only)...');
    
    const filter3Response = await makeRequest(
      'POST',
      `/api/libraries/${LIBRARY_ID}/songs/filter`,
      { labelIds: [labelA.labelId, labelB.labelId] }
    );

    const result3 = filter3Response.data;
    const songIds3 = result3.songs.map(s => s.songId);

    if (songIds3.length !== 1 || songIds3[0] !== song2.songId) {
      throw new Error(`Filter [A,B] failed: expected [${song2.songId}], got [${songIds3}]`);
    }

    console.log(`✅ Filter [A, B] returned song2 only (AND logic correct)\n`);

    // TEST 4: Filter with [S] (SUPER expands to A+B) → should return song2 only
    console.log('📝 TEST 4: Filter with [S] (SUPER expands to A+B, expect song2 only)...');
    
    const filter4Response = await makeRequest(
      'POST',
      `/api/libraries/${LIBRARY_ID}/songs/filter`,
      { labelIds: [labelS.labelId] }
    );

    const result4 = filter4Response.data;
    const songIds4 = result4.songs.map(s => s.songId);

    if (songIds4.length !== 1 || songIds4[0] !== song2.songId) {
      throw new Error(`Filter [S] failed: expected [${song2.songId}], got [${songIds4}]`);
    }

    if (result4.requiredRegularLabelIds.length !== 2) {
      throw new Error(`SUPER expansion failed: expected 2 REGULAR labels, got ${result4.requiredRegularLabelIds.length}`);
    }

    console.log(`✅ Filter [S] correctly expanded to [A, B] and returned song2\n`);

    // TEST 5: Filter with [] → should return all 3 songs
    console.log('📝 TEST 5: Filter with [] (expect all 3 songs)...');
    
    const filter5Response = await makeRequest(
      'POST',
      `/api/libraries/${LIBRARY_ID}/songs/filter`,
      { labelIds: [] }
    );

    const result5 = filter5Response.data;
    
    if (result5.requiredRegularLabelIds.length !== 0) {
      throw new Error('Empty filter should have empty requiredRegularLabelIds');
    }

    if (result5.songs.length < 3) {
      throw new Error(`Empty filter should return all songs (at least 3), got ${result5.songs.length}`);
    }

    console.log(`✅ Filter [] returned all songs\n`);

    // TEST 6: Filter with nonexistent label → should return 404
    console.log('📝 TEST 6: Filter with nonexistent label (expect 404)...');
    
    const filter6Response = await makeRequest(
      'POST',
      `/api/libraries/${LIBRARY_ID}/songs/filter`,
      { labelIds: ['nonexistent_label_12345'] }
    );

    if (filter6Response.status !== 404) {
      throw new Error(`Expected 404 for nonexistent label, got ${filter6Response.status}`);
    }

    console.log(`✅ Nonexistent label correctly returned 404\n`);

    // Cleanup
    console.log('🧹 Cleaning up test data...');
    
    // Delete songs
    for (const songId of createdIds.songs) {
      await makeRequest('DELETE', `/api/libraries/${LIBRARY_ID}/songs/${songId}`);
    }

    // Delete labels
    for (const labelId of createdIds.labels) {
      await makeRequest('DELETE', `/api/libraries/${LIBRARY_ID}/labels/${labelId}`);
    }
    
    console.log('✅ Cleanup complete\n');

    // SUCCESS
    console.log('🎉 PASS: AND filter verified successfully!\n');

  } catch (error) {
    console.error('❌ FAIL: AND filter verification failed');
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
verifyAndFilter();