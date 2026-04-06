import "server-only";

import { promises as fs } from "fs";
import path from "path";
import { parseCsvText, stringifyCsv } from "../utils/csv";
import type { Review } from "../types/review";
import type { SessionUser } from "../types/user";

const REVIEWS_CSV_PATH = path.join(process.cwd(), "data", "reviews.csv");

const REVIEW_HEADERS = [
  "id",
  "vin",
  "reviewerId",
  "reviewerEmail",
  "reviewerName",
  "rating",
  "title",
  "comment",
  "createdAt",
  "updatedAt",
] as const;

type ReviewRecord = Record<(typeof REVIEW_HEADERS)[number], string>;

function mapRowToReview(row: Record<string, string>): Review | null {
  const rating = parseInt(row.rating, 10);
  if (isNaN(rating) || rating < 1 || rating > 5) return null;
  if (!row.id || !row.vin || !row.reviewerId) return null;

  return {
    id: row.id,
    vin: row.vin,
    reviewerId: row.reviewerId,
    reviewerEmail: row.reviewerEmail,
    reviewerName: row.reviewerName,
    rating,
    title: row.title,
    comment: row.comment,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt || undefined,
  };
}

function mapReviewToRow(review: Review): ReviewRecord {
  return {
    id: review.id,
    vin: review.vin,
    reviewerId: review.reviewerId,
    reviewerEmail: review.reviewerEmail,
    reviewerName: review.reviewerName,
    rating: review.rating.toString(),
    title: review.title,
    comment: review.comment,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt ?? "",
  };
}

function generateReviewId(): string {
  return `review_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

export async function readReviews(): Promise<{ reviews: Review[]; malformedRows: number }> {
  try {
    const raw = await fs.readFile(REVIEWS_CSV_PATH, "utf-8");
    const { rows, malformedRowCount } = parseCsvText(raw);
    const reviews: Review[] = [];
    let malformedRows = malformedRowCount;

    for (const row of rows) {
      const review = mapRowToReview(row);
      if (review) {
        reviews.push(review);
      } else {
        malformedRows += 1;
      }
    }

    return { reviews, malformedRows };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { reviews: [], malformedRows: 0 };
    }
    throw error;
  }
}

export async function writeReviews(reviews: Review[]): Promise<void> {
  const dataDir = path.dirname(REVIEWS_CSV_PATH);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }

  const content = stringifyCsv([...REVIEW_HEADERS], reviews.map(mapReviewToRow));
  await fs.writeFile(REVIEWS_CSV_PATH, `${content}\n`, "utf-8");
}

export async function createReview(
  reviewData: Omit<Review, "id" | "createdAt" | "reviewerId" | "reviewerEmail" | "reviewerName">,
  currentUser: SessionUser
): Promise<Review> {
  const { reviews } = await readReviews();

  if (reviewData.rating < 1 || reviewData.rating > 5) {
    throw new Error("Rating must be between 1 and 5 stars.");
  }

  if (!reviewData.title?.trim() || !reviewData.comment?.trim()) {
    throw new Error("Title and comment are required.");
  }

  const newReview: Review = {
    ...reviewData,
    id: generateReviewId(),
    reviewerId: currentUser.id,
    reviewerEmail: currentUser.email,
    reviewerName: currentUser.fullName,
    createdAt: new Date().toISOString(),
  };

  reviews.push(newReview);
  await writeReviews(reviews);

  return newReview;
}

export async function getReviewsForVin(vin: string): Promise<Review[]> {
  const { reviews } = await readReviews();
  return reviews.filter((review) => review.vin === vin);
}

export async function getReviewById(id: string): Promise<Review | null> {
  const { reviews } = await readReviews();
  return reviews.find((review) => review.id === id) ?? null;
}
