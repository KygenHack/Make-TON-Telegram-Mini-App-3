// botDB.ts

import { openDB } from 'idb';
import { supabase } from './useSupabase';

// Define Task interface
export interface Task {
  id: number;
  description: string;
  completed: boolean;
  reward: number;
  requiredBalance?: number;
  status?: 'pending' | 'approved' | 'not_started';
  platform?: string;
  link?: string;
}

// Define PlayerData interface
export interface PlayerData {
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
  cooldownEndTime?: number; // Timestamp of when the cooldown ends
  referrerId?: number; // ID of the referrer
  referredPlayers?: number[]; // List of referred players' IDs
}

// Open the IndexedDB database and handle version upgrades
const dbPromise = openDB('ScorpionGameDB', 2, {
  upgrade(db, oldVersion) {
    if (oldVersion < 1) {
      // Create object store for player data
      db.createObjectStore('playerData', { keyPath: 'id' });
      db.createObjectStore('tasks', { keyPath: 'id' }); // Store player tasks
    }
  },
});

// Debounce function to prevent excessive updates
const debounceSave = (fn: (...args: any[]) => void, delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: any[]) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

// Save player data to both IndexedDB and Supabase
export const savePlayerData = async (playerData: PlayerData): Promise<void> => {
  const db = await dbPromise;
  await db.put('playerData', playerData);

  // Save to Supabase, using 'id' as the conflict resolution column
  const { error } = await supabase
    .from('players')
    .upsert([playerData], { onConflict: 'id' });

  if (error) {
    console.error('Error saving player data to Supabase:', error);
  }
};

// Debounced version of savePlayerData
const debouncedSavePlayerData = debounceSave(savePlayerData, 1000);

// Fetch player data from IndexedDB or Supabase
export const getPlayerData = async (id: number): Promise<PlayerData | undefined> => {
  const db = await dbPromise;
  const playerData = await db.get('playerData', id);

  // If player data doesn't exist in IndexedDB, fetch it from Supabase
  if (!playerData) {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching player data from Supabase:', error);
      return undefined;
    }

    if (data) {
      await savePlayerData(data); // Save fetched data back to IndexedDB
      return data;
    }
  }

  return playerData;
};

// Update only certain fields in the player data and save to Supabase
export const updatePlayerData = async (id: number, updates: Partial<PlayerData>): Promise<void> => {
  const db = await dbPromise;
  const existingData = await db.get('playerData', id);

  if (existingData) {
    const updatedData = { ...existingData, ...updates };
    await db.put('playerData', updatedData);
    debouncedSavePlayerData(updatedData);
  } else {
    throw new Error(`Player with id ${id} does not exist.`);
  }
};

// Function to update the player's balance and save to Supabase
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

// ====================== Task Management ====================== //

// Save tasks to both IndexedDB and Supabase
export const savePlayerTasks = async (tasks: Task[], playerId: number): Promise<void> => {
  const db = await dbPromise;
  await db.put('tasks', { id: playerId, tasks });

  // Save tasks to Supabase
  const { error } = await supabase
    .from('tasks')
    .upsert([{ id: playerId, tasks }], { onConflict: 'id' });

  if (error) {
    console.error('Error saving tasks to Supabase:', error);
  }
};

// Debounced version of savePlayerTasks
const debouncedSavePlayerTasks = debounceSave(savePlayerTasks, 1000);

// Fetch tasks from IndexedDB or Supabase
export const getPlayerTasks = async (playerId: number): Promise<Task[] | undefined> => {
  const db = await dbPromise;
  const taskData = await db.get('tasks', playerId);

  if (!taskData) {
    const { data, error } = await supabase
      .from('tasks')
      .select('tasks')
      .eq('id', playerId)
      .single();

    if (error) {
      console.error('Error fetching tasks from Supabase:', error);
      return undefined;
    }

    if (data) {
      await savePlayerTasks(data.tasks, playerId); // Save fetched tasks back to IndexedDB
      return data.tasks;
    }
  }

  return taskData?.tasks || [];
};

// Update tasks in both IndexedDB and Supabase
export const updatePlayerTasks = async (playerId: number, updatedTasks: Task[]): Promise<void> => {
  await savePlayerTasks(updatedTasks, playerId);
  console.log(`Player ${playerId}'s tasks updated.`);
};
