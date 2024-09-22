'use client';

import { useEffect, useState, useRef } from 'react';
import { FaTelegramPlane, FaTwitter, FaFacebook, FaYoutube, FaInstagram, FaBug } from 'react-icons/fa';
import { getPlayerData, initializePlayerData, savePlayerData, updatePlayerBalance } from '@/app/hooks/indexedDBClient';
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

// Define task structure
interface Task {
  id: number;
  description: string;
  completed: boolean;
  reward: number;
  requiredBalance?: number;
}

// Define game state interface
interface GameState {
  scorpionsCaught: number;
  energy: number;
  isHolding: boolean;
  reward: number;
  tasks: Task[];
  level: number;
  holdDuration: number;
}

export default function TaskComponent() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [state, setState] = useState<GameState>({
    scorpionsCaught: 0,
    energy: 100,
    isHolding: false,
    reward: 0,
    level: 1,
    holdDuration: 0,
    tasks: [
      { id: 1, description: 'Catch 50 scorpions in one hold', completed: false, reward: 50, requiredBalance: 500 },
      { id: 2, description: 'Hold for a total of 300 seconds', completed: false, reward: 30, requiredBalance: 300 },
    ],
  });
  const [cooldownTimeRemaining, setCooldownTimeRemaining] = useState(0);
  const [balance, setBalance] = useState(0);
  const [loadingTaskId, setLoadingTaskId] = useState<number | null>(null); // Track which task is loading
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [activeTab, setActiveTab] = useState<'in-game' | 'social'>('in-game');

  // Add social tasks
  const socialTasks = [
    { platform: 'Telegram', task: 'Join our TG channel', link: 'https://t.me/example_channel', reward: 10 },
    { platform: 'Telegram', task: 'Join our TG Community', link: 'https://t.me/example_channel', reward: 10 },
    { platform: 'Twitter', task: 'Follow us on Twitter', link: 'https://twitter.com/example_account', reward: 8 },
    { platform: 'Facebook', task: 'Like us on Facebook', link: 'https://facebook.com/example_page', reward: 5 },
    { platform: 'YouTube', task: 'Subscribe to our YouTube channel', link: 'https://youtube.com/example_channel', reward: 7 },
    { platform: 'Instagram', task: 'Follow us on Instagram', link: 'https://instagram.com/example_profile', reward: 6 },
  ];

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
          energy: 0,
          cooldownEndTime: 0,
        });
      } else {
        setBalance(playerData.balance);
        setState((s) => ({ ...s, energy: playerData.energy }));
        const now = Date.now();
        if (playerData.cooldownEndTime && playerData.cooldownEndTime > now) {
          setCooldownTimeRemaining(Math.floor((playerData.cooldownEndTime - now) / 1000));
        }
      }
    };

    initWebApp();
  }, []);

  // Handle cooldown time update
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

  // Task completion logic with balance and progress validation
  const handleTaskComplete = async (taskId: number) => {
    // Set the loading state for this task
    setLoadingTaskId(taskId);

    const taskToComplete = state.tasks.find((task) => task.id === taskId);

    if (taskToComplete && !taskToComplete.completed) {
      // Simulate a loading delay (you can replace this with actual logic if needed)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (balance >= (taskToComplete.requiredBalance || 0) && state.scorpionsCaught >= 50) {
        // If player meets the criteria
        const newBalance = balance + taskToComplete.reward;
        setBalance(newBalance);
        setState((prevState) => ({
          ...prevState,
          tasks: prevState.tasks.map((t) => (t.id === taskId ? { ...t, completed: true } : t)),
        }));
        await updatePlayerBalance(userData!.id, taskToComplete.reward);
      } else {
        alert("You don't meet the requirements to complete this task.");
      }
    }

    // Reset the loading state after checking
    setLoadingTaskId(null);
  };

  // Format time for cooldown
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
          <Title caps level="1" weight="1" className="text-5xl text-white">
            {balance}
          </Title>
          <p className="text-lg text-[#f48d2f]">Complete tasks to earn Scorpion rewards</p>
        </div>
      </div>

      {/* Tabs for Social and In-Game Tasks */}
      <div className="flex justify-center space-x-4 mt-4">
        <button
          onClick={() => setActiveTab('in-game')}
          className={`py-2 px-6 rounded-lg ${activeTab === 'in-game' ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-white'}`}
        >
          Game Tasks
        </button>
        <button
          onClick={() => setActiveTab('social')}
          className={`py-2 px-6 rounded-lg ${activeTab === 'social' ? 'bg-blue-500 text-black' : 'bg-gray-700 text-white'}`}
        >
          Social Tasks
        </button>
      </div>

      {/* Task List */}
      <div className="mt-6">
        {activeTab === 'in-game' ? (
          <div className="space-y-4">
            {state.tasks.map((task) => (
              <div key={task.id} className="flex justify-between items-center bg-gray-900 text-white p-4 mb-4 rounded-lg shadow-lg ">
                <div className="flex items-center space-x-6 gap-2">
                  <FaBug className="text-4xl text-yellow-500" />
                  <div>
                    <p className="text-sm">{task.description}</p>
                    <p className="text-xs">+{task.reward} Scorpion</p>
                  </div>
                </div>
                <button
                  onClick={() => handleTaskComplete(task.id)}
                  disabled={task.completed || loadingTaskId === task.id} // Disable if the task is loading or already completed
                  className={`py-2 px-4 rounded-lg shadow-md ${
                    task.completed || loadingTaskId === task.id
                      ? 'bg-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {loadingTaskId === task.id ? 'Loading...' : task.completed ? 'Done' : 'Claim'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {socialTasks.map((task, index) => (
              <div key={index} className="flex justify-between items-center bg-gray-900 text-white p-4 mb-4 rounded-lg shadow-lg">
                <div className="flex items-center space-x-4">
                  {task.platform === 'Telegram' && <FaTelegramPlane className="text-2xl text-blue-500" />}
                  {task.platform === 'Twitter' && <FaTwitter className="text-2xl text-blue-400" />}
                  {task.platform === 'Facebook' && <FaFacebook className="text-2xl text-blue-700" />}
                  {task.platform === 'YouTube' && <FaYoutube className="text-2xl text-red-600" />}
                  {task.platform === 'Instagram' && <FaInstagram className="text-2xl text-pink-500" />}
                  <div>
                    <p className="text-sm">{task.task}</p>
                    <p className="text-xs">+{task.reward} Scorpion</p>
                  </div>
                </div>
                <a
                  href={task.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg shadow-md"
                >
                  Start
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
