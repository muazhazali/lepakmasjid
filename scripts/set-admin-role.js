/**
 * Set Admin Role for a User
 * 
 * This script sets the admin role for a specific user in the users collection.
 * It requires superuser authentication.
 * 
 * Usage:
 *   node scripts/set-admin-role.js [email]
 * 
 * Environment Variables:
 *   VITE_POCKETBASE_URL - PocketBase instance URL (default: https://pb.muaz.app)
 *   POCKETBASE_ADMIN_EMAIL - Admin email for authentication
 *   POCKETBASE_ADMIN_PASSWORD - Admin password for authentication
 * 
 * Or you can pass credentials via command line prompts.
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

// Create readline interface for prompts
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function authenticate(pb) {
  const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL;
  const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD;

  if (adminEmail && adminPassword) {
    console.log('🔐 Authenticating with environment variables...');
    try {
      await pb.collection('_superusers').authWithPassword(adminEmail, adminPassword);
      console.log('   ✅ Authenticated successfully\n');
      return true;
    } catch (err) {
      console.error('   ❌ Authentication failed:', err.message);
      return false;
    }
  }

  // Prompt for credentials
  console.log('🔐 Please provide PocketBase admin credentials:');
  const email = await question('   Email: ');
  const password = await question('   Password: ');
  console.log('');

  try {
    await pb.collection('_superusers').authWithPassword(email, password);
    console.log('   ✅ Authenticated successfully\n');
    return true;
  } catch (err) {
    console.error('   ❌ Authentication failed:', err.message);
    return false;
  }
}

async function setAdminRole(pb, userEmail) {
  try {
    console.log(`🔍 Looking for user: ${userEmail}...`);
    
    // Find user by email
    const user = await pb.collection('users').getFirstListItem(`email="${userEmail}"`);
    
    console.log(`   ✅ Found user: ${user.email} (ID: ${user.id})`);
    console.log(`   Current role: ${user.role || 'not set'}`);
    
    if (user.role === 'admin') {
      console.log('   ℹ️  User already has admin role');
      return { success: true, alreadyAdmin: true };
    }
    
    // Update user role to admin
    console.log('   🔄 Setting role to admin...');
    await pb.collection('users').update(user.id, {
      role: 'admin',
    });
    
    console.log('   ✅ Successfully set admin role');
    return { success: true, alreadyAdmin: false };
  } catch (err) {
    if (err.status === 404) {
      console.error(`   ❌ User with email "${userEmail}" not found`);
    } else {
      console.error('   ❌ Failed to set admin role:', err.message);
      if (err.data) {
        console.error('   Error details:', JSON.stringify(err.data, null, 2));
      }
    }
    return { success: false, error: err.message };
  }
}

async function listUsers(pb) {
  try {
    const users = await pb.collection('users').getFullList({
      sort: '-created',
    });
    
    if (users.length === 0) {
      console.log('   ℹ️  No users found');
      return [];
    }
    
    console.log(`\n📋 Found ${users.length} user(s):\n`);
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email}`);
      console.log(`      ID: ${user.id}`);
      console.log(`      Role: ${user.role || 'not set'}`);
      console.log(`      Verified: ${user.verified ? 'Yes' : 'No'}`);
      console.log('');
    });
    
    return users;
  } catch (err) {
    console.error('   ❌ Failed to list users:', err.message);
    return [];
  }
}

async function main() {
  console.log('👤 Set Admin Role for User\n');
  console.log(`📍 PocketBase URL: ${POCKETBASE_URL}\n`);

  const pb = new PocketBase(POCKETBASE_URL);
  pb.autoCancellation(false);

  // Authenticate
  const authSuccess = await authenticate(pb);
  if (!authSuccess) {
    console.error('\n❌ Authentication failed. Cannot proceed.');
    rl.close();
    process.exit(1);
  }

  // Get user email from command line or prompt
  const userEmail = process.argv[2];
  
  if (!userEmail) {
    // List available users
    const users = await listUsers(pb);
    
    if (users.length === 0) {
      console.error('\n❌ No users found. Please create a user first.');
      rl.close();
      process.exit(1);
    }
    
    // Prompt for email
    console.log('📧 Enter the email of the user to set as admin:');
    const email = await question('   Email: ');
    console.log('');
    
    const result = await setAdminRole(pb, email);
    
    if (!result.success) {
      console.error('\n❌ Failed to set admin role.');
      rl.close();
      process.exit(1);
    }
    
    if (result.alreadyAdmin) {
      console.log('\n✅ User already has admin role.');
    } else {
      console.log('\n✅ Admin role set successfully!');
      console.log('\n💡 The user can now:');
      console.log('   - View all submissions');
      console.log('   - Approve/reject submissions');
      console.log('   - View audit logs');
      console.log('   - Manage all mosques');
    }
  } else {
    const result = await setAdminRole(pb, userEmail);
    
    if (!result.success) {
      console.error('\n❌ Failed to set admin role.');
      rl.close();
      process.exit(1);
    }
    
    if (result.alreadyAdmin) {
      console.log('\n✅ User already has admin role.');
    } else {
      console.log('\n✅ Admin role set successfully!');
    }
  }

  rl.close();
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Unexpected error:', err);
    rl.close();
    process.exit(1);
  });

