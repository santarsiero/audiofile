import dotenv from 'dotenv';
import http from 'http';

/**
 * Phase 3 Bootstrap Verification Script
 * 
 * Tests the GET /api/libraries/:libraryId/bootstrap endpoint
 * 
 * Requirements:
 * - Backend server must be running
 * - DEFAULT_LIBRARY_ID must exist in .env (created by Phase 2 verification)
 * 
 * Validates:
 * - Response status is 200
 * - All required keys exist
 * - Types are correct (library = object, others = arrays)
 */

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5050;
const LIBRARY_ID = process.env.DEFAULT_LIBRARY_ID;

if (!LIBRARY_ID) {
  console.error('❌ FAIL: DEFAULT_LIBRARY_ID not found in .env');
  console.error('   Run Phase 2 verification first to create test library');
  process.exit(1);
}

/**
 * Make HTTP request to bootstrap endpoint
 */
function makeRequest(libraryId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: `/api/libraries/${libraryId}/bootstrap`,
      method: 'GET',
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
          const parsedData = JSON.parse(data);
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

    req.end();
  });
}

/**
 * Validate bootstrap response structure
 */
function validateBootstrapResponse(response) {
  const requiredKeys = [
    'library',
    'songs',
    'labels',
    'songLabels',
    'superLabelComponents',
    'labelModes',
    'labelModeLabels',
  ];

  // Check status
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }

  // Check all required keys exist
  for (const key of requiredKeys) {
    if (!(key in response.data)) {
      throw new Error(`Missing required key: ${key}`);
    }
  }

  // Check types
  if (typeof response.data.library !== 'object' || Array.isArray(response.data.library)) {
    throw new Error('library must be an object');
  }

  const arrayKeys = [
    'songs',
    'labels',
    'songLabels',
    'superLabelComponents',
    'labelModes',
    'labelModeLabels',
  ];

  for (const key of arrayKeys) {
    if (!Array.isArray(response.data[key])) {
      throw new Error(`${key} must be an array, got ${typeof response.data[key]}`);
    }
  }

  // Verify library has required fields
  if (!response.data.library.libraryId) {
    throw new Error('library object missing libraryId field');
  }

  return true;
}

/**
 * Run verification
 */
async function verifyBootstrap() {
  console.log('🚀 Starting Phase 3 Bootstrap Verification...\n');
  console.log(`📡 Testing endpoint: GET http://localhost:${PORT}/api/libraries/${LIBRARY_ID}/bootstrap\n`);

  try {
    // Make request
    console.log('📝 Making bootstrap request...');
    const response = await makeRequest(LIBRARY_ID);

    // Validate response
    console.log('✅ Request successful (status 200)');
    console.log('📝 Validating response structure...');
    
    validateBootstrapResponse(response);

    // Print summary
    console.log('✅ Response structure valid\n');
    console.log('📊 Bootstrap data summary:');
    console.log(`   - Library: ${response.data.library.name} (${response.data.library.libraryId})`);
    console.log(`   - Songs: ${response.data.songs.length}`);
    console.log(`   - Labels: ${response.data.labels.length}`);
    console.log(`   - SongLabels: ${response.data.songLabels.length}`);
    console.log(`   - SuperLabelComponents: ${response.data.superLabelComponents.length}`);
    console.log(`   - LabelModes: ${response.data.labelModes.length}`);
    console.log(`   - LabelModeLabels: ${response.data.labelModeLabels.length}`);
    console.log();
    console.log('🎉 PASS: Bootstrap endpoint verified successfully!\n');

  } catch (error) {
    console.error('❌ FAIL: Bootstrap verification failed');
    console.error(`   Reason: ${error.message}\n`);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.error('   💡 Make sure the backend server is running on port', PORT);
    }
    
    process.exit(1);
  }
}

// Test 404 handling
async function verifyNotFound() {
  console.log('📝 Testing 404 handling with non-existent library...');
  
  try {
    const response = await makeRequest('nonexistent_library_id_12345');
    
    if (response.status === 404) {
      console.log('✅ PASS: 404 returned for non-existent library\n');
    } else {
      console.error(`❌ FAIL: Expected 404, got ${response.status}\n`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ FAIL: 404 test failed');
    console.error(`   Reason: ${error.message}\n`);
    process.exit(1);
  }
}

// Run all tests
(async () => {
  await verifyBootstrap();
  await verifyNotFound();
})();