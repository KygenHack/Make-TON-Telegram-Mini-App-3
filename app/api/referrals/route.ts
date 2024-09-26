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
      const { data: user, error: userError } = await supabase
        .from('players')
        .select('is_premium')
        .eq('id', userId)
        .single();

      if (userError) {
        throw new Error(userError.message);
      }

      const scorpionsEarned = user.is_premium ? 10 : 5; // Award based on Premium status

      const { error: insertError } = await supabase
        .from('referrals')
        .insert({ referrer_id: referrerId, referred_id: userId, scorpions_earned: scorpionsEarned });

      if (insertError) {
        throw new Error(insertError.message);
      }

      // Increment the referrer's scorpions balance
      await supabase.rpc('increment_scorpion_balance', {
        user_id: referrerId,
        amount: scorpionsEarned,
      });

      return NextResponse.json({ success: true, scorpionsEarned });
    }

    return NextResponse.json({ message: 'Referral already exists' });
  } catch (error) {
    console.error('Error processing referral:', error);
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
      .select('referred_id, scorpions_earned')
      .eq('referrer_id', userId);

    if (referralsError) {
      throw new Error(referralsError.message);
    }

    const referrals = referralsData.map((referral) => ({
      referredId: referral.referred_id,
      scorpionsEarned: referral.scorpions_earned,
    }));

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
    console.error('Error fetching referrals:', error);
    return NextResponse.json({ error: 'Failed to fetch referrals' }, { status: 500 });
  }
}
