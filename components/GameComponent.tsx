'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { scorpion } from '@/app/images';
import { Title } from '@telegram-apps/telegram-ui';
import { getPlayerData, initializePlayerData, savePlayerData, updatePlayerBalance } from '@/app/hooks/indexedDBClient'; // Import your DB functions
import { FaTelegramPlane, FaTwitter, FaFacebook, FaYoutube, FaInstagram, FaBug, FaFlagCheckered, FaLevelUpAlt, FaTools } from 'react-icons/fa';
import Image from 'next/image';
import DailyStreakModal from './DailyStreakModal'; // Import the daily streak modal component
import useAuth from '@/app/hooks/useAuth';
import Preloader from './Preloader';

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

// Define task structure
interface Task {
  id: number;
  description: string;
  completed: boolean;
  reward: number;
}

// Define game state interface
interface GameState {
  scorpionsCaught: number;
  energy: number;
  isHolding: boolean;
  reward: number;
  tasks: Task[];
  level: number;  // Add level to the game state
  holdDuration: number; // Add hold duration tracking
}

export default function GameComponent() {
  const { user, isLoading } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [state, setState] = useState<GameState>({
    scorpionsCaught: 0,
    energy: 100,
    isHolding: false,
    reward: 0,
    level: 1,  // Initial player level
    holdDuration: 0, // Add holdDuration initialization
    tasks: [
      { id: 1, description: "Catch 50 scorpions in one hold", completed: false, reward: 50 },
      { id: 2, description: "Hold for a total of 300 seconds", completed: false, reward: 30 },
    ],
  });
  
  const [cooldownTimeRemaining, setCooldownTimeRemaining] = useState(0);
  const [balance, setBalance] = useState(0);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [showPreloader, setShowPreloader] = useState(true); // Show preloader state
  const [showModal, setShowModal] = useState<boolean>(false); // Show modal for daily reward
  const [dailyStreak, setDailyStreak] = useState<number>(0); // Track login streak
  const [dailyReward, setDailyReward] = useState<number>(0); // Track daily reward

  // Add a delay for the preloader (50 seconds)
  useEffect(() => {
    const preloaderTimeout = setTimeout(() => {
      setShowPreloader(false); // After 50 seconds, hide the preloader
    }, 50000); // 50 seconds delay

    return () => clearTimeout(preloaderTimeout); // Cleanup on unmount
  }, []);

  // Initialize player data
  useEffect(() => {
    const initWebApp = async () => {
      const WebApp = (await import('@twa-dev/sdk')).default;
      WebApp.ready();
      const user = WebApp.initDataUnsafe.user as UserData;
      setUserData(user);
      const playerData = await getPlayerData(user.id);
      if (!playerData) {
        await initializePlayerData({
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          username: user.username,
          languageCode: user.language_code,
          balance: 0,
          miningLevel: 1,
          lastHarvestTime: Date.now(),
          lastExhaustedTime: Date.now(),
          energy: 100, // Default energy
          cooldownEndTime: 0,
          lastLoginDate: new Date().toISOString().split('T')[0], // Track last login date
          loginStreak: 1, // Start with a 1-day streak
        });
        setDailyStreak(1);
        setDailyReward(calculateDailyReward(1));
        setShowModal(true); // Show reward modal on first login
      } else {
        // Check if the player qualifies for a daily login reward
        await checkDailyLoginReward(playerData);
        setBalance(playerData.balance);
        setState((s) => ({ ...s, energy: playerData.energy }));

        // Check if cooldown is active
        const now = Date.now();
        if (playerData.cooldownEndTime && playerData.cooldownEndTime > now) {
          const remainingCooldown = Math.floor((playerData.cooldownEndTime - now) / 1000);
          setCooldownTimeRemaining(remainingCooldown);
        }
      }
    };

    initWebApp();
  }, []);

  const checkDailyLoginReward = async (playerData: any) => {
    const today = new Date().toISOString().split('T')[0];
    const lastLoginDate = playerData.lastLoginDate;

    if (today !== lastLoginDate) {
      let newLoginStreak = playerData.loginStreak;

      // Continue the streak if last login was yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (new Date(lastLoginDate).toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]) {
        newLoginStreak = Math.min(newLoginStreak + 1, 30); // Cap at 30 days
      } else {
        // Reset streak if more than a day passed
        newLoginStreak = 1;
      }

      // Calculate reward based on streak
      const reward = calculateDailyReward(newLoginStreak);

      // Update player data
      playerData.lastLoginDate = today;
      playerData.loginStreak = newLoginStreak;
      playerData.balance += reward;

      // Update player state and show modal
      setDailyStreak(newLoginStreak);
      setDailyReward(reward);
      setShowModal(true);

      await savePlayerData(playerData); // Save updated data to IndexedDB
    }
  };

  // Calculate reward based on login streak
  const calculateDailyReward = (streak: number): number => {
    return streak * 10; // Example: reward increases by 10 each day
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
        for (let i = 0; i < updatedTasks.length; i++) {
          const task = updatedTasks[i];
          if (!task.completed && ((task.id === 2 && duration >= 300) || (task.id === 1 && state.reward + 1 >= 50))) {
            const newBalance = balance + task.reward;
            setBalance(newBalance);
            await updatePlayerBalance(userData!.id, task.reward);
            updatedTasks[i] = { ...task, completed: true, reward: 0 }; // Mark as completed
          }
        }

        setState((prev) => {
          if (prev.energy > 0) {
            const newState = {
              ...prev,
              tasks: updatedTasks,
              reward: prev.reward + 1,
              energy: Math.max(prev.energy - 1, 0),
            };
            savePlayerData({
              id: userData!.id,
              balance,
              energy: newState.energy,
              miningLevel: 1, // Update with your current logic
              lastHarvestTime: Date.now(),
              lastExhaustedTime: Date.now(),
              lastLoginDate: '',
              loginStreak: 0
            });
            return newState;
          } else {
            handleHoldRelease();
            return prev;
          }
        });
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
      const cooldownDuration = 3 * 3600; // 3 hours cooldown
      const cooldownEndTime = Date.now() + cooldownDuration * 1000;
      setCooldownTimeRemaining(cooldownDuration);

      await savePlayerData({
        id: userData!.id,
        balance: newBalance,
        energy: state.energy,
        miningLevel: 1,
        lastHarvestTime: Date.now(),
        lastExhaustedTime: Date.now(),
        cooldownEndTime,
        lastLoginDate: '',
        loginStreak: 0
      });
    }
  };

  // Format time for cooldown
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  };

  // Show the preloader for 50 seconds, then render the game component
  if (showPreloader || isLoading) {
    return <Preloader />;
  }

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
