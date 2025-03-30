export type Player = 'X' | 'O';
export type Cell = Player | null;
export type Board = Cell[];
export type GameStatus = 'waiting' | 'playing' | 'won' | 'draw' | 'ended';

interface PlayerInfo {
  id: string;
  name: string;
}

export interface GameState {
  board: Board;
  moves: number[];
  currentPlayer: Player;
  winner: Player | null;
  status: GameStatus;
  players: {
    X: PlayerInfo | null;
    O: PlayerInfo | null;
  };
  scores: {
    X: number;
    O: number;
  };
  theme: 'light' | 'dark';
  gameId: string | null;
  symbol: Player | null;
}

export interface GameStore extends GameState {
  makeMove: (index: number) => void;
  setPlayer: (symbol: Player, name: string) => void;
  resetGame: () => void;
  toggleTheme: () => void;
  setGameId: (gameId: string) => void;
  setSymbol: (symbol: Player) => void;
}