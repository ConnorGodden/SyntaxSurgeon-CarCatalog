'use client';

import React from 'react';
import { Review } from '../../types/review';

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`text-lg ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
      >
        ★
      </span>
    ));

  return (
    <div className="border border-gray-200 rounded-lg p-4 mb-4 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-gray-900">{review.reviewerName}</span>
          <span className="text-sm text-gray-500">{review.reviewerEmail}</span>
        </div>
        <span className="text-sm text-gray-500">{formatDate(review.createdAt)}</span>
      </div>

      <div className="flex items-center mb-2">
        {renderStars(review.rating)}
        <span className="ml-2 text-sm text-gray-600">({review.rating}/5)</span>
      </div>

      <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>
      <p className="text-gray-700 leading-relaxed">{review.comment}</p>

      {review.updatedAt && review.updatedAt !== review.createdAt && (
        <p className="text-xs text-gray-500 mt-2">Updated {formatDate(review.updatedAt)}</p>
      )}
    </div>
  );
}
