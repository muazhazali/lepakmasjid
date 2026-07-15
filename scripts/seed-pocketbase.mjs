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
await pb.collection("_superusers").authWithPassword(email, password);

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

console.log("PocketBase seed complete: 3 mosques checked.");
