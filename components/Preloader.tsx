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
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black text-white">
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
          <h1 className="text-3xl font-bold"> Loading... </h1>
        </div>
      </div>
    );
  }

  // Render the main content when the user is authenticated
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black text-white">
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
          <h1 className="text-3xl font-bold">  Welcome, {user?.first_name || 'Player'}! </h1>
        </div>
      </div>
  );
};

export default Preloader;
