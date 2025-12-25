/**
 * Create PocketBase Collections
 * 
 * This script creates all required collections for LepakMasjid in your PocketBase instance.
 * It requires superuser authentication.
 * 
 * Usage:
 *   node scripts/create-collections.js
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

async function getCollectionId(pb, collectionName) {
  try {
    const collection = await pb.collections.getOne(collectionName);
    return collection.id;
  } catch (err) {
    return null;
  }
}

function formatField(field, collectionIdMap) {
  if (field.type === 'relation') {
    if (field.collectionName) {
      const collectionId = collectionIdMap[field.collectionName];
      if (!collectionId) {
        return null; // Can't resolve this field yet
      }
      return {
        name: field.name,
        type: 'relation',
        required: field.required || false,
        collectionId: collectionId,
        maxSelect: field.maxSelect || 1,
        cascadeDelete: field.cascadeDelete || false,
      };
    } else if (field.collectionId) {
      // Already has collectionId
      return {
        name: field.name,
        type: 'relation',
        required: field.required || false,
        collectionId: field.collectionId,
        maxSelect: field.maxSelect || 1,
        cascadeDelete: field.cascadeDelete || false,
      };
    }
    return null;
  } else if (field.type === 'select') {
    return {
      name: field.name,
      type: 'select',
      required: field.required || false,
      values: field.values || field.options?.values || [],
      maxSelect: field.maxSelect || field.options?.maxSelect || 1,
    };
  } else {
    // For other field types
    const cleanField = { ...field };
    delete cleanField.collectionName;
    delete cleanField.options;
    return cleanField;
  }
}

async function createCollection(pb, collectionConfig, collectionIdMap) {
  const { name, type, fields, indexes, rules } = collectionConfig;

  try {
    // Check if collection already exists
    const existingId = await getCollectionId(pb, name);
    if (existingId) {
      console.log(`   ⚠️  Collection "${name}" already exists. Updating permissions...`);
      collectionIdMap[name] = existingId;
      
      // Update permissions to ensure they match expected rules
      try {
        await pb.collections.update(existingId, {
          listRule: rules.listRule,
          viewRule: rules.viewRule,
          createRule: rules.createRule,
          updateRule: rules.updateRule,
          deleteRule: rules.deleteRule,
        });
        console.log(`   ✅ Updated permissions for "${name}"`);
      } catch (updateErr) {
        console.log(`   ⚠️  Could not update permissions for "${name}": ${updateErr.message}`);
      }
      
      return { success: true, skipped: true, collectionId: existingId };
    }

    // Format fields and filter out ones that can't be resolved yet
    const resolvedFields = [];
    const pendingRelationFields = [];
    
    for (const field of fields || []) {
      const formattedField = formatField(field, collectionIdMap);
      if (formattedField) {
        resolvedFields.push(formattedField);
      } else if (field.type === 'relation' && field.collectionName) {
        // Store for later update
        pendingRelationFields.push(field);
      }
    }

    // Create collection with resolved fields
    const collectionData = {
      name,
      type: type || 'base',
      fields: resolvedFields,
      indexes: indexes || [],
      ...rules,
    };

    const collection = await pb.collections.create(collectionData);
    collectionIdMap[name] = collection.id;
    console.log(`   ✅ Created collection "${name}" (ID: ${collection.id})`);

    // If there are pending relation fields, update the collection
    if (pendingRelationFields.length > 0) {
      const updateFields = [...resolvedFields];
      for (const field of pendingRelationFields) {
        const formattedField = formatField(field, collectionIdMap);
        if (formattedField) {
          updateFields.push(formattedField);
        }
      }
      
      try {
        await pb.collections.update(collection.id, {
          fields: updateFields,
        });
        console.log(`   ✅ Updated collection "${name}" with relation fields`);
      } catch (updateErr) {
        console.log(`   ⚠️  Could not update relation fields for "${name}": ${updateErr.message}`);
      }
    }

    return { success: true, collectionId: collection.id, collection };
  } catch (err) {
    console.error(`   ❌ Failed to create collection "${name}":`, err.message);
    if (err.data) {
      console.error('   Error details:', JSON.stringify(err.data, null, 2));
    }
    return { success: false, error: err.message };
  }
}

async function main() {
  console.log('🚀 Creating PocketBase Collections\n');
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

  // Get users collection ID for relations
  let usersCollectionId;
  try {
    const usersCollection = await pb.collections.getOne('users');
    usersCollectionId = usersCollection.id;
    console.log(`📋 Found users collection: ${usersCollectionId}\n`);
  } catch (err) {
    console.error('❌ Could not find users collection. Make sure PocketBase is properly set up.');
    rl.close();
    process.exit(1);
  }

  // Map to store collection IDs as we create them
  const collectionIdMap = {
    users: usersCollectionId,
  };

  // Define all collections in dependency order
  // Collections that don't depend on others come first
  const collections = [
    {
      name: 'amenities',
      type: 'base',
      fields: [
        { name: 'key', type: 'text', required: true, unique: true },
        { name: 'label_bm', type: 'text', required: true },
        { name: 'label_en', type: 'text', required: true },
        { name: 'icon', type: 'text', required: false },
        { name: 'order', type: 'number', required: false },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_amenities_key ON amenities (key)',
      ],
      rules: {
        listRule: null, // Public read
        viewRule: null, // Public read
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""',
      },
    },
    {
      name: 'mosques',
      type: 'base',
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'name_bm', type: 'text', required: false },
        { name: 'address', type: 'text', required: true },
        { name: 'state', type: 'text', required: true },
        { name: 'lat', type: 'number', required: true },
        { name: 'lng', type: 'number', required: true },
        { name: 'description', type: 'text', required: false },
        { name: 'description_bm', type: 'text', required: false },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['pending', 'approved', 'rejected'],
          maxSelect: 1,
        },
        {
          name: 'created_by',
          type: 'relation',
          required: true,
          collectionName: 'users',
          maxSelect: 1,
        },
      ],
      indexes: [
        'CREATE INDEX idx_mosques_state ON mosques (state)',
        'CREATE INDEX idx_mosques_status ON mosques (status)',
        'CREATE INDEX idx_mosques_location ON mosques (lat, lng)',
      ],
      rules: {
        listRule: 'status = "approved" || @request.auth.id != ""',
        viewRule: 'status = "approved" || @request.auth.id != ""',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""',
      },
    },
    {
      name: 'mosque_amenities',
      type: 'base',
      fields: [
        {
          name: 'mosque_id',
          type: 'relation',
          required: true,
          collectionName: 'mosques',
          maxSelect: 1,
        },
        {
          name: 'amenity_id',
          type: 'relation',
          required: false,
          collectionName: 'amenities',
          maxSelect: 1,
        },
        {
          name: 'details',
          type: 'json',
          required: false,
        },
        {
          name: 'verified',
          type: 'bool',
          required: false,
        },
      ],
      indexes: [
        'CREATE INDEX idx_mosque_amenities_mosque ON mosque_amenities (mosque_id)',
        'CREATE INDEX idx_mosque_amenities_amenity ON mosque_amenities (amenity_id)',
      ],
      rules: {
        listRule: null, // Public read
        viewRule: null, // Public read
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""',
      },
    },
    {
      name: 'activities',
      type: 'base',
      fields: [
        {
          name: 'mosque_id',
          type: 'relation',
          required: true,
          collectionName: 'mosques',
          maxSelect: 1,
        },
        { name: 'title', type: 'text', required: true },
        { name: 'title_bm', type: 'text', required: false },
        { name: 'description', type: 'text', required: false },
        { name: 'description_bm', type: 'text', required: false },
        {
          name: 'type',
          type: 'select',
          required: true,
          values: ['one_off', 'recurring', 'fixed'],
          maxSelect: 1,
        },
        {
          name: 'schedule_json',
          type: 'json',
          required: true,
        },
        { name: 'start_date', type: 'date', required: false },
        { name: 'end_date', type: 'date', required: false },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['active', 'cancelled'],
          maxSelect: 1,
        },
        {
          name: 'created_by',
          type: 'relation',
          required: true,
          collectionName: 'users',
          maxSelect: 1,
        },
      ],
      indexes: [
        'CREATE INDEX idx_activities_mosque ON activities (mosque_id)',
        'CREATE INDEX idx_activities_status ON activities (status)',
      ],
      rules: {
        listRule: null, // Public read
        viewRule: null, // Public read
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != "" && created_by = @request.auth.id',
        deleteRule: '@request.auth.id != "" && created_by = @request.auth.id',
      },
    },
    {
      name: 'submissions',
      type: 'base',
      fields: [
        {
          name: 'type',
          type: 'select',
          required: true,
          values: ['new_mosque', 'edit_mosque'],
          maxSelect: 1,
        },
        {
          name: 'mosque_id',
          type: 'relation',
          required: false,
          collectionName: 'mosques',
          maxSelect: 1,
        },
        {
          name: 'data',
          type: 'json',
          required: true,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['pending', 'approved', 'rejected'],
          maxSelect: 1,
        },
        {
          name: 'submitted_by',
          type: 'relation',
          required: true,
          collectionName: 'users',
          maxSelect: 1,
        },
        { name: 'submitted_at', type: 'date', required: true },
        {
          name: 'reviewed_by',
          type: 'relation',
          required: false,
          collectionName: 'users',
          maxSelect: 1,
        },
        { name: 'reviewed_at', type: 'date', required: false },
        { name: 'rejection_reason', type: 'text', required: false },
      ],
      indexes: [
        'CREATE INDEX idx_submissions_status ON submissions (status)',
        'CREATE INDEX idx_submissions_submitted_by ON submissions (submitted_by)',
        'CREATE INDEX idx_submissions_submitted_at ON submissions (submitted_at)',
      ],
      rules: {
        listRule: '@request.auth.id != "" && (submitted_by = @request.auth.id || @request.auth.id != "")',
        viewRule: '@request.auth.id != "" && (submitted_by = @request.auth.id || @request.auth.id != "")',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""',
      },
    },
    {
      name: 'audit_logs',
      type: 'base',
      fields: [
        {
          name: 'actor_id',
          type: 'relation',
          required: true,
          collectionName: 'users',
          maxSelect: 1,
        },
        { name: 'action', type: 'text', required: true },
        { name: 'entity_type', type: 'text', required: true },
        { name: 'entity_id', type: 'text', required: true },
        { name: 'before', type: 'json', required: false },
        { name: 'after', type: 'json', required: false },
        { name: 'timestamp', type: 'date', required: true },
        { name: 'ip_address', type: 'text', required: false },
        { name: 'user_agent', type: 'text', required: false },
      ],
      indexes: [
        'CREATE INDEX idx_audit_logs_actor ON audit_logs (actor_id)',
        'CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type, entity_id)',
        'CREATE INDEX idx_audit_logs_timestamp ON audit_logs (timestamp)',
      ],
      rules: {
        listRule: '@request.auth.id != ""', // Admin only (should be more restrictive)
        viewRule: '@request.auth.id != ""', // Admin only
        createRule: null, // System can create
        updateRule: null, // No updates allowed
        deleteRule: '@request.auth.id != ""', // Admin only
      },
    },
  ];

  console.log('📦 Creating collections...\n');

  const results = [];
  for (const collectionConfig of collections) {
    const result = await createCollection(pb, collectionConfig, collectionIdMap);
    results.push({ name: collectionConfig.name, ...result });
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary\n');

  const successful = results.filter(r => r.success && !r.skipped).length;
  const skipped = results.filter(r => r.skipped).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`✅ Created: ${successful}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`❌ Failed: ${failed}\n`);

  if (failed > 0) {
    console.log('Failed collections:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
    console.log('');
  }

  if (successful > 0 || skipped > 0) {
    console.log('✅ Collection setup completed!');
    console.log('\n💡 Next steps:');
    console.log('   1. Verify collections in PocketBase Admin Panel');
    console.log('   2. Configure collection permissions as needed');
    console.log('   3. Run: npm run test:schema');
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
