import { useGameStore } from '../store';
import { Cell } from './Cell';
import { motion } from 'framer-motion';

export const Board = () => {
  const { board, makeMove } = useGameStore();

  return (
    <motion.div
      className="grid grid-cols-3 gap-2 w-full max-w-md aspect-square p-4"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {board.map((value, index) => (
        <Cell key={index} value={value} onClick={() => makeMove(index)} />
      ))}
    </motion.div>
  );
};