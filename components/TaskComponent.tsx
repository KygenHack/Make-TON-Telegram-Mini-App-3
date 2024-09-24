'use client';

import { useEffect, useState } from 'react';
import { FaTelegramPlane, FaTwitter, FaFacebook, FaYoutube, FaInstagram, FaBug } from 'react-icons/fa';
import useAuth from '@/app/hooks/useAuth'; // Import the useAuth hook
import { getPlayerData, updatePlayerBalance } from '@/app/hooks/indexedDBClient';
import { supabase } from '@/app/hooks/useSupabase'; // Supabase client for tasks
import { Title, Modal, Placeholder, Button } from '@telegram-apps/telegram-ui';
import { ModalHeader } from '@telegram-apps/telegram-ui/dist/components/Overlays/Modal/components/ModalHeader/ModalHeader';
import { ModalClose } from '@telegram-apps/telegram-ui/dist/components/Overlays/Modal/components/ModalClose/ModalClose';

// Define task interface
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

// Fetch task list (all available tasks in task_list)
const fetchTaskList = async () => {
  try {
    const { data: taskList, error } = await supabase
      .from('task_list')
      .select('*');

    if (error) {
      console.error('Error fetching task list:', error.message);
      return [];
    }

    return taskList;
  } catch (error) {
    console.error('Error fetching task list:', error);
    return [];
  }
};

// Fetch tasks specific to the user (from tasks table)
const fetchUserTasks = async (userId: number) => {
  try {
    const { data: userTasks, error } = await supabase
      .from('tasks')
      .select(`
        id, 
        completed, 
        status, 
        task_list (
          description, 
          reward, 
          required_balance, 
          platform, 
          link
        )
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user tasks:', error.message);
      return [];
    }

    return userTasks;
  } catch (error) {
    console.error('Error fetching user tasks:', error);
    return [];
  }
};

// Assign all tasks from task_list to a user if they don't have tasks yet
const assignTasksToUser = async (userId: number, taskList: any[]) => {
  try {
    const tasksToAssign = taskList.map(task => ({
      user_id: userId,
      task_list_id: task.id,
      completed: false,
      status: 'not_started',
    }));

    const { error } = await supabase
      .from('tasks')
      .insert(tasksToAssign);

    if (error) {
      console.error('Error assigning tasks to user:', error.message);
    }
  } catch (error) {
    console.error('Error assigning tasks to user:', error);
  }
};

export default function TaskComponent() {
  const { user, isLoading } = useAuth(); // Get the authenticated user from the hook
  const [balance, setBalance] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTaskId, setLoadingTaskId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'in-game' | 'social'>('in-game');
  const [currentTaskId, setCurrentTaskId] = useState<number | null>(null);
  const [isLinkClicked, setIsLinkClicked] = useState(false); // Track whether the social link was clicked
  const [showCompleteMessage, setShowCompleteMessage] = useState(false);

  // Fetch player data and tasks when user is authenticated
  useEffect(() => {
    if (!isLoading && user) {
      (async () => {
        const playerData = await getPlayerData(user.id);
        if (playerData) {
          setBalance(playerData.balance);

          // Fetch the full task list (available tasks)
          const taskList = await fetchTaskList();

          // Fetch user-specific tasks
          let userTasks = await fetchUserTasks(user.id);

          if (userTasks.length === 0) {
            console.log('No tasks found for user, assigning tasks...');
            // Assign all tasks from task_list to the user
            await assignTasksToUser(user.id, taskList);

            // Re-fetch tasks for the user after assigning
            userTasks = await fetchUserTasks(user.id);
          }

          // Map and store the user tasks with task details
          const mappedTasks = userTasks.map((task: any) => ({
            id: task.id,
            description: task.task_list.description,
            completed: task.completed,
            reward: task.task_list.reward,
            requiredBalance: task.task_list.required_balance,
            platform: task.task_list.platform,
            link: task.task_list.link,
            status: task.status,
          }));

          setTasks(mappedTasks);
        }
      })();
    }
  }, [user, isLoading]);

  // Handle task completion for in-game tasks
  const handleTaskComplete = async (taskId: number) => {
    setLoadingTaskId(taskId);
    try {
      const taskToComplete = tasks.find((task) => task.id === taskId);
      if (taskToComplete && !taskToComplete.completed) {
        const playerData = await getPlayerData(user!.id);
        if (playerData && playerData.balance >= (taskToComplete.requiredBalance ?? 0)) {
          const newBalance = playerData.balance + taskToComplete.reward;
          setBalance(newBalance);

          // Update task in Supabase
          await supabase
            .from('tasks')
            .update({ completed: true, status: 'approved' })
            .eq('id', taskId)
            .eq('user_id', user!.id);

          // Update task locally
          setTasks((prevTasks) =>
            prevTasks.map((t) => (t.id === taskId ? { ...t, completed: true } : t))
          );

          // Update player's balance in IndexedDB
          await updatePlayerBalance(user!.id, taskToComplete.reward);
          setShowCompleteMessage(true);
        } else {
          alert("You don't meet the required balance to complete this task.");
        }
      }
    } catch (error) {
      console.error('Error completing task:', error);
    } finally {
      setLoadingTaskId(null);
    }
  };

  // Handle starting a social task and marking it as pending
  const handleSocialTaskComplete = (taskId: number) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, status: 'pending' } : task
      )
    );
    setCurrentTaskId(taskId);
    setIsLinkClicked(false); // Reset the link clicked state
  };

  // Confirm completion of a social task
  const confirmTaskCompletion = async () => {
    if (currentTaskId !== null) {
      const completedTask = tasks.find((task) => task.id === currentTaskId);
      if (completedTask && completedTask.status === 'pending') {
        const newBalance = balance + completedTask.reward;

        // Update task in Supabase
        await supabase
          .from('tasks')
          .update({ completed: true, status: 'approved' })
          .eq('id', currentTaskId)
          .eq('user_id', user!.id);

        // Update task locally
        setBalance(newBalance);
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === currentTaskId ? { ...task, status: 'approved', completed: true } : task
          )
        );
        setShowCompleteMessage(true);
      }
      setCurrentTaskId(null);
    }
  };

  // Handle clicking on the task link for a social task
  const handleLinkClick = () => {
    setIsLinkClicked(true); // Set the state to indicate the link was clicked
  };

  if (isLoading) {
    return <center>Loading...</center>;
  }

  if (!user) {
    return <div>Error: User not authenticated</div>;
  }

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
            {tasks
              .filter((task) => !task.platform) // In-game tasks
              .map((task) => (
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
            {tasks
              .filter((task) => task.platform) // Social tasks
              .map((task) => (
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
