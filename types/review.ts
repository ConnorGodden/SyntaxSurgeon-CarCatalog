export interface Review {
  id: string;
  vin: string;
  reviewerId: string;
  reviewerEmail: string;
  reviewerName: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
  updatedAt?: string;
}
