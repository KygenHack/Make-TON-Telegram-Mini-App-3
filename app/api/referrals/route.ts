// File: /app/api/referrals.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/hooks/useSupabase';

export async function POST(request: NextRequest) {
  try {
    const { userId, referrerId } = await request.json();

    if (!userId || !referrerId) {
      return NextResponse.json({ error: 'Missing userId or referrerId' }, { status: 400 });
    }

    // Check if referral already exists
    const { data: existingReferral, error: checkError } = await supabase
      .from('referrals')
      .select('id')
      .eq('referrer_id', referrerId)
      .eq('referred_id', userId);

    if (checkError) {
      throw new Error(checkError.message);
    }

    if (!existingReferral || existingReferral.length === 0) {
      // Insert new referral if it doesn't exist
      const { error: insertError } = await supabase
        .from('referrals')
        .insert({ referrer_id: referrerId, referred_id: userId });

      if (insertError) {
        throw new Error(insertError.message);
      }

      // Update referrer's rewards (scorpion bonus)
      await supabase.rpc('increment_scorpion_bonus', {
        telegram_id: referrerId,
        increment_value: 1, // Update with the appropriate value
      });

      // Calculate and update grand referrer's rewards (scorpion bonus) if applicable
      const { data: referrerData, error: referrerError } = await supabase
        .from('players')
        .select('referrer_id')
        .eq('telegram_id', referrerId);

      if (referrerError) {
        throw new Error(referrerError.message);
      }

      if (referrerData && referrerData.length > 0 && referrerData[0].referrer_id) {
        const grandReferrerId = referrerData[0].referrer_id;
        await supabase.rpc('increment_scorpion_bonus', {
          telegram_id: grandReferrerId,
          increment_value: 0.25, // Update with the appropriate value for grand referrer
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST request:', error);
    return NextResponse.json({ error: 'Failed to save referral' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const { data: referralsData, error: referralsError } = await supabase
      .from('referrals')
      .select('referred_id')
      .eq('referrer_id', userId);

    if (referralsError) {
      throw new Error(referralsError.message);
    }

    const referrals = referralsData ? referralsData.map((referral: { referred_id: any; }) => referral.referred_id) : [];

    const { data: referrerData, error: referrerError } = await supabase
      .from('referrals')
      .select('referrer_id')
      .eq('referred_id', userId)
      .single();

    if (referrerError) {
      throw new Error(referrerError.message);
    }

    const referrer = referrerData ? referrerData.referrer_id : null;

    return NextResponse.json({ referrals, referrer });
  } catch (error) {
    console.error('Error in GET request:', error);
    return NextResponse.json({ error: 'Failed to fetch referrals' }, { status: 500 });
  }
}
