import { NextResponse } from 'next/server';
import { supabase } from '@/app/hooks/useSupabase';

// POST method for saving a referral
export async function POST(req: Request) {
  const body = await req.json();
  const { userId, referrerId } = body;

  try {
    const { error } = await supabase
      .from('referrals')
      .insert([{ user_id: userId, referrer_id: referrerId }]);

    if (error) {
      throw error;
    }

    return NextResponse.json({ message: 'Referral saved successfully' }, { status: 200 });
  } catch (error) {
    const err = error as Error; // Explicitly cast error to Error
    console.error('Error saving referral:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET method for fetching referrals
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const referrerId = searchParams.get('referrerId');

  try {
    const { data, error } = await supabase
      .from('referrals')
      .select('user_id')
      .eq('referrer_id', referrerId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ referrals: data.map((row) => row.user_id) }, { status: 200 });
  } catch (error) {
    const err = error as Error; // Explicitly cast error to Error
    console.error('Error fetching referrals:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
