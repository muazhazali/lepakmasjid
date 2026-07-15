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
} catch (error) {
  console.error(
    `Cannot reach PocketBase at ${url}. Start PocketBase first, then retry.`
  );
  console.error(error?.message || error);
  process.exit(1);
}

try {
  await pb.collection("_superusers").authWithPassword(email, password);
} catch (error) {
  console.error(
    "Could not authenticate as a PocketBase superuser. " +
      "Check POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD."
  );
  console.error(error?.message || error);
  process.exit(1);
}

const rules = {
  public: "",
  authenticated: '@request.auth.id != ""',
  admin: '@request.auth.role = "admin"',
};

const text = (name, options = {}) => ({ name, type: "text", ...options });
const relation = (name, collectionId, options = {}) => ({
  name,
  type: "relation",
  collectionId,
  maxSelect: 1,
  ...options,
});
const select = (name, values, options = {}) => ({
  name,
  type: "select",
  values,
  maxSelect: 1,
  ...options,
});

const collectionDefinitions = [
  {
    name: "amenities",
    fields: [
      text("key", { required: true }),
      text("label_en", { required: true }),
      text("label_bm", { required: true }),
      text("icon"),
      { name: "order", type: "number", required: true, min: 0 },
    ],
    listRule: rules.public,
    viewRule: rules.public,
    createRule: rules.admin,
    updateRule: rules.admin,
    deleteRule: rules.admin,
  },
  {
    name: "mosques",
    fields: [
      text("name", { required: true }),
      text("name_bm"),
      text("address", { required: true }),
      text("contact"),
      text("state", { required: true }),
      { name: "lat", type: "number", required: true, min: -90, max: 90 },
      { name: "lng", type: "number", required: true, min: -180, max: 180 },
      text("description", { max: 10000 }),
      text("description_bm", { max: 10000 }),
      {
        name: "image",
        type: "file",
        maxSelect: 1,
        maxSize: 5242880,
        mimeTypes: ["image/jpeg", "image/png", "image/webp"],
      },
      select("status", ["pending", "approved", "rejected"], {
        required: true,
      }),
      { ...relation("created_by", "__users__"), required: false },
    ],
    listRule: 'status = "approved"',
    viewRule: 'status = "approved"',
    createRule: rules.authenticated,
    updateRule: rules.admin,
    deleteRule: rules.admin,
  },
  {
    name: "mosque_amenities",
    fields: [
      { ...relation("mosque_id", "__mosques__"), required: true },
      { ...relation("amenity_id", "__amenities__"), required: false },
      { name: "details", type: "json", maxSize: 20000 },
      { name: "verified", type: "bool" },
    ],
    listRule: rules.public,
    viewRule: rules.public,
    createRule: rules.authenticated,
    updateRule: rules.admin,
    deleteRule: rules.admin,
  },
  {
    name: "activities",
    fields: [
      { ...relation("mosque_id", "__mosques__"), required: true },
      text("title", { required: true }),
      text("title_bm"),
      text("description", { max: 10000 }),
      text("description_bm", { max: 10000 }),
      select("type", ["one_off", "recurring", "fixed"], {
        required: true,
      }),
      { name: "schedule_json", type: "json", maxSize: 20000 },
      { name: "start_date", type: "date", required: false },
      { name: "end_date", type: "date", required: false },
      select("status", ["active", "cancelled"], { required: true }),
      { ...relation("created_by", "__users__"), required: false },
    ],
    listRule: rules.public,
    viewRule: rules.public,
    createRule: rules.authenticated,
    updateRule: rules.admin,
    deleteRule: rules.admin,
  },
  {
    name: "submissions",
    fields: [
      select("type", ["new_mosque", "edit_mosque"], { required: true }),
      { ...relation("mosque_id", "__mosques__"), required: false },
      { name: "data", type: "json", required: true, maxSize: 100000 },
      select("status", ["pending", "approved", "rejected"], {
        required: true,
      }),
      { ...relation("submitted_by", "__users__"), required: true },
      { name: "submitted_at", type: "date", required: true },
      { ...relation("reviewed_by", "__users__"), required: false },
      { name: "reviewed_at", type: "date", required: false },
      text("rejection_reason", { max: 10000 }),
    ],
    listRule: rules.authenticated,
    viewRule: rules.authenticated,
    createRule: rules.authenticated,
    updateRule: rules.admin,
    deleteRule: rules.admin,
  },
  {
    name: "audit_logs",
    fields: [
      { ...relation("actor_id", "__users__"), required: true },
      text("action", { required: true }),
      text("entity_type", { required: true }),
      text("entity_id", { required: true }),
      { name: "before", type: "json", maxSize: 100000 },
      { name: "after", type: "json", maxSize: 100000 },
      { name: "timestamp", type: "date", required: true },
      text("ip_address"),
      text("user_agent", { max: 1000 }),
    ],
    listRule: rules.admin,
    viewRule: rules.admin,
    createRule: rules.authenticated,
    updateRule: null,
    deleteRule: rules.admin,
  },
];

const collections = await pb.collections.getFullList({ sort: "name" });
const byName = new Map(
  collections.map((collection) => [collection.name, collection])
);
const users = byName.get("users");

if (!users) {
  throw new Error("PocketBase users auth collection was not found");
}

const ids = {
  __users__: users.id,
};

for (const definition of collectionDefinitions) {
  const existing = byName.get(definition.name);
  if (existing) {
    ids[`__${definition.name}__`] = existing.id;
    console.log(`Exists: ${definition.name}`);
    continue;
  }

  const fields = definition.fields.map((field) => ({
    ...field,
    ...(field.collectionId ? { collectionId: ids[field.collectionId] } : {}),
  }));
  const created = await pb.collections.create({
    ...definition,
    fields,
    type: "base",
  });
  byName.set(created.name, created);
  ids[`__${definition.name}__`] = created.id;
  console.log(`Created: ${definition.name}`);
}

const userFields = users.fields || [];
const customUserFields = [
  select("role", ["user", "admin"]),
  { name: "trust_score", type: "number", min: 0 },
];
const missingUserFields = customUserFields.filter(
  (field) => !userFields.some((existing) => existing.name === field.name)
);

if (missingUserFields.length > 0) {
  await pb.collections.update(users.id, {
    fields: [...userFields, ...missingUserFields],
  });
  console.log(
    `Added users fields: ${missingUserFields.map((field) => field.name).join(", ")}`
  );
}

console.log("PocketBase schema setup complete.");
await import("./seed-pocketbase.mjs");
