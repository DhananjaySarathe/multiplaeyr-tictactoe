'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface GameBoardProps {
  boardState: (string | null)[];
  onMove: (index: number) => void;
  isActive: boolean;
}

export function GameBoard({ boardState, onMove, isActive }: GameBoardProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [playerSymbol, setPlayerSymbol] = useState<string | null>(null);
  
  // Safely access localStorage (only on client)
  useEffect(() => {
    const symbol = localStorage.getItem('playerSymbol');
    setPlayerSymbol(symbol);
  }, []);
  
  const handleCellClick = (index: number) => {
    console.log('Cell clicked:', index, 'Active:', isActive, 'Cell value:', boardState[index]);
    if (!isActive || boardState[index] !== null) {
      console.log(isActive ? 'Cell already filled' : 'Not your turn');
      return;
    }
    
    console.log('Cell click accepted, calling onMove with index:', index);
    onMove(index);
  };

  return (
    <div className="grid grid-cols-3 gap-4 p-4 bg-gray-100 aspect-square rounded-xl">
      {boardState.map((value, index) => (
        <motion.div
          key={index}
          whileHover={{ scale: isActive && !value ? 1.05 : 1 }}
          whileTap={{ scale: isActive && !value ? 0.95 : 1 }}
          className={`
            aspect-square rounded-lg shadow-sm flex items-center justify-center text-4xl font-bold
            ${value ? 'bg-white' : isActive ? 'bg-white cursor-pointer hover:bg-gray-50' : 'bg-white'}
            ${hoverIndex === index && isActive && !value ? 'bg-gray-50' : ''}
          `}
          onClick={() => handleCellClick(index)}
          onMouseEnter={() => setHoverIndex(index)}
          onMouseLeave={() => setHoverIndex(null)}
        >
          {value === 'X' && <span className="text-blue-600">X</span>}
          {value === 'O' && <span className="text-red-600">O</span>}
          {!value && isActive && hoverIndex === index && (
            <span className="text-gray-300 opacity-50">
              {playerSymbol}
            </span>
          )}
        </motion.div>
      ))}
    </div>
  );
} 