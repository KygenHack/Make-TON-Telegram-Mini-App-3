import { motion } from 'framer-motion';

interface DailyStreakModalProps {
    streak: number;
    reward: number;
    onClose: () => void;
  }

const DailyStreakModal: React.FC<DailyStreakModalProps> = ({ streak, reward, onClose }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <motion.div
        className="bg-white p-6 rounded-lg shadow-lg text-center max-w-md"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-2xl font-bold text-[#f48d2f]">Daily Login Streak</h2>
        <p className="mt-4 text-lg text-black">Congratulations! You have a {streak}-day streak.</p>
        <p className="mt-2 text-lg text-black">You have earned {reward} Scorpions today!</p>
        <button
          onClick={onClose}
          className="mt-6 bg-[#f48d2f] hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg"
        >
          Claim Reward
        </button>
      </motion.div>
    </div>
  );
};


export default DailyStreakModal; // Ensure you're exporting the component
