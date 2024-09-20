'use client';

import React, { useState, useEffect, useReducer } from 'react';
import Image from 'next/image';
import { scorpion } from '@/app/images';
import { getPlayerData, savePlayerData } from '@/app/hooks/indexedDBClient';
import { Button, Placeholder, Title } from '@telegram-apps/telegram-ui';
import WebApp from '@twa-dev/sdk';

interface GameComponentProps {
  initialBalance: number;
  initialMiningLevel: number;
}

interface State {
  energy: number;
  reward: number;
  isHolding: boolean;
}

// Define the interface for user data
interface UserData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code: string;
  is_premium?: boolean;
}

type Action =
  | { type: 'START_HOLD' }
  | { type: 'RELEASE_HOLD' }
  | { type: 'DECREMENT_ENERGY'; miningLevel: number }
  | { type: 'RESET_ENERGY' };

const initialState: State = {
  energy: 100,
  reward: 0,
  isHolding: false,
};

// Reducer to manage game state
const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'START_HOLD':
      return { ...state, isHolding: true, energy: 100, reward: 0 };
    case 'RELEASE_HOLD':
      return { ...state, isHolding: false };
    case 'DECREMENT_ENERGY':
      const newEnergy = state.energy > 0 ? state.energy - 1 : 0;
      const updatedReward = Math.floor((100 - newEnergy) * (action.miningLevel / 10));

      // Automatically release hold when energy reaches 0
      if (newEnergy === 0) {
        return { ...state, energy: newEnergy, reward: updatedReward, isHolding: false };
      }

      return { ...state, energy: newEnergy, reward: updatedReward };
    case 'RESET_ENERGY':
      return { ...state, energy: 100, reward: 0 };
    default:
      return state;
  }
};


const GameComponent: React.FC<GameComponentProps> = ({ initialBalance, initialMiningLevel }) => {
    const [balance, setBalance] = useState<number>(initialBalance);
    const [miningLevel, setMiningLevel] = useState<number>(initialMiningLevel);
    const [state, dispatch] = useReducer(reducer, initialState);
    const [lastHarvestTime, setLastHarvestTime] = useState<number>(Date.now());
    const [lastExhaustedTime, setLastExhaustedTime] = useState<number | undefined>(undefined);
    const [timeRemaining, setTimeRemaining] = useState<number>(0);
    const [cooldownTimeRemaining, setCooldownTimeRemaining] = useState<number>(0);
     const [userData, setUserData] = useState<UserData | null>(null);
  const [userId, setUserId] = useState('');
  const [initData, setInitData] = useState('');
  const [startParam, setStartParam] = useState('');
  
    const COOLDOWN_PERIOD = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
  
    // Initialize Telegram WebApp and get initData
    // Inside useEffect:
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
  // Load player data from IndexedDB when initData is available
  useEffect(() => {
    const loadPlayerData = async () => {
      if (typeof window !== 'undefined' && initData?.user?.id) {
        try {
          const playerData = await getPlayerData(initData.user.id); // Fetch using Telegram user ID

          if (playerData) {
            setBalance(playerData.balance ?? 0);
            setMiningLevel(playerData.miningLevel ?? 1);
            setLastHarvestTime(playerData.lastHarvestTime ?? Date.now()); // Ensure lastHarvestTime is loaded
            setLastExhaustedTime(playerData.lastExhaustedTime);
          } else {
            setBalance(0);
            setMiningLevel(1);
            setLastHarvestTime(Date.now());
            setLastExhaustedTime(undefined);
          }
        } catch (error) {
          console.error('Error loading player data:', error);
        }
      }
    };

    loadPlayerData();
  }, [initData]); // Reload player data whenever initData changes

  // Save player data automatically when balance, mining level, or last harvest time changes
  useEffect(() => {
    const saveData = async () => {
      if (typeof window !== 'undefined' && initData?.user?.id) {
        try {
          await savePlayerData({
            id: initData.user.id,
            username: initData.user.username,
            firstName: initData.user.firstName,
            lastName: initData.user.lastName,
            photoUrl: initData.user.photoUrl,
            isBot: initData.user.isBot,
            isPremium: initData.user.isPremium,
            languageCode: initData.user.languageCode,
            balance,
            miningLevel,
            lastHarvestTime, // Ensure lastHarvestTime is saved correctly
            lastExhaustedTime: lastExhaustedTime ?? Date.now(),
          });
        } catch (error) {
          console.error('Error saving player data:', error);
        }
      }
    };

    saveData();
  }, [balance, miningLevel, lastHarvestTime, lastExhaustedTime, initData]);

  // Calculate the remaining time for next harvest
  useEffect(() => {
    const updateRemainingTime = () => {
      const currentTime = Date.now();
      const nextHarvestTime = lastHarvestTime + COOLDOWN_PERIOD;
      const timeLeft = nextHarvestTime - currentTime;
      setTimeRemaining(timeLeft > 0 ? timeLeft : 0);
    };

    const interval = setInterval(updateRemainingTime, 1000);
    return () => clearInterval(interval);
  }, [lastHarvestTime]);

  // Calculate cooldown time for refilling energy after exhaustion
  useEffect(() => {
    if (lastExhaustedTime) {
      const updateCooldownTime = () => {
        const currentTime = Date.now();
        const cooldownEndTime = lastExhaustedTime + COOLDOWN_PERIOD;
        const timeLeft = cooldownEndTime - currentTime;
        setCooldownTimeRemaining(timeLeft > 0 ? timeLeft : 0);
      };

      const interval = setInterval(updateCooldownTime, 1000);
      return () => clearInterval(interval);
    }
  }, [lastExhaustedTime]);

  // Handle holding the scorpion
  const handleHoldStart = () => {
    if (!state.isHolding && cooldownTimeRemaining === 0) {
      dispatch({ type: 'START_HOLD' });
    }
  };

  // Decrement energy while holding
  useEffect(() => {
    if (state.isHolding && state.energy > 0) {
      const interval = setInterval(() => {
        dispatch({ type: 'DECREMENT_ENERGY', miningLevel });
      }, 100); // Adjust the time interval if needed

      return () => clearInterval(interval);
    } else if (state.energy === 0 && state.isHolding) {
      handleHoldRelease(); // Automatically release hold when energy reaches 0
    }
  }, [state.isHolding, state.energy, miningLevel]);

  // Handle releasing the scorpion
  const handleHoldRelease = () => {
    const newBalance = balance + state.reward;
    setBalance(newBalance);
    dispatch({ type: 'RELEASE_HOLD' });

    if (state.energy === 0) {
      setLastExhaustedTime(Date.now()); // Set exhausted time when energy reaches 0
    }
  };

  // Handle timed harvest
  const handleHarvest = () => {
    if (timeRemaining === 0) {
      const harvestedReward = 100; // Harvested amount
      const newBalance = balance + harvestedReward;
      setBalance(newBalance);
      const currentTime = Date.now();
      setLastHarvestTime(currentTime); // Save new lastHarvestTime after harvesting
    }
  };

  // Convert time remaining to hours, minutes, and seconds
  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
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
      <div className="flex justify-center mt-custom">
        <div
          className={`relative w-[250px] h-[250px] rounded-full border-8 border-[#f48d2f] flex items-center justify-center cursor-pointer ${cooldownTimeRemaining > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          onMouseDown={handleHoldStart}
          onMouseUp={handleHoldRelease}
          onTouchStart={handleHoldStart}
          onTouchEnd={handleHoldRelease}
        >
          <Image src={scorpion} alt="Scorpion" className="object-cover" />
          {state.isHolding && (
            <div className="absolute inset-0 bg-[#f48d2f] opacity-30 rounded-full animate-pulse flex justify-center items-center">
              <p className="text-white text-2xl">{state.reward} Scorpions</p>
            </div>
          )}
        </div>
      </div>
      

      {/* Energy and Status Display */}
      <div className="flex justify-between items-center mt-custom">
        {cooldownTimeRemaining > 0 ? (
      <div className="bg-[#f48d2f] text-white font-bold px-4 rounded-full">Refilling</div>
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
    {cooldownTimeRemaining > 0 && (
      <div className="absolute top-0 left-0 h-full bg-gray-500 opacity-70 p-2 flex items-center justify-center text-white text-sm font-bold transition-all duration-500">
        {/* Show refilling progress as a percentage or remaining time */}
        <span>Refilling... {formatTime(cooldownTimeRemaining)}</span>
      </div>
    )}
  </div>

      <p className="text-[#f48d2f] text-center mt-2 text-sm">
        Hold the coin to make it grow. The longer you hold, the more coins you earn.
      </p>
    </div>
  );
};

export default GameComponent;
