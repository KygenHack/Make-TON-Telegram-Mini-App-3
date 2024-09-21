import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/app/hooks/useSupabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { userId, referrerId } = req.body;

    try {
      const { error } = await supabase
        .from('referrals')
        .insert([{ user_id: userId, referrer_id: referrerId }]);

      if (error) {
        throw error;
      }

      return res.status(200).json({ message: 'Referral saved successfully' });
    } catch (error) {
      const err = error as Error; // Explicitly cast error to Error
      console.error('Error saving referral:', err.message);
      return res.status(500).json({ error: err.message });
    }
  } else if (req.method === 'GET') {
    const { referrerId } = req.query;

    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('user_id')
        .eq('referrer_id', referrerId);

      if (error) {
        throw error;
      }

      return res.status(200).json({ referrals: data.map((row: { user_id: any; }) => row.user_id) });
    } catch (error) {
      const err = error as Error; // Explicitly cast error to Error
      console.error('Error fetching referrals:', err.message);
      return res.status(500).json({ error: err.message });
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
