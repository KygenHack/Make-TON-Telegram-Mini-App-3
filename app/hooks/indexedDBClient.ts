import { openDB } from 'idb';

// Define the PlayerData type, including additional fields for gameplay and referral tracking
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

// Utility function to handle errors in DB operations
const handleError = (error: any, message: string) => {
  console.error(message, error);
  // Potentially send error details to a monitoring service
};

// Fetch player data from the database by ID
export const getPlayerData = async (id: number): Promise<PlayerData | undefined> => {
  try {
    const db = await dbPromise;
    return db.get('playerData', id);
  } catch (error) {
    handleError(error, `Error fetching player data for ID ${id}`);
    return undefined;
  }
};

// Save player data to the database, updating existing records or adding new ones
export const savePlayerData = async (playerData: PlayerData): Promise<void> => {
  try {
    const db = await dbPromise;
    await db.put('playerData', playerData);
    console.log('Player data saved locally');
    // Optionally sync with server after saving locally
    await syncPlayerDataWithServer(playerData);
  } catch (error) {
    handleError(error, `Error saving player data for ID ${playerData.id}`);
  }
};

// Update certain fields in the player data
export const updatePlayerData = async (id: number, updates: Partial<PlayerData>): Promise<void> => {
  try {
    const db = await dbPromise;
    const existingData = await db.get('playerData', id);

    if (existingData) {
      const updatedData = { ...existingData, ...updates };
      await db.put('playerData', updatedData);
      console.log(`Player ${id} data updated.`);
    } else {
      throw new Error(`Player with ID ${id} does not exist.`);
    }
  } catch (error) {
    handleError(error, `Error updating player data for ID ${id}`);
  }
};

// Update the player's balance when they perform game actions (e.g., catching scorpions)
export const updatePlayerBalance = async (id: number, amount: number): Promise<void> => {
  try {
    const playerData = await getPlayerData(id);

    if (playerData) {
      const newBalance = playerData.balance + amount;
      await updatePlayerData(id, { balance: newBalance });
      console.log(`Player ${id}'s balance updated to ${newBalance}`);
    } else {
      console.log(`Player with ID ${id} not found.`);
    }
  } catch (error) {
    handleError(error, `Error updating balance for ID ${id}`);
  }
};

// Initialize or create new player data if it doesn't exist
export const initializePlayerData = async (playerData: PlayerData, referrerId?: number): Promise<void> => {
  try {
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
  } catch (error) {
    handleError(error, `Error initializing player data for ID ${playerData.id}`);
  }
};

// Get referred players by referrer ID
export const getReferredPlayers = async (referrerId: number): Promise<number[] | undefined> => {
  try {
    const referrerData = await getPlayerData(referrerId);
    return referrerData?.referredPlayers || [];
  } catch (error) {
    handleError(error, `Error fetching referred players for referrer ID ${referrerId}`);
    return [];
  }
};

// Sync player data with the server (e.g., Supabase or another backend)
export const syncPlayerDataWithServer = async (playerData: PlayerData) => {
  try {
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(playerData),
    });

    if (!response.ok) throw new Error('Failed to sync with server');
    console.log('Data synced successfully with server');
  } catch (error) {
    handleError(error, 'Failed to sync local data with server.');
  }
};

// Sync all local player data with the server
export const syncAllPlayerDataWithServer = async (): Promise<void> => {
  try {
    const db = await dbPromise;
    const tx = db.transaction('playerData', 'readonly');
    const store = tx.objectStore('playerData');
    const allPlayerData = await store.getAll();

    await Promise.all(
      allPlayerData.map(async (playerData) => {
        await syncPlayerDataWithServer(playerData);
      })
    );

    console.log('All player data synced with server.');
  } catch (error) {
    handleError(error, 'Error syncing all player data with server.');
  }
};
