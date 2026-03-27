import "server-only";

import { cookies } from "next/headers";
import type { SessionUser } from "../types/user";
import { readUsers } from "./users";

export const SESSION_COOKIE_NAME = "car_catalog_session";

export function toSessionUser(user: {
  id: string;
  fullName: string;
  email: string;
  role: SessionUser["role"];
}): SessionUser {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
  };
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value?.trim();

  if (!sessionId) {
    return null;
  }

  const { users } = await readUsers();
  const matches = users.filter((user) => user.id === sessionId && user.isActive);
  if (matches.length !== 1) {
    return null;
  }

  return toSessionUser(matches[0]);
}
