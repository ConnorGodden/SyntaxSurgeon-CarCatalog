import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { mockCar } from "./mockCar";

vi.mock("server-only", () => ({}));

const mockCookieStore = { get: vi.fn(), set: vi.fn(), delete: vi.fn() };
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue(mockCookieStore),
}));

vi.mock("../lib/listings", () => ({
  readListings: vi.fn(),
  createListing: vi.fn(),
  updateListing: vi.fn(),
}));

vi.mock("../lib/users", () => ({
  readUsers: vi.fn(),
}));

const { readListings, createListing, updateListing } = await import("../lib/listings");
const { readUsers } = await import("../lib/users");
const { GET, POST, PUT } = await import("../app/api/listings/route");

const activeUser = {
  id: "user-001",
  fullName: "Casey Consumer",
  email: "casey@example.com",
  password: "pass",
  role: "consumer" as const,
  createdAt: "2024-01-01",
  isActive: true,
};

const car = mockCar({ vin: "VIN123", ownerId: "user-001", ownerEmail: "casey@example.com", ownerRole: "consumer" });

function makeRequest(body: unknown, method = "POST"): NextRequest {
  return new NextRequest("http://localhost/api/listings", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(readListings).mockResolvedValue({ cars: [car], malformedRows: 0 });
  vi.mocked(readUsers).mockResolvedValue({ users: [activeUser], malformedRows: 0 });
});

// ─── GET /api/listings ────────────────────────────────────────────────────────

describe("GET /api/listings", () => {
  it("returns 200 with a list of cars", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it("returns the cars from readListings", async () => {
    const res = await GET();
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].vin).toBe("VIN123");
  });

  it("returns 500 when readListings throws", async () => {
    vi.mocked(readListings).mockRejectedValue(new Error("disk error"));
    const res = await GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });
});

// ─── POST /api/listings ───────────────────────────────────────────────────────

describe("POST /api/listings", () => {
  it("returns 401 when no session cookie is present", async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    const res = await POST(makeRequest(car));
    expect(res.status).toBe(401);
  });

  it("returns 401 when session ID does not match any user", async () => {
    mockCookieStore.get.mockReturnValue({ value: "unknown-id" });
    const res = await POST(makeRequest(car));
    expect(res.status).toBe(401);
  });

  it("returns 200 and the created car when authenticated", async () => {
    mockCookieStore.get.mockReturnValue({ value: "user-001" });
    vi.mocked(createListing).mockResolvedValue(car);
    const res = await POST(makeRequest(car));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.vin).toBe("VIN123");
  });

  it("returns 400 when createListing throws (e.g. duplicate VIN)", async () => {
    mockCookieStore.get.mockReturnValue({ value: "user-001" });
    vi.mocked(createListing).mockRejectedValue(new Error("A listing with that VIN already exists."));
    const res = await POST(makeRequest(car));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toContain("VIN");
  });
});

// ─── PUT /api/listings ────────────────────────────────────────────────────────

describe("PUT /api/listings", () => {
  it("returns 401 when unauthenticated", async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    const res = await PUT(makeRequest(car, "PUT"));
    expect(res.status).toBe(401);
  });

  it("returns 200 and the updated car when authenticated", async () => {
    mockCookieStore.get.mockReturnValue({ value: "user-001" });
    const updated = { ...car, sellingprice: 9999 };
    vi.mocked(updateListing).mockResolvedValue(updated);
    const res = await PUT(makeRequest(updated, "PUT"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.sellingprice).toBe(9999);
  });

  it("returns 400 when updateListing throws (e.g. listing not found)", async () => {
    mockCookieStore.get.mockReturnValue({ value: "user-001" });
    vi.mocked(updateListing).mockRejectedValue(new Error("Listing not found."));
    const res = await PUT(makeRequest(car, "PUT"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Listing not found");
  });
});
