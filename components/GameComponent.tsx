'use client';

import WebApp from '@twa-dev/sdk';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion'; // For smooth animations
import { scorpion } from '@/app/images';
import { Button, Placeholder, Title } from '@telegram-apps/telegram-ui';


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
}

export default function ProfessionalScorpionGame() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userId, setUserId] = useState('');
  const [initData, setInitData] = useState('');
  const [startParam, setStartParam] = useState('');
  const [state, setState] = useState<GameState>({
    scorpionsCaught: 0,
    energy: 100,
    isHolding: false,
    reward: 0,
  });
  const [cooldownTimeRemaining, setCooldownTimeRemaining] = useState(0);
  const [balance, setBalance] = useState(0);
  const [holdingStartTime, setHoldingStartTime] = useState<number | null>(null);

  // Energy and cooldown management
  useEffect(() => {
    if (state.energy === 0 && cooldownTimeRemaining === 0) {
      setCooldownTimeRemaining(5); // 5-second cooldown
    }

    if (cooldownTimeRemaining > 0) {
      const interval = setInterval(() => {
        setCooldownTimeRemaining((prev) => prev - 1);
      }, 1000);

      return () => clearInterval(interval);
    } else if (cooldownTimeRemaining === 0 && state.energy < 100) {
      setState((prev) => ({ ...prev, energy: 100 }));
    }
  }, [state.energy, cooldownTimeRemaining]);

  // Telegram WebApp SDK initialization
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

  // Handle scorpion holding logic
  const handleHoldStart = () => {
    if (state.energy > 0 && !state.isHolding) {
      setState((prev) => ({ ...prev, isHolding: true }));
      setHoldingStartTime(Date.now());
      const holdInterval = setInterval(() => {
        setState((prev) => ({
          ...prev,
          reward: prev.reward + 1,
          energy: prev.energy - 5, // Decrease energy
        }));

        if (state.energy <= 0) {
          clearInterval(holdInterval);
          handleHoldRelease();
        }
      }, 500); // Increase reward every 500ms

      return () => clearInterval(holdInterval);
    }
  };

  // Handle hold release
  const handleHoldRelease = () => {
    if (state.isHolding && holdingStartTime) {
      const holdDuration = (Date.now() - holdingStartTime) / 1000; // Hold duration in seconds
      const bonusMultiplier = holdDuration > 5 ? 2 : 1; // Bonus multiplier for long holds
      const newReward = state.reward * bonusMultiplier;
      
      setState((prev) => ({
        ...prev,
        scorpionsCaught: prev.scorpionsCaught + newReward,
        reward: 0,
        isHolding: false,
      }));
      setBalance((prevBalance) => prevBalance + newReward);
    }
  };

  // Format cooldown time
  const formatTime = (time: number) => {
    return `${Math.floor(time / 60)}:${time % 60 < 10 ? '0' : ''}${time % 60}`;
  };

  return (
    <div className="p-6">
    <div className="flex justify-center">
        <div className="text-center">
  <Title 
  level="2"
    weight="1" className="text-4xl text-white">{balance} </Title>
          <p className="text-lg text-[#f48d2f]">Catching <strong>{state.reward} scorpions</strong></p>
        </div>
      </div>
      {/* Scorpion Hold Interaction */}
      <div className="flex justify-center mt-6">
        <motion.div
          className={`relative w-[250px] h-[250px] rounded-full border-8 border-[#f48d2f] flex items-center justify-center cursor-pointer ${cooldownTimeRemaining > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          onMouseDown={handleHoldStart}
          onMouseUp={handleHoldRelease}
          onTouchStart={handleHoldStart}
          onTouchEnd={handleHoldRelease}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Image src={scorpion} alt="Scorpion" className="object-cover" />
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
      <div className="flex justify-between items-center mt-6">
        {cooldownTimeRemaining > 0 ? (
          <div className="bg-[#f48d2f] text-white font-bold px-4 rounded-full">Refilling</div>
        ) : (
          <div className="bg-[#f48d2f] text-white font-bold px-4 rounded-full">{state.energy}%</div>
        )}
        <span className="text-[#f48d2f] font-semibold">
          {cooldownTimeRemaining > 0 ? (
            <span className="text-sm">Cooling Down</span>
          ) : (
            <span className="text-sm">Hold to Catch Scorpions</span>
          )}
        </span>
      </div>

      {/* Energy Progress Bar */}
      <div className="relative w-full h-4 bg-gray-300 rounded-full shadow-md overflow-hidden mb-2 mt-2">
        <motion.div
          className="absolute top-0 left-0 h-4 bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-500"
          style={{ width: `${state.energy}%` }}
        />
        {cooldownTimeRemaining > 0 && (
          <motion.div
            className="absolute top-0 left-0 h-full bg-gray-500 opacity-70 p-2 flex items-center justify-center text-white text-sm font-bold transition-all duration-500"
            animate={{ scale: 1.1 }}
            transition={{ yoyo: Infinity, duration: 1 }}
          >
            <span>Refilling... {formatTime(cooldownTimeRemaining)}</span>
          </motion.div>
        )}
      </div>

      <p className="text-[#f48d2f] text-center mt-2 text-sm">
        Hold the scorpion to catch more. The longer you hold, the more scorpions you earn.
      </p>
    </div>
  );
}
