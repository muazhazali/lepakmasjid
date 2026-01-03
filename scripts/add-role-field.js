/**
 * Add Role Field to Users Collection
 * 
 * This script adds a 'role' field to the PocketBase users collection.
 * It requires superuser authentication.
 * 
 * Usage:
 *   node scripts/add-role-field.js
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

async function addRoleField(pb) {
  try {
    // Get the users collection
    const usersCollection = await pb.collections.getOne('users');
    
    console.log('📋 Checking users collection...');
    
    // Check if role field already exists
    const existingRoleField = usersCollection.schema.find(field => field.name === 'role');
    
    if (existingRoleField) {
      console.log('   ℹ️  Role field already exists');
      console.log(`   Current type: ${existingRoleField.type}`);
      if (existingRoleField.options?.values) {
        console.log(`   Current values: ${existingRoleField.options.values.join(', ')}`);
      }
      
      // Check if it needs to be updated
      const needsUpdate = 
        existingRoleField.type !== 'select' ||
        !existingRoleField.options?.values?.includes('user') ||
        !existingRoleField.options?.values?.includes('admin');
      
      if (needsUpdate) {
        console.log('   🔄 Updating role field to match expected configuration...');
        
        // Update the field
        const updatedSchema = usersCollection.schema.map(field => {
          if (field.name === 'role') {
            return {
              ...field,
              type: 'select',
              required: false,
              options: {
                values: ['user', 'admin'],
                maxSelect: 1,
              },
            };
          }
          return field;
        });
        
        await pb.collections.update(usersCollection.id, {
          schema: updatedSchema,
        });
        
        console.log('   ✅ Updated role field successfully');
      } else {
        console.log('   ✅ Role field is already correctly configured');
      }
      
      return { success: true, alreadyExists: true };
    }
    
    // Add the role field
    console.log('   ➕ Adding role field...');
    
    const newField = {
      name: 'role',
      type: 'select',
      required: false,
      options: {
        values: ['user', 'admin'],
        maxSelect: 1,
      },
    };
    
    const updatedSchema = [...usersCollection.schema, newField];
    
    await pb.collections.update(usersCollection.id, {
      schema: updatedSchema,
    });
    
    console.log('   ✅ Added role field successfully');
    console.log('   📝 Field configuration:');
    console.log('      - Type: select');
    console.log('      - Values: user, admin');
    console.log('      - Default: user (when not set)');
    console.log('      - Required: false');
    
    return { success: true, alreadyExists: false };
  } catch (err) {
    console.error('   ❌ Failed to add role field:', err.message);
    if (err.data) {
      console.error('   Error details:', JSON.stringify(err.data, null, 2));
    }
    return { success: false, error: err.message };
  }
}

async function setDefaultRoleForExistingUsers(pb) {
  try {
    console.log('\n📝 Setting default role for existing users...');
    
    // Get all users without a role
    const usersWithoutRole = await pb.collection('users').getFullList({
      filter: 'role = "" || role = null',
    });
    
    if (usersWithoutRole.length === 0) {
      console.log('   ℹ️  All users already have a role assigned');
      return { success: true, updated: 0 };
    }
    
    console.log(`   Found ${usersWithoutRole.length} user(s) without role`);
    
    let updated = 0;
    for (const user of usersWithoutRole) {
      try {
        await pb.collection('users').update(user.id, {
          role: 'user',
        });
        updated++;
      } catch (err) {
        console.log(`   ⚠️  Could not update user ${user.id}: ${err.message}`);
      }
    }
    
    console.log(`   ✅ Set default role 'user' for ${updated} user(s)`);
    return { success: true, updated };
  } catch (err) {
    console.error('   ⚠️  Could not set default roles:', err.message);
    return { success: false, error: err.message };
  }
}

async function main() {
  console.log('🔧 Adding Role Field to Users Collection\n');
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

  // Add role field
  const result = await addRoleField(pb);
  
  if (!result.success) {
    console.error('\n❌ Failed to add role field.');
    rl.close();
    process.exit(1);
  }

  // Set default role for existing users
  await setDefaultRoleForExistingUsers(pb);

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary\n');
  
  if (result.alreadyExists) {
    console.log('✅ Role field already exists and is properly configured');
  } else {
    console.log('✅ Role field added successfully');
  }
  
  console.log('\n💡 Next steps:');
  console.log('   1. Set admin role for your user account:');
  console.log('      - Go to PocketBase Admin Panel');
  console.log('      - Navigate to Collections > users');
  console.log('      - Edit your user record');
  console.log('      - Set role to "admin"');
  console.log('   2. Or use this command to set admin role:');
  console.log('      node scripts/set-admin-role.js');
  console.log('   3. Verify permissions work correctly by running:');
  console.log('      node scripts/fix-permissions.js');

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

