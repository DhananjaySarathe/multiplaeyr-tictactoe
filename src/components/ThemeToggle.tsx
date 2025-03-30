import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { motion } from 'framer-motion';
import clsx from 'clsx';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      className={clsx(
        'fixed top-4 right-4 p-3 rounded-full transition-all duration-300',
        'min-w-[44px] min-h-[44px] touch-manipulation',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        theme === 'light' 
          ? 'bg-white hover:bg-gray-100 text-gray-900 shadow-sm focus:ring-gray-400'
          : 'bg-gray-800 hover:bg-gray-700 text-gray-100 shadow-lg shadow-black/10 focus:ring-gray-500'
      )}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <span className="sr-only">
        Switch to {theme === 'light' ? 'dark' : 'light'} mode
      </span>
      {theme === 'light' ? (
        <Moon className="w-5 h-5 md:w-6 md:h-6" />
      ) : (
        <Sun className="w-5 h-5 md:w-6 md:h-6" />
      )}
    </motion.button>
  );
};