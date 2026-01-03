/**
 * Test PocketBase Connection
 * 
 * This script tests the connection to pb.muaz.app
 * Run with: node scripts/test-connection.js
 */

import PocketBase from 'pocketbase';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '../.env.local') });
config({ path: join(__dirname, '../.env') });

const POCKETBASE_URL = process.env.VITE_POCKETBASE_URL || 'https://pb.muaz.app';

console.log('🔍 Testing PocketBase Connection...\n');
console.log(`📍 URL: ${POCKETBASE_URL}\n`);

async function testConnection() {
  const pb = new PocketBase(POCKETBASE_URL);
  
  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health endpoint...');
    const health = await pb.health.check();
    console.log('   ✅ Health check passed:', health);
    
    // Test 2: Test authentication endpoint (doesn't require auth)
    console.log('\n2️⃣ Testing authentication endpoint...');
    try {
      const authMethods = await pb.collection('users').listAuthMethods();
      console.log('   ✅ Auth methods available:');
      if (authMethods.usernamePassword) {
        console.log('      - Username/Password');
      }
      if (authMethods.emailPassword) {
        console.log('      - Email/Password');
      }
      if (authMethods.authProviders && authMethods.authProviders.length > 0) {
        console.log('      - OAuth providers:', authMethods.authProviders.map(p => p.name).join(', '));
      }
    } catch (err) {
      console.log('   ⚠️  Could not fetch auth methods:', err.message);
    }
    
    // Test 3: Check if we can access collections (requires auth or admin)
    console.log('\n3️⃣ Checking collections access...');
    console.log('   ℹ️  Collection listing requires authentication.');
    console.log('   💡 To verify collections, use the schema verification script:');
    console.log('      npm run test:schema');
    console.log('   💡 Or log in to PocketBase Admin Panel to view collections.');
    
    // Test 4: Verify API is accessible
    console.log('\n4️⃣ Verifying API endpoints...');
    try {
      // Try to access a public endpoint - just verify the base URL works
      // We'll get 401/403 which is expected without auth
      await pb.collection('users').listAuthMethods();
      console.log('   ✅ API is accessible and responding');
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        console.log('   ✅ API is accessible (authentication required for some endpoints)');
      } else if (!err.status) {
        // Network or other errors
        console.log('   ⚠️  API access issue:', err.message);
      } else {
        console.log('   ✅ API is accessible');
      }
    }
    
    console.log('\n✅ Connection test completed successfully!');
    return { success: true };
    
  } catch (error) {
    console.error('\n❌ Connection test failed!');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
    if (error.status) {
      console.error('Status:', error.status);
    }
    return { success: false, error: error.message };
  }
}

testConnection()
  .then(result => {
    if (result.success) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });

