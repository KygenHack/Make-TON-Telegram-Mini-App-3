import { openDB } from 'idb';

// Define the structure for referral data
interface ReferralData {
  referrals: { [userId: string]: string[] };
  referredBy: { [userId: string]: string };
}

// Open IndexedDB and create a referral data store if it doesn't exist
const dbPromise = openDB('ReferralDB', 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('referrals')) {
      const store = db.createObjectStore('referrals', { keyPath: 'userId' });
      store.createIndex('referredBy', 'referredBy', { unique: false });
    }
  },
});

// Function to save referral data to IndexedDB
export async function saveReferral(userId: string, referrerId: string) {
  const db = await dbPromise;
  
  // Get the existing referral data for the referrer
  const referralData = await db.get('referrals', referrerId);
  
  let referrals = referralData?.referrals || [];
  referrals.push(userId);

  // Save/update the referral data in IndexedDB
  await db.put('referrals', {
    userId: referrerId,
    referrals: referrals,
    referredBy: referrerId,
  });

  // Save the referred user with their referrer
  await db.put('referrals', {
    userId: userId,
    referrals: [],
    referredBy: referrerId,
  });
}

// Function to get the list of users referred by a specific user from IndexedDB
export async function getReferrals(userId: string): Promise<string[]> {
  const db = await dbPromise;
  const referralData = await db.get('referrals', userId);
  return referralData?.referrals || [];
}

// Function to get the referrer of a user from IndexedDB
export async function getReferrer(userId: string): Promise<string | null> {
  const db = await dbPromise;
  const referralData = await db.get('referrals', userId);
  return referralData?.referredBy || null;
}
