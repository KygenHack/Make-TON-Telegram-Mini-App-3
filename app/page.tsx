'use client';

import NavBar from '@/components/NavBar';
import WebApp from '@twa-dev/sdk';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Preloader from '@/components/Preloader'; // Assuming you have a Preloader component

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

// Main component definition with a proper name
function MainPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userId, setUserId] = useState('');
  const [initData, setInitData] = useState('');
  const [startParam, setStartParam] = useState('');
  const [showPreloader, setShowPreloader] = useState(true); // Preloader state

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

  // Check if the preloader has already been shown using localStorage
  useEffect(() => {
    const preloaderShown = localStorage.getItem('preloaderShown');
    if (!preloaderShown) {
      // Show the preloader for 5 seconds only once
      const preloaderTimeout = setTimeout(() => {
        setShowPreloader(false);
        localStorage.setItem('preloaderShown', 'true'); // Set flag so the preloader doesn’t show again
      }, 5000); // 5 seconds delay

      return () => clearTimeout(preloaderTimeout); // Cleanup on unmount
    } else {
      // If the preloader was shown before, don't show it again
      setShowPreloader(false);
    }
  }, []);

  // Dynamically import the GameComponent and NavTop
  const GameComponent = dynamic(() => import('../components/GameComponent'), { ssr: false });
  const NavTop = dynamic(() => import('@/components/NavTop'), { ssr: false });
  const Preloader = dynamic(() => import('@/components/Preloader'), { ssr: false });

  return (
    <>
      <div className="bg-black min-h-screen flex flex-col">
        {showPreloader ? (
          <Preloader />
        ) : (
          <>
            <NavTop />
            <div className="flex-grow w-full bg-fish mt-4 rounded-t-[16px] relative top-glow z-0">
              <div className="absolute top-[2px] left-0 right-0 bottom-0 bg-[#1d2025] rounded-t-[16px] p-6 carpet33">
                <div className="justify-center items-center">
                  <GameComponent />
                </div>
              </div>
            </div>

            {/* Only show NavBar when preloader is hidden */}
            <div className="fixed bottom-0 left-0 right-0">
              <NavBar />
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default MainPage;
