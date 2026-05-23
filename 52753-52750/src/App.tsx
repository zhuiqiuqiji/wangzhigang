import React, { useState, useCallback } from 'react';
import { GameState, Difficulty, GameStatus, Song, ReplayData } from '@/types/game';
import { songs } from '@/data/songs';
import { MainMenu } from '@/components/MainMenu';
import { GameScene } from '@/components/GameScene';
import { ResultScreen } from '@/components/ResultScreen';
import { Editor } from '@/components/Editor';

function App() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [selectedSong, setSelectedSong] = useState<Song>(songs[0]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('normal');
  const [gameResult, setGameResult] = useState<GameStatus | null>(null);
  const [lastReplay, setLastReplay] = useState<ReplayData | null>(null);
  
  const handleStartGame = useCallback(() => {
    setGameState('playing');
  }, []);
  
  const handleOpenEditor = useCallback(() => {
    setGameState('editor');
  }, []);
  
  const handleGameEnd = useCallback((status: GameStatus, replay?: ReplayData) => {
    setGameResult(status);
    if (replay) {
      setLastReplay(replay);
      localStorage.setItem('lastReplay', JSON.stringify(replay));
    }
    setGameState('result');
  }, []);
  
  const handleRestart = useCallback(() => {
    setGameResult(null);
    setGameState('playing');
  }, []);
  
  const handleBackToMenu = useCallback(() => {
    setGameResult(null);
    setGameState('menu');
  }, []);
  
  return (
    <div className="min-h-screen bg-black">
      {gameState === 'menu' && (
        <MainMenu
          songs={songs}
          selectedSong={selectedSong}
          selectedDifficulty={selectedDifficulty}
          onSelectSong={setSelectedSong}
          onSelectDifficulty={setSelectedDifficulty}
          onStartGame={handleStartGame}
          onOpenEditor={handleOpenEditor}
        />
      )}
      
      {gameState === 'playing' && (
        <GameScene
          key={`${selectedSong.id}-${selectedDifficulty}-${Date.now()}`}
          song={selectedSong}
          difficulty={selectedDifficulty}
          onGameEnd={handleGameEnd}
        />
      )}
      
      {gameState === 'result' && gameResult && (
        <ResultScreen
          song={selectedSong}
          difficulty={selectedDifficulty}
          status={gameResult}
          replay={lastReplay}
          onRestart={handleRestart}
          onBackToMenu={handleBackToMenu}
        />
      )}
      
      {gameState === 'editor' && (
        <Editor
          song={selectedSong}
          difficulty={selectedDifficulty}
          onBack={handleBackToMenu}
        />
      )}
    </div>
  );
}

export default App;
