'use client';

import { motion } from 'framer-motion';
import { TowerControl as GameController, Users } from 'lucide-react';
import Link from 'next/link';

export function GameHub() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="w-full max-w-md p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 space-y-8"
        >
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold text-gray-900">Game Hub</h1>
            <p className="text-gray-600">Create or join a multiplayer game session</p>
          </div>

          <div className="space-y-4">
            <Link href="/new-game">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-4 px-6 rounded-xl font-medium hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200"
              >
                <GameController className="w-5 h-5" />
                Start New Game
              </motion.button>
            </Link>

            <Link href="/join-game">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-3 bg-white text-indigo-600 py-4 px-6 rounded-xl font-medium border-2 border-indigo-100 hover:bg-indigo-50 hover:border-indigo-200 transition-all duration-200"
              >
                <Users className="w-5 h-5" />
                Join Game
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}