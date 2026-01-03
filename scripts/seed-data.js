/**
 * Seed Sample Data for LepakMasjid
 * 
 * This script seeds the PocketBase database with sample mosque data.
 * It requires superuser authentication.
 * 
 * Usage:
 *   node scripts/seed-data.js
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

// Sample amenities data
const SAMPLE_AMENITIES = [
  { key: 'wifi', label_en: 'Free WiFi', label_bm: 'WiFi Percuma', icon: 'wifi', order: 1 },
  { key: 'working_space', label_en: 'Working Space', label_bm: 'Ruang Kerja', icon: 'laptop', order: 2 },
  { key: 'library', label_en: 'Library', label_bm: 'Perpustakaan', icon: 'book', order: 3 },
  { key: 'oku_access', label_en: 'OKU Friendly', label_bm: 'Mesra OKU', icon: 'accessibility', order: 4 },
  { key: 'parking', label_en: 'Parking', label_bm: 'Tempat Letak Kereta', icon: 'car', order: 5 },
  { key: 'wudhu', label_en: 'Wudhu Area', label_bm: 'Tempat Wuduk', icon: 'droplet', order: 6 },
  { key: 'women_area', label_en: 'Women Section', label_bm: 'Ruang Wanita', icon: 'users', order: 7 },
  { key: 'ac', label_en: 'Air Conditioned', label_bm: 'Berhawa Dingin', icon: 'wind', order: 8 },
  { key: 'cafe', label_en: 'Café/Canteen', label_bm: 'Kafe/Kantin', icon: 'utensils', order: 9 },
  { key: 'quran_class', label_en: 'Quran Classes', label_bm: 'Kelas Al-Quran', icon: 'graduation-cap', order: 10 },
];

// Sample mosques data - 10 mosques from different Malaysian states
const SAMPLE_MOSQUES = [
  {
    name: 'Masjid Negara',
    name_bm: 'Masjid Negara',
    address: 'Jalan Perdana, Tasik Perdana, 50480 Kuala Lumpur',
    state: 'WP Kuala Lumpur',
    lat: 3.1412,
    lng: 101.6918,
    description: 'The National Mosque of Malaysia, an iconic landmark featuring modernist architecture with a 73-meter minaret and star-shaped roof. A symbol of Islamic faith and Malaysian identity.',
    description_bm: 'Masjid Negara Malaysia, mercu tanda ikonik dengan seni bina moden yang menampilkan menara setinggi 73 meter dan bumbung berbentuk bintang. Simbol keimanan Islam dan identiti Malaysia.',
    status: 'approved',
    amenity_keys: ['wifi', 'oku_access', 'parking', 'wudhu', 'women_area', 'ac', 'library'],
  },
  {
    name: 'Masjid Sultan Salahuddin Abdul Aziz Shah',
    name_bm: 'Masjid Sultan Salahuddin Abdul Aziz Shah',
    address: 'Persiaran Masjid, Seksyen 14, 40000 Shah Alam, Selangor',
    state: 'Selangor',
    lat: 3.0738,
    lng: 101.5183,
    description: 'Also known as the Blue Mosque, it is the largest mosque in Malaysia and the second largest in Southeast Asia. Features stunning blue and silver domes.',
    description_bm: 'Juga dikenali sebagai Masjid Biru, ia adalah masjid terbesar di Malaysia dan kedua terbesar di Asia Tenggara. Menampilkan kubah biru dan perak yang menakjubkan.',
    status: 'approved',
    amenity_keys: ['wifi', 'working_space', 'oku_access', 'parking', 'wudhu', 'women_area', 'ac', 'library', 'cafe'],
  },
  {
    name: 'Masjid Jamek Sultan Abdul Samad',
    name_bm: 'Masjid Jamek Sultan Abdul Samad',
    address: 'Jalan Tun Perak, City Centre, 50050 Kuala Lumpur',
    state: 'WP Kuala Lumpur',
    lat: 3.1492,
    lng: 101.6964,
    description: 'One of the oldest mosques in Kuala Lumpur, built in 1909, located at the confluence of the Klang and Gombak rivers. Features Moorish and Mughal architectural styles.',
    description_bm: 'Salah satu masjid tertua di Kuala Lumpur, dibina pada tahun 1909, terletak di pertemuan Sungai Klang dan Sungai Gombak. Menampilkan gaya seni bina Moorish dan Mughal.',
    status: 'approved',
    amenity_keys: ['wudhu', 'women_area', 'parking'],
  },
  {
    name: 'Masjid Putra',
    name_bm: 'Masjid Putra',
    address: 'Persiaran Persekutuan, Presint 1, 62502 Putrajaya',
    state: 'WP Putrajaya',
    lat: 2.9364,
    lng: 101.6933,
    description: 'A principal mosque of Putrajaya known for its pink granite dome and lakeside location. Can accommodate up to 15,000 worshippers.',
    description_bm: 'Masjid utama Putrajaya yang terkenal dengan kubah granit merah jambu dan lokasinya di tepi tasik. Boleh menampung sehingga 15,000 jemaah.',
    status: 'approved',
    amenity_keys: ['wifi', 'oku_access', 'parking', 'wudhu', 'women_area', 'ac', 'library', 'quran_class'],
  },
  {
    name: 'Masjid Wilayah Persekutuan',
    name_bm: 'Masjid Wilayah Persekutuan',
    address: 'Jalan Duta, 50480 Kuala Lumpur',
    state: 'WP Kuala Lumpur',
    lat: 3.1750,
    lng: 101.6750,
    description: 'A modern mosque inspired by the Blue Mosque in Istanbul, featuring Ottoman and Malay architectural elements. Known for its beautiful blue domes.',
    description_bm: 'Masjid moden yang diilhamkan oleh Masjid Biru di Istanbul, menampilkan elemen seni bina Uthmaniyyah dan Melayu. Dikenali dengan kubah birunya yang cantik.',
    status: 'approved',
    amenity_keys: ['wifi', 'working_space', 'oku_access', 'parking', 'wudhu', 'women_area', 'ac', 'cafe', 'quran_class'],
  },
  {
    name: 'Masjid Kapitan Keling',
    name_bm: 'Masjid Kapitan Keling',
    address: 'Jalan Buckingham, George Town, 10200 Pulau Pinang',
    state: 'Penang',
    lat: 5.4164,
    lng: 100.3400,
    description: 'A historic mosque built in the 19th century, showcasing Moorish and Indian Muslim architectural influences. Part of George Town UNESCO World Heritage Site.',
    description_bm: 'Masjid bersejarah yang dibina pada abad ke-19, mempamerkan pengaruh seni bina Moorish dan Muslim India. Sebahagian daripada Tapak Warisan Dunia UNESCO George Town.',
    status: 'approved',
    amenity_keys: ['wudhu', 'women_area', 'parking'],
  },
  {
    name: 'Masjid Sultan Abu Bakar',
    name_bm: 'Masjid Sultan Abu Bakar',
    address: 'Jalan Skudai, 80000 Johor Bahru, Johor',
    state: 'Johor',
    lat: 1.4564,
    lng: 103.7614,
    description: 'A beautiful mosque overlooking the Straits of Johor, built in 1900. Features Victorian and Moorish architectural styles with four minarets.',
    description_bm: 'Masjid yang cantik menghadap Selat Johor, dibina pada tahun 1900. Menampilkan gaya seni bina Victoria dan Moorish dengan empat menara.',
    status: 'approved',
    amenity_keys: ['parking', 'wudhu', 'women_area', 'ac', 'library'],
  },
  {
    name: 'Masjid Ubudiah',
    name_bm: 'Masjid Ubudiah',
    address: 'Bukit Chandan, 33000 Kuala Kangsar, Perak',
    state: 'Perak',
    lat: 4.7756,
    lng: 100.9383,
    description: 'One of the most beautiful mosques in Malaysia, built in 1917. Features golden domes and stunning architecture, located in the royal town of Kuala Kangsar.',
    description_bm: 'Salah satu masjid tercantik di Malaysia, dibina pada tahun 1917. Menampilkan kubah emas dan seni bina yang menakjubkan, terletak di bandar diraja Kuala Kangsar.',
    status: 'approved',
    amenity_keys: ['parking', 'wudhu', 'women_area', 'ac', 'quran_class'],
  },
  {
    name: 'Masjid Zahir',
    name_bm: 'Masjid Zahir',
    address: 'Jalan Kampung Masjid, 05000 Alor Setar, Kedah',
    state: 'Kedah',
    lat: 6.1254,
    lng: 100.3672,
    description: 'One of the oldest mosques in Malaysia, built in 1912. Features black domes and beautiful Islamic calligraphy. Located in the heart of Alor Setar.',
    description_bm: 'Salah satu masjid tertua di Malaysia, dibina pada tahun 1912. Menampilkan kubah hitam dan seni khat Islam yang cantik. Terletak di tengah-tengah Alor Setar.',
    status: 'approved',
    amenity_keys: ['parking', 'wudhu', 'women_area', 'library', 'quran_class'],
  },
  {
    name: 'Masjid Kristal',
    name_bm: 'Masjid Kristal',
    address: 'Pulau Wan Man, 21000 Kuala Terengganu, Terengganu',
    state: 'Terengganu',
    lat: 5.3296,
    lng: 103.1371,
    description: 'A stunning modern mosque made of steel, glass, and crystal, built on an artificial island. Features beautiful lighting that makes it glow at night.',
    description_bm: 'Masjid moden yang menakjubkan diperbuat daripada keluli, kaca, dan kristal, dibina di atas pulau buatan. Menampilkan pencahayaan yang cantik yang membuatkannya bercahaya pada waktu malam.',
    status: 'approved',
    amenity_keys: ['wifi', 'parking', 'wudhu', 'women_area', 'ac', 'library', 'cafe', 'quran_class'],
  },
];

async function ensureAmenities(pb) {
  console.log('📦 Ensuring amenities exist...\n');
  
  const amenityMap = {};
  
  for (const amenity of SAMPLE_AMENITIES) {
    try {
      // Check if amenity exists
      const existing = await pb.collection('amenities').getFirstListItem(`key="${amenity.key}"`);
      amenityMap[amenity.key] = existing.id;
      console.log(`   ✅ Amenity "${amenity.key}" already exists`);
    } catch (err) {
      // Create if doesn't exist
      try {
        const created = await pb.collection('amenities').create(amenity);
        amenityMap[amenity.key] = created.id;
        console.log(`   ✅ Created amenity "${amenity.key}"`);
      } catch (createErr) {
        console.error(`   ❌ Failed to create amenity "${amenity.key}":`, createErr.message);
      }
    }
  }
  
  console.log('');
  return amenityMap;
}

async function getOrCreateAdminUser(pb) {
  // Try to find an admin user first
  try {
    const adminUsers = await pb.collection('users').getList(1, 1, {
      filter: 'role = "admin"',
    });
    
    if (adminUsers.items.length > 0) {
      console.log(`   ✅ Found admin user: ${adminUsers.items[0].email || adminUsers.items[0].id}`);
      return adminUsers.items[0].id;
    }
  } catch (err) {
    // Continue to try other options
  }
  
  // Try to find a user by the superuser's email (in case admin has a user account)
  try {
    const superuserEmail = pb.authStore.model?.email;
    if (superuserEmail) {
      const userByEmail = await pb.collection('users').getFirstListItem(`email="${superuserEmail}"`);
      console.log(`   ✅ Found user matching superuser email: ${superuserEmail}`);
      return userByEmail.id;
    }
  } catch (err) {
    // No matching user found, continue
  }
  
  // Try to find any user in the users collection
  try {
    const users = await pb.collection('users').getList(1, 1);
    if (users.items.length > 0) {
      console.log(`   ✅ Found user: ${users.items[0].email || users.items[0].id}`);
      return users.items[0].id;
    }
  } catch (err) {
    // No users found, will create one
  }
  
  // If no users exist, create a system user for seeding
  console.log('   ℹ️  No users found in users collection. Creating system user...');
  try {
    const systemUserEmail = `seed-${Date.now()}@system.lepakmasjid.app`;
    const randomPassword = `Seed${Date.now()}${Math.random().toString(36).slice(2, 15)}`;
    
    // Create a system user (as superuser, we can create users directly)
    const systemUser = await pb.collection('users').create({
      email: systemUserEmail,
      emailVisibility: false,
      password: randomPassword,
      passwordConfirm: randomPassword,
      verified: true,
    });
    
    // Try to set role if the field exists
    try {
      await pb.collection('users').update(systemUser.id, {
        role: 'admin',
      });
    } catch (roleErr) {
      // Role field might not exist, that's okay
    }
    
    console.log(`   ✅ Created system user: ${systemUserEmail}`);
    return systemUser.id;
  } catch (err) {
    console.error('   ❌ Failed to create system user:', err.message);
    if (err.data) {
      console.error('   Error details:', JSON.stringify(err.data, null, 2));
    }
    console.error('   💡 Please create at least one user in the users collection manually');
    return null;
  }
}

async function seedMosques(pb, amenityMap, createdByUserId) {
  console.log('🕌 Seeding mosques...\n');
  
  const createdMosques = [];
  
  for (const mosque of SAMPLE_MOSQUES) {
    try {
      // Check if mosque already exists (by name and address)
      const existing = await pb.collection('mosques').getFirstListItem(
        `name="${mosque.name}" && address="${mosque.address}"`
      );
      console.log(`   ⏭️  Mosque "${mosque.name}" already exists, skipping...`);
      createdMosques.push({ mosque: existing, created: false });
    } catch (err) {
      // Create new mosque
      try {
        const mosqueData = {
          ...mosque,
          created_by: createdByUserId,
        };
        
        const created = await pb.collection('mosques').create(mosqueData);
        console.log(`   ✅ Created mosque "${mosque.name}" (${mosque.state})`);
        createdMosques.push({ mosque: created, created: true });
        
        // Create mosque_amenities relationships
        if (mosque.amenity_keys && mosque.amenity_keys.length > 0) {
          for (const amenityKey of mosque.amenity_keys) {
            const amenityId = amenityMap[amenityKey];
            if (amenityId) {
              try {
                await pb.collection('mosque_amenities').create({
                  mosque_id: created.id,
                  amenity_id: amenityId,
                  details: {},
                  verified: true,
                });
              } catch (amenityErr) {
                console.log(`      ⚠️  Could not link amenity "${amenityKey}":`, amenityErr.message);
              }
            }
          }
          console.log(`      ✅ Linked ${mosque.amenity_keys.length} amenities`);
        }
      } catch (createErr) {
        console.error(`   ❌ Failed to create mosque "${mosque.name}":`, createErr.message);
        if (createErr.data) {
          console.error('      Error details:', JSON.stringify(createErr.data, null, 2));
        }
      }
    }
  }
  
  console.log('');
  return createdMosques;
}

async function main() {
  console.log('🌱 Seeding Sample Data for LepakMasjid\n');
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

  // Ensure amenities exist
  const amenityMap = await ensureAmenities(pb);

  // Get or create admin user for created_by field
  const createdByUserId = await getOrCreateAdminUser(pb);
  if (!createdByUserId) {
    console.error('\n❌ Could not find or create a user for created_by field.');
    console.error('   Please ensure at least one user exists in the database.');
    rl.close();
    process.exit(1);
  }
  console.log(`👤 Using user ID "${createdByUserId}" for created_by field\n`);

  // Seed mosques
  const results = await seedMosques(pb, amenityMap, createdByUserId);

  // Summary
  console.log('='.repeat(50));
  console.log('📊 Summary\n');

  const created = results.filter(r => r.created).length;
  const skipped = results.filter(r => !r.created).length;

  console.log(`✅ Created: ${created} mosques`);
  console.log(`⏭️  Skipped: ${skipped} mosques (already exist)`);
  console.log(`📦 Amenities: ${Object.keys(amenityMap).length} available\n`);

  if (created > 0) {
    console.log('✅ Data seeding completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Verify data in PocketBase Admin Panel');
    console.log('   2. Check that mosques are visible in the app');
    console.log('   3. Test search and filter functionality');
  } else {
    console.log('ℹ️  All mosques already exist in the database.');
  }

  rl.close();
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Unexpected error:', err);
    if (err.response) {
      console.error('Response:', JSON.stringify(err.response, null, 2));
    }
    rl.close();
    process.exit(1);
  });

