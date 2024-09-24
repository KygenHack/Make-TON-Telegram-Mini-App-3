'use client';

import React from 'react';

interface TaskItemProps {
  description: string;
  details: string; // Details about the task
  points: number; // Task reward points
  completed: boolean; // Task completion status
  onClick: () => void; // Action to start or complete the task
  loading: boolean; // Loading state while task is being verified or completed
}

const TaskItem: React.FC<TaskItemProps> = ({ description, details, points, completed, onClick, loading }) => {
  return (
    <div className="flex items-center justify-between mb-4 border-b border-orange-700 pb-2">
      {/* Task description, details, and points */}
      <div className="flex flex-col items-start">
        <span className="text-black mb-2 font-bold">{description}</span>
        <p className="text-black mb-2">{details}</p> {/* Additional task details */}
        <p className="text-green">+ {points} Scorpion</p> {/* Reward points */}
      </div>

      {/* Task action button */}
      <button
        className={`bg-gradient-to-r from-green-400 to-blue-500 text-white py-1 px-4 rounded-lg font-semibold transition-all duration-300 hover:shadow-xl ${
          loading ? 'button-disabled' : completed ? 'done-button' : ''
        }`}
        onClick={onClick}
        disabled={loading || completed} // Disable button if task is loading or completed
      >
        {/* Button label with loading or completion icons */}
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="loading-spinner mr-2"></div> {/* Loading spinner */}
            Verifying... {/* Status message during task verification */}
          </div>
        ) : completed ? (
          <div className="flex items-center justify-center">
            Done {/* Completion message */}
            <svg
              className="w-4 h-4 ml-2 done-icon" // SVG icon for completed task
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ) : (
          'Start' // Default button label
        )}
      </button>
    </div>
  );
};

export default TaskItem;
