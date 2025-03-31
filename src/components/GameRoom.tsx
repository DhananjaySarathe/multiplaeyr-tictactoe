'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Copy, Loader2, Check } from 'lucide-react';
import type { Game } from '@prisma/client';
import { GameBoard } from './GameBoard';
import { getSocket } from '../lib/socket';

interface GameRoomProps {
  initialGame: Game & {
    players: any[];
  };
}

export function GameRoom({ initialGame }: GameRoomProps) {
  const [game, setGame] = useState(initialGame);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [boardState, setBoardState] = useState<(string | null)[]>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<string>('X'); // X always starts
  const [playerSymbol, setPlayerSymbol] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isHost, setIsHost] = useState<boolean | null>(null); // Initialize as null
  const [message, setMessage] = useState<string | null>(null);
  const [localPlayerId, setLocalPlayerId] = useState<string | null>(null);

  // Store player name in localStorage for persistence
  useEffect(() => {
    let storedPlayerName = localStorage.getItem('playerName');
    if (!storedPlayerName) {
      storedPlayerName = prompt('Enter your name:') || `Anonymous_${Math.random().toString(36).substring(7)}`;
      localStorage.setItem('playerName', storedPlayerName);
    }
    setLocalPlayerId(storedPlayerName);
  }, []);

  useEffect(() => {
    if (!game.code || !localPlayerId) return; // Don't connect until we have game code and player ID

    const socket = getSocket();
    
    // Connection events
    socket.on('connect', () => {
      console.log('Connected to server with ID:', socket.id);
      setIsConnected(true);
      
      // Join the game room
      socket.emit('joinGame', { 
        gameCode: game.code, 
        playerId: localPlayerId
      });
      console.log(`Emitted joinGame for game ${game.code} as player ${localPlayerId}`);
    });
    
    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
      setIsHost(null); // Reset host status on disconnect
      setPlayerSymbol(null); // Reset symbol
    });
    
    // Player assignment
    socket.on('playerAssigned', ({ symbol, isHost: hostStatus }) => {
      console.log(`<<<< Received playerAssigned: Symbol=${symbol}, isHost=${hostStatus} >>>>`);
      setPlayerSymbol(symbol);
      setIsHost(hostStatus);
      localStorage.setItem('playerSymbol', symbol);
      localStorage.setItem('isHostClient', String(hostStatus));
    });
    
    // Game state updates
    socket.on('gameState', (updatedGame) => {
      console.log('<<< Received gameState:', updatedGame, '>>>');
      
      if (updatedGame.board) {
        setBoardState(updatedGame.board);
      }
      
      if (updatedGame.currentPlayer) {
        setCurrentPlayer(updatedGame.currentPlayer);
      }
      
      if (updatedGame.status) {
        setGame(prev => ({
          ...prev,
          status: updatedGame.status,
          // Update players array from the server state if available
          players: updatedGame.players ? Object.values(updatedGame.players).map((p: any) => ({ ...p, isHost: p.symbol === 'X' })) : prev.players
        }));
        
        if (updatedGame.status === 'playing') {
          setMessage('Game started! X goes first.');
          setTimeout(() => setMessage(null), 3000);
        }
      }
    });
    
    // Player notifications
    socket.on('playerJoined', (data) => {
      console.log('<<< Received playerJoined:', data, '>>>');
      setMessage(`${data.players[1]?.name || 'Opponent'} has joined the game!`);
      setTimeout(() => setMessage(null), 3000);
      // Optional: Trigger a gameState fetch or rely on the server to send it
    });
    
    socket.on('playerDisconnected', ({ symbol }) => {
      setMessage(`Player ${symbol} disconnected!`);
      setTimeout(() => setMessage(null), 3000);
      // Optionally reset game state or handle accordingly
    });

    socket.on('error', (errorData) => {
      console.error('<<< Received server error:', errorData.message, '>>>');
      setMessage(`Error: ${errorData.message}`);
      setTimeout(() => setMessage(null), 5000);
    });
    
    // Cleanup event listeners on component unmount
    return () => {
      console.log('Cleaning up GameRoom listeners');
      socket.off('connect');
      socket.off('disconnect');
      socket.off('playerAssigned');
      socket.off('gameState');
      socket.off('playerJoined');
      socket.off('playerDisconnected');
      socket.off('error');
    };
  // Depend on localPlayerId to ensure joinGame is emitted after name is set
  }, [game.code, localPlayerId]); 

  const handleStartGame = useCallback(() => {
    // Explicitly check the isHost state variable
    console.log(`Attempting to start game... Am I identified as host? ${isHost}`); 
    if (!isHost) {
      console.log("Start game rejected: Client does not identify as host.");
      setMessage("Only the host (Player X) can start the game.");
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    
    setIsLoading(true);
    try {
      const socket = getSocket();
      socket.emit('startGame', { gameCode: game.code });
      console.log(`Emitted startGame for game ${game.code}`);
    } catch (error) {
      console.error('Failed to start game:', error);
      setMessage(`Error: ${error instanceof Error ? error.message : 'Failed to start game'}`);
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setIsLoading(false);
    }
  // Add isHost to dependency array for useCallback
  }, [game.code, isHost]); 

  const handleMove = useCallback((index: number) => {
    console.log('Handling move at index:', index);
    console.log('Current state: status =', game.status, ', currentPlayer =', currentPlayer, ', playerSymbol =', playerSymbol);
    
    if (game.status !== 'playing') {
      console.log('Move rejected - Game not in playing state:', game.status);
      return;
    }
    
    if (boardState[index] !== null) {
      console.log('Move rejected - Cell already filled:', boardState[index]);
      return;
    }
    
    if (currentPlayer !== playerSymbol) {
      console.log('Move rejected - Not your turn. Current player:', currentPlayer, 'Your symbol:', playerSymbol);
      return;
    }
    
    console.log('Move accepted! Sending to server...');
    const socket = getSocket();
    socket.emit('makeMove', {
      gameCode: game.code,
      index,
      symbol: playerSymbol
    });
  }, [game.status, game.code, boardState, currentPlayer, playerSymbol]);

  const copyGameCode = useCallback(() => {
    navigator.clipboard.writeText(game.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setMessage('Game code copied! Share this with your friend to join.');
    setTimeout(() => setMessage(null), 3000);
  }, [game.code]);

  // Determine if it's the current player's turn
  const isMyTurn = playerSymbol === currentPlayer && game.status === 'playing';
  
  // Determine player names for display (handle potential undefined players)
  const playerXName = game.players?.find(p => p.isHost)?.name || 'Player X';
  const playerOName = game.players?.find(p => !p.isHost)?.name || 'Player O';

  // Check if players data is available and has length
  const playersAvailable = Array.isArray(game.players) && game.players.length > 0;

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      {/* Notification message */}
      {message && (
        <div className="fixed z-50 w-auto max-w-md px-6 py-3 transform -translate-x-1/2 bg-white rounded-lg shadow-lg top-4 left-1/2">
          <p className="text-center text-gray-800">{message}</p>
        </div>
      )}
      
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
                title="Copy game code"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Game status and current turn indicator */}
          <div className={`p-4 rounded-lg text-center ${
            game.status === 'waiting'
              ? 'bg-blue-100 text-blue-700'
              : isMyTurn
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
          }`}>
            {game.status === 'waiting' ? (
              <p className="font-medium">
                {playersAvailable && game.players.length === 2 
                  ? 'Both players have joined! Ready to start.'
                  : 'Waiting for another player to join...' 
                }
              </p>
            ) : isMyTurn ? (
              <p className="font-medium">Your turn! Place an {playerSymbol}</p>
            ) : (
              <p className="font-medium">Wait for {currentPlayer === 'X' ? playerXName : playerOName}'s move...</p>
            )}
          </div>

          <GameBoard 
            boardState={boardState} 
            onMove={handleMove} 
            isActive={isMyTurn}
          />
          
          {/* Debug status */}
          <div className="mt-2 text-xs text-gray-500">
            <p>You: {playerSymbol || 'Not assigned'} (Host: {isHost === null ? '?' : isHost ? 'Yes' : 'No'}) | Current Turn: {currentPlayer}</p>
            <p>Status: {game.status} | Connected: {isConnected ? 'Yes' : 'No'}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-gray-50 rounded-xl">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Players</h2>
            <div className="space-y-3">
              {playersAvailable ? game.players.map((player) => (
                <div
                  // Use name as key temporarily, assuming names are unique for now
                  key={player.name || player.id} 
                  className="flex items-center justify-between text-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      (player.isHost && currentPlayer === 'X') || (!player.isHost && currentPlayer === 'O')
                        ? 'bg-green-500 animate-pulse' // Add pulse for current player
                        : 'bg-gray-400'
                    }`} />
                    <span>{player.name}</span>
                  </div>
                  <div className="flex items-center">
                    {player.isHost ? (
                      <span className="px-2 py-1 text-xs text-blue-600 bg-blue-100 rounded-full">
                        X {currentPlayer === 'X' && game.status === 'playing' && '(Turn)'}
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs text-red-600 bg-red-100 rounded-full">
                        O {currentPlayer === 'O' && game.status === 'playing' && '(Turn)'}
                      </span>
                    )}
                  </div>
                </div>
              )) : (
                <div className="flex items-center gap-3 text-gray-400">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Waiting for players...</span>
                </div>
              )}
            </div>
          </div>

          {/* Start Game Button Logic */}
          {playersAvailable && game.players.length === 2 && game.status === 'waiting' && (
            <button
              onClick={handleStartGame}
              // Disable if loading, not connected, or explicitly not the host (isHost is false)
              // If isHost is null (undetermined), also disable
              disabled={isLoading || !isConnected || isHost !== true} 
              className="w-full px-6 py-3 font-medium text-white transition-all duration-200 bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Starting...
                </span>
              ) : !isConnected ? (
                'Connecting...'
              // Explicitly check if isHost is false
              ) : isHost === false ? ( 
                'Waiting for host to start'
              // Only show Start Game if isHost is true
              ) : isHost === true ? ( 
                'Start Game'
              // Default/Fallback case if isHost is null
              ) : ( 
                'Initializing...' 
              )}
            </button>
          )}
          
          {/* Connection status indicator */}
          <div className="text-sm text-center">
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

// Simple fade-in animation for messages
const messageVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0 },
};