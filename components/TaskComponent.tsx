'use client';

import { useEffect, useState } from 'react';
import { FaTelegramPlane, FaTwitter, FaFacebook, FaYoutube, FaInstagram, FaBug } from 'react-icons/fa';
import { getPlayerData, updatePlayerBalance } from '@/app/hooks/indexedDBClient';
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

interface Task {
  id: number;
  description: string;
  completed: boolean;
  reward: number;
  requiredBalance?: number;
  status?: 'pending' | 'approved' | 'not_started'; // Strict typing for task status
  link?: string;  // For social tasks
  platform?: string;  // For social tasks
}


// Define game state interface
interface GameState {
  balance: number;
  tasks: Task[];
}

// Function to return in-game tasks based on balance milestones
const getInGameTasksBasedOnBalance = (balance: number): Task[] => {
  return [
    { id: 1, description: 'Reach a balance of 500 Scorpions', completed: balance >= 500, reward: 50, requiredBalance: 500 },
    { id: 2, description: 'Reach a balance of 1000 Scorpions', completed: balance >= 1000, reward: 100, requiredBalance: 1000 },
    { id: 3, description: 'Reach a balance of 2000 Scorpions', completed: balance >= 2000, reward: 200, requiredBalance: 2000 },
    { id: 4, description: 'Reach a balance of 3000 Scorpions', completed: balance >= 3000, reward: 300, requiredBalance: 3000 },
    { id: 5, description: 'Reach a balance of 5000 Scorpions', completed: balance >= 5000, reward: 500, requiredBalance: 5000 },
  ];
};

// Define the social tasks
const socialTasksInitial: Task[] = [
  {
    id: 101, platform: 'Telegram', description: 'Join Telegram Channel', link: 'https://t.me/scorpioncommunity_channel', reward: 10, status: 'not_started',
    completed: false
  },
  {
    id: 102, platform: 'Telegram', description: 'Join Telegram Community', link: 'https://t.me/scorpion_community', reward: 10, status: 'not_started',
    completed: false
  },
  {
    id: 103, platform: 'Twitter', description: 'Follow on X', link: 'https://x.com/scorpionworld3', reward: 8, status: 'not_started',
    completed: false
  },
  {
    id: 104, platform: 'Facebook', description: 'Like on Facebook', link: 'https://web.facebook.com/people/Scorpionworld', reward: 5, status: 'not_started',
    completed: false
  },
  {
    id: 105, platform: 'YouTube', description: 'Subscribe to YouTube', link: 'https://youtube.com/example_channel', reward: 7, status: 'not_started',
    completed: false
  },
  {
    id: 106, platform: 'Instagram', description: 'Follow Instagram', link: 'https://www.instagram.com/scorpionworld3', reward: 6, status: 'not_started',
    completed: false
  },
];

export default function TaskComponent() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [balance, setBalance] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<'in-game' | 'social'>('in-game'); // To switch between tabs

  // Initialize player data and in-game tasks
  useEffect(() => {
    const initWebApp = async () => {
      const WebApp = (await import('@twa-dev/sdk')).default;
      WebApp.ready();
      const user = WebApp.initDataUnsafe.user as UserData;
      setUserData(user);

      const playerData = await getPlayerData(user.id);
      if (playerData) {
        setBalance(playerData.balance);
        setTasks(getInGameTasksBasedOnBalance(playerData.balance)); // Set tasks based on balance for in-game tasks
      }
    };

    initWebApp();
  }, []);

  // Handle task completion when the player clicks on a social task
  const handleSocialTaskClick = (taskId: number) => {
    const updatedTasks = tasks.map((task) => {
      if (task.id === taskId) {
        return { ...task, status: 'pending' as 'pending' }; // Set task to 'pending'
      }
      return task;
    });
    setTasks(updatedTasks);

    // You can now handle what happens when the user comes back, e.g., mark as 'approved'
  };

  return (
    <div className="p-2">
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
            {tasks.map((task) => (
              <div key={task.id} className="flex justify-between items-center bg-gray-900 text-white p-4 mb-4 rounded-lg shadow-lg">
                <div className="flex items-center space-x-6 gap-2">
                  <FaBug className="text-4xl text-yellow-500" />
                  <div>
                    <p className="text-sm">{task.description}</p>
                    <p className="text-xs text-[#f48d2f]">+{task.reward} Scorpion</p>
                  </div>
                </div>
                <button
                  disabled={task.completed}
                  className={`py-2 px-4 rounded-lg shadow-md ${task.completed ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                >
                  {task.completed ? 'Claimed' : 'Claim'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {socialTasksInitial.map((task) => (
              <div key={task.id} className="flex justify-between items-center bg-gray-900 text-white p-4 mb-4 rounded-lg shadow-lg">
                <div className="flex items-center space-x-4">
                  {task.platform === 'Telegram' && <FaTelegramPlane className="text-2xl text-blue-500" />}
                  {task.platform === 'Twitter' && <FaTwitter className="text-2xl text-blue-400" />}
                  {task.platform === 'Facebook' && <FaFacebook className="text-2xl text-blue-700" />}
                  {task.platform === 'YouTube' && <FaYoutube className="text-2xl text-red-600" />}
                  {task.platform === 'Instagram' && <FaInstagram className="text-2xl text-pink-500" />}
                  <div>
                    <p className="text-sm">{task.description}</p>
                    <p className="text-xs text-[#f48d2f]">+{task.reward} Scorpion</p>
                  </div>
                </div>
                <a
                  href={task.link} // Directly link to the task
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg shadow-md ${
                    task.status === 'approved' ? 'cursor-not-allowed opacity-50' : ''
                  }`}
                  onClick={() => handleSocialTaskClick(task.id)} // Handle the task click
                >
                  {task.status === 'pending' ? 'Pending Approval...' : task.status === 'approved' ? 'Approved' : 'Start'}
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
