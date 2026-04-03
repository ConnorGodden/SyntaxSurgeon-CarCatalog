export interface Review {
  id: string; // Unique identifier for the review
  vin: string; // VIN of the car being reviewed
  reviewerId: string; // ID of the user who wrote the review
  reviewerEmail: string; // Email of the reviewer
  reviewerName: string; // Name of the reviewer
  rating: number; // 1-5 star rating
  title: string; // Short title for the review
  comment: string; // Full review text
  createdAt: string; // ISO date string
  updatedAt?: string; // Optional for edits
}