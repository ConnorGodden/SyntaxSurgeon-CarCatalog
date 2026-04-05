'use client';

import React, { useState } from 'react';
import { Review } from '../../types/review';

interface ReviewFormProps {
  vin: string;
  onReviewSubmitted: (review: Review) => void;
  onCancel: () => void;
}

export function ReviewForm({ vin, onReviewSubmitted, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isSubmitting) return;

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vin,
          rating,
          title: title.trim(),
          comment: comment.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit review');
      }

      onReviewSubmitted(result.data);
      setTitle('');
      setComment('');
      setRating(5);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
      e.preventDefault();
    }
  };

  const renderStars = () =>
    Array.from({ length: 5 }, (_, i) => (
      <button
        key={i}
        type="button"
        onClick={() => setRating(i + 1)}
        className={`text-2xl focus:outline-none ${
          i < rating ? 'text-amber-400' : 'text-zinc-300 dark:text-zinc-600'
        } hover:text-amber-400 transition-colors`}
      >
        ★
      </button>
    ));

  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 bg-white dark:bg-zinc-950 shadow-sm" onClick={(e) => e.stopPropagation()}>
      <h3 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50 mb-5">Share Your Experience</h3>

      <form onSubmit={handleSubmit} onKeyPress={handleKeyPress} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-3">Rating</label>
          <div className="flex items-center space-x-1">
            {renderStars()}
            <span className="ml-3 text-sm text-zinc-600 dark:text-zinc-400 font-medium">({rating}/5)</span>
          </div>
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
            Review Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:focus:ring-blue-500 transition-colors"
            placeholder="Summarize your experience"
            required
            maxLength={100}
          />
        </div>

        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
            Your Review
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:focus:ring-blue-500 resize-vertical transition-colors"
            placeholder="Share your thoughts about this car..."
            required
            maxLength={1000}
          />
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">{comment.length}/1000 characters</p>
        </div>

        {error && (
          <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-950/30 p-3 rounded-lg border border-red-200 dark:border-red-800">{error}</div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-950 font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
