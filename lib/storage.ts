import { supabase } from "@/app/hooks/useSupabase"

interface ReferralData {
  referrals: { [userId: string]: string[] };
  referredBy: { [userId: string]: string };
}

let storage: ReferralData = {
  referrals: {},
  referredBy: {}
};

// Function to save referral data to both storage and Supabase
export async function saveReferral(userId: string, referrerId: string) {
  if (!storage.referrals[referrerId]) {
    storage.referrals[referrerId] = [];
  }
  storage.referrals[referrerId].push(userId);
  storage.referredBy[userId] = referrerId;

  // Save referral data to Supabase
  const { error } = await supabase
    .from('referrals')
    .insert([{ userId, referrerId }]);

  if (error) {
    console.error('Error saving referral to Supabase:', error);
  } else {
    console.log('Referral data saved to Supabase');
  }
}

// Function to get referrals from local storage
export function getReferrals(userId: string): string[] {
  return storage.referrals[userId] || [];
}

// Function to get the referrer of a user from local storage
export function getReferrer(userId: string): string | null {
  return storage.referredBy[userId] || null;
}

// Optional: Function to fetch all referral data from Supabase
export async function fetchReferralsFromSupabase() {
  const { data, error } = await supabase
    .from('referrals')
    .select('*');

  if (error) {
    console.error('Error fetching referrals from Supabase:', error);
  } else {
    console.log('Referral data fetched from Supabase:', data);
  }
}
