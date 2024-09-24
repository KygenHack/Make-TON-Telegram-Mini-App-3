'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { FaTelegramPlane, FaTwitter, FaFacebook, FaYoutube, FaInstagram, FaBug } from 'react-icons/fa';
import { getPlayerData, updatePlayerBalance } from '@/app/hooks/indexedDBClient'; // Import IndexedDB functions
import { supabase } from '@/app/hooks/useSupabase'; // Supabase client for tasks
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

export default function TaskComponent() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [balance, setBalance] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTaskId, setLoadingTaskId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'in-game' | 'social'>('in-game');
  const [currentTaskId, setCurrentTaskId] = useState<number | null>(null);
  const [isLinkClicked, setIsLinkClicked] = useState(false);
  const [showCompleteMessage, setShowCompleteMessage] = useState(false);

  // Fetch tasks for the player
  const fetchTasksForPlayer = async (playerId: number) => {
    // Fetch tasks from task_list and tasks table
    const { data: assignedTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*, task_list(description, reward, required_balance, platform, link)')
      .eq('user_id', playerId);
    
    if (tasksError) {
      console.error('Error fetching tasks:', tasksError.message);
      return [];
    }
    return assignedTasks.map((task: any) => ({
      ...task.task_list,
      id: task.id,
      completed: task.completed,
      status: task.status,
    }));
  };

  // Initialize the player data and fetch tasks
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
          const playerTasks = await fetchTasksForPlayer(user.id);
          setTasks(playerTasks);
        }
      } catch (error) {
        console.error("Failed to initialize the app:", error);
      }
    };
    initWebApp();
  }, []);

  // Handle task completion and update in IndexedDB and Supabase
  const handleTaskComplete = useCallback(async (taskId: number) => {
    setLoadingTaskId(taskId);
    try {
      const taskToComplete = tasks.find((task) => task.id === taskId);
      if (taskToComplete && !taskToComplete.completed) {
        const playerData = await getPlayerData(userData!.id);
        if (playerData && playerData.balance >= (taskToComplete.requiredBalance ?? 0)) {
          const newBalance = playerData.balance + taskToComplete.reward;
          setBalance(newBalance);

          // Update task in Supabase
          await supabase
            .from('tasks')
            .update({ completed: true, status: 'approved' })
            .eq('id', taskId)
            .eq('user_id', userData!.id);

          // Update tasks in IndexedDB and balance
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

  const confirmTaskCompletion = useCallback(async () => {
    if (currentTaskId !== null) {
      const completedTask = tasks.find((task) => task.id === currentTaskId);
      if (completedTask && completedTask.status === 'pending') {
        const newBalance = balance + completedTask.reward;

        // Update task in Supabase and IndexedDB
        setBalance(newBalance);
        await supabase
          .from('tasks')
          .update({ completed: true, status: 'approved' })
          .eq('id', currentTaskId)
          .eq('user_id', userData!.id);

        // Update tasks in IndexedDB
        setShowCompleteMessage(true);
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === currentTaskId ? { ...task, status: 'approved', completed: true } : task
          )
        );
      }
      setCurrentTaskId(null);
    }
  }, [currentTaskId, tasks, balance, userData]);

  const handleLinkClick = () => {
    setIsLinkClicked(true);
  };

  const inGameTasks = useMemo(() => tasks.filter((task) => task.requiredBalance), [tasks]);
  const socialTasks = useMemo(() => tasks.filter((task) => task.platform), [tasks]);

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
