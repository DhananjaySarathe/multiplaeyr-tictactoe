import React from 'react';
import { useGameStore } from './store';
import { Board } from './components/Board';
import { PlayerForm } from './components/PlayerForm';
import { GameStatus } from './components/GameStatus';
import { ThemeToggle } from './components/ThemeToggle';
import { ThemeInitializer } from './hooks/useTheme';
import clsx from 'clsx';

function App() {
  const { players, theme } = useGameStore();

  return (
    <>
      <ThemeInitializer />
      <div
        className={clsx(
          'min-h-screen transition-colors duration-300 flex flex-col items-center justify-center p-4',
          theme === 'light' ? 'bg-gray-100' : 'bg-gray-900'
        )}
      >
        <ThemeToggle />
        
        {(!players.X || !players.O) ? (
          <div className="flex flex-col items-center gap-8">
            {!players.X && <PlayerForm symbol="X" />}
            {!players.O && players.X && <PlayerForm symbol="O" />}
          </div>
        ) : (
          <>
            <GameStatus />
            <Board />
          </>
        )}
      </div>
    </>
  );
}

export default App;