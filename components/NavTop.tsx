'use client'

import WebApp from '@twa-dev/sdk';
import Image from 'next/image';
import { useEffect, useState } from 'react';

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

export default function NavTop() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userId, setUserId] = useState('');
  const [initData, setInitData] = useState('');
  const [startParam, setStartParam] = useState('');

  useEffect(() => {
    const initWebApp = async () => {
      if (typeof window !== 'undefined') {
        const WebApp = (await import('@twa-dev/sdk')).default;
        WebApp.ready();
        setInitData(WebApp.initData);
        setUserData(WebApp.initDataUnsafe.user as UserData);
        setUserId(WebApp.initDataUnsafe.user?.id.toString() || '');
        setStartParam(WebApp.initDataUnsafe.start_param || '');
      }
    };

    initWebApp();
  }, []);

  return (
    <div className="px-4 w-full">
      <div className="flex items-center justify-between mt-4 space-x-4">
        <div className="flex items-center">
          <div className="p-2 bg-gray-700 rounded-lg shadow-md">
            {userData?.photoUrl ? (
              <Image src={userData.photoUrl} alt="Profile" className="w-10 h-10 rounded-full shadow-lg" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center text-2xl shadow-lg">
                {userData?.first_name?.charAt(0).toUpperCase() || 'G'}
              </div>
            )}
          </div>
          <p className="ml-2 text-white text-sm">{userData?.username || 'Guest'}</p>
        </div>
        <button className="bg-white text-black p-2 rounded-full shadow-md">Boost</button>
      </div>
    </div>
  );
}
