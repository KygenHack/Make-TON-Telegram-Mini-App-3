'use client'

import WebApp from '@twa-dev/sdk';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Title } from '@telegram-apps/telegram-ui';
import { getPlayerData } from '@/app/hooks/indexedDBClient'; // Import your DB function to fetch player data

// Define the interface for user data
interface UserData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code: string;
  is_premium?: boolean;
  photoUrl?: string;
}

interface PlayerData {
  id: number;
  balance: number;
}

export default function NavTop() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userId, setUserId] = useState('');
  const [initData, setInitData] = useState('');
  const [startParam, setStartParam] = useState('');
  const [playerData, setPlayerData] = useState<PlayerData | null>(null); // null by default

  useEffect(() => {
    const initWebApp = async () => {
      if (typeof window !== 'undefined') {
        const WebApp = (await import('@twa-dev/sdk')).default;
        WebApp.ready();
        setInitData(WebApp.initData);
        const user = WebApp.initDataUnsafe.user as UserData;
        setUserData(user);
        setUserId(user?.id.toString() || '');
        setStartParam(WebApp.initDataUnsafe.start_param || '');

        // Fetch player data from IndexedDB
        const playerData = await getPlayerData(user.id);
        setPlayerData(playerData ?? null); // Default to null if undefined
      }
    };

    initWebApp();
  }, []);

  // Define mining status based on balance
  const getMiningStatus = (balance: number): string => {
    if (balance >= 5000000) return 'Galactic Miner';
    if (balance >= 1000000) return 'Mythical Miner';
    if (balance >= 850000) return 'Legendary Miner';
    if (balance >= 550000) return 'Grandmaster Miner';
    if (balance >= 350000) return 'Master Miner';
    if (balance >= 100000) return 'Expert Miner';
    if (balance >= 50000) return 'Skilled Miner';
    if (balance >= 10000) return 'Apprentice Miner';
    if (balance >= 500) return 'Novice Miner';
    return 'Scorpion Hustler';
  };

  return (
    <div className="px-4 w-full">
      <div className="flex items-center justify-between mt-4 space-x-4">
        <div className="flex items-center">
          <div className="p-2 bg-gray-700 rounded-lg shadow-md">
            {userData?.photoUrl ? (
              <Image
                src={userData.photoUrl}
                alt="Profile"
                width={40}  // Added width and height to Image for Next.js optimization
                height={40}
                className="rounded-full shadow-lg"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center text-2xl shadow-lg">
                {userData?.first_name?.charAt(0).toUpperCase() || 'G'}
              </div>
            )}
          </div>
          <div className="ml-2 text-white text-sm">
            <p>{userData?.username || 'Guest'}</p>
            <p className="text-xs text-gray-400">
              {playerData ? getMiningStatus(playerData.balance) : 'Trail Hustler'}
            </p>
          </div>
        </div>
        <button className="bg-white text-black p-2 rounded-full shadow-md">Boost</button>
      </div>
    </div>
  );
}
