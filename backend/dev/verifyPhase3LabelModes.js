import dotenv from 'dotenv';
import http from 'http';

/**
 * Phase 3 Label Modes Verification Script
 * 
 * Tests Label Modes (display configuration):
 * - Create REGULAR labels A, B
 * - Create SUPER label S = [A, B]
 * - Create mode
 * - Test attach idempotency (created true/false)
 * - Test get mode and list modes
 * - Test detach idempotency (count 1/0)
 * - Delete mode with cleanup
 * - Cleanup labels
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
 * Run full label modes verification
 */
async function verifyLabelModes() {
  console.log('🚀 Starting Phase 3 Label Modes Verification...\n');

  const createdIds = {
    labels: [],
    modes: [],
  };

  try {
    const timestamp = Date.now();

    // Create REGULAR labels A, B
    console.log('📝 Creating REGULAR labels A, B...');
    
    const labelAResponse = await makeRequest(
      'POST',
      `/api/libraries/${LIBRARY_ID}/labels`,
      { name: `mode_label_A_${timestamp}` }
    );
    const labelA = labelAResponse.data.label;
    createdIds.labels.push(labelA.labelId);

    const labelBResponse = await makeRequest(
      'POST',
      `/api/libraries/${LIBRARY_ID}/labels`,
      { name: `mode_label_B_${timestamp}` }
    );
    const labelB = labelBResponse.data.label;
    createdIds.labels.push(labelB.labelId);

    console.log(`✅ Created REGULAR labels A, B\n`);

    // Create SUPER label S = [A, B]
    console.log('📝 Creating SUPER label S = [A, B]...');
    
    const labelSResponse = await makeRequest(
      'POST',
      `/api/libraries/${LIBRARY_ID}/labels/super`,
      {
        name: `mode_label_S_${timestamp}`,
        componentLabelIds: [labelA.labelId, labelB.labelId],
      }
    );
    const labelS = labelSResponse.data.label;
    createdIds.labels.push(labelS.labelId);

    console.log(`✅ Created SUPER label S\n`);

    // Create mode
    console.log('📝 Creating mode "House Mode"...');
    
    const modeResponse = await makeRequest(
      'POST',
      `/api/libraries/${LIBRARY_ID}/modes`,
      { name: `House Mode ${timestamp}` }
    );

    if (modeResponse.status !== 201) {
      throw new Error(`Expected 201, got ${modeResponse.status}`);
    }

    const mode = modeResponse.data.mode;
    createdIds.modes.push(mode.modeId);

    console.log(`✅ Mode created: ${mode.modeId} ("${mode.name}")\n`);

    // TEST 1: Attach label A (should create)
    console.log('📝 TEST 1: Attach label A to mode (expect created: true)...');
    
    const attach1Response = await makeRequest(
      'POST',
      `/api/libraries/${LIBRARY_ID}/modes/${mode.modeId}/labels/${labelA.labelId}`
    );

    if (attach1Response.status !== 201) {
      throw new Error(`Expected 201, got ${attach1Response.status}`);
    }

    if (attach1Response.data.created !== true) {
      throw new Error('Expected created: true for first attach');
    }

    console.log(`✅ Label A attached (created: true)\n`);

    // TEST 2: Attach label A again (should be idempotent)
    console.log('📝 TEST 2: Attach label A again (expect created: false)...');
    
    const attach2Response = await makeRequest(
      'POST',
      `/api/libraries/${LIBRARY_ID}/modes/${mode.modeId}/labels/${labelA.labelId}`
    );

    if (attach2Response.status !== 200) {
      throw new Error(`Expected 200 for idempotent attach, got ${attach2Response.status}`);
    }

    if (attach2Response.data.created !== false) {
      throw new Error('Expected created: false for duplicate attach');
    }

    console.log(`✅ Idempotent attach returned created: false\n`);

    // TEST 3: Attach SUPER label S
    console.log('📝 TEST 3: Attach SUPER label S to mode (expect created: true)...');
    
    const attach3Response = await makeRequest(
      'POST',
      `/api/libraries/${LIBRARY_ID}/modes/${mode.modeId}/labels/${labelS.labelId}`
    );

    if (attach3Response.status !== 201) {
      throw new Error(`Expected 201, got ${attach3Response.status}`);
    }

    if (attach3Response.data.created !== true) {
      throw new Error('Expected created: true for SUPER label attach');
    }

    console.log(`✅ SUPER label S attached (created: true)\n`);

    // TEST 4: Get mode and verify joins
    console.log('📝 TEST 4: GET mode and verify 2 joins (A and S)...');
    
    const getModeResponse = await makeRequest(
      'GET',
      `/api/libraries/${LIBRARY_ID}/modes/${mode.modeId}`
    );

    if (getModeResponse.status !== 200) {
      throw new Error(`Expected 200, got ${getModeResponse.status}`);
    }

    const modeData = getModeResponse.data;
    if (modeData.modeLabels.length !== 2) {
      throw new Error(`Expected 2 modeLabels, got ${modeData.modeLabels.length}`);
    }

    const labelIds = modeData.modeLabels.map(ml => ml.labelId).sort();
    const expectedLabelIds = [labelA.labelId, labelS.labelId].sort();

    if (JSON.stringify(labelIds) !== JSON.stringify(expectedLabelIds)) {
      throw new Error(`Mode has wrong labels: expected [${expectedLabelIds}], got [${labelIds}]`);
    }

    console.log(`✅ Mode has correct 2 label joins (A and S)\n`);

    // TEST 5: List modes
    console.log('📝 TEST 5: GET list modes and verify includes created mode...');
    
    const listModesResponse = await makeRequest(
      'GET',
      `/api/libraries/${LIBRARY_ID}/modes`
    );

    if (listModesResponse.status !== 200) {
      throw new Error(`Expected 200, got ${listModesResponse.status}`);
    }

    const listData = listModesResponse.data;
    
    if (!Array.isArray(listData.modes)) {
      throw new Error('Expected modes array');
    }

    if (!Array.isArray(listData.modeLabels)) {
      throw new Error('Expected modeLabels array');
    }

    const foundMode = listData.modes.find(m => m.modeId === mode.modeId);
    if (!foundMode) {
      throw new Error('Created mode not found in list');
    }

    const modeLabelCount = listData.modeLabels.filter(ml => ml.modeId === mode.modeId).length;
    if (modeLabelCount !== 2) {
      throw new Error(`Expected 2 modeLabels for mode, got ${modeLabelCount}`);
    }

    console.log(`✅ List modes includes created mode with 2 label joins\n`);

    // TEST 6: Detach label A
    console.log('📝 TEST 6: DELETE detach label A (expect count 1)...');
    
    const detach1Response = await makeRequest(
      'DELETE',
      `/api/libraries/${LIBRARY_ID}/modes/${mode.modeId}/labels/${labelA.labelId}`
    );

    if (detach1Response.status !== 200) {
      throw new Error(`Expected 200, got ${detach1Response.status}`);
    }

    if (detach1Response.data.deletedJoinCount !== 1) {
      throw new Error(`Expected deletedJoinCount 1, got ${detach1Response.data.deletedJoinCount}`);
    }

    console.log(`✅ Label A detached (count: 1)\n`);

    // TEST 7: Detach label A again (idempotent)
    console.log('📝 TEST 7: DELETE detach label A again (expect count 0)...');
    
    const detach2Response = await makeRequest(
      'DELETE',
      `/api/libraries/${LIBRARY_ID}/modes/${mode.modeId}/labels/${labelA.labelId}`
    );

    if (detach2Response.status !== 200) {
      throw new Error(`Expected 200, got ${detach2Response.status}`);
    }

    if (detach2Response.data.deletedJoinCount !== 0) {
      throw new Error(`Expected deletedJoinCount 0, got ${detach2Response.data.deletedJoinCount}`);
    }

    console.log(`✅ Idempotent detach returned count 0\n`);

    // TEST 8: Delete mode
    console.log('📝 TEST 8: DELETE mode and verify cleanup...');
    
    const deleteModeResponse = await makeRequest(
      'DELETE',
      `/api/libraries/${LIBRARY_ID}/modes/${mode.modeId}`
    );

    if (deleteModeResponse.status !== 200) {
      throw new Error(`Expected 200, got ${deleteModeResponse.status}`);
    }

    if (deleteModeResponse.data.deletedModeId !== mode.modeId) {
      throw new Error('Wrong modeId in delete response');
    }

    if (deleteModeResponse.data.deleted.modeLabels !== 1) {
      throw new Error(`Expected 1 modeLabel cleanup, got ${deleteModeResponse.data.deleted.modeLabels}`);
    }

    console.log(`✅ Mode deleted with cleanup (1 modeLabel removed)\n`);

    // Cleanup labels
    console.log('🧹 Cleaning up labels...');
    
    // Delete SUPER first (has components)
    await makeRequest('DELETE', `/api/libraries/${LIBRARY_ID}/labels/${labelS.labelId}`);
    
    // Then delete REGULAR labels
    await makeRequest('DELETE', `/api/libraries/${LIBRARY_ID}/labels/${labelA.labelId}`);
    await makeRequest('DELETE', `/api/libraries/${LIBRARY_ID}/labels/${labelB.labelId}`);
    
    console.log('✅ Cleanup complete\n');

    // SUCCESS
    console.log('🎉 PASS: Label modes verified successfully!\n');

  } catch (error) {
    console.error('❌ FAIL: Label modes verification failed');
    console.error(`   Reason: ${error.message}\n`);

    if (error.message.includes('ECONNREFUSED')) {
      console.error('   💡 Make sure the backend server is running on port', PORT);
    }

    // Attempt cleanup
    console.log('🧹 Attempting cleanup...');
    try {
      for (const modeId of createdIds.modes) {
        await makeRequest('DELETE', `/api/libraries/${LIBRARY_ID}/modes/${modeId}`);
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
verifyLabelModes();