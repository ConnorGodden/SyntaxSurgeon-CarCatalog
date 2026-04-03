import { NextRequest, NextResponse } from 'next/server';
import { createReview } from '../../../../lib/reviews';
import { getAuthenticatedUser } from '../../../../lib/session';

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getAuthenticatedUser();
    if (!currentUser) {
      return NextResponse.json(
        { ok: false, error: 'You must be logged in to write a review.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { vin, rating, title, comment } = body;

    if (!vin || !rating || !title || !comment) {
      return NextResponse.json(
        { ok: false, error: 'VIN, rating, title, and comment are required.' },
        { status: 400 }
      );
    }

    const review = await createReview(
      {
        vin,
        rating: parseInt(rating, 10),
        title: title.trim(),
        comment: comment.trim(),
      },
      currentUser
    );

    return NextResponse.json({ ok: true, data: review });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Failed to create review' },
      { status: 500 }
    );
  }
}
