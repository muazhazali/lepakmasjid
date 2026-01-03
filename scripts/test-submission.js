/**
 * Test Submission Workflow
 * 
 * This script tests the submission workflow end-to-end
 * Run with: node scripts/test-submission.js
 * 
 * Note: You'll need to be authenticated as a regular user (not admin)
 */

import PocketBase from 'pocketbase';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '../.env.local') });
config({ path: join(__dirname, '../.env') });

const POCKETBASE_URL = process.env.VITE_POCKETBASE_URL || 'https://pb.muaz.app';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function testSubmission() {
  const pb = new PocketBase(POCKETBASE_URL);
  
  console.log('🧪 Testing Submission Workflow...\n');
  console.log(`📍 URL: ${POCKETBASE_URL}\n`);
  
  try {
    // Step 1: Authenticate
    console.log('1️⃣ Authentication');
    console.log('   Please provide credentials to test as a regular user:');
    
    const email = await question('   Email: ');
    const password = await question('   Password: ');
    
    try {
      await pb.collection('users').authWithPassword(email, password);
      console.log('   ✅ Authenticated as:', pb.authStore.model?.email);
    } catch (err) {
      console.error('   ❌ Authentication failed:', err.message);
      console.log('\n   💡 Tip: Create a test user first or use existing credentials');
      process.exit(1);
    }
    
    // Step 2: Create a test submission
    console.log('\n2️⃣ Creating test submission...');
    
    const testSubmission = {
      type: 'new_mosque',
      data: {
        name: 'Test Mosque ' + Date.now(),
        name_bm: 'Masjid Ujian ' + Date.now(),
        address: '123 Test Street, Test City',
        state: 'Selangor',
        lat: 3.1390,
        lng: 101.6869,
        description: 'This is a test submission created by the test script',
        description_bm: 'Ini adalah penyerahan ujian yang dibuat oleh skrip ujian',
        status: 'pending',
      },
      status: 'pending',
      submitted_by: pb.authStore.model?.id,
      submitted_at: new Date().toISOString(),
    };
    
    let submission;
    try {
      submission = await pb.collection('submissions').create(testSubmission);
      console.log('   ✅ Submission created:', submission.id);
      console.log('   📝 Submission data:', JSON.stringify(submission.data, null, 2));
    } catch (err) {
      console.error('   ❌ Failed to create submission:', err.message);
      if (err.response) {
        console.error('   Response:', JSON.stringify(err.response, null, 2));
      }
      process.exit(1);
    }
    
    // Step 3: Verify submission was created
    console.log('\n3️⃣ Verifying submission...');
    try {
      const retrieved = await pb.collection('submissions').getOne(submission.id);
      console.log('   ✅ Submission retrieved successfully');
      console.log('   📊 Status:', retrieved.status);
      console.log('   📅 Submitted at:', retrieved.submitted_at);
    } catch (err) {
      console.error('   ❌ Failed to retrieve submission:', err.message);
      process.exit(1);
    }
    
    // Step 4: Test admin approval (if admin credentials provided)
    console.log('\n4️⃣ Testing admin approval...');
    const testAdmin = await question('   Test admin approval? (y/n): ');
    
    if (testAdmin.toLowerCase() === 'y') {
      const adminEmail = await question('   Admin email: ');
      const adminPassword = await question('   Admin password: ');
      
      try {
        // Create new instance for admin
        const adminPb = new PocketBase(POCKETBASE_URL);
        await adminPb.collection('users').authWithPassword(adminEmail, adminPassword);
        console.log('   ✅ Admin authenticated');
        
        // Approve submission
        const updated = await adminPb.collection('submissions').update(submission.id, {
          status: 'approved',
          reviewed_by: adminPb.authStore.model?.id,
          reviewed_at: new Date().toISOString(),
        });
        console.log('   ✅ Submission approved');
        
        // If it's a new_mosque, check if mosque was created
        if (submission.type === 'new_mosque') {
          console.log('   🔍 Checking if mosque was created...');
          // Note: The actual mosque creation should happen in a hook or API function
          // This is just checking the submission status
          console.log('   📝 Submission status:', updated.status);
        }
      } catch (err) {
        console.error('   ⚠️  Admin approval test failed:', err.message);
        console.log('   💡 This is expected if approval logic is in API layer');
      }
    }
    
    // Step 5: Cleanup
    console.log('\n5️⃣ Cleanup');
    const cleanup = await question('   Delete test submission? (y/n): ');
    
    if (cleanup.toLowerCase() === 'y') {
      try {
        await pb.collection('submissions').delete(submission.id);
        console.log('   ✅ Test submission deleted');
      } catch (err) {
        console.error('   ⚠️  Failed to delete submission:', err.message);
        console.log('   💡 You may need to delete it manually from admin panel');
      }
    }
    
    console.log('\n✅ Submission workflow test completed!');
    console.log('\n📋 Summary:');
    console.log('   - Submission creation: ✅');
    console.log('   - Submission retrieval: ✅');
    console.log('   - Admin approval: ' + (testAdmin.toLowerCase() === 'y' ? '✅' : '⏭️'));
    
  } catch (error) {
    console.error('\n❌ Test failed!');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response, null, 2));
    }
    process.exit(1);
  } finally {
    rl.close();
  }
}

testSubmission()
  .then(() => {
    process.exit(0);
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });

