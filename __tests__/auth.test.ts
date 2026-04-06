import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const mockCookieStore = { get: vi.fn(), set: vi.fn(), delete: vi.fn() };
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue(mockCookieStore),
}));

vi.mock("../lib/users", () => ({
  readUsers: vi.fn(),
  createUser: vi.fn(),
}));

vi.mock("bcrypt", () => ({
  default: { compare: vi.fn() },
  compare: vi.fn(),
}));

const { readUsers, createUser } = await import("../lib/users");
import bcrypt from "bcrypt";
const { POST: loginPOST } = await import("../app/api/auth/login/route");
const { POST: logoutPOST } = await import("../app/api/auth/logout/route");
const { POST: signupPOST } = await import("../app/api/auth/signup/route");

function makeRequest(body: unknown, method = "POST"): NextRequest {
  return new NextRequest("http://localhost/api/auth", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const activeUser = {
  id: "user-001",
  fullName: "Casey Consumer",
  email: "casey@example.com",
  password: "plainpass",
  role: "consumer" as const,
  createdAt: "2024-01-01",
  isActive: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(readUsers).mockResolvedValue({ users: [activeUser], malformedRows: 0 });
});

// ─── Login ────────────────────────────────────────────────────────────────────

describe("POST /api/auth/login", () => {
  it("returns 400 when email is missing", async () => {
    const res = await loginPOST(makeRequest({ password: "pass" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });

  it("returns 400 when password is missing", async () => {
    const res = await loginPOST(makeRequest({ email: "casey@example.com" }));
    expect(res.status).toBe(400);
  });

  it("returns 404 when no account exists for the email", async () => {
    vi.mocked(readUsers).mockResolvedValue({ users: [], malformedRows: 0 });
    const res = await loginPOST(makeRequest({ email: "unknown@example.com", password: "pass" }));
    expect(res.status).toBe(404);
  });

  it("returns 403 when the account is inactive", async () => {
    vi.mocked(readUsers).mockResolvedValue({
      users: [{ ...activeUser, isActive: false }],
      malformedRows: 0,
    });
    const res = await loginPOST(makeRequest({ email: "casey@example.com", password: "plainpass" }));
    expect(res.status).toBe(403);
  });

  it("returns 401 when the plain-text password is wrong", async () => {
    const res = await loginPOST(makeRequest({ email: "casey@example.com", password: "wrong" }));
    expect(res.status).toBe(401);
  });

  it("returns 401 when the bcrypt password comparison fails", async () => {
    vi.mocked(readUsers).mockResolvedValue({
      users: [{ ...activeUser, password: "$2b$10$hashedpassword" }],
      malformedRows: 0,
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
    const res = await loginPOST(makeRequest({ email: "casey@example.com", password: "wrong" }));
    expect(res.status).toBe(401);
  });

  it("returns 200 with user data on successful plain-text login", async () => {
    const res = await loginPOST(makeRequest({ email: "casey@example.com", password: "plainpass" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.email).toBe("casey@example.com");
    expect(body.data).not.toHaveProperty("password");
  });

  it("returns 200 with user data on successful bcrypt login", async () => {
    vi.mocked(readUsers).mockResolvedValue({
      users: [{ ...activeUser, password: "$2b$10$hashedpassword" }],
      malformedRows: 0,
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    const res = await loginPOST(makeRequest({ email: "casey@example.com", password: "plainpass" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it("sets the session cookie on success", async () => {
    await loginPOST(makeRequest({ email: "casey@example.com", password: "plainpass" }));
    expect(mockCookieStore.set).toHaveBeenCalled();
  });

  it("normalises email casing before lookup", async () => {
    const res = await loginPOST(makeRequest({ email: "CASEY@EXAMPLE.COM", password: "plainpass" }));
    expect(res.status).toBe(200);
  });
});

// ─── Logout ───────────────────────────────────────────────────────────────────

describe("POST /api/auth/logout", () => {
  it("returns 200", async () => {
    const res = await logoutPOST();
    expect(res.status).toBe(200);
  });

  it("clears the session cookie by setting maxAge to 0", async () => {
    await logoutPOST();
    expect(mockCookieStore.set).toHaveBeenCalled();
    const [, , options] = vi.mocked(mockCookieStore.set).mock.calls[0];
    expect((options as { maxAge: number }).maxAge).toBe(0);
  });

  it("returns ok: true", async () => {
    const res = await logoutPOST();
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});

// ─── Signup ───────────────────────────────────────────────────────────────────

describe("POST /api/auth/signup", () => {
  beforeEach(() => {
    vi.mocked(createUser).mockResolvedValue({
      ...activeUser,
      id: "user-new",
      fullName: "New User",
      email: "new@example.com",
    });
  });

  it("returns 400 when fullName is missing", async () => {
    const res = await signupPOST(makeRequest({ email: "new@example.com", password: "pass" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when email is missing", async () => {
    const res = await signupPOST(makeRequest({ fullName: "New User", password: "pass" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when password is missing", async () => {
    const res = await signupPOST(makeRequest({ fullName: "New User", email: "new@example.com" }));
    expect(res.status).toBe(400);
  });

  it("returns 200 with user data on successful signup", async () => {
    const res = await signupPOST(
      makeRequest({ fullName: "New User", email: "new@example.com", password: "pass123" })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data).not.toHaveProperty("password");
  });

  it("sets the session cookie after signup", async () => {
    await signupPOST(
      makeRequest({ fullName: "New User", email: "new@example.com", password: "pass123" })
    );
    expect(mockCookieStore.set).toHaveBeenCalled();
  });

  it("returns 400 when createUser throws (e.g. duplicate email)", async () => {
    vi.mocked(createUser).mockRejectedValue(new Error("Email already in use."));
    const res = await signupPOST(
      makeRequest({ fullName: "New User", email: "casey@example.com", password: "pass123" })
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Email already in use.");
  });
});
