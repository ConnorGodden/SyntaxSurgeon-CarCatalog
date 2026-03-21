import "server-only";

import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { stringifyCsv, parseCsvText } from "../utils/csv";
import { USER_ROLES, type UserRecord, type UserRole } from "../types/user";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_CSV_PATH = path.join(DATA_DIR, "users.csv");

const USER_HEADERS = ["id", "fullName", "email", "password", "role", "createdAt", "isActive"] as const;

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
  await mkdir(DATA_DIR, { recursive: true });
  const content = stringifyCsv([...USER_HEADERS], users.map((user) => ({
    ...user,
    isActive: user.isActive ? "true" : "false",
  })));
  await writeFile(USERS_CSV_PATH, `${content}\n`, "utf8");
}

export async function ensureUsersSeeded(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });

  try {
    await readFile(USERS_CSV_PATH, "utf8");
  } catch {
    await writeUsers(SEEDED_USERS);
  }
}

export async function readUsers(): Promise<{ users: UserRecord[]; malformedRows: number }> {
  await ensureUsersSeeded();
  const raw = await readFile(USERS_CSV_PATH, "utf8");
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

  const user: UserRecord = {
    id,
    fullName,
    email,
    password,
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
