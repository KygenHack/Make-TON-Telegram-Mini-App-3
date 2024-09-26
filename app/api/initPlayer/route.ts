import { NextApiRequest, NextApiResponse } from 'next';
import { validate } from '@telegram-apps/init-data-node';
import { supabase } from '@/app/hooks/useSupabase';

const secretToken = process.env.BOTAPI!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { initData } = req.body;

  if (!initData) {
    return res.status(400).json({ error: 'Missing initData' });
  }

  try {
    // Validate initData
    validate(initData, secretToken); // If invalid, this will throw an error

    // Extract user data from initData
    const params = new URLSearchParams(initData);
    const user = JSON.parse(params.get('user') || '{}');

    const playerData = {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      username: user.username,
      languageCode: user.language_code,
      isPremium: user.is_premium,
      authDate: params.get('auth_date'),
    };

    // Upsert player data into the database (playerData needs to be an array)
    const { error } = await supabase
      .from('players')
      .upsert([playerData], { onConflict: 'id' }); // onConflict expects a string

    if (error) {
      throw new Error(error.message);
    }

    return res.status(200).json({ message: 'Player data initialized', playerData });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error initializing player data:', error.message);
    } else {
      console.error('Unknown error:', error);
    }
    return res.status(500).json({ error: 'Failed to initialize player data' });
  }
}
