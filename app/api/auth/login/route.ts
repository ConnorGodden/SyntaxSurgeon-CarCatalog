import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { SESSION_COOKIE_NAME, toSessionUser } from "../../../../lib/session";
import { readUsers } from "../../../../lib/users";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { email?: string; password?: string };
    const email = normalizeEmail(body.email ?? "");
    const password = (body.password ?? "").trim();

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: "Email and password are required." },
        { status: 400 },
      );
    }

    const { users, malformedRows } = await readUsers();
    const matches = users.filter((user) => user.email === email);

    if (matches.length > 1) {
      return NextResponse.json(
        { ok: false, error: "Duplicate accounts were found for that email. Please contact an admin." },
        { status: 409 },
      );
    }

    if (matches.length === 0) {
      return NextResponse.json({ ok: false, error: "No account was found for that email." }, { status: 404 });
    }

    const user = matches[0];
    if (!user.isActive) {
      return NextResponse.json({ ok: false, error: "This account is inactive." }, { status: 403 });
    }

    let isPasswordValid = false;
    if (user.password.startsWith("$2b$")) {
      // Password is hashed
      isPasswordValid = await bcrypt.compare(password, user.password);
    } else {
      // Password is plain text (for backward compatibility)
      isPasswordValid = user.password === password;
    }

    if (!isPasswordValid) {
      return NextResponse.json({ ok: false, error: "Incorrect password." }, { status: 401 });
    }

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, user.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({
      ok: true,
      data: toSessionUser(user),
      meta: {
        malformedUserRows: malformedRows,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Login failed." },
      { status: 500 },
    );
  }
}
