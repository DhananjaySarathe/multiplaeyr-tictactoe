import { useState } from 'react';
import { Player } from '../types';
import { useGameStore } from '../store';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface PlayerFormProps {
  symbol: Player;
}

export const PlayerForm = ({ symbol }: PlayerFormProps) => {
  const [name, setName] = useState('');
  const setPlayer = useGameStore((state) => state.setPlayer);
  const theme = useGameStore((state) => state.theme);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      setPlayer(symbol, name.trim());
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 w-full max-w-xs"
    >
      <div className="flex flex-col gap-2">
        <label
          htmlFor={`player-${symbol}`}
          className={clsx(
            'text-sm font-medium',
            theme === 'light' ? 'text-gray-700' : 'text-gray-300'
          )}
        >
          Enter Player {symbol} Name
        </label>
        <input
          type="text"
          id={`player-${symbol}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={clsx(
            'px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-colors duration-300',
            theme === 'light'
              ? 'border-gray-200 focus:ring-blue-500'
              : 'border-gray-700 bg-gray-800 focus:ring-blue-400 text-white'
          )}
          placeholder="Enter your name"
          required
          minLength={2}
          maxLength={20}
        />
      </div>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={clsx(
          'px-6 py-2 rounded-lg font-medium transition-colors duration-300',
          theme === 'light'
            ? 'bg-blue-500 hover:bg-blue-600 text-white'
            : 'bg-blue-400 hover:bg-blue-500 text-gray-900'
        )}
        type="submit"
      >
        Join Game
      </motion.button>
    </motion.form>
  );
};