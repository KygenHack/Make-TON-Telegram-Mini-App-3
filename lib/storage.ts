import { supabase } from "@/app/hooks/useSupabase"; 

// Function to save a referral
export const saveReferral = async (userId: string, referrerId: string) => {
  const { error } = await supabase
    .from('referrals')
    .insert([{ userId, referrerId }]);

  if (error) {
    throw new Error('Failed to save referral');
  }
};

// Function to get the referrer of a specific user
export const getReferrer = async (userId: string): Promise<string | null> => {
  const { data, error } = await supabase
    .from('referrals')
    .select('referrerId')
    .eq('userId', userId)
    .single();

  if (error) {
    throw new Error('Failed to fetch referrer');
  }

  return data?.referrerId || null;
};

// Function to get all referrals for a specific user
export const getReferrals = async (userId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from('referrals')
    .select('userId')
    .eq('referrerId', userId);

  if (error) {
    throw new Error('Failed to fetch referrals');
  }

  return data.map(referral => referral.userId);
};

// Function to claim the referral bonus
export const claimReferralBonus = async (userId: string): Promise<void> => {
  // Logic for transferring the referral bonus to the scorpion balance
  // Fetch the user and update their balance
  // Example:
  const { data, error } = await supabase
    .from('players')
    .select('balance, referralBonus')
    .eq('id', userId)
    .single();

  if (error || !data) {
    throw new Error('Failed to fetch player data');
  }

  const newBalance = data.balance + data.referralBonus;
  await supabase
    .from('players')
    .update({ balance: newBalance, referralBonus: 0 })
    .eq('id', userId);

  if (error) {
    throw new Error('Failed to claim referral bonus');
  }
};
