import { supabase } from '@/app/hooks/useSupabase';

export const POST = async (req: Request) => {
  try {
    const { userId, referrerId } = await req.json();

    if (!userId || !referrerId) {
      return new Response(
        JSON.stringify({ error: 'Missing userId or referrerId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if referral already exists
    const { data, error: fetchError } = await supabase
      .from('referrals')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw new Error(fetchError.message);
    }

    if (!data) {
      // Insert new referral
      const { error } = await supabase
        .from('referrals')
        .insert([{ user_id: userId, referrer_id: referrerId }]);

      if (error) {
        throw new Error(error.message);
      }
    }

    return new Response(JSON.stringify({ message: 'Referral saved successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error saving referral:', error.message);
    return new Response(
      JSON.stringify({ error: 'Failed to save referral' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const GET = async (req: Request) => {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing userId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch referrals
    const { data: referrals, error: referralsError } = await supabase
      .from('referrals')
      .select('referred_id')
      .eq('referrer_id', userId);

    if (referralsError) {
      throw new Error(referralsError.message);
    }

    return new Response(JSON.stringify({ referrals }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error fetching referrals:', error.message);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch referrals' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
