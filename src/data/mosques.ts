export interface Amenity {
  id: string;
  key: string;
  label_en: string;
  label_bm: string;
  icon: string;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  type: "one_off" | "recurring" | "fixed";
  schedule?: string;
}

export interface Mosque {
  id: string;
  name: string;
  address: string;
  state: string;
  lat: number;
  lng: number;
  description?: string;
  image?: string;
  amenities: string[];
  activities: Activity[];
  status: "pending" | "approved" | "rejected";
}

export const AMENITIES: Amenity[] = [
  {
    id: "1",
    key: "wifi",
    label_en: "Free WiFi",
    label_bm: "WiFi Percuma",
    icon: "Wifi",
  },
  {
    id: "2",
    key: "working_space",
    label_en: "Working Space",
    label_bm: "Ruang Kerja",
    icon: "Laptop",
  },
  {
    id: "3",
    key: "library",
    label_en: "Library",
    label_bm: "Perpustakaan",
    icon: "BookOpen",
  },
  {
    id: "4",
    key: "oku_access",
    label_en: "OKU Friendly",
    label_bm: "Mesra OKU",
    icon: "Accessibility",
  },
  {
    id: "5",
    key: "parking",
    label_en: "Parking",
    label_bm: "Tempat Letak Kereta",
    icon: "Car",
  },
  {
    id: "6",
    key: "wudhu",
    label_en: "Wudhu Area",
    label_bm: "Tempat Wuduk",
    icon: "Droplets",
  },
  {
    id: "7",
    key: "women_area",
    label_en: "Women Section",
    label_bm: "Ruang Wanita",
    icon: "Users",
  },
  {
    id: "8",
    key: "ac",
    label_en: "Air Conditioned",
    label_bm: "Berhawa Dingin",
    icon: "Wind",
  },
  {
    id: "9",
    key: "cafe",
    label_en: "Café/Canteen",
    label_bm: "Kafe/Kantin",
    icon: "Coffee",
  },
  {
    id: "10",
    key: "quran_class",
    label_en: "Quran Classes",
    label_bm: "Kelas Al-Quran",
    icon: "GraduationCap",
  },
];

export const STATES = [
  "Johor",
  "Kedah",
  "Kelantan",
  "Melaka",
  "Negeri Sembilan",
  "Pahang",
  "Perak",
  "Perlis",
  "Pulau Pinang",
  "Sabah",
  "Sarawak",
  "Selangor",
  "Terengganu",
  "Wilayah Persekutuan Kuala Lumpur",
  "Wilayah Persekutuan Labuan",
  "Wilayah Persekutuan Putrajaya",
];

export const MOCK_MOSQUES: Mosque[] = [
  {
    id: "1",
    name: "Masjid Negara",
    address: "Jalan Perdana, Tasik Perdana, 50480 Kuala Lumpur",
    state: "Wilayah Persekutuan Kuala Lumpur",
    lat: 3.1412,
    lng: 101.6918,
    description:
      "The National Mosque of Malaysia, an iconic landmark featuring modernist architecture with a 73-meter minaret and star-shaped roof.",
    amenities: [
      "wifi",
      "oku_access",
      "parking",
      "wudhu",
      "women_area",
      "ac",
      "library",
    ],
    activities: [
      {
        id: "1",
        title: "Friday Sermon",
        description: "Weekly Friday prayers and sermon",
        type: "recurring",
        schedule: "Every Friday 1:00 PM",
      },
      {
        id: "2",
        title: "Quran Study Circle",
        description: "Weekly Quran recitation and tafsir",
        type: "recurring",
        schedule: "Every Saturday 9:00 AM",
      },
    ],
    status: "approved",
  },
  {
    id: "2",
    name: "Masjid Sultan Salahuddin Abdul Aziz Shah",
    address: "Persiaran Masjid, Seksyen 14, 40000 Shah Alam, Selangor",
    state: "Selangor",
    lat: 3.0738,
    lng: 101.5183,
    description:
      "Also known as the Blue Mosque, it is the largest mosque in Malaysia and the second largest in Southeast Asia.",
    amenities: [
      "wifi",
      "working_space",
      "oku_access",
      "parking",
      "wudhu",
      "women_area",
      "ac",
      "library",
      "cafe",
    ],
    activities: [
      {
        id: "3",
        title: "Islamic Lecture Series",
        description: "Weekly lectures on various Islamic topics",
        type: "recurring",
        schedule: "Every Wednesday 8:00 PM",
      },
    ],
    status: "approved",
  },
  {
    id: "3",
    name: "Masjid Jamek Sultan Abdul Samad",
    address: "Jalan Tun Perak, City Centre, 50050 Kuala Lumpur",
    state: "Wilayah Persekutuan Kuala Lumpur",
    lat: 3.1492,
    lng: 101.6964,
    description:
      "One of the oldest mosques in Kuala Lumpur, built in 1909, located at the confluence of the Klang and Gombak rivers.",
    amenities: ["wudhu", "women_area", "parking"],
    activities: [],
    status: "approved",
  },
  {
    id: "4",
    name: "Masjid Putra",
    address: "Persiaran Persekutuan, Presint 1, 62502 Putrajaya",
    state: "Wilayah Persekutuan Putrajaya",
    lat: 2.9364,
    lng: 101.6933,
    description:
      "A principal mosque of Putrajaya known for its pink granite dome and lakeside location.",
    amenities: [
      "wifi",
      "oku_access",
      "parking",
      "wudhu",
      "women_area",
      "ac",
      "library",
      "quran_class",
    ],
    activities: [
      {
        id: "4",
        title: "Guided Tours",
        description: "Daily guided tours for visitors",
        type: "fixed",
        schedule: "Daily 9:00 AM - 6:00 PM",
      },
    ],
    status: "approved",
  },
  {
    id: "5",
    name: "Masjid Wilayah Persekutuan",
    address: "Jalan Duta, 50480 Kuala Lumpur",
    state: "Wilayah Persekutuan Kuala Lumpur",
    lat: 3.175,
    lng: 101.675,
    description:
      "A modern mosque inspired by the Blue Mosque in Istanbul, featuring Ottoman and Malay architectural elements.",
    amenities: [
      "wifi",
      "working_space",
      "oku_access",
      "parking",
      "wudhu",
      "women_area",
      "ac",
      "cafe",
      "quran_class",
    ],
    activities: [
      {
        id: "5",
        title: "Tahfiz Program",
        description: "Quran memorization program",
        type: "recurring",
        schedule: "Daily after Fajr",
      },
    ],
    status: "approved",
  },
  {
    id: "6",
    name: "Masjid Kapitan Keling",
    address: "Jalan Buckingham, George Town, 10200 Pulau Pinang",
    state: "Pulau Pinang",
    lat: 5.4164,
    lng: 100.34,
    description:
      "A historic mosque built in the 19th century, showcasing Moorish and Indian Muslim architectural influences.",
    amenities: ["wudhu", "women_area", "parking"],
    activities: [],
    status: "approved",
  },
];
