'use client';

import React, { useState, useEffect } from 'react';
import { Review } from '../../types/review';
import { ReviewCard } from './ReviewCard';
import { ReviewForm } from './ReviewForm';

interface ReviewsSectionProps {
  vin: string;
  isLoggedIn: boolean;
}

export function ReviewsSection({ vin, isLoggedIn }: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReviews();
  }, [vin]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/reviews/${vin}`);
      const result = await response.json();

      if (response.ok) {
        setReviews(result.data);
      } else {
        setError('Failed to load reviews');
      }
    } catch (err) {
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmitted = (newReview: Review) => {
    setReviews(prev => [newReview, ...prev]);
    setShowForm(false);
  };

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  };

  const renderStars = (rating: number, size: 'sm' | 'lg' = 'sm') => {
    const starSize = size === 'lg' ? 'text-2xl' : 'text-lg';
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`${starSize} ${i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
      >
        ★
      </span>
    ));
  };

  if (loading) {
    return (
      <div className="py-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Loading reviews...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Reviews</h3>
          {reviews.length > 0 && (
            <div className="flex items-center mt-1">
              {renderStars(calculateAverageRating())}
              <span className="ml-2 text-sm text-gray-600">
                {calculateAverageRating()} ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
              </span>
            </div>
          )}
        </div>
        {isLoggedIn && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Write a Review
          </button>
        )}
      </div>

      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
          {error}
        </div>
      )}

      {showForm && (
        <ReviewForm
          vin={vin}
          onReviewSubmitted={handleReviewSubmitted}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No reviews yet. {isLoggedIn ? 'Be the first to write one!' : 'Log in to write a review.'}</p>
          </div>
        ) : (
          reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))
        )}
      </div>
    </div>
  );
}