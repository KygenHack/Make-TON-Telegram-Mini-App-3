import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import useAuth from '@/app/hooks/useAuth';
import Image from 'next/image';
import scorpion from '@/app/images/scorpion.png'; // Replace with your scorpion or hamster image path

const Preloader = () => {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      // Handle what happens after the user is authenticated, e.g., redirect or load the main content
    }
  }, [isLoading, user]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-purple-700 text-white">
        {/* Animated hamster/scorpion image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.5 }}
        >
          <Image src={scorpion} alt="Loading" width={250} height={250} />
        </motion.div>
        
        <div className="mt-8 text-center">
          <h1 className="text-3xl font-bold">Congrats!</h1>
          <p className="mt-2">Season 1 results are ready.</p>
          <p className="mt-1">Check yours in the Airdrop section.</p>
          <p className="mt-2">Stay tuned for more info in official channels.</p>

          {/* Social media links */}
          <div className="flex justify-center mt-4 space-x-4">
            <a href="https://t.me/official_channel" target="_blank" rel="noopener noreferrer">
              <img src="/telegram_icon.png" alt="Telegram" className="w-8 h-8" />
            </a>
            <a href="https://youtube.com/official_channel" target="_blank" rel="noopener noreferrer">
              <img src="/youtube_icon.png" alt="YouTube" className="w-8 h-8" />
            </a>
            <a href="https://twitter.com/official_channel" target="_blank" rel="noopener noreferrer">
              <img src="/twitter_icon.png" alt="Twitter" className="w-8 h-8" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Render the main content when the user is authenticated
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-purple-700 text-white">
        {/* Animated hamster/scorpion image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.5 }}
        >
          <Image src={scorpion} alt="Loading" width={250} height={250} />
        </motion.div>
        
        <div className="mt-8 text-center">
          <h1 className="text-3xl font-bold">Congrats!</h1>
          <p className="mt-2">Season 1 results are ready.</p>
          <p className="mt-1">Check yours in the Airdrop section.</p>
          <p className="mt-2">Stay tuned for more info in official channels.</p>

          {/* Social media links */}
          <div className="flex justify-center mt-4 space-x-4">
            <a href="https://t.me/official_channel" target="_blank" rel="noopener noreferrer">
              <img src="/telegram_icon.png" alt="Telegram" className="w-8 h-8" />
            </a>
            <a href="https://youtube.com/official_channel" target="_blank" rel="noopener noreferrer">
              <img src="/youtube_icon.png" alt="YouTube" className="w-8 h-8" />
            </a>
            <a href="https://twitter.com/official_channel" target="_blank" rel="noopener noreferrer">
              <img src="/twitter_icon.png" alt="Twitter" className="w-8 h-8" />
            </a>
          </div>
        </div>
      </div>
  );
};

export default Preloader;
