import { motion } from 'framer-motion';
import { Cell as CellType } from '../types';
import { useGameStore } from '../store';
import clsx from 'clsx';

interface CellProps {
  value: CellType;
  onClick: () => void;
}

export const Cell = ({ value, onClick }: CellProps) => {
  const theme = useGameStore((state) => state.theme);
  
  return (
    <motion.button
      className={clsx(
        'aspect-square rounded-xl text-4xl font-bold flex items-center justify-center',
        'transition-colors duration-300 touch-manipulation min-w-[44px] min-h-[44px]',
        theme === 'light'
          ? 'bg-white hover:bg-gray-50 shadow-sm'
          : 'bg-gray-800 hover:bg-gray-700 shadow-lg shadow-gray-900/20',
        value === 'X' ? 'text-blue-500' : 'text-red-500'
      )}
      whileHover={{ scale: 0.98 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      {value && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          {value}
        </motion.span>
      )}
    </motion.button>
  );
};