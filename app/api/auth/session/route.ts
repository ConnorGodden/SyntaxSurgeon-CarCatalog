import { NextResponse } from "next/server";
import { getSessionUser } from "../../../../lib/session";
import { readUsers } from "../../../../lib/users";

export async function GET() {
  try {
    const { malformedRows } = await readUsers();
    const user = await getSessionUser();

    return NextResponse.json({
      ok: true,
      data: user,
      meta: {
        malformedUserRows: malformedRows,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load the current session." },
      { status: 500 },
    );
  }
}
