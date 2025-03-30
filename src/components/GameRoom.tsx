'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Share, Copy, Loader2, Check } from 'lucide-react';
import type { Game } from '@prisma/client';
import { GameBoard } from './GameBoard';
import { getSocket } from '@/lib/socket';

interface GameRoomProps {
  initialGame: Game & {
    players: any[];
  };
}

export function GameRoom({ initialGame }: GameRoomProps) {
  const [game, setGame] = useState(initialGame);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [boardState, setBoardState] = useState(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<string | null>(null);
  
  // Get player ID and determine if the current user is the host
  const currentPlayerId = game.players.find(player => player.isHost)?.id || '';
  const playerSymbol = game.players.find(player => player.id === currentPlayerId)?.isHost ? 'X' : 'O';

  useEffect(() => {
    const socket = getSocket();
    
    // Set up socket connection
    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('joinGame', { 
        gameCode: game.code, 
        playerId: currentPlayerId 
      });
    });
    
    socket.on('disconnect', () => {
      setIsConnected(false);
    });
    
    // Game events
    socket.on('gameMove', (data) => {
      console.log('Move received:', data);
      setBoardState(prev => {
        const newBoard = [...prev];
        newBoard[data.index] = data.symbol;
        return newBoard;
      });
      
      // Toggle current player after a move
      setCurrentPlayer(prev => prev === 'X' ? 'O' : 'X');
    });
    
    socket.on('gameStarted', (data) => {
      console.log('Game started:', data);
      setGame(prev => ({ ...prev, status: 'playing' }));
      setCurrentPlayer('X'); // X always starts
    });
    
    socket.on('playerJoined', (data) => {
      console.log('Player joined:', data);
    });
    
    // Clean up on unmount
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('gameMove');
      socket.off('gameStarted');
      socket.off('playerJoined');
    };
  }, [game.code, currentPlayerId]);

  const copyGameCode = () => {
    navigator.clipboard.writeText(game.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    alert('Game code copied! Share this code with your friend to join the game');
  };

  const handleStartGame = () => {
    setIsLoading(true);
    try {
      const socket = getSocket();
      socket.emit('startGame', { gameCode: game.code });
    } catch (error) {
      console.error('Failed to start game:', error);
      alert(`Error: ${error.message || 'Failed to start game'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMove = useCallback((index: number) => {
    if (game.status !== 'playing' || boardState[index] !== null || currentPlayer !== playerSymbol) {
      return;
    }
    
    const socket = getSocket();
    socket.emit('makeMove', {
      gameCode: game.code,
      index,
      playerId: currentPlayerId,
      symbol: playerSymbol
    });
  }, [game.status, boardState, currentPlayer, playerSymbol, game.code, currentPlayerId]);

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

          <GameBoard 
            boardState={boardState} 
            onMove={handleMove} 
            isActive={game.status === 'playing' && currentPlayer === playerSymbol}
          />
          
          {game.status === 'playing' && (
            <div className="p-3 text-center rounded-lg bg-blue-50">
              {currentPlayer === playerSymbol ? 
                <span className="font-medium text-blue-600">Your turn</span> : 
                <span className="text-gray-600">Waiting for opponent...</span>
              }
            </div>
          )}
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
                      Host (X)
                    </span>
                  )}
                  {!player.isHost && (
                    <span className="px-2 py-1 text-xs text-red-600 bg-red-100 rounded-full">
                      Guest (O)
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
              onClick={handleStartGame}
              disabled={isLoading || !isConnected}
              className="w-full px-6 py-3 font-medium text-white transition-all duration-200 bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Starting...
                </span>
              ) : !isConnected ? (
                'Connecting...'
              ) : (
                'Start Game'
              )}
            </button>
          )}
          
          {/* Connection status indicator */}
          <div className="text-sm text-center text-gray-500">
            {isConnected ? 
              <span className="text-green-500">Connected</span> : 
              <span className="text-red-500">Disconnected</span>
            }
          </div>
        </div>
      </motion.div>
    </div>
  );
}