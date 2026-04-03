import { NextRequest, NextResponse } from 'next/server';
import { getReviewsForVin } from '../../../../lib/reviews';

export async function GET(
  req: NextRequest,
  { params }: { params: { vin: string } }
) {
  try {
    const vin = params.vin;
    if (!vin) {
      return NextResponse.json(
        { ok: false, error: 'VIN parameter is required.' },
        { status: 400 }
      );
    }

    const reviews = await getReviewsForVin(vin);
    return NextResponse.json({ ok: true, data: reviews });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}