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
        className={`text-lg ${i < rating ? 'text-amber-400' : 'text-zinc-300 dark:text-zinc-600'}`}
      >
        ★
      </span>
    ));

  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 mb-4 bg-white dark:bg-zinc-950 shadow-sm hover:shadow-md dark:hover:shadow-zinc-800/50 transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex flex-col">
          <span className="font-semibold text-zinc-950 dark:text-zinc-50">{review.reviewerName}</span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">{review.reviewerEmail}</span>
        </div>
        <span className="text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap ml-4">{formatDate(review.createdAt)}</span>
      </div>

      <div className="flex items-center mb-3">
        {renderStars(review.rating)}
        <span className="ml-2 text-xs text-zinc-600 dark:text-zinc-400">({review.rating}/5)</span>
      </div>

      <h4 className="font-medium text-zinc-950 dark:text-zinc-50 mb-2">{review.title}</h4>
      <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-sm">{review.comment}</p>

      {review.updatedAt && review.updatedAt !== review.createdAt && (
        <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-3">Updated {formatDate(review.updatedAt)}</p>
      )}
    </div>
  );
}
