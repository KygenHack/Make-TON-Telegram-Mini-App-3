import { supabase } from "@/app/hooks/useSupabase";

interface ReferralData {
  referrals: { [userId: string]: string[] };
  referredBy: { [userId: string]: string };
}

// In-memory storage
let storage: ReferralData = {
  referrals: {},
  referredBy: {}
};

// Function to save referral data to both in-memory storage and Supabase
export async function saveReferral(userId: string, referrerId: string) {
  // Save to in-memory storage
  if (!storage.referrals[referrerId]) {
    storage.referrals[referrerId] = [];
  }
  storage.referrals[referrerId].push(userId);
  storage.referredBy[userId] = referrerId;

  // Save to Supabase
  const { error } = await supabase
    .from('referrals')
    .insert([{ userId, referrerId }]);

  if (error) {
    console.error('Error saving referral to Supabase:', error);
  } else {
    console.log('Referral data saved to Supabase');
  }
}

// Function to get referrals from in-memory storage or Supabase if not in memory
export async function getReferrals(userId: string): Promise<string[]> {
  // Check in-memory storage first
  if (storage.referrals[userId]) {
    return storage.referrals[userId];
  }

  // Fetch referrals from Supabase if not in local storage
  const { data, error } = await supabase
    .from('referrals')
    .select('userId')
    .eq('referrerId', userId);

  if (error) {
    console.error('Error fetching referrals from Supabase:', error);
    return [];
  }

  const referrals = data.map((referral) => referral.userId);
  storage.referrals[userId] = referrals; // Update in-memory storage

  return referrals;
}

// Function to get the referrer of a user from in-memory storage or Supabase
export async function getReferrer(userId: string): Promise<string | null> {
  // Check in-memory storage first
  if (storage.referredBy[userId]) {
    return storage.referredBy[userId];
  }

  // Fetch referrer from Supabase if not in local storage
  const { data, error } = await supabase
    .from('referrals')
    .select('referrerId')
    .eq('userId', userId)
    .single();

  if (error) {
    console.error('Error fetching referrer from Supabase:', error);
    return null;
  }

  const referrerId = data?.referrerId || null;
  storage.referredBy[userId] = referrerId; // Update in-memory storage

  return referrerId;
}

// Optional: Fetch all referral data from Supabase and sync with in-memory storage
export async function fetchReferralsFromSupabase() {
  const { data, error } = await supabase
    .from('referrals')
    .select('*');

  if (error) {
    console.error('Error fetching referrals from Supabase:', error);
  } else {
    // Sync Supabase data with in-memory storage
    data.forEach((entry) => {
      const { userId, referrerId } = entry;
      if (!storage.referrals[referrerId]) {
        storage.referrals[referrerId] = [];
      }
      storage.referrals[referrerId].push(userId);
      storage.referredBy[userId] = referrerId;
    });

    console.log('Referral data fetched and synced with in-memory storage:', storage);
  }
}
