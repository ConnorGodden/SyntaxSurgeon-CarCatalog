import "server-only";

import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import { stringifyCsv, parseCsvText } from "../utils/csv";
import { USER_ROLES, type UserRecord, type UserRole } from "../types/user";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_CSV_PATH = path.join(DATA_DIR, "users.csv");
const USERS_BLOB_PATH = "data/users.csv";

const USER_HEADERS = ["id", "fullName", "email", "password", "role", "createdAt", "isActive"] as const;

//#region Vercel Blob Storage Helpers
function isVercelRuntime(): boolean {
  return process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);
}
type VercelBlobModule = {
  put: (
    pathname: string,
    body: string,
    options: {
      access: "public";
      addRandomSuffix: boolean;
      allowOverwrite: boolean;
      contentType: string;
    },
  ) => Promise<unknown>;
  list: (options: { prefix: string; limit: number }) => Promise<{
    blobs: Array<{ pathname: string; url: string }>;
  }>;
};
async function loadVercelBlobModule(): Promise<VercelBlobModule> {
  try {
    const blobModuleSpecifier = "@vercel/blob";
    const mod = (await import(blobModuleSpecifier)) as Partial<VercelBlobModule>;

    if (typeof mod.put !== "function" || typeof mod.list !== "function") {
      throw new Error("Invalid @vercel/blob exports.");
    }

    return mod as VercelBlobModule;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Vercel Blob storage is configured, but @vercel/blob is not available at runtime. ${message}`);
  }
}
//#endregion

export const SEEDED_USERS: UserRecord[] = [
  {
    id: "seed-consumer-001",
    fullName: "Casey Consumer",
    email: "consumer@carcatalog.local",
    password: "consumer123",
    role: "consumer",
    createdAt: "2026-03-21T00:00:00.000Z",
    isActive: true,
  },
  {
    id: "seed-dealer-001",
    fullName: "Dana Dealer",
    email: "dealer@carcatalog.local",
    password: "dealer123",
    role: "dealer",
    createdAt: "2026-03-21T00:00:00.000Z",
    isActive: true,
  },
  {
    id: "seed-admin-001",
    fullName: "Alex Admin",
    email: "admin@carcatalog.local",
    password: "admin123",
    role: "admin",
    createdAt: "2026-03-21T00:00:00.000Z",
    isActive: true,
  },
];

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isSupportedRole(role: string): role is UserRole {
  return USER_ROLES.includes(role as UserRole);
}

function parseBoolean(value: string): boolean | null {
  const normalized = value.trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return null;
}

function validateUserRow(row: Record<string, string>, rowNumber: number): UserRecord | null {
  const id = row.id?.trim();
  const fullName = row.fullName?.trim();
  const email = normalizeEmail(row.email ?? "");
  const password = row.password?.trim();
  const role = row.role?.trim().toLowerCase() ?? "";
  const createdAt = row.createdAt?.trim();
  const isActive = parseBoolean(row.isActive ?? "");

  if (!id || !fullName || !email || !password || !createdAt || isActive === null) {
    return null;
  }

  if (!isSupportedRole(role)) {
    return null;
  }

  if (Number.isNaN(Date.parse(createdAt))) {
    return null;
  }

  return {
    id,
    fullName,
    email,
    password,
    role,
    createdAt,
    isActive,
  };
}

async function writeUsers(users: UserRecord[]): Promise<void> {
  const content = stringifyCsv([...USER_HEADERS], users.map((user) => ({
    ...user,
    isActive: user.isActive ? "true" : "false",
  })));

  if (isVercelRuntime()) {
    const { put } = await loadVercelBlobModule();
    await put(USERS_BLOB_PATH, `${content}\n`, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "text/csv",
    });
    return;
  }

  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(USERS_CSV_PATH, `${content}\n`, "utf8");
}

async function readUsersCsv(): Promise<string> {
  if (!isVercelRuntime()) {
    return readFile(USERS_CSV_PATH, "utf8");
  }

  const { list } = await loadVercelBlobModule();
  const { blobs } = await list({ prefix: USERS_BLOB_PATH, limit: 1000 });
  const usersBlob = blobs.find((blob) => blob.pathname === USERS_BLOB_PATH);

  if (!usersBlob) {
    const error = new Error("Users CSV blob not found.");
    (error as NodeJS.ErrnoException).code = "ENOENT";
    throw error;
  }

  const response = await fetch(usersBlob.url);
  if (!response.ok) {
    throw new Error(`Failed to read users blob: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

export async function ensureUsersSeeded(): Promise<void> {
  if (!isVercelRuntime()) {
    await mkdir(DATA_DIR, { recursive: true });
  }

  try {
    await readUsersCsv();
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code !== "ENOENT") {
      throw error;
    }
    await writeUsers(SEEDED_USERS);
  }
}

export async function readUsers(): Promise<{ users: UserRecord[]; malformedRows: number }> {
  await ensureUsersSeeded();
  const raw = await readUsersCsv();
  const parsed = parseCsvText(raw);

  const users: UserRecord[] = [];
  let malformedRows = parsed.malformedRowCount;

  for (let i = 0; i < parsed.rows.length; i += 1) {
    const user = validateUserRow(parsed.rows[i], i + 2);
    if (!user) {
      malformedRows += 1;
      continue;
    }
    users.push(user);
  }

  return { users, malformedRows };
}

export async function createUser(input: {
  fullName: string;
  email: string;
  password: string;
}): Promise<UserRecord> {
  const fullName = input.fullName.trim();
  const email = normalizeEmail(input.email);
  const password = input.password.trim();

  if (!fullName || !email || !password) {
    throw new Error("Full name, email, and password are required.");
  }

  const { users } = await readUsers();
  const emailMatches = users.filter((user) => user.email === email);
  if (emailMatches.length > 0) {
    throw new Error("An account with that email already exists.");
  }

  const id = `user-${randomUUID()}`;
  if (!/^user-[a-f0-9-]+$/i.test(id)) {
    throw new Error("Failed to generate a valid user id.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user: UserRecord = {
    id,
    fullName,
    email,
    password: hashedPassword,
    role: "consumer",
    createdAt: new Date().toISOString(),
    isActive: true,
  };

  await writeUsers([...users, user]);
  return user;
}

export function getSeededListingOwners(): UserRecord[] {
  return SEEDED_USERS.filter((user) => user.role === "consumer" || user.role === "dealer");
}
