'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Share, Copy, Loader2, Check } from 'lucide-react';
import type { Game } from '@prisma/client';
import { GameBoard } from './GameBoard';
// Either remove this import if you don't have the hook
// import { useToast } from '@/hooks/useToast';

interface GameRoomProps {
  initialGame: Game & {
    players: any[];
  };
}

export function GameRoom({ initialGame }: GameRoomProps) {
  const [game, setGame] = useState(initialGame);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // If you don't have the useToast hook, remove this line
  // const { toast } = useToast();

  useEffect(() => {
    const eventSource = new EventSource(`/api/games/${game.code}/events`);
    
    eventSource.onmessage = (event) => {
      const newGame = JSON.parse(event.data);
      setGame(newGame);
    };
    
    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      eventSource.close();
    };
    
    return () => {
      eventSource.close();
    };
  }, [game.code]);

  const copyGameCode = () => {
    navigator.clipboard.writeText(game.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    // Replace toast with alert or console.log
    alert('Game code copied! Share this code with your friend to join the game');
  };

  const startGame = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/games/${game.code}/start`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start game');
      }
      
      // Replace toast with alert
      alert('Game started! Let the battle begin!');
    } catch (error) {
      console.error('Failed to start game:', error);
      // Replace toast with alert
      alert(`Error: ${error.message || 'Failed to start game'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid w-full max-w-4xl gap-8 p-6 bg-white shadow-xl rounded-2xl md:p-8 md:grid-cols-3"
      >
        <div className="space-y-6 md:col-span-2">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Game Room</h1>
            <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg">
              <span className="font-medium text-gray-600">{game.code}</span>
              <button
                onClick={copyGameCode}
                className="text-indigo-600 transition-colors hover:text-indigo-800"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <GameBoard game={game} />
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-gray-50 rounded-xl">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Players</h2>
            <div className="space-y-3">
              {game.players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center gap-3 text-gray-700"
                >
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span>{player.name}</span>
                  {player.isHost && (
                    <span className="px-2 py-1 text-xs text-indigo-600 bg-indigo-100 rounded-full">
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
              onClick={startGame}
              disabled={isLoading}
              className="w-full px-6 py-3 font-medium text-white transition-all duration-200 bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Starting...
                </span>
              ) : (
                'Start Game'
              )}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}