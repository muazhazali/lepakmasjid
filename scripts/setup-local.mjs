#!/usr/bin/env node
/**
 * One-time local dev bootstrap: env files, install deps, DB migrate + seed.
 * Usage: node scripts/setup-local.mjs [--with-docker]
 */
import { copyFileSync, existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { spawnSync } from "child_process";
import { randomBytes } from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import { setTimeout as delay } from "timers/promises";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const serverDir = path.join(root, "server");
const args = new Set(process.argv.slice(2));
const withDocker = args.has("--with-docker");

function run(cmd, argv, cwd = root) {
  console.log(`\n> ${cmd} ${argv.join(" ")}`);
  const r = spawnSync(cmd, argv, { cwd, stdio: "inherit", shell: process.platform === "win32" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function hasCmd(name) {
  const r = spawnSync(process.platform === "win32" ? "where" : "which", [name], {
    stdio: "ignore",
    shell: true,
  });
  return r.status === 0;
}

function ensureEnv(src, dest, patch) {
  if (!existsSync(dest)) {
    copyFileSync(src, dest);
    console.log(`Created ${path.relative(root, dest)}`);
  }
  if (patch) {
    let text = readFileSync(dest, "utf8");
    for (const [key, value] of Object.entries(patch)) {
      const re = new RegExp(`^${key}=.*$`, "m");
      text = re.test(text) ? text.replace(re, `${key}=${value}`) : `${text.trim()}\n${key}=${value}\n`;
    }
    writeFileSync(dest, text);
  }
}

(async () => {
  console.log("LepakMasjid — local setup\n");

  const nodeMajor = parseInt(process.versions.node.split(".")[0], 10);
  if (nodeMajor < 20) {
    console.error("Node.js 20+ required. You have", process.versions.node);
    process.exit(1);
  }

  ensureEnv(path.join(root, ".env.example"), path.join(root, ".env.local"));
  ensureEnv(path.join(serverDir, ".env.example"), path.join(serverDir, ".env"), {
    DATABASE_URL: "postgresql://lepakmasjid:lepakmasjid_dev@127.0.0.1:5432/lepakmasjid",
    JWT_SECRET: randomBytes(32).toString("hex"),
    PUBLIC_URL: "http://127.0.0.1:3000",
  });

  mkdirSync(path.join(serverDir, "uploads"), { recursive: true });

  if (withDocker) {
    if (!hasCmd("docker")) {
      console.error("--with-docker: Docker not found. Install Docker or use your own Postgres.");
      process.exit(1);
    }
    run("docker", ["compose", "up", "-d", "postgres"], root);
    console.log("Waiting for PostgreSQL…");
    let ready = false;
    for (let i = 0; i < 60; i++) {
      const check = spawnSync(
        "docker",
        ["compose", "exec", "-T", "postgres", "pg_isready", "-U", "lepakmasjid", "-d", "lepakmasjid"],
        { cwd: root, stdio: "ignore" }
      );
      if (check.status === 0) {
        ready = true;
        break;
      }
      await delay(1000);
    }
    if (!ready) {
      console.error("Postgres did not become ready in time. Check: docker compose logs postgres");
      process.exit(1);
    }
  } else {
    console.log(
      "Tip: start Postgres with `pnpm db:up` (Docker) or point server/.env DATABASE_URL at your instance."
    );
  }

  run("pnpm", ["install"], root);
  run("pnpm", ["install"], serverDir);
  run("pnpm", ["migrate"], serverDir);
  run("pnpm", ["seed"], serverDir);


  console.log(`
Setup complete.

  Admin login:  admin@lepakmasjid.local / adminadmin

  Terminal 1:   pnpm dev:api
  Terminal 2:   pnpm dev:web
  Or one shot:  pnpm dev:all

  App:          http://localhost:8080
  API health:   http://localhost:8080/api/health
`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});