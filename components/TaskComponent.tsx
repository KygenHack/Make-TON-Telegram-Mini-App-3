'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { FaTelegramPlane, FaTwitter, FaFacebook, FaYoutube, FaInstagram } from 'react-icons/fa';
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
  const [currentTaskId, setCurrentTaskId] = useState<number | null>(null);
  const [isLinkClicked, setIsLinkClicked] = useState(false);

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
        }
      } catch (error) {
        console.error("Failed to initialize the app:", error);
      }
    };
    initWebApp();
  }, []);

  // Handle opening a social task (when "Start" is clicked)
  const handleSocialTaskComplete = useCallback((taskId: number) => {
    console.log("Social task started:", taskId); // Debugging log
    setCurrentTaskId(taskId);
    setIsLinkClicked(false);  // Reset link clicked state when the modal is opened
  }, []);

  // Confirm task completion when "Complete Task" is clicked
  const confirmTaskCompletion = useCallback(() => {
    if (currentTaskId !== null) {
      const taskToComplete = tasks.find((task) => task.id === currentTaskId);
      if (taskToComplete && taskToComplete.status === 'pending') {
        console.log("Completing task:", taskToComplete);  // Debugging log

        // Update balance and mark the task as completed
        const newBalance = balance + taskToComplete.reward;
        setBalance(newBalance);
        updatePlayerBalance(userData!.id, taskToComplete.reward);

        // Update the task status
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === currentTaskId ? { ...task, status: 'approved', completed: true } : task
          )
        );
        setCurrentTaskId(null);
      }
    }
  }, [currentTaskId, tasks, balance, userData]);

  // Set isLinkClicked to true when the link is clicked
  const handleLinkClick = () => {
    console.log("Link clicked");  // Debugging log
    setIsLinkClicked(true);
  };

  return (
    <div className="p-2">
      <div className="text-center">
        <Title caps level="1" weight="1" className="text-5xl text-white">
          {balance}
        </Title>
        <p className="text-lg text-[#f48d2f]">Complete tasks to earn Scorpion rewards</p>
      </div>

      <div className="space-y-4 mt-6">
        {tasks.map((task) => (
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
    </div>
  );
}
