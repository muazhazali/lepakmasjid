/**
 * Fix PocketBase Collection Permissions
 * 
 * This script updates collection permissions to allow public read access where needed.
 * It requires superuser authentication.
 * 
 * Usage:
 *   node scripts/fix-permissions.js
 * 
 * Environment Variables:
 *   VITE_POCKETBASE_URL - PocketBase instance URL (default: https://pb.muazhazali.me)
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

const POCKETBASE_URL = process.env.VITE_POCKETBASE_URL || 'https://pb.muazhazali.me';

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

async function updateCollectionPermissions(pb, collectionName, rules) {
  try {
    const collection = await pb.collections.getOne(collectionName);
    
    console.log(`\n📋 Updating permissions for: ${collectionName}`);
    console.log(`   Current listRule: ${collection.listRule || 'null (public)'}`);
    console.log(`   Current viewRule: ${collection.viewRule || 'null (public)'}`);
    
    await pb.collections.update(collection.id, {
      listRule: rules.listRule,
      viewRule: rules.viewRule,
      createRule: rules.createRule,
      updateRule: rules.updateRule,
      deleteRule: rules.deleteRule,
    });
    
    console.log(`   ✅ Updated permissions successfully`);
    console.log(`   New listRule: ${rules.listRule || 'null (public)'}`);
    console.log(`   New viewRule: ${rules.viewRule || 'null (public)'}`);
    
    return { success: true };
  } catch (err) {
    console.error(`   ❌ Failed to update permissions:`, err.message);
    if (err.data) {
      console.error('   Error details:', JSON.stringify(err.data, null, 2));
    }
    return { success: false, error: err.message };
  }
}

async function main() {
  console.log('🔧 Fixing PocketBase Collection Permissions\n');
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

  // Define permissions that should be public read
  const publicReadCollections = {
    amenities: {
      listRule: null, // Public read
      viewRule: null, // Public read
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""',
    },
    mosque_amenities: {
      listRule: null, // Public read
      viewRule: null, // Public read
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""',
    },
    activities: {
      listRule: null, // Public read
      viewRule: null, // Public read
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != "" && created_by = @request.auth.id',
      deleteRule: '@request.auth.id != "" && created_by = @request.auth.id',
    },
  };

  console.log('🔧 Updating collection permissions...\n');

  const results = [];
  for (const [collectionName, rules] of Object.entries(publicReadCollections)) {
    const result = await updateCollectionPermissions(pb, collectionName, rules);
    results.push({ name: collectionName, ...result });
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary\n');

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`✅ Updated: ${successful}`);
  console.log(`❌ Failed: ${failed}\n`);

  if (failed > 0) {
    console.log('Failed collections:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
    console.log('');
  }

  if (successful > 0) {
    console.log('✅ Permission updates completed!');
    console.log('\n💡 The amenities collection should now be publicly accessible.');
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

