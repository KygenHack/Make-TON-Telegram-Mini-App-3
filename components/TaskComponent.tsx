'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/app/hooks/useSupabase';
import { FaTelegramPlane, FaTwitter, FaFacebook, FaYoutube, FaInstagram, FaBug } from 'react-icons/fa';
import { Title, Modal, Placeholder, Button } from '@telegram-apps/telegram-ui';
import { ModalHeader } from '@telegram-apps/telegram-ui/dist/components/Overlays/Modal/components/ModalHeader/ModalHeader';
import { ModalClose } from '@telegram-apps/telegram-ui/dist/components/Overlays/Modal/components/ModalClose/ModalClose';

// Define the player data interface based on your schema
interface PlayerData {
  id: number;             // Telegram user ID
  username?: string;       // Telegram username
  firstName?: string;      // Player's first name
  lastName?: string;       // Player's last name (optional)
  balance: number;         // Player's balance
  miningLevel: number;     // Player's mining level
  lastHarvestTime: number; // Timestamp of last harvest
  energy: number;          // Player's energy
}

// Define the task interface
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
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [loadingTaskId, setLoadingTaskId] = useState<number | null>(null);
  const [currentTaskId, setCurrentTaskId] = useState<number | null>(null);
  const [isLinkClicked, setIsLinkClicked] = useState(false);
  const [showCompleteMessage, setShowCompleteMessage] = useState(false);

  // Fetch player data from Supabase and tasks
  useEffect(() => {
    const fetchPlayerData = async () => {
      try {
        const WebApp = (await import('@twa-dev/sdk')).default;
        WebApp.ready();
        const user = WebApp.initDataUnsafe.user;

        // Fetch the player data from Supabase
        const { data: playerData, error: playerError } = await supabase
          .from('players')
          .select('*')
          .eq('id', user.id)
          .single();

        if (playerError) {
          console.error('Error fetching player data:', playerError.message);
          return;
        }

        setPlayerData(playerData);
        setBalance(playerData.balance);

        // Fetch tasks assigned to the player
        const { data: tasksFromSupabase, error: tasksError } = await supabase
          .from('tasks')
          .select('*, task_list(description, reward, required_balance, platform, link)')
          .eq('user_id', user.id);

        if (tasksError) {
          console.error('Error fetching tasks:', tasksError.message);
        } else if (tasksFromSupabase) {
          setTasks(
            tasksFromSupabase.map((task: any) => ({
              ...task.task_list,
              id: task.id,
              completed: task.completed,
              status: task.status,
            }))
          );
        }
      } catch (error) {
        console.error('Failed to initialize the app:', error);
      }
    };

    fetchPlayerData();
  }, []);

  // Handle task completion and update in Supabase
  const handleTaskComplete = useCallback(async (taskId: number) => {
    setLoadingTaskId(taskId);
    try {
      const taskToComplete = tasks.find((task) => task.id === taskId);
      if (taskToComplete && !taskToComplete.completed) {
        if (playerData!.balance >= (taskToComplete.requiredBalance ?? 0)) {
          const newBalance = playerData!.balance + taskToComplete.reward;
          setBalance(newBalance);

          // Update the task as completed in Supabase
          const { error: updateError } = await supabase
            .from('tasks')
            .update({ completed: true, status: 'approved' })
            .eq('id', taskId)
            .eq('user_id', playerData!.id);

          if (updateError) {
            console.error('Error updating task:', updateError.message);
          } else {
            setTasks((prevTasks) =>
              prevTasks.map((t) => (t.id === taskId ? { ...t, completed: true } : t))
            );

            await supabase
              .from('players')
              .update({ balance: newBalance })
              .eq('id', playerData!.id); // Update player's balance
              
            setShowCompleteMessage(true);
          }
        } else {
          alert("You don't have enough balance to complete this task.");
        }
      }
    } catch (error) {
      console.error('Failed to complete the task:', error);
    } finally {
      setLoadingTaskId(null);
    }
  }, [tasks, playerData]);

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
          <p className="text-lg text-[#f48d2f]">Complete tasks to earn rewards</p>
        </div>
      </div>

      <div className="flex justify-center space-x-4 mt-4">
        <button
          onClick={() => setCurrentTaskId('in-game')}
          className={`py-2 px-6 rounded-lg ${currentTaskId === 'in-game' ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-white'}`}
        >
          In-Game Tasks
        </button>
        <button
          onClick={() => setCurrentTaskId('social')}
          className={`py-2 px-6 rounded-lg ${currentTaskId === 'social' ? 'bg-blue-500 text-black' : 'bg-gray-700 text-white'}`}
        >
          Social Tasks
        </button>
      </div>

      <div className="mt-6">
        {currentTaskId === 'in-game' ? (
          <div className="space-y-4">
            {inGameTasks.map((task) => (
              <div key={task.id} className="flex justify-between items-center bg-gray-900 text-white p-4 mb-4 rounded-lg shadow-lg">
                <div className="flex items-center space-x-6 gap-2">
                  <FaBug className="text-4xl text-yellow-500" />
                  <div>
                    <p className="text-sm">{task.description}</p>
                    <p className="text-xs text-[#f48d2f]">+{task.reward}</p>
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
                    <p className="text-xs text-[#f48d2f]">+{task.reward}</p>
                  </div>
                </div>
                <Modal
                  header={<ModalHeader after={<ModalClose>Close</ModalClose>}>Task Instructions</ModalHeader>}
                  trigger={(
                    <button
                      onClick={() => handleTaskComplete(task.id)}
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
                        onClick={() => handleTaskComplete(task.id)}
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
