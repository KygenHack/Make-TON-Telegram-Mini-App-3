import { getReferrals, getReferrer, saveReferral } from '@/lib/storage'; // Use Supabase storage
import { NextRequest, NextResponse } from 'next/server';

// POST request: Save a referral to Supabase
export async function POST(request: NextRequest) {
  try {
    const { userId, referrerId } = await request.json();

    // Validate input
    if (!userId || !referrerId) {
      return NextResponse.json({ error: 'Missing userId or referrerId' }, { status: 400 });
    }

    // Save referral to Supabase
    await saveReferral(userId, referrerId);

    // Return success response
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving referral:', error);
    return NextResponse.json({ error: 'Failed to save referral' }, { status: 500 });
  }
}

// GET request: Fetch referrals and referrer from Supabase
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    // Validate input
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Fetch referrals and referrer using Supabase
    const [referrals, referrer] = await Promise.all([
      getReferrals(userId),
      getReferrer(userId),
    ]);

    // Return referral and referrer data
    return NextResponse.json({ referrals, referrer });
  } catch (error) {
    console.error('Error fetching referral data:', error);
    return NextResponse.json({ error: 'Failed to fetch referral data' }, { status: 500 });
  }
}
