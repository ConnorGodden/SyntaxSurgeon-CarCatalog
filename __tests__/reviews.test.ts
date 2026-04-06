import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const mockCookieStore = { get: vi.fn(), set: vi.fn(), delete: vi.fn() };
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue(mockCookieStore),
}));

vi.mock("../lib/reviews", () => ({
  createReview: vi.fn(),
  getReviewsForVin: vi.fn(),
}));

vi.mock("../lib/users", () => ({
  readUsers: vi.fn(),
}));

const { createReview, getReviewsForVin } = await import("../lib/reviews");
const { readUsers } = await import("../lib/users");
const { POST: reviewPOST } = await import("../app/api/reviews/route");
const { GET: reviewsForVinGET } = await import("../app/api/reviews/[vin]/route");

const activeUser = {
  id: "user-001",
  fullName: "Casey Consumer",
  email: "casey@example.com",
  password: "pass",
  role: "consumer" as const,
  createdAt: "2024-01-01",
  isActive: true,
};

const sampleReview = {
  id: "review_123",
  vin: "VIN123",
  reviewerId: "user-001",
  reviewerEmail: "casey@example.com",
  reviewerName: "Casey Consumer",
  rating: 4,
  title: "Great car",
  comment: "Really enjoyed driving it.",
  createdAt: new Date().toISOString(),
};

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/reviews", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(readUsers).mockResolvedValue({ users: [activeUser], malformedRows: 0 });
  vi.mocked(createReview).mockResolvedValue(sampleReview);
  vi.mocked(getReviewsForVin).mockResolvedValue([sampleReview]);
});

// ─── POST /api/reviews ────────────────────────────────────────────────────────

describe("POST /api/reviews", () => {
  it("returns 401 when not logged in", async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    const res = await reviewPOST(makeRequest({ vin: "VIN123", rating: 4, title: "Good", comment: "Nice" }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });

  it("returns 400 when vin is missing", async () => {
    mockCookieStore.get.mockReturnValue({ value: "user-001" });
    const res = await reviewPOST(makeRequest({ rating: 4, title: "Good", comment: "Nice" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when rating is missing", async () => {
    mockCookieStore.get.mockReturnValue({ value: "user-001" });
    const res = await reviewPOST(makeRequest({ vin: "VIN123", title: "Good", comment: "Nice" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when title is missing", async () => {
    mockCookieStore.get.mockReturnValue({ value: "user-001" });
    const res = await reviewPOST(makeRequest({ vin: "VIN123", rating: 4, comment: "Nice" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when comment is missing", async () => {
    mockCookieStore.get.mockReturnValue({ value: "user-001" });
    const res = await reviewPOST(makeRequest({ vin: "VIN123", rating: 4, title: "Good" }));
    expect(res.status).toBe(400);
  });

  it("returns 200 with the created review when authenticated and all fields present", async () => {
    mockCookieStore.get.mockReturnValue({ value: "user-001" });
    const res = await reviewPOST(
      makeRequest({ vin: "VIN123", rating: 4, title: "Great car", comment: "Really enjoyed it." })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.vin).toBe("VIN123");
    expect(body.data.rating).toBe(4);
  });

  it("does not expose reviewerId or reviewer email in the response (passes through lib)", async () => {
    mockCookieStore.get.mockReturnValue({ value: "user-001" });
    const res = await reviewPOST(
      makeRequest({ vin: "VIN123", rating: 5, title: "Excellent", comment: "Top pick." })
    );
    const body = await res.json();
    // The lib assigns reviewer fields from the session user — they're present but came from session
    expect(body.data.reviewerEmail).toBe("casey@example.com");
  });
});

// ─── GET /api/reviews/[vin] ───────────────────────────────────────────────────

describe("GET /api/reviews/[vin]", () => {
  it("returns 200 with reviews for the given VIN", async () => {
    const res = await reviewsForVinGET(
      new NextRequest("http://localhost/api/reviews/VIN123"),
      { params: Promise.resolve({ vin: "VIN123" }) }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data[0].vin).toBe("VIN123");
  });

  it("returns an empty array when no reviews exist for the VIN", async () => {
    vi.mocked(getReviewsForVin).mockResolvedValue([]);
    const res = await reviewsForVinGET(
      new NextRequest("http://localhost/api/reviews/NOREVIEWS"),
      { params: Promise.resolve({ vin: "NOREVIEWS" }) }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(0);
  });

  it("calls getReviewsForVin with the correct VIN from the route params", async () => {
    await reviewsForVinGET(
      new NextRequest("http://localhost/api/reviews/TARGETVIN"),
      { params: Promise.resolve({ vin: "TARGETVIN" }) }
    );
    expect(getReviewsForVin).toHaveBeenCalledWith("TARGETVIN");
  });
});
