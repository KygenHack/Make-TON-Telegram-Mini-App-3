import { useState, useEffect } from 'react';
import { getPlayerData, initializePlayerData, savePlayerData } from '@/app/hooks/indexedDBClient'; // Custom functions for player data
import { supabase } from '@/app/hooks/useSupabase'; // Supabase client for player data sync

// Define the shape of the authenticated user data
interface AuthUser {
  id: number; // Telegram user ID (BigInt)
  username?: string;
  first_name: string;
  last_name?: string;
  photo_url?: string;
  is_premium?: boolean;
  language_code: string;
}

export default function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [playerData, setPlayerData] = useState<any>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const WebApp = (await import('@twa-dev/sdk')).default;
        WebApp.ready();

        const userData = WebApp.initDataUnsafe.user as AuthUser;
        if (userData) {
          setUser(userData);

          // Check if player exists in IndexedDB
          let playerData = await getPlayerData(userData.id);
          if (!playerData) {
            // Initialize player data if it doesn't exist
            playerData = {
              id: userData.id,
              username: userData.username,
              firstName: userData.first_name,
              lastName: userData.last_name,
              photoUrl: userData.photo_url,
              languageCode: userData.language_code,
              balance: 0, // Initial balance
              miningLevel: 1, // Initial level
              energy: 100, // Initial energy
              lastHarvestTime: Date.now(),
              lastExhaustedTime: Date.now(),
              lastLoginDate: '', // Initialize to empty string
              loginStreak: 0 // Initial login streak
            };

            await initializePlayerData(playerData);
          } else {
            // Check daily login reward eligibility
            playerData = await checkDailyLogin(playerData);
          }

          // Sync player data to Supabase
          await syncPlayerDataToSupabase(playerData);

          setPlayerData(playerData);
        }
      } catch (error) {
        console.error('Failed to initialize user authentication', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Function to check if player is eligible for daily login rewards
  const checkDailyLogin = async (playerData: any) => {
    const today = new Date().toISOString().split('T')[0]; // Get today's date in "YYYY-MM-DD" format

    if (playerData.lastLoginDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let loginStreak = playerData.loginStreak;
      if (playerData.lastLoginDate === yesterdayStr) {
        loginStreak = Math.min(loginStreak + 1, 30); // Continue streak, max 30 days
      } else {
        loginStreak = 1; // Reset streak if last login was not yesterday
      }

      // Update player data with new login streak and date
      playerData = {
        ...playerData,
        lastLoginDate: today,
        loginStreak,
        balance: playerData.balance + loginStreak * 10 // Reward for daily login
      };

      // Save updated player data locally
      await savePlayerData(playerData);
    }

    return playerData;
  };

  // Function to sync player data to Supabase
  const syncPlayerDataToSupabase = async (playerData: any) => {
    try {
      await supabase.from('players').upsert({
        id: playerData.id,
        username: playerData.username,
        first_name: playerData.firstName,
        last_name: playerData.lastName,
        photo_url: playerData.photoUrl,
        is_premium: playerData.isPremium,
        language_code: playerData.languageCode,
        balance: playerData.balance,
        mining_level: playerData.miningLevel,
        last_login_date: playerData.lastLoginDate,
        login_streak: playerData.loginStreak
      });
    } catch (error) {
      console.error('Error syncing player data to Supabase', error);
    }
  };

  return { user, playerData, isLoading };
}
