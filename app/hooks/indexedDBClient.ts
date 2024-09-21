import { openDB } from 'idb';

// Define the PlayerData type, including additional fields from Telegram and tracking harvest and energy depletion
interface PlayerData {
  energy: number;
  id: number; // Telegram user ID
  username?: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  isBot?: boolean;
  isPremium?: boolean;
  languageCode?: string;
  balance: number; // Player's balance in the game
  miningLevel: number;
  lastHarvestTime: number; // Timestamp of the last harvest
  lastExhaustedTime: number; // Timestamp of when the energy was exhausted
  lastEnergyDepletionTime?: number; // Timestamp when energy was depleted
  referrerId?: number; // ID of the referrer
  referredPlayers?: number[]; // List of referred players' IDs
}

// Open the IndexedDB database and handle version upgrades
const dbPromise = openDB('ScorpionGameDB', 2, {
  upgrade(db, oldVersion) {
    if (oldVersion < 1) {
      // Create object store for player data
      db.createObjectStore('playerData', { keyPath: 'id' });
    }
  },
});

// Fetch player data from the database by ID
export const getPlayerData = async (id: number): Promise<PlayerData | undefined> => {
  const db = await dbPromise;
  return db.get('playerData', id);
};

// Save player data to the database, updating existing records or adding new ones
export const savePlayerData = async (playerData: PlayerData): Promise<void> => {
  const db = await dbPromise;
  await db.put('playerData', playerData);
};

// Utility function to update only certain fields in the player data
export const updatePlayerData = async (id: number, updates: Partial<PlayerData>): Promise<void> => {
  const db = await dbPromise;
  const existingData = await db.get('playerData', id);

  if (existingData) {
    const updatedData = { ...existingData, ...updates };
    await db.put('playerData', updatedData);
    console.log(`Player ${id} data updated.`);
  } else {
    throw new Error(`Player with id ${id} does not exist.`);
  }
};

// Function to update the player's balance when they perform game actions (e.g., catching scorpions)
export const updatePlayerBalance = async (id: number, amount: number): Promise<void> => {
  const playerData = await getPlayerData(id);

  if (playerData) {
    const newBalance = playerData.balance + amount; // Add/subtract the amount from balance
    await updatePlayerData(id, { balance: newBalance });
    console.log(`Player ${id}'s balance updated to ${newBalance}`);
  } else {
    console.log(`Player with id ${id} not found.`);
  }
};

// Function to initialize or create new player data if it doesn't exist
export const initializePlayerData = async (playerData: PlayerData, referrerId?: number): Promise<void> => {
  const existingPlayerData = await getPlayerData(playerData.id);

  if (!existingPlayerData) {
    if (referrerId) {
      playerData.referrerId = referrerId;

      // Update referrer's referred players list
      const referrerData = await getPlayerData(referrerId);
      if (referrerData) {
        const updatedReferredPlayers = referrerData.referredPlayers
          ? [...referrerData.referredPlayers, playerData.id]
          : [playerData.id];

        await updatePlayerData(referrerId, { referredPlayers: updatedReferredPlayers });
        console.log(`Referrer ${referrerId}'s referred players list updated.`);
      }
    }

    await savePlayerData(playerData);
    console.log(`New player data created for ${playerData.firstName}`);
  } else {
    console.log(`Player data for ${playerData.firstName} already exists.`);
  }
};

// Function to get referred players by referrer ID
export const getReferredPlayers = async (referrerId: number): Promise<number[] | undefined> => {
  const referrerData = await getPlayerData(referrerId);
  return referrerData?.referredPlayers || [];
};
