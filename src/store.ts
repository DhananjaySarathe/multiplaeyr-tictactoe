import { create } from 'zustand';
import { GameState, GameStore, Player } from './types';
import { io, Socket } from 'socket.io-client';

const socket = io('http://localhost:5173');

const initialState: GameState = {
  board: Array(9).fill(null),
  moves: [],
  currentPlayer: 'X',
  winner: null,
  status: 'waiting',
  players: {
    X: null,
    O: null,
  },
  scores: {
    X: 0,
    O: 0,
  },
  theme: 'light',
  gameId: null,
  symbol: null,
};

const checkWinner = (board: (string | null)[]): Player | null => {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a] as Player;
    }
  }

  return null;
};

export const useGameStore = create<GameStore>((set) => {
  // Socket event listeners
  socket.on('gameState', (gameState) => {
    set((state) => ({
      ...state,
      board: gameState.board,
      moves: gameState.moves,
      currentPlayer: gameState.currentPlayer,
      status: gameState.status,
      players: gameState.players,
    }));
  });

  socket.on('playerAssigned', ({ symbol }) => {
    set((state) => ({ ...state, symbol }));
  });

  socket.on('gameStart', (gameState) => {
    set((state) => ({
      ...state,
      status: 'playing',
      players: gameState.players,
    }));
  });

  socket.on('playerDisconnected', () => {
    set((state) => ({
      ...state,
      status: 'ended',
    }));
  });

  return {
    ...initialState,
    makeMove: (index) =>
      set((state) => {
        if (state.board[index] || state.winner || state.symbol !== state.currentPlayer) {
          return state;
        }

        socket.emit('makeMove', { gameId: state.gameId, index });
        return state;
      }),
    setPlayer: (symbol, name) =>
      set((state) => {
        const gameId = state.gameId || Math.random().toString(36).substring(7);
        socket.emit('joinGame', { gameId, player: name });
        
        return {
          ...state,
          gameId,
          players: { ...state.players, [symbol]: name },
        };
      }),
    resetGame: () =>
      set((state) => ({
        ...initialState,
        scores: state.scores,
        players: state.players,
        theme: state.theme,
        gameId: state.gameId,
        symbol: state.symbol,
      })),
    toggleTheme: () =>
      set((state) => ({
        ...state,
        theme: state.theme === 'light' ? 'dark' : 'light',
      })),
    setGameId: (gameId) =>
      set((state) => ({
        ...state,
        gameId,
      })),
    setSymbol: (symbol) =>
      set((state) => ({
        ...state,
        symbol,
      })),
  };
});