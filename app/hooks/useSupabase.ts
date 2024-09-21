import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);


async function testSupabaseConnection() {
    const { data, error } = await supabase.from('players').select('*');
    
    if (error) {
      console.error('Supabase connection error:', error);
    } else {
      console.log('Supabase data:', data);
    }
  }
  
  testSupabaseConnection();