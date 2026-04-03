import { promises as fs } from 'fs';
import path from 'path';
import { Review } from '../types/review';
import { SessionUser } from '../types/user';

const REVIEWS_CSV_PATH = path.join(process.cwd(), 'data', 'reviews.csv');

const REVIEW_HEADERS = [
  'id',
  'vin',
  'reviewerId',
  'reviewerEmail',
  'reviewerName',
  'rating',
  'title',
  'comment',
  'createdAt',
  'updatedAt'
] as const;

function mapReviewToRow(review: Review): string[] {
  return [
    review.id,
    review.vin,
    review.reviewerId,
    review.reviewerEmail,
    review.reviewerName,
    review.rating.toString(),
    review.title,
    review.comment,
    review.createdAt,
    review.updatedAt || ''
  ];
}

function mapRowToReview(row: string[]): Review | null {
  if (row.length !== REVIEW_HEADERS.length) {
    return null;
  }

  const [
    id,
    vin,
    reviewerId,
    reviewerEmail,
    reviewerName,
    ratingStr,
    title,
    comment,
    createdAt,
    updatedAt
  ] = row;

  const rating = parseInt(ratingStr, 10);
  if (isNaN(rating) || rating < 1 || rating > 5) {
    return null;
  }

  return {
    id,
    vin,
    reviewerId,
    reviewerEmail,
    reviewerName,
    rating,
    title,
    comment,
    createdAt,
    updatedAt: updatedAt || undefined
  };
}

export async function readReviews(): Promise<{ reviews: Review[], malformedRows: number }> {
  try {
    const csvContent = await fs.readFile(REVIEWS_CSV_PATH, 'utf-8');
    const lines = csvContent.trim().split('\n');
    const reviews: Review[] = [];
    let malformedRows = 0;

    for (let i = 1; i < lines.length; i++) { // Skip header
      const row = lines[i].split(',').map(cell => cell.trim());
      const review = mapRowToReview(row);
      if (review) {
        reviews.push(review);
      } else {
        malformedRows++;
      }
    }

    return { reviews, malformedRows };
  } catch (error) {
    // If file doesn't exist, return empty array
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { reviews: [], malformedRows: 0 };
    }
    throw error;
  }
}

export async function writeReviews(reviews: Review[]): Promise<void> {
  const header = REVIEW_HEADERS.join(',');
  const rows = reviews.map(mapReviewToRow).map(row => row.join(','));
  const csvContent = [header, ...rows].join('\n') + '\n';

  // Ensure data directory exists
  const dataDir = path.dirname(REVIEWS_CSV_PATH);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }

  await fs.writeFile(REVIEWS_CSV_PATH, csvContent, 'utf-8');
}

export async function createReview(reviewData: Omit<Review, 'id' | 'createdAt'>, currentUser: SessionUser): Promise<Review> {
  const { reviews } = await readReviews();

  // Validate rating
  if (reviewData.rating < 1 || reviewData.rating > 5) {
    throw new Error('Rating must be between 1 and 5 stars.');
  }

  // Validate required fields
  if (!reviewData.title?.trim() || !reviewData.comment?.trim()) {
    throw new Error('Title and comment are required.');
  }

  // Create new review
  const newReview: Review = {
    ...reviewData,
    id: generateReviewId(),
    reviewerId: currentUser.id,
    reviewerEmail: currentUser.email,
    reviewerName: currentUser.fullName,
    createdAt: new Date().toISOString()
  };

  // Add to reviews and save
  reviews.push(newReview);
  await writeReviews(reviews);

  return newReview;
}

export async function getReviewsForVin(vin: string): Promise<Review[]> {
  const { reviews } = await readReviews();
  return reviews.filter(review => review.vin === vin);
}

export async function getReviewById(id: string): Promise<Review | null> {
  const { reviews } = await readReviews();
  return reviews.find(review => review.id === id) || null;
}

function generateReviewId(): string {
  return `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}