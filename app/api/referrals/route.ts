import { getReferrals, getReferrer, saveReferral } from '@/lib/storage';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Extract userId and referrerId from request body
    const { userId, referrerId } = await request.json();

    // Validate the input
    if (!userId || !referrerId) {
      return NextResponse.json({ error: 'Missing userId or referrerId' }, { status: 400 });
    }

    // Save the referral data
    await saveReferral(userId, referrerId);

    // Respond with success
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving referral:', error);
    return NextResponse.json({ error: 'Failed to save referral' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get the userId from the query parameters
    const userId = request.nextUrl.searchParams.get('userId');

    // Validate userId
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Fetch referrals and referrer data
    const referrals = await getReferrals(userId);
    const referrer = await getReferrer(userId);

    // Respond with referrals and referrer data
    return NextResponse.json({ referrals, referrer });
  } catch (error) {
    console.error('Error fetching referral data:', error);
    return NextResponse.json({ error: 'Failed to fetch referral data' }, { status: 500 });
  }
}
