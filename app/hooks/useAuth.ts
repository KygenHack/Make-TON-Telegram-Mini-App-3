import { useState, useEffect } from 'react';
import { getPlayerData, initializePlayerData } from '@/app/hooks/indexedDBClient'; // Custom functions for player data
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

// Hook to handle user authentication via Telegram's WebApp
export default function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const WebApp = (await import('@twa-dev/sdk')).default;
        WebApp.ready();

        const userData = WebApp.initDataUnsafe.user as AuthUser;
        if (userData) {
          setUser(userData);

          // Check if player exists in IndexedDB or create a new one
          const playerData = await getPlayerData(userData.id);
          if (!playerData) {
            // Initialize player data if it doesn't exist
            await initializePlayerData({
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
            });
          }

          // Sync user data to Supabase
          await supabase.from('players').upsert({
            id: userData.id,
            username: userData.username,
            first_name: userData.first_name,
            last_name: userData.last_name,
            photo_url: userData.photo_url,
            is_premium: userData.is_premium,
            language_code: userData.language_code,
          });
        }
      } catch (error) {
        console.error('Failed to initialize user authentication', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  return { user, isLoading };
}
