'use client';

import WebApp from '@twa-dev/sdk';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { scorpion } from '@/app/images';
import { Title } from '@telegram-apps/telegram-ui';

// Define user data interface
interface UserData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code: string;
  is_premium?: boolean;
  photoUrl?: string;
}

// Define game state interface
interface GameState {
  scorpionsCaught: number;
  energy: number;
  isHolding: boolean;
  reward: number;
  tasks: Task[];
}

// Define task structure
interface Task {
  id: number;
  description: string;
  completed: boolean;
  reward: number;
}

export default function TaskComponent() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [state, setState] = useState<GameState>({
    scorpionsCaught: 0,
    energy: 100,
    isHolding: false,
    reward: 0,
    tasks: [
      { id: 1, description: "Catch 50 scorpions in one hold", completed: false, reward: 50 },
      { id: 2, description: "Hold for a total of 300 seconds", completed: false, reward: 30 }
    ],
  });
  const [cooldownTimeRemaining, setCooldownTimeRemaining] = useState(0);
  const [balance, setBalance] = useState(0);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const initWebApp = async () => {
      const WebApp = (await import('@twa-dev/sdk')).default;
      WebApp.ready();
      setUserData(WebApp.initDataUnsafe.user as UserData);
    };

    initWebApp();
  }, []);

  useEffect(() => {
    if (cooldownTimeRemaining > 0) {
      const cooldownInterval = setInterval(() => {
        setCooldownTimeRemaining(prev => prev - 1);
      }, 1000);
      return () => clearInterval(cooldownInterval);
    } else if (cooldownTimeRemaining === 0 && !state.isHolding && state.energy < 100) {
      setState(prev => ({ ...prev, energy: 100 }));
    }
  }, [cooldownTimeRemaining, state.isHolding, state.energy]);

  const handleHoldStart = () => {
    if (state.energy > 0 && !state.isHolding) {
      setState(prev => ({ ...prev, isHolding: true }));
      const startTime = Date.now();

      holdIntervalRef.current = setInterval(() => {
        const duration = (Date.now() - startTime) / 1000;
        const updatedTasks = state.tasks.map(task => {
          if (!task.completed && ((task.id === 2 && duration >= 300) || (task.id === 1 && state.reward + 1 >= 50))) {
            setBalance(prev => prev + task.reward);
            return { ...task, completed: true, reward: 0 };  // Mark as completed and reset reward to prevent re-application
          }
          return task;
        });

        setState(prev => {
          if (prev.energy > 0) {
            return {
              ...prev,
              tasks: updatedTasks,
              reward: prev.reward + 1,
              energy: Math.max(prev.energy - 1, 0)
            };
          } else {
            handleHoldRelease();
            return prev;
          }
        });
      }, 1000);
    }
  };

  const handleHoldRelease = () => {
    if (state.isHolding) {
      clearInterval(holdIntervalRef.current!);
      holdIntervalRef.current = null;

      const updatedTasks = state.tasks.map(task => {
        return task.completed ? { ...task, reward: 0 } : task;
      });

      setState(prev => ({
        ...prev,
        scorpionsCaught: prev.scorpionsCaught + prev.reward,
        reward: 0,
        isHolding: false,
        tasks: updatedTasks
      }));
      setBalance(prev => prev + state.reward);
      setCooldownTimeRemaining(3 * 3600);
    }
  };

   // Format time to display hours, minutes, and seconds
   const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="p-6">
      <div className="flex justify-center">
        <div className="text-center">
          <Title  caps
    level="1"
    weight="1"
     className="text-5xl text-white">{balance}</Title>
          <p className="text-lg text-[#f48d2f]">Catching <strong>{state.reward} scorpions</strong></p>
        </div>
      </div>
       {/* Scorpion Hold Interaction */}
       <div className="flex justify-center mt-6">
       <motion.div
  className={`relative w-[250px] h-[250px] rounded-full border-8 border-[#f48d2f] flex items-center justify-center cursor-pointer ${cooldownTimeRemaining > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
  onMouseDown={cooldownTimeRemaining === 0 ? handleHoldStart : undefined}
  onMouseUp={cooldownTimeRemaining === 0 ? handleHoldRelease : undefined}
  onTouchStart={cooldownTimeRemaining === 0 ? handleHoldStart : undefined}
  onTouchEnd={cooldownTimeRemaining === 0 ? handleHoldRelease : undefined}
  onContextMenu={(e) => e.preventDefault()} // Preventing the context menu
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  <Image src={scorpion} alt="Scorpion" className="object-cover no-select" unselectable="on" />
  {state.isHolding && (
    <motion.div
      className="absolute inset-0 bg-[#f48d2f] opacity-30 rounded-full flex justify-center items-center"
      initial={{ scale: 1 }}
      animate={{ scale: 1.1 }}
      transition={{ duration: 0.5, yoyo: Infinity }}
    >
      <p className="text-white text-2xl animate-pulse">{state.reward} Scorpions</p>
    </motion.div>
  )}
</motion.div>

      </div>
        {/* Energy and Status Display */}
        <div className="flex justify-between items-center mt-custom">
        {cooldownTimeRemaining > 0 ? (
      <div className="bg-[#f48d2f] text-white font-bold px-4 rounded-full">{formatTime(cooldownTimeRemaining)}</div>
    ) : (
      <div className="bg-[#f48d2f] text-white font-bold px-4 rounded-full">{state.energy}%</div>
    )}
        <span className="text-[#f48d2f] font-semibold"> 
          {cooldownTimeRemaining > 0 ? (
      <span className="text-[#f48d2f] font-semibold text-sm">
        Cooling Down
      </span>
    ) : (
      <span className="text-[#f48d2f] font-semibold text-sm">
        Hold to Catch Scorpions
      </span>
    )}
        </span>

      </div>

      <div className="relative w-full h-4 bg-gray-300 rounded-full shadow-md overflow-hidden mb-2 mt-2">
    {/* Energy Progress Bar */}
    <div
      className="absolute top-0 left-0 h-4 bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-500"
      style={{ width: `${state.energy}%` }} // Energy progress
    />
    {/* Cooldown Indicator */}
   
  </div>
      <p className="text-[#f48d2f] text-center mt-2 text-sm">
        Hold the scorpion to catch more. The longer you hold, the more scorpions you earn.
      </p>
    </div>
  );
}
