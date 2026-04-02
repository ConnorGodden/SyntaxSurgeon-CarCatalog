import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, toSessionUser } from "../../../lib/session";
import { readUsers } from "../../../lib/users";

async function getAuthenticatedUser() {
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

export async function GET() {
  try {
    const currentUser = await getAuthenticatedUser();
    if (!currentUser) {
      return NextResponse.json({ ok: false, error: "You must be logged in to view users." }, { status: 401 });
    }

    if (currentUser.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Only admins can view users." }, { status: 403 });
    }

    const { users, malformedRows } = await readUsers();
    const sanitizedUsers = users.map(({ password: _password, ...user }) => user);
    return NextResponse.json({ ok: true, data: sanitizedUsers, meta: { malformedRows } });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to read users." },
      { status: 500 },
    );
  }
}
