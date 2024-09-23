'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@telegram-apps/telegram-ui'; // Ensure the Modal component is correctly imported
import { Button, Title } from '@telegram-apps/telegram-ui';
import {
  FaTelegramPlane,
  FaTwitter,
  FaFacebook,
  FaYoutube,
  FaInstagram,
  FaBug,
} from 'react-icons/fa';
import { getPlayerData, updatePlayerBalance } from '@/app/hooks/indexedDBClient';

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
  link?: string; // For social tasks
  platform?: string; // For social tasks
}

// Function to return in-game tasks based on balance milestones
const getInGameTasksBasedOnBalance = (balance: number): Task[] => {
  return [
    {
      id: 1,
      description: 'Reach a balance of 500 Scorpions',
      completed: balance >= 500,
      reward: 50,
      requiredBalance: 500,
    },
    {
      id: 2,
      description: 'Reach a balance of 1000 Scorpions',
      completed: balance >= 1000,
      reward: 100,
      requiredBalance: 1000,
    },
    {
      id: 3,
      description: 'Reach a balance of 2000 Scorpions',
      completed: balance >= 2000,
      reward: 200,
      requiredBalance: 2000,
    },
    {
      id: 4,
      description: 'Reach a balance of 3000 Scorpions',
      completed: balance >= 3000,
      reward: 300,
      requiredBalance: 3000,
    },
    {
      id: 5,
      description: 'Reach a balance of 5000 Scorpions',
      completed: balance >= 5000,
      reward: 500,
      requiredBalance: 5000,
    },
  ];
};

// Define the social tasks
const socialTasksInitial: Task[] = [
  {
    id: 101,
    platform: 'Telegram',
    description: 'Join Telegram Channel',
    link: 'https://t.me/scorpioncommunity_channel',
    reward: 10,
    status: 'not_started',
    completed: false,
  },
  {
    id: 102,
    platform: 'Telegram',
    description: 'Join Telegram Community',
    link: 'https://t.me/scorpion_community',
    reward: 10,
    status: 'not_started',
    completed: false,
  },
  {
    id: 103,
    platform: 'Twitter',
    description: 'Follow on X',
    link: 'https://x.com/scorpionworld3',
    reward: 8,
    status: 'not_started',
    completed: false,
  },
  {
    id: 104,
    platform: 'Facebook',
    description: 'Like on Facebook',
    link: 'https://web.facebook.com/people/Scorpionworld',
    reward: 5,
    status: 'not_started',
    completed: false,
  },
  {
    id: 105,
    platform: 'YouTube',
    description: 'Subscribe to YouTube',
    link: 'https://youtube.com/example_channel',
    reward: 7,
    status: 'not_started',
    completed: false,
  },
  {
    id: 106,
    platform: 'Instagram',
    description: 'Follow Instagram',
    link: 'https://www.instagram.com/scorpionworld3',
    reward: 6,
    status: 'not_started',
    completed: false,
  },
];

export default function TaskComponent() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [balance, setBalance] = useState(0);
  const [inGameTasks, setInGameTasks] = useState<Task[]>([]);
  const [socialTasks, setSocialTasks] = useState<Task[]>(socialTasksInitial);
  const [activeTab, setActiveTab] = useState<'in-game' | 'social'>('in-game'); // To switch between tabs
  const [isModalOpen, setIsModalOpen] = useState(false); // Track modal open state
  const [currentTask, setCurrentTask] = useState<Task | null>(null); // Track current task for the modal

  // Initialize player data and in-game tasks
  useEffect(() => {
    const initWebApp = async () => {
      try {
        const WebApp = (await import('@twa-dev/sdk')).default;
        WebApp.ready();
        const user = WebApp.initDataUnsafe.user as UserData;
        setUserData(user);

        const playerData = await getPlayerData(user.id);
        if (playerData) {
          setBalance(playerData.balance);
          setInGameTasks(getInGameTasksBasedOnBalance(playerData.balance)); // Set in-game tasks based on balance
        }
      } catch (error) {
        console.error('Error initializing web app:', error);
      }
    };

    initWebApp();
  }, []);

  // Handle task click to open the modal (for social tasks)
  const handleTaskClick = (task: Task) => {
    if (task.status === 'approved') return; // Do nothing if task is already approved
    setCurrentTask(task); // Set the current task to be displayed in the modal
    setIsModalOpen(true); // Open the modal
  };

  // Close the modal
  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentTask(null); // Reset the current task
  };

  // Task completion handler
  const handleTaskCompletion = async () => {
    if (!currentTask || !userData) return;

    try {
      const updatedSocialTasks = socialTasks.map((task) => {
        if (task.id === currentTask?.id) {
          // Explicitly cast the status as 'approved' to satisfy TypeScript
          return { ...task, status: 'approved' as 'approved', completed: true };
        }
        return task;
      });
      
      setSocialTasks(updatedSocialTasks);

      // Update player's balance and reward
      const newBalance = balance + (currentTask.reward || 0);
      setBalance(newBalance);
      await updatePlayerBalance(userData.id, currentTask.reward || 0); // Update balance in backend

      // Update in-game tasks based on new balance
      const updatedInGameTasks = getInGameTasksBasedOnBalance(newBalance);
      setInGameTasks(updatedInGameTasks);

      closeModal(); // Close the modal after completion
    } catch (error) {
      console.error('Error completing task:', error);
      alert('There was an error completing the task. Please try again.');
    }
  };

  // Handle claiming in-game tasks
  const handleClaimInGameTask = async (taskId: number) => {
    const taskToClaim = inGameTasks.find((task) => task.id === taskId);
    if (!taskToClaim || taskToClaim.completed) return;

    try {
      // Update task as claimed
      const updatedInGameTasks = inGameTasks.map((task) => {
        if (task.id === taskId) {
          return { ...task, completed: true };
        }
        return task;
      });
      setInGameTasks(updatedInGameTasks);

      // Update balance
      const newBalance = balance + taskToClaim.reward;
      setBalance(newBalance);
      await updatePlayerBalance(userData!.id, taskToClaim.reward); // Update balance in backend

      // Check and unlock new in-game tasks based on updated balance
      const refreshedInGameTasks = getInGameTasksBasedOnBalance(newBalance);
      setInGameTasks(refreshedInGameTasks);
    } catch (error) {
      console.error('Error claiming in-game task:', error);
      alert('There was an error claiming the task. Please try again.');
    }
  };

  return (
    <div className="p-2">
      {/* Player Balance Display */}
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
          className={`py-2 px-6 rounded-lg ${
            activeTab === 'in-game' ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-white'
          }`}
        >
          Game Tasks
        </button>
        <button
          onClick={() => setActiveTab('social')}
          className={`py-2 px-6 rounded-lg ${
            activeTab === 'social' ? 'bg-blue-500 text-black' : 'bg-gray-700 text-white'
          }`}
        >
          Social Tasks
        </button>
      </div>

      {/* Task List */}
      <div className="mt-6">
        {activeTab === 'in-game' ? (
          <div className="space-y-4">
            {inGameTasks.map((task) => (
              <div
                key={task.id}
                className="flex justify-between items-center bg-gray-900 text-white p-4 mb-4 rounded-lg shadow-lg"
              >
                <div className="flex items-center space-x-6 gap-2">
                  <FaBug className="text-4xl text-yellow-500" />
                  <div>
                    <p className="text-sm">{task.description}</p>
                    <p className="text-xs text-[#f48d2f]">+{task.reward} Scorpion</p>
                  </div>
                </div>
                <button
                  disabled={task.completed}
                  onClick={() => handleClaimInGameTask(task.id)}
                  className={`py-2 px-4 rounded-lg shadow-md ${
                    task.completed
                      ? 'bg-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {task.completed ? 'Claimed' : 'Claim'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {socialTasks.map((task) => (
              <div
                key={task.id}
                className="flex justify-between items-center bg-gray-900 text-white p-4 mb-4 rounded-lg shadow-lg"
              >
                <div className="flex items-center space-x-4">
                  {task.platform === 'Telegram' && (
                    <FaTelegramPlane className="text-2xl text-blue-500" />
                  )}
                  {task.platform === 'Twitter' && <FaTwitter className="text-2xl text-blue-400" />}
                  {task.platform === 'Facebook' && (
                    <FaFacebook className="text-2xl text-blue-700" />
                  )}
                  {task.platform === 'YouTube' && <FaYoutube className="text-2xl text-red-600" />}
                  {task.platform === 'Instagram' && (
                    <FaInstagram className="text-2xl text-pink-500" />
                  )}
                  <div>
                    <p className="text-sm">{task.description}</p>
                    <p className="text-xs text-[#f48d2f]">+{task.reward} Scorpion</p>
                  </div>
                </div>
                <Button
                  size="m"
                  onClick={() => handleTaskClick(task)}
                  disabled={task.status === 'approved'}
                  className={`${
                    task.status === 'approved'
                      ? 'bg-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white py-2 px-4 rounded-lg shadow-md`}
                >
                  {task.status === 'pending'
                    ? 'Pending Approval...'
                    : task.status === 'approved'
                    ? 'Approved'
                    : 'Start Task'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

  {/* Task Notification and Guidance Modal */}
{isModalOpen && currentTask && (
  <Modal>
    <div className="text-center">
      {/* Custom Header for Modal */}
      <div className="text-lg font-bold mb-4">{currentTask.description}</div>
      <p className="mb-4">Complete this task to earn {currentTask.reward} Scorpion points.</p>
      <img
        alt="Task Visual"
        src="https://xelene.me/telegram.gif" // Consider using platform-specific images
        className="mx-auto mb-4"
        style={{
          height: '144px',
          width: '144px',
        }}
      />
      <div className="flex justify-center space-x-4">
        <Button size="m" onClick={() => window.open(currentTask.link, '_blank')}>
          Go to {currentTask.platform} Task
        </Button>
        <Button size="m" onClick={handleTaskCompletion} className="bg-green-500 hover:bg-green-600">
          I have completed the task
        </Button>
      </div>
      <div className="mt-4">
        <Button size="m" onClick={closeModal} className="bg-red-500 hover:bg-red-600">
          Close
        </Button>
      </div>
    </div>
  </Modal>
)}

    </div>
  );
}
