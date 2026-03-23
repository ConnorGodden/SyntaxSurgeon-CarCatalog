import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import type { Car } from "../../../types/car";
import { createListing, readListings, updateListing } from "../../../lib/listings";
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
    const { cars, malformedRows } = await readListings();
    return NextResponse.json({ ok: true, data: cars, meta: { malformedRows } });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to read listings." },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getAuthenticatedUser();
    if (!currentUser) {
      return NextResponse.json({ ok: false, error: "You must be logged in to create a listing." }, { status: 401 });
    }

    const car = (await req.json()) as Car;
    const created = await createListing(car, currentUser);
    return NextResponse.json({ ok: true, data: created });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to create listing." },
      { status: 400 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const currentUser = await getAuthenticatedUser();
    if (!currentUser) {
      return NextResponse.json({ ok: false, error: "You must be logged in to edit a listing." }, { status: 401 });
    }

    const car = (await req.json()) as Car;
    const updated = await updateListing(car, currentUser);
    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to update listing." },
      { status: 400 },
    );
  }
}
