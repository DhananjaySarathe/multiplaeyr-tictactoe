'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Loader2 } from 'lucide-react';
import { Game, Player } from '@prisma/client';

interface GameRoomProps {
  initialGame: Game & {
    players: Player[];
  };
}

export function GameRoom({ initialGame }: GameRoomProps) {
  const [game, setGame] = useState(initialGame);
  const [copied, setCopied] = useState(false);

  const copyGameLink = () => {
    const url = `${window.location.origin}/game/${game.code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const eventSource = new EventSource(`/api/games/${game.code}/events`);

    eventSource.onmessage = (event) => {
      const updatedGame = JSON.parse(event.data);
      setGame(updatedGame);
    };

    return () => {
      eventSource.close();
    };
  }, [game.code]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8"
      >
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Game Room</h1>
          <div className="flex items-center justify-center gap-4">
            <p className="text-4xl font-mono font-bold text-indigo-600">{game.code}</p>
            <button
              onClick={copyGameLink}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Copy game link"
            >
              <Copy className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          {copied && (
            <p className="text-sm text-green-600">Game link copied!</p>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-gray-50 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Players</h2>
            <div className="space-y-3">
              {game.players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center gap-3 text-gray-700"
                >
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span>{player.name}</span>
                  {player.isHost && (
                    <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full">
                      Host
                    </span>
                  )}
                </div>
              ))}
              {game.players.length === 1 && (
                <div className="flex items-center gap-3 text-gray-400">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Waiting for opponent...</span>
                </div>
              )}
            </div>
          </div>

          {game.players.length === 2 && game.status === 'waiting' && (
            <button
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-3 px-6 rounded-xl font-medium hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200"
            >
              Start Game
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}