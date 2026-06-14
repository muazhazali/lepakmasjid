import "dotenv/config";
import { apiFetch } from "../../src/lib/api-client.ts";

async function main() {
  const base = process.env.SMOKE_API || "http://127.0.0.1:3000";
  const login = await fetch(`${base}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@lepakmasjid.local",
      password: "adminadmin",
    }),
  });
  const { token } = (await login.json()) as { token: string };

  const create = await fetch(`${base}/submissions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: (() => {
      const fd = new FormData();
      fd.append("type", "new_mosque");
      fd.append(
        "data",
        JSON.stringify({
          name: "Smoke Test Masjid",
          address: "1 Test St",
          state: "Selangor",
          lat: 3.1,
          lng: 101.6,
          amenities: [],
        })
      );
      return fd;
    })(),
  });
  const created = (await create.json()) as { record: { id: string } };
  console.log("created", created.record?.id);

  const approve = await fetch(
    `${base}/submissions/${created.record.id}/approve`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: "{}",
    }
  );
  const approved = await approve.json();
  console.log("approve status", approve.status, approved.record?.status);

  const mosques = await fetch(`${base}/mosques?search=Smoke`);
  const list = await mosques.json();
  console.log(
    "mosques with smoke",
    list.items?.map((m: { name: string }) => m.name)
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});