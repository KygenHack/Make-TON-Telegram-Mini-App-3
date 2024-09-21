import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xaztlrduenbmmefyihqr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhenRscmR1ZW5ibW1lZnlpaHFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjYzMDE3ODcsImV4cCI6MjA0MTg3Nzc4N30.Rzk-CaO0SwDYYheCbUt6LwQMGu-OtOn3F8baaGVj3j0';
export const supabase = createClient(supabaseUrl, supabaseKey);
        
