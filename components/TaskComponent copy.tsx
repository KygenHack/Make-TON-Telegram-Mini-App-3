'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { FaTelegramPlane, FaTwitter, FaFacebook, FaYoutube, FaInstagram, FaBug } from 'react-icons/fa';
import { getPlayerData, updatePlayerBalance } from '@/app/hooks/indexedDBClient';
import { Title, Modal, Placeholder, Button } from '@telegram-apps/telegram-ui';
import { ModalHeader } from '@telegram-apps/telegram-ui/dist/components/Overlays/Modal/components/ModalHeader/ModalHeader';
import { ModalClose } from '@telegram-apps/telegram-ui/dist/components/Overlays/Modal/components/ModalClose/ModalClose';

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
  status?: 'pending' | 'approved' | 'not_started';
  link?: string;
  platform?: string;
}

const getInGameTasksBasedOnBalance = (balance: number): Task[] => [
  { id: 1, description: 'Reach a balance of 500 Scorpions', completed: balance >= 500, reward: 50, requiredBalance: 500 },
  { id: 2, description: 'Reach a balance of 1000 Scorpions', completed: balance >= 1000, reward: 100, requiredBalance: 1000 },
  { id: 3, description: 'Reach a balance of 2000 Scorpions', completed: balance >= 2000, reward: 200, requiredBalance: 2000 },
  { id: 4, description: 'Reach a balance of 3000 Scorpions', completed: balance >= 3000, reward: 300, requiredBalance: 3000 },
  { id: 5, description: 'Reach a balance of 5000 Scorpions', completed: balance >= 5000, reward: 500, requiredBalance: 5000 },
];

const socialTasksInitial: Task[] = [
  { id: 101, platform: 'Telegram', description: 'Join Telegram Channel', link: 'https://t.me/scorpioncommunity_channel', reward: 10, status: 'not_started', completed: false },
  { id: 102, platform: 'Telegram', description: 'Join Telegram Community', link: 'https://t.me/scorpion_community', reward: 10, status: 'not_started', completed: false },
  { id: 103, platform: 'Twitter', description: 'Follow on X', link: 'https://x.com/scorpionworld3', reward: 8, status: 'not_started', completed: false },
  { id: 104, platform: 'Facebook', description: 'Like on Facebook', link: 'https://web.facebook.com/people/Scorpionworld', reward: 5, status: 'not_started', completed: false },
  { id: 105, platform: 'YouTube', description: 'Subscribe to YouTube', link: 'https://youtube.com/example_channel', reward: 7, status: 'not_started', completed: false },
  { id: 106, platform: 'Instagram', description: 'Follow Instagram', link: 'https://www.instagram.com/scorpionworld3', reward: 6, status: 'not_started', completed: false },
];

export default function TaskComponent() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [balance, setBalance] = useState(0);
  const [tasks, setTasks] = useState<Task[]>(socialTasksInitial);
  const [loadingTaskId, setLoadingTaskId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'in-game' | 'social'>('in-game');
  const [currentTaskId, setCurrentTaskId] = useState<number | null>(null);
  const [isLinkClicked, setIsLinkClicked] = useState(false);
  const [showCompleteMessage, setShowCompleteMessage] = useState(false);

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
          setTasks(getInGameTasksBasedOnBalance(playerData.balance));
        }
      } catch (error) {
        console.error("Failed to initialize the app:", error);
      }
    };
    initWebApp();
  }, []);

  const handleTaskComplete = useCallback(async (taskId: number) => {
    setLoadingTaskId(taskId);
    try {
      const taskToComplete = tasks.find((task) => task.id === taskId);
      if (taskToComplete && !taskToComplete.completed) {
        const updatedBalance = await getPlayerData(userData!.id).then((data) => data?.balance || 0);

        if (updatedBalance >= (taskToComplete.requiredBalance ?? 0)) {
          const newBalance = updatedBalance + taskToComplete.reward;
          setBalance(newBalance);
          setTasks((prevTasks) =>
            prevTasks.map((t) => (t.id === taskId ? { ...t, completed: true } : t))
          );
          await updatePlayerBalance(userData!.id, taskToComplete.reward);
          setShowCompleteMessage(true);
        } else {
          alert("You don't meet the required balance to complete this task.");
        }
      }
    } catch (error) {
      console.error("Failed to complete the task:", error);
    } finally {
      setLoadingTaskId(null);
    }
  }, [tasks, userData]);

  const handleSocialTaskComplete = useCallback((taskId: number) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, status: 'pending' } : task
      )
    );
    setCurrentTaskId(taskId);
    setIsLinkClicked(false);
  }, []);

  const confirmTaskCompletion = useCallback(() => {
    if (currentTaskId !== null) {
      console.log("Task ID to be completed:", currentTaskId);
      const completedTask = tasks.find((task) => task.id === currentTaskId);
      if (completedTask && completedTask.status === 'pending') {
        const newBalance = balance + completedTask.reward;
        console.log("Updated balance:", newBalance);

        // Updating balance and task state
        setBalance(newBalance);
        updatePlayerBalance(userData!.id, completedTask.reward);
        setShowCompleteMessage(true);
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === currentTaskId ? { ...task, status: 'approved', completed: true } : task
          )
        );
        console.log("Task completed:", completedTask);
      } else {
        console.log("Task not found or not pending:", completedTask);
      }
      setCurrentTaskId(null);
    }
  }, [currentTaskId, tasks, balance, userData]);

  const handleLinkClick = () => {
    setIsLinkClicked(true);
    console.log("Link clicked, button should be enabled");
  };

  const inGameTasks = useMemo(() => tasks.filter((task) => task.requiredBalance), [tasks]);
  const socialTasks = useMemo(() => socialTasksInitial, []);

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

      <div className="mt-6">
        {activeTab === 'in-game' ? (
          <div className="space-y-4">
            {inGameTasks.map((task) => (
              <div key={task.id} className="flex justify-between items-center bg-gray-900 text-white p-4 mb-4 rounded-lg shadow-lg">
                <div className="flex items-center space-x-6 gap-2">
                  <FaBug className="text-4xl text-yellow-500" />
                  <div>
                    <p className="text-sm">{task.description}</p>
                    <p className="text-xs text-[#f48d2f]">+{task.reward} Scorpion</p>
                  </div>
                </div>
                <button
                  onClick={() => handleTaskComplete(task.id)}
                  disabled={task.completed || loadingTaskId === task.id}
                  className={`py-2 px-4 rounded-lg shadow-md ${
                    task.completed || loadingTaskId === task.id
                      ? 'bg-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {task.completed ? 'Done' : loadingTaskId === task.id ? 'Loading...' : 'Claim'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {socialTasks.map((task) => (
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
                <Modal
                  header={<ModalHeader after={<ModalClose>Close</ModalClose>}>Task Instructions</ModalHeader>}
                  trigger={(
                    <button
                      onClick={() => handleSocialTaskComplete(task.id)}
                      className={`bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg shadow-md`}
                    >
                      {task.completed ? 'Done' : 'Start'}
                    </button>
                  )}
                >
                  <Placeholder description={task.description} header="Task Instructions">
                    <p>Follow the link to complete the task:</p>
                    <a
                      href={task.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 underline"
                      onClick={handleLinkClick}
                    >
                      {task.platform} Link
                    </a>
                    <div className="mt-4">
                      <Button
                        size="m"
                        onClick={confirmTaskCompletion}
                        disabled={!isLinkClicked || task.completed}
                      >
                        {task.completed ? 'Done' : 'Complete Task'}
                      </Button>
                    </div>
                  </Placeholder>
                </Modal>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
