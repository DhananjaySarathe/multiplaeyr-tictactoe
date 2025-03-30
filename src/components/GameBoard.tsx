'use client';

import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

interface GameBoardProps {
  boardState: (string | null)[];
  onMove: (index: number) => void;
  isActive: boolean;
}

export function GameBoard({ boardState, onMove, isActive }: GameBoardProps) {
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);
  
  const handleCellClick = (index: number) => {
    if (!isActive || boardState[index] !== null) {
      return;
    }
    
    setLoadingIndex(index);
    setTimeout(() => {
      setLoadingIndex(null);
    }, 300); // Visual feedback
    
    onMove(index);
  };

  return (
    <div className="grid grid-cols-3 gap-4 p-4 bg-gray-100 aspect-square rounded-xl">
      {boardState.map((value, index) => (
        <motion.div
          key={index}
          whileHover={{ scale: isActive && !value ? 1.05 : 1 }}
          whileTap={{ scale: isActive && !value ? 0.95 : 1 }}
          className={`aspect-square bg-white rounded-lg shadow-sm flex items-center justify-center text-4xl font-bold ${
            isActive && !value ? 'cursor-pointer hover:bg-gray-50' : ''
          }`}
          onClick={() => handleCellClick(index)}
        >
          {loadingIndex === index ? (
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
          ) : value ? (
            <span className={value === 'X' ? 'text-blue-600' : 'text-red-600'}>
              {value}
            </span>
          ) : null}
        </motion.div>
      ))}
    </div>
  );
} 