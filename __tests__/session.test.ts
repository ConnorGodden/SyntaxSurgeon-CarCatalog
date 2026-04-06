import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

// Use vi.hoisted so the mock object is available before vi.mock is hoisted
const mockCookieStore = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue(mockCookieStore),
}));

vi.mock("../lib/users", () => ({
  readUsers: vi.fn(),
}));

const { readUsers } = await import("../lib/users");
const { toSessionUser, getSessionUser } = await import("../lib/session");

const activeUser = {
  id: "user-001",
  fullName: "Jane Doe",
  email: "jane@example.com",
  role: "consumer" as const,
  password: "secret",
  createdAt: "2024-01-01T00:00:00.000Z",
  isActive: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(readUsers).mockResolvedValue({ users: [activeUser], malformedRows: 0 });
});

// ─── toSessionUser ────────────────────────────────────────────────────────────

describe("toSessionUser", () => {
  it("returns id, fullName, email, and role", () => {
    const result = toSessionUser(activeUser);
    expect(result.id).toBe("user-001");
    expect(result.fullName).toBe("Jane Doe");
    expect(result.email).toBe("jane@example.com");
    expect(result.role).toBe("consumer");
  });

  it("does not expose password", () => {
    const result = toSessionUser(activeUser);
    expect(result).not.toHaveProperty("password");
  });

  it("does not expose createdAt or isActive", () => {
    const result = toSessionUser(activeUser);
    expect(result).not.toHaveProperty("createdAt");
    expect(result).not.toHaveProperty("isActive");
  });

  it("works for admin role", () => {
    expect(toSessionUser({ ...activeUser, role: "admin" }).role).toBe("admin");
  });

  it("works for dealer role", () => {
    expect(toSessionUser({ ...activeUser, role: "dealer" }).role).toBe("dealer");
  });
});

// ─── getSessionUser ───────────────────────────────────────────────────────────

describe("getSessionUser", () => {
  it("returns null when no session cookie is set", async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    expect(await getSessionUser()).toBeNull();
  });

  it("returns null when the session ID does not match any user", async () => {
    mockCookieStore.get.mockReturnValue({ value: "unknown-id" });
    expect(await getSessionUser()).toBeNull();
  });

  it("returns null when the matched user is inactive", async () => {
    vi.mocked(readUsers).mockResolvedValue({
      users: [{ ...activeUser, isActive: false }],
      malformedRows: 0,
    });
    mockCookieStore.get.mockReturnValue({ value: "user-001" });
    expect(await getSessionUser()).toBeNull();
  });

  it("returns a SessionUser when the session ID matches an active user", async () => {
    mockCookieStore.get.mockReturnValue({ value: "user-001" });
    const result = await getSessionUser();
    expect(result?.id).toBe("user-001");
    expect(result?.email).toBe("jane@example.com");
  });

  it("does not include password in the returned session user", async () => {
    mockCookieStore.get.mockReturnValue({ value: "user-001" });
    const result = await getSessionUser();
    expect(result).not.toHaveProperty("password");
  });
});
