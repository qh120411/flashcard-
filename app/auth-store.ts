import "server-only";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import postgres from "postgres";

const SESSION_COOKIE = "wordly_session";
const SESSION_SECONDS = 60 * 60 * 24 * 30;
let initialized: Promise<void> | null = null;
let client: ReturnType<typeof postgres> | null = null;

function sqlClient() {
  if (client) return client;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL_MISSING");
  client = postgres(url, { max: 1, ssl: "require", idle_timeout: 20 });
  return client;
}

async function ensureTables() {
  const sql = sqlClient();
  initialized ??= (async () => {
    await sql`CREATE TABLE IF NOT EXISTS wordly_users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    await sql`CREATE TABLE IF NOT EXISTS wordly_sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES wordly_users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL
    )`;
    await sql`CREATE TABLE IF NOT EXISTS wordly_progress (
      user_id TEXT PRIMARY KEY REFERENCES wordly_users(id) ON DELETE CASCADE,
      ratings JSONB NOT NULL DEFAULT '{}'::jsonb,
      history JSONB NOT NULL DEFAULT '[]'::jsonb,
      start_date DATE NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
  })();
  return initialized;
}

const digest = (value: string) => createHash("sha256").update(value).digest("hex");

export async function database() {
  await ensureTables();
  return sqlClient();
}

export async function createSession(userId: string) {
  try {
    await ensureTables();
    const sql = sqlClient();
    const token = randomBytes(32).toString("base64url");
    const expires = new Date(Date.now() + SESSION_SECONDS * 1000);
    await sql`INSERT INTO wordly_sessions (token_hash, user_id, expires_at) VALUES (${digest(token)}, ${userId}, ${expires})`;
    const jar = await cookies();
    jar.set(SESSION_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: SESSION_SECONDS });
  } catch (error) {
    console.error("WORDLY_SESSION_CREATE", error);
    throw new Error("SESSION_CREATE_FAILED", { cause: error });
  }
}

export async function currentUser() {
  await ensureTables();
  const sql = sqlClient();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const [user] = await sql`SELECT u.id, u.username FROM wordly_users u JOIN wordly_sessions s ON s.user_id = u.id WHERE s.token_hash = ${digest(token)} AND s.expires_at > NOW() LIMIT 1`;
  return user ? { id: String(user.id), username: String(user.username) } : null;
}

export async function clearSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await ensureTables();
    const sql = sqlClient();
    await sql`DELETE FROM wordly_sessions WHERE token_hash = ${digest(token)}`;
  }
  jar.delete(SESSION_COOKIE);
}

export { randomUUID };
