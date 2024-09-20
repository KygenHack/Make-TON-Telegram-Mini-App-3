'use client'

import NavBar from '@/components/NavBar';
import NavTop from '@/components/NavTop';
import ReferralSystem from '@/components/ReferralSystem'
import { useEffect, useState } from 'react'

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
          <ReferralSystem initData={initData} userId={userId} startParam={startParam} />
          </div>
          {userData ? (
        <>
          <h1 className="text-2xl font-bold mb-4">User Data</h1>
          <ul>
            <li>ID: {userData.id}</li>
            <li>First Name: {userData.first_name}</li>
            <li>Last Name: {userData.last_name || 'N/A'}</li>
            <li>Username: {userData.username || 'N/A'}</li>
            <li>Language Code: {userData.language_code}</li>
            <li>Is Premium: {userData.is_premium ? 'Yes' : 'No'}</li>
          </ul>
        </>
      ) : (
        <div>Loading...</div>
      )}
        </div>
      </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0" >
              <NavBar/>
            </div>
    </>
  )
}