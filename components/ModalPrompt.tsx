import React from 'react';

interface ModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
}

const ModalPrompt: React.FC<ModalProps> = ({ isOpen, message, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg text-center">
        <p className="text-lg text-gray-800 mb-4">{message}</p>
        <button
          onClick={onClose}
          className="py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ModalPrompt;
