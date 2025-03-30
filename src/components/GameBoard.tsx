'use client';

import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import type { Game } from '@prisma/client';

interface GameBoardProps {
  game: Game & {
    players: any[];
  };
  onMove?: (index: number) => void;
}

export function GameBoard({ game, onMove }: GameBoardProps) {
  const [loading, setLoading] = useState<number | null>(null);
  
  const handleCellClick = async (index: number) => {
    if (game.status !== 'playing') {
      return;
    }

    // Add your logic to check if the move is valid
    // For example, check if it's the player's turn, if the cell is empty, etc.
    
    setLoading(index);
    
    try {
      // Make API call to update the game state
      // Example:
      await fetch(`/api/games/${game.code}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index }),
      });
      
      if (onMove) {
        onMove(index);
      }
    } catch (error) {
      console.error('Failed to make move:', error);
      // Instead of using toast, we'll just log the error
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-4 p-4 bg-gray-100 aspect-square rounded-xl">
      {Array(9)
        .fill(null)
        .map((_, index) => (
          <motion.div
            key={index}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center text-4xl font-bold text-gray-400 bg-white rounded-lg shadow-sm aspect-square"
            onClick={() => handleCellClick(index)}
            style={{ opacity: loading === index ? 0.5 : 1 }}
          />
        ))}
    </div>
  );
} 