/**
 * Script to add image field to submissions collection
 * Run this with: node scripts/add-image-field-to-submissions.js
 */

const PocketBase = require('pocketbase/cjs');

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';
const PB_EMAIL = process.env.PB_EMAIL;
const PB_PASSWORD = process.env.PB_PASSWORD;

async function addImageField() {
  // Validate required environment variables
  if (!PB_EMAIL || !PB_PASSWORD) {
    console.error('❌ Error: PB_EMAIL and PB_PASSWORD environment variables are required');
    console.error('   Please set them in your environment or .env file');
    process.exit(1);
  }

  const pb = new PocketBase(PB_URL);

  try {
    console.log('🔐 Authenticating...');
    await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);
    console.log('✅ Authenticated\n');

    console.log('📝 Adding image field to submissions collection...');
    
    // Get the submissions collection
    const collection = await pb.collections.getOne('submissions');
    
    // Check if image field already exists
    const imageFieldExists = collection.schema.some(field => field.name === 'image');
    
    if (imageFieldExists) {
      console.log('⚠️  Image field already exists in submissions collection');
      return;
    }

    // Add the image field
    const imageField = {
      name: 'image',
      type: 'file',
      required: false,
      options: {
        maxSelect: 1,
        maxSize: 5242880, // 5MB
        mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      },
    };

    // Add field to schema
    collection.schema.push(imageField);

    // Update the collection
    await pb.collections.update('submissions', {
      schema: collection.schema,
    });

    console.log('✅ Image field added successfully to submissions collection!');
    console.log('\nField details:');
    console.log('  - Name: image');
    console.log('  - Type: file');
    console.log('  - Required: false');
    console.log('  - Max size: 5MB');
    console.log('  - Allowed types: JPEG, PNG, WebP, GIF');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
    process.exit(1);
  }
}

// Run the script
addImageField()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

