import { motion } from 'framer-motion';
import { useGameStore } from '../store';
import clsx from 'clsx';

export const GameStatus = () => {
  const { status, currentPlayer, winner, players, scores, theme, symbol } = useGameStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        'text-center p-4 rounded-lg mb-8',
        theme === 'light' ? 'bg-white shadow-sm' : 'bg-gray-800 shadow-lg shadow-gray-900/20'
      )}
    >
      <div className="flex justify-between items-center mb-4">
        <div className={clsx('text-left', winner === 'X' && 'text-blue-500 font-bold')}>
          {players.X?.name || 'Player X'}: {scores.X}
          {symbol === 'X' && ' (You)'}
        </div>
        <div className={clsx('text-right', winner === 'O' && 'text-red-500 font-bold')}>
          {players.O?.name || 'Player O'}: {scores.O}
          {symbol === 'O' && ' (You)'}
        </div>
      </div>
      
      <motion.p
        key={status}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={clsx(
          'text-lg font-medium',
          theme === 'light' ? 'text-gray-800' : 'text-gray-200'
        )}
      >
        {status === 'waiting' && 'Waiting for opponent...'}
        {status === 'playing' && (
          <>
            {currentPlayer === symbol 
              ? "Your turn"
              : `Waiting for ${players[currentPlayer]?.name}'s move`
            }
          </>
        )}
        {status === 'won' && `${players[winner!]?.name} (${winner}) wins!`}
        {status === 'draw' && "It's a draw!"}
        {status === 'ended' && 'Game ended - Opponent disconnected'}
      </motion.p>
    </motion.div>
  );
};