import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, toSessionUser } from "../../../../lib/session";
import { createUser, readUsers } from "../../../../lib/users";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { fullName?: string; email?: string; password?: string };
    const fullName = (body.fullName ?? "").trim();
    const email = (body.email ?? "").trim();
    const password = (body.password ?? "").trim();

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { ok: false, error: "Full name, email, and password are required." },
        { status: 400 },
      );
    }

    const { malformedRows } = await readUsers();
    const user = await createUser({ fullName, email, password });

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
      { ok: false, error: error instanceof Error ? error.message : "Signup failed." },
      { status: 400 },
    );
  }
}
