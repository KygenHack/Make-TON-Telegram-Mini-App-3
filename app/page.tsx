'use client'

import NavBar from '@/components/NavBar';
import NavTop from '@/components/NavTop';
import ReferralSystem from '@/components/ReferralSystem'
import { useEffect, useState } from 'react'
import WebApp from '@twa-dev/sdk'
import GameComponent from '@/components/GameComponent';

// Define the interface for user data
interface UserData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code: string;
  is_premium?: boolean;
}


export default function Home() {
  const [initData, setInitData] = useState('')
  const [userId, setUserId] = useState('')
  const [startParam, setStartParam] = useState('')
  const [userData, setUserData] = useState<UserData | null>(null)
  const initialBalance = 500;  // Example starting balance
  const initialMiningLevel = 1; // Example starting mining level


  useEffect(() => {
    const initWebApp = async () => {
      if (typeof window !== 'undefined') {
        const WebApp = (await import('@twa-dev/sdk')).default;
        WebApp.ready();
        setInitData(WebApp.initData);
        setUserId(WebApp.initDataUnsafe.user?.id.toString() || '');
        setStartParam(WebApp.initDataUnsafe.start_param || '');
      }
    };

    initWebApp();
  }, [])

  
  return (

    <>
    <div className="bg-black min-h-screen flex flex-col">
      <NavTop />
      <div className="flex-grow w-full bg-fish mt-4 rounded-t-[16px] relative top-glow z-0">
        <div className="absolute top-[2px] left-0 right-0 bottom-0 bg-[#1d2025] rounded-t-[16px] p-6 carpet33">
          <div className="justify-center items-center">
          <GameComponent initialBalance={initialBalance} initialMiningLevel={initialMiningLevel} />
          <ReferralSystem initData={initData} userId={userId} startParam={startParam} />

          </div>
        </div>
      </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0" >
              <NavBar/>
            </div>
    </>
  )
}


