'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { scorpion } from '@/app/images';
import { Title } from '@telegram-apps/telegram-ui';
import { getPlayerData, PlayerData, savePlayerData, updatePlayerBalance } from '@/app/hooks/indexedDBClient';
import DailyStreakModal from './DailyStreakModal';
import useAuth from '@/app/hooks/useAuth';
import Preloader from './Preloader';
import Image from 'next/image';

interface Task {
  id: number;
  description: string;
  completed: boolean;
  reward: number;
}

interface GameState {
  scorpionsCaught: number;
  energy: number;
  isHolding: boolean;
  reward: number;
  tasks: Task[];
  level: number;
  holdDuration: number;
}

export default function GameComponent() {
  const { user, playerData, isLoading } = useAuth();
  const [state, setState] = useState<GameState>({
    scorpionsCaught: 0,
    energy: 100,
    isHolding: false,
    reward: 0,
    level: 1,
    holdDuration: 0,
    tasks: [
      { id: 1, description: 'Catch 50 scorpions in one hold', completed: false, reward: 50 },
      { id: 2, description: 'Hold for a total of 300 seconds', completed: false, reward: 30 },
    ],
  });
  const [cooldownTimeRemaining, setCooldownTimeRemaining] = useState(0);
  const [balance, setBalance] = useState<number>(0);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [dailyStreak, setDailyStreak] = useState<number>(0);
  const [dailyReward, setDailyReward] = useState<number>(0);


  // Initialize player data and daily login reward logic
  useEffect(() => {
    if (!user || isLoading) return;

    const initializePlayer = async () => {
      if (!playerData) {
        // Initialize player data if not existing
        const initialData: PlayerData = {
          id: user.id,
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name,
          languageCode: user.language_code,
          balance: 0, // Initial balance
          miningLevel: 1, // Initial level
          energy: 100, // Initial energy
          lastHarvestTime: Date.now(), // Initialize with current time
          lastExhaustedTime: Date.now(), // Initialize with current time
          lastLoginDate: new Date().toISOString().split('T')[0], // Today's date
          loginStreak: 1, // Initial login streak
          cooldownEndTime: 0 // Initialize if required
        };

        await savePlayerData(initialData); // Save the initialized player data
    setDailyStreak(1);
    setDailyReward(calculateDailyReward(1));
    setShowModal(true); // Show reward modal on first login
  } else {
        // Check for daily login rewards and update player balance
        await checkDailyLoginReward(playerData);
        setBalance(playerData.balance);
        setState((s) => ({ ...s, energy: playerData.energy }));

        // Handle cooldown time if it's active
        const now = Date.now();
        if (playerData.cooldownEndTime && playerData.cooldownEndTime > now) {
          const remainingCooldown = Math.floor((playerData.cooldownEndTime - now) / 1000);
          setCooldownTimeRemaining(remainingCooldown);
        }
      }
    };

    initializePlayer();
  }, [user, playerData, isLoading]);

  const checkDailyLoginReward = async (playerData: any) => {
    const today = new Date().toISOString().split('T')[0];
    const lastLoginDate = playerData.lastLoginDate;

    if (today !== lastLoginDate) {
      let newLoginStreak = playerData.loginStreak;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      if (new Date(lastLoginDate).toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]) {
        newLoginStreak = Math.min(newLoginStreak + 1, 30);
      } else {
        newLoginStreak = 1;
      }

      const reward = calculateDailyReward(newLoginStreak);
      playerData.lastLoginDate = today;
      playerData.loginStreak = newLoginStreak;
      playerData.balance += reward;

      setDailyStreak(newLoginStreak);
      setDailyReward(reward);
      setShowModal(true);

      await savePlayerData(playerData);
    }
  };

  const calculateDailyReward = (streak: number): number => {
    return streak * 10;
  };

  useEffect(() => {
    if (cooldownTimeRemaining > 0) {
      const cooldownInterval = setInterval(() => {
        setCooldownTimeRemaining((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(cooldownInterval);
    } else if (cooldownTimeRemaining === 0 && !state.isHolding && state.energy < 100) {
      setState((prev) => ({ ...prev, energy: 100 }));
    }
  }, [cooldownTimeRemaining, state.isHolding, state.energy]);

  const handleHoldStart = () => {
    if (state.energy > 0 && !state.isHolding) {
      setState((prev) => ({ ...prev, isHolding: true }));
      const startTime = Date.now();
  
      const intervalHandler = async () => {
        const duration = (Date.now() - startTime) / 1000;
        const updatedTasks = [...state.tasks];
  
        if (!user) {
          console.error('User is not authenticated');
          return;
        }
  
        for (let i = 0; i < updatedTasks.length; i++) {
          const task = updatedTasks[i];
          if (!task.completed && ((task.id === 2 && duration >= 300) || (task.id === 1 && state.reward + 1 >= 50))) {
            const newBalance = balance + task.reward;
            setBalance(newBalance);
            await updatePlayerBalance(user.id, task.reward); // Now safe to use 'user.id'
            updatedTasks[i] = { ...task, completed: true, reward: 0 };
          }
        }
  
        setState((prev) => ({
          ...prev,
          tasks: updatedTasks,
          reward: prev.reward + 1,
          energy: Math.max(prev.energy - 1, 0),
        }));
      };
  
      holdIntervalRef.current = setInterval(intervalHandler, 1000);
    }
  };  

  const handleHoldRelease = async () => {
    if (state.isHolding) {
      clearInterval(holdIntervalRef.current!);
      holdIntervalRef.current = null;

      const updatedTasks = state.tasks.map((task) => {
        return task.completed ? { ...task, reward: 0 } : task;
      });

      const newBalance = balance + state.reward;
      setState((prev) => ({
        ...prev,
        scorpionsCaught: prev.scorpionsCaught + prev.reward,
        reward: 0,
        isHolding: false,
        tasks: updatedTasks,
      }));

      setBalance(newBalance);
      const cooldownDuration = 3 * 3600;
      const cooldownEndTime = Date.now() + cooldownDuration * 1000;
      setCooldownTimeRemaining(cooldownDuration);

      await savePlayerData({
        ...playerData,
        balance: newBalance,
        energy: state.energy,
        cooldownEndTime,
      });
    }
  };

  if (isLoading) {
    return <Preloader />;
  }

  // Format time for cooldown
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="p-6">
      {/* Daily Streak Modal */}
      {showModal && (
        <DailyStreakModal streak={dailyStreak} reward={dailyReward} onClose={() => setShowModal(false)} />
      )}

      <div className="flex justify-center">
        <div className="text-center">
          <Title caps level="1" weight="1" className="text-5xl text-white">
            {balance}
          </Title>
          <p className="text-lg text-[#f48d2f]">
            Catching <strong>{state.reward} scorpions</strong>
          </p>
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
          <div className="bg-[#f48d2f] text-white font-bold px-4 rounded-full">
            {formatTime(cooldownTimeRemaining)}
          </div>
        ) : (
          <div className="bg-[#f48d2f] text-white font-bold px-4 rounded-full">{state.energy}%</div>
        )}
        <span className="text-[#f48d2f] font-semibold">
          {cooldownTimeRemaining > 0 ? (
            <span className="text-[#f48d2f] font-semibold text-sm">Cooling Down</span>
          ) : (
            <span className="text-[#f48d2f] font-semibold text-sm">Hold to Catch Scorpions</span>
          )}
        </span>
      </div>

      <div className="relative w-full h-4 bg-gray-300 rounded-full shadow-md overflow-hidden mb-2 mt-2">
        {/* Energy Progress Bar */}
        <div
          className="absolute top-0 left-0 h-4 bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-500"
          style={{ width: `${state.energy}%` }} // Energy progress
        />
      </div>

      <p className="text-[#f48d2f] text-center mt-2 text-sm">
        Hold the scorpion to catch more. The longer you hold, the more scorpions you earn.
      </p>
    </div>
  );
}
