import dotenv from "dotenv";
import PocketBase from "pocketbase";

dotenv.config({ path: ".env.local" });
dotenv.config();

const url = process.env.POCKETBASE_URL || process.env.VITE_POCKETBASE_URL;
const email = process.env.POCKETBASE_ADMIN_EMAIL;
const password = process.env.POCKETBASE_ADMIN_PASSWORD;

if (!url || !email || !password) {
  console.error(
    "Required environment variables: POCKETBASE_URL (or VITE_POCKETBASE_URL), " +
      "POCKETBASE_ADMIN_EMAIL, and POCKETBASE_ADMIN_PASSWORD"
  );
  process.exit(1);
}

const pb = new PocketBase(url);
try {
  await pb.health.check();
  await pb.collection("_superusers").authWithPassword(email, password);
} catch (error) {
  console.error(
    "Could not connect/authenticate with PocketBase. Check that it is running " +
      "and that the admin credentials in .env.local are correct."
  );
  console.error(error?.message || error);
  process.exit(1);
}

const amenities = [
  ["wifi", "Free WiFi", "WiFi Percuma", "Wifi", 1],
  ["working_space", "Working Space", "Ruang Kerja", "Laptop", 2],
  ["library", "Library", "Perpustakaan", "BookOpen", 3],
  ["oku_access", "OKU Friendly", "Mesra OKU", "Accessibility", 4],
  ["parking", "Parking", "Tempat Letak Kereta", "Car", 5],
  ["wudhu", "Wudhu Area", "Tempat Wuduk", "Droplets", 6],
  ["women_area", "Women Section", "Ruang Wanita", "Users", 7],
  ["ac", "Air Conditioned", "Berhawa Dingin", "Wind", 8],
  ["cafe", "Café/Canteen", "Kafe/Kantin", "Coffee", 9],
  ["quran_class", "Quran Classes", "Kelas Al-Quran", "GraduationCap", 10],
];

const escapeFilter = (value) => value.replaceAll('"', '\\"');

const getOrCreate = async (collection, filter, data) => {
  try {
    return await pb.collection(collection).getFirstListItem(filter);
  } catch (error) {
    if (error?.status !== 404) throw error;
    return await pb.collection(collection).create(data);
  }
};

for (const [key, label_en, label_bm, icon, order] of amenities) {
  await getOrCreate("amenities", `key = "${escapeFilter(key)}"`, {
    key,
    label_en,
    label_bm,
    icon,
    order,
  });
}
console.log(`Amenities checked: ${amenities.length}`);

const mosques = [
  {
    name: "Masjid Negara",
    name_bm: "Masjid Negara",
    address: "Jalan Perdana, 50480 Kuala Lumpur, Malaysia",
    state: "WP Kuala Lumpur",
    lat: 3.1419,
    lng: 101.6869,
    description:
      "Malaysia's national mosque and a landmark of modern Islamic architecture.",
    description_bm:
      "Masjid kebangsaan Malaysia dan mercu tanda seni bina Islam moden.",
    status: "approved",
  },
  {
    name: "Masjid Jamek Sultan Abdul Samad",
    name_bm: "Masjid Jamek Sultan Abdul Samad",
    address: "Jalan Tun Perak, 50050 Kuala Lumpur, Malaysia",
    state: "WP Kuala Lumpur",
    lat: 3.1488,
    lng: 101.6953,
    description:
      "A historic mosque at the confluence of the Klang and Gombak rivers.",
    description_bm:
      "Masjid bersejarah di pertemuan Sungai Klang dan Sungai Gombak.",
    status: "approved",
  },
  {
    name: "Masjid Sultan Salahuddin Abdul Aziz Shah",
    name_bm: "Masjid Sultan Salahuddin Abdul Aziz Shah",
    address:
      "Persiaran Masjid, Seksyen 14, 40000 Shah Alam, Selangor, Malaysia",
    state: "Selangor",
    lat: 3.0733,
    lng: 101.5185,
    description:
      "The Blue Mosque, known for its large blue-and-silver dome and minarets.",
    description_bm:
      "Masjid Biru yang terkenal dengan kubah dan menara biru peraknya.",
    status: "approved",
  },
];

for (const mosque of mosques) {
  try {
    await pb
      .collection("mosques")
      .getFirstListItem(`name = "${mosque.name.replaceAll('"', '\\"')}"`);
    console.log(`Exists: ${mosque.name}`);
  } catch (error) {
    if (error?.status !== 404) throw error;

    const record = {
      ...mosque,
      ...(process.env.POCKETBASE_SEED_CREATED_BY
        ? { created_by: process.env.POCKETBASE_SEED_CREATED_BY }
        : {}),
    };
    await pb.collection("mosques").create(record);
    console.log(`Created: ${mosque.name}`);
  }
}

const amenityIds = new Map();
for (const [key] of amenities) {
  const record = await pb
    .collection("amenities")
    .getFirstListItem(`key = "${escapeFilter(key)}"`);
  amenityIds.set(key, record.id);
}

const mosqueAmenities = {
  "Masjid Negara": [
    "wifi",
    "oku_access",
    "parking",
    "wudhu",
    "women_area",
    "ac",
    "library",
  ],
  "Masjid Jamek Sultan Abdul Samad": ["parking", "wudhu", "women_area"],
  "Masjid Sultan Salahuddin Abdul Aziz Shah": [
    "wifi",
    "oku_access",
    "parking",
    "wudhu",
    "women_area",
    "ac",
    "library",
    "cafe",
  ],
};

for (const [mosqueName, keys] of Object.entries(mosqueAmenities)) {
  const mosque = await pb
    .collection("mosques")
    .getFirstListItem(`name = "${escapeFilter(mosqueName)}"`);

  for (const key of keys) {
    const amenityId = amenityIds.get(key);
    await getOrCreate(
      "mosque_amenities",
      `mosque_id = "${mosque.id}" && amenity_id = "${amenityId}"`,
      {
        mosque_id: mosque.id,
        amenity_id: amenityId,
        details: {},
        verified: true,
      }
    );
  }
}

const activities = [
  {
    mosque: "Masjid Negara",
    title: "Quran Study Circle",
    title_bm: "Kuliah Al-Quran",
    description: "Weekly Quran recitation and tafsir.",
    description_bm: "Bacaan dan tafsir Al-Quran mingguan.",
    type: "recurring",
    schedule_json: { day: "Saturday", time: "09:00" },
    status: "active",
  },
  {
    mosque: "Masjid Sultan Salahuddin Abdul Aziz Shah",
    title: "Islamic Lecture Series",
    title_bm: "Siri Kuliah Islam",
    description: "Weekly lectures on Islamic topics.",
    description_bm: "Kuliah mingguan tentang topik Islam.",
    type: "recurring",
    schedule_json: { day: "Wednesday", time: "20:00" },
    status: "active",
  },
];

for (const activity of activities) {
  const mosque = await pb
    .collection("mosques")
    .getFirstListItem(`name = "${escapeFilter(activity.mosque)}"`);
  await getOrCreate(
    "activities",
    `mosque_id = "${mosque.id}" && title = "${escapeFilter(activity.title)}"`,
    {
      mosque_id: mosque.id,
      title: activity.title,
      title_bm: activity.title_bm,
      description: activity.description,
      description_bm: activity.description_bm,
      type: activity.type,
      schedule_json: activity.schedule_json,
      status: activity.status,
    }
  );
}

const appAdminEmail = process.env.POCKETBASE_SEED_USER_EMAIL;
const appAdminPassword = process.env.POCKETBASE_SEED_USER_PASSWORD;
if (appAdminEmail && appAdminPassword) {
  const appAdmin = await getOrCreate(
    "users",
    `email = "${escapeFilter(appAdminEmail)}"`,
    {
      email: appAdminEmail,
      password: appAdminPassword,
      passwordConfirm: appAdminPassword,
      verified: true,
      role: "admin",
      trust_score: 100,
    }
  );
  if (appAdmin.role !== "admin" || !appAdmin.verified) {
    await pb
      .collection("users")
      .update(appAdmin.id, { role: "admin", verified: true });
  }
  console.log(`App admin ready: ${appAdminEmail}`);
} else {
  console.log(
    "Skipped app admin user. Set POCKETBASE_SEED_USER_EMAIL and " +
      "POCKETBASE_SEED_USER_PASSWORD to create one."
  );
}

console.log(
  "PocketBase seed complete: mosques, amenities, relationships, and activities checked."
);
