import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/app/hooks/useSupabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    return saveReferral(req, res);
  } else if (req.method === 'GET') {
    return getReferrals(req, res);
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

// Save referral information
async function saveReferral(req: NextApiRequest, res: NextApiResponse) {
  const { userId, referrerId } = req.body;

  if (!userId || !referrerId) {
    return res.status(400).json({ error: 'Missing userId or referrerId' });
  }

  try {
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

    return res.status(200).json({ message: 'Referral saved successfully' });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error saving referral:', error.message);
    } else {
      console.error('Unknown error:', error);
    }
    return res.status(500).json({ error: 'Failed to save referral' });
  }
}

// Fetch referrals for the user
async function getReferrals(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  try {
    // Fetch referrals
    const { data: referrals, error: referralsError } = await supabase
      .from('referrals')
      .select('referred_id')
      .eq('referrer_id', userId);

    if (referralsError) {
      throw new Error(referralsError.message);
    }

    return res.status(200).json({ referrals });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching referrals:', error.message);
    } else {
      console.error('Unknown error:', error);
    }
    return res.status(500).json({ error: 'Failed to fetch referrals' });
  }
}
