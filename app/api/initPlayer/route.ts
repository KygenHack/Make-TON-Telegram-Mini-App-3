import { validate } from '@telegram-apps/init-data-node';
import { supabase } from '@/app/hooks/useSupabase';

const secretToken = process.env.BOTAPI!;

export const POST = async (req: Request) => {
  const { initData } = await req.json(); // Use req.json() to parse the request body

  if (!initData) {
    return new Response(JSON.stringify({ error: 'Missing initData' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
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

    return new Response(
      JSON.stringify({ message: 'Player data initialized', playerData }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error initializing player data:', error.message);
    return new Response(
      JSON.stringify({ error: 'Failed to initialize player data' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
