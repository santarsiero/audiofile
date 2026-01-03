import dotenv from 'dotenv';
import http from 'http';

/**
 * Phase 3 Labels CRUD Verification Script
 * 
 * Tests REGULAR and SUPER label operations:
 * 1. Create REGULAR label
 * 2. Attempt duplicate REGULAR → 409
 * 3. Create more REGULAR labels for components
 * 4. Create SUPER label with components
 * 5. Attempt SUPER with SUPER component → 400
 * 6. Replace SUPER components
 * 7. Delete REGULAR component label
 * 8. Delete SUPER label
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
 * Run full labels CRUD verification
 */
async function verifyLabelsCrud() {
  console.log('🚀 Starting Phase 3 Labels CRUD Verification...\n');

  const createdIds = {
    regular: [],
    super: [],
  };

  try {
    const timestamp = Date.now();

    // TEST 1: Create REGULAR label
    console.log('📝 TEST 1: POST create REGULAR label...');
    const regularResponse = await makeRequest(
      'POST',
      `/api/libraries/${LIBRARY_ID}/labels`,
      { name: `test_regular_${timestamp}` }
    );

    if (regularResponse.status !== 201) {
      throw new Error(`Expected 201, got ${regularResponse.status}`);
    }

    const regularLabel = regularResponse.data.label;
    createdIds.regular.push(regularLabel.labelId);
    console.log(`✅ REGULAR label created: ${regularLabel.labelId} ("${regularLabel.name}")\n`);

    // TEST 2: Attempt duplicate REGULAR
    console.log('📝 TEST 2: POST duplicate REGULAR label (expect 409)...');
    const dupResponse = await makeRequest(
      'POST',
      `/api/libraries/${LIBRARY_ID}/labels`,
      { name: regularLabel.name }
    );

    if (dupResponse.status !== 409) {
      throw new Error(`Expected 409 for duplicate, got ${dupResponse.status}`);
    }

    console.log('✅ Duplicate correctly rejected with 409\n');

    // TEST 3: Create more REGULAR labels for components
    console.log('📝 TEST 3: Create 2 more REGULAR labels for SUPER components...');
    const comp1Response = await makeRequest(
      'POST',
      `/api/libraries/${LIBRARY_ID}/labels`,
      { name: `component_1_${timestamp}` }
    );
    const comp2Response = await makeRequest(
      'POST',
      `/api/libraries/${LIBRARY_ID}/labels`,
      { name: `component_2_${timestamp}` }
    );

    const comp1 = comp1Response.data.label;
    const comp2 = comp2Response.data.label;
    createdIds.regular.push(comp1.labelId, comp2.labelId);
    console.log(`✅ Component labels created: ${comp1.labelId}, ${comp2.labelId}\n`);

    // TEST 4: Create SUPER label with components
    console.log('📝 TEST 4: POST create SUPER label with components...');
    const superResponse = await makeRequest(
      'POST',
      `/api/libraries/${LIBRARY_ID}/labels/super`,
      {
        name: `test_super_${timestamp}`,
        componentLabelIds: [comp1.labelId, comp2.labelId],
      }
    );

    if (superResponse.status !== 201) {
      throw new Error(`Expected 201, got ${superResponse.status}`);
    }

    const superLabel = superResponse.data.label;
    const components = superResponse.data.components;
    createdIds.super.push(superLabel.labelId);
    console.log(`✅ SUPER label created: ${superLabel.labelId} ("${superLabel.name}")`);
    console.log(`   Components: ${components.length} mappings\n`);

    // TEST 5: Attempt SUPER with SUPER component
    console.log('📝 TEST 5: POST SUPER with SUPER component (expect 400)...');
    const invalidSuperResponse = await makeRequest(
      'POST',
      `/api/libraries/${LIBRARY_ID}/labels/super`,
      {
        name: `invalid_super_${timestamp}`,
        componentLabelIds: [superLabel.labelId], // SUPER as component
      }
    );

    if (invalidSuperResponse.status !== 400) {
      throw new Error(`Expected 400 for SUPER component, got ${invalidSuperResponse.status}`);
    }

    console.log('✅ SUPER as component correctly rejected with 400\n');

    // TEST 6: Replace SUPER components
    console.log('📝 TEST 6: PUT replace SUPER components...');
    const replaceResponse = await makeRequest(
      'PUT',
      `/api/libraries/${LIBRARY_ID}/labels/${superLabel.labelId}/components`,
      {
        componentLabelIds: [regularLabel.labelId, comp1.labelId], // Different set
      }
    );

    if (replaceResponse.status !== 200) {
      throw new Error(`Expected 200, got ${replaceResponse.status}`);
    }

    console.log(`✅ Components replaced: ${replaceResponse.data.components.length} new mappings\n`);

    // TEST 7: Delete REGULAR component label
    console.log('📝 TEST 7: DELETE REGULAR component label...');
    const deleteRegularResponse = await makeRequest(
      'DELETE',
      `/api/libraries/${LIBRARY_ID}/labels/${comp1.labelId}`
    );

    if (deleteRegularResponse.status !== 200) {
      throw new Error(`Expected 200, got ${deleteRegularResponse.status}`);
    }

    console.log(`✅ REGULAR label deleted: ${comp1.labelId}`);
    console.log(`   Cleanup: ${deleteRegularResponse.data.deleted.songLabels} songLabels, ${deleteRegularResponse.data.deleted.superLabelComponents} superLabelComponents, ${deleteRegularResponse.data.deleted.labelModeLabels} labelModeLabels\n`);

    // Remove from cleanup list
    createdIds.regular = createdIds.regular.filter(id => id !== comp1.labelId);

    // TEST 8: Delete SUPER label
    console.log('📝 TEST 8: DELETE SUPER label...');
    const deleteSuperResponse = await makeRequest(
      'DELETE',
      `/api/libraries/${LIBRARY_ID}/labels/${superLabel.labelId}`
    );

    if (deleteSuperResponse.status !== 200) {
      throw new Error(`Expected 200, got ${deleteSuperResponse.status}`);
    }

    console.log(`✅ SUPER label deleted: ${superLabel.labelId}`);
    console.log(`   Cleanup: ${deleteSuperResponse.data.deleted.superLabelComponents} superLabelComponents, ${deleteSuperResponse.data.deleted.labelModeLabels} labelModeLabels\n`);

    // Remove from cleanup list
    createdIds.super = createdIds.super.filter(id => id !== superLabel.labelId);

    // Cleanup remaining labels
    console.log('🧹 Cleaning up remaining test labels...');
    for (const labelId of [...createdIds.regular, ...createdIds.super]) {
      await makeRequest('DELETE', `/api/libraries/${LIBRARY_ID}/labels/${labelId}`);
    }
    console.log('✅ Cleanup complete\n');

    // SUCCESS
    console.log('🎉 PASS: Labels CRUD verified successfully!\n');

  } catch (error) {
    console.error('❌ FAIL: Labels CRUD verification failed');
    console.error(`   Reason: ${error.message}\n`);

    if (error.message.includes('ECONNREFUSED')) {
      console.error('   💡 Make sure the backend server is running on port', PORT);
    }

    // Attempt cleanup
    console.log('🧹 Attempting cleanup...');
    try {
      for (const labelId of [...createdIds.regular, ...createdIds.super]) {
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
verifyLabelsCrud();