import React from 'react';
import { Song, Difficulty, Theme } from '@/types/game';
import { getDifficultyText, getDifficultyColor } from '@/data/songs';
import { useTheme } from '@/hooks/useTheme';

interface MainMenuProps {
  songs: Song[];
  selectedSong: Song;
  selectedDifficulty: Difficulty;
  onSelectSong: (song: Song) => void;
  onSelectDifficulty: (difficulty: Difficulty) => void;
  onStartGame: () => void;
  onOpenEditor: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  songs,
  selectedSong,
  selectedDifficulty,
  onSelectSong,
  onSelectDifficulty,
  onStartGame,
  onOpenEditor,
}) => {
  const { theme, themes, setTheme } = useTheme();
  const difficulties: Difficulty[] = ['easy', 'normal', 'hard'];
  
  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden"
      style={{ background: theme.colors.backgroundGradient }}
    >
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(circle at 20% 80%, ${theme.colors.accent}40 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, ${theme.colors.notes[2]}40 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, ${theme.colors.notes[0]}20 0%, transparent 60%)
          `,
          animation: 'bgPulse 8s ease-in-out infinite',
        }} />
      </div>
      
      <div className="relative z-10 text-center mb-8">
        <h1 
          className="text-6xl font-bold mb-4 bg-clip-text text-transparent"
          style={{ 
            backgroundImage: `linear-gradient(90deg, ${theme.colors.notes[0]}, ${theme.colors.notes[1]}, ${theme.colors.notes[2]}, ${theme.colors.notes[3]})`,
            textShadow: `0 0 40px ${theme.colors.accent}40`,
          }}
        >
          节奏大师
        </h1>
        <p style={{ color: theme.colors.textSecondary }} className="text-xl">
          跟随节奏，释放你的音乐灵魂
        </p>
      </div>
      
      <div className="relative z-10 w-full max-w-2xl space-y-6">
        <div className="space-y-3">
          <h2 className="text-xl font-bold" style={{ color: theme.colors.text }}>选择曲目</h2>
          <div className="grid gap-3">
            {songs.map((song) => (
              <button
                key={song.id}
                onClick={() => onSelectSong(song)}
                className={`p-5 rounded-xl transition-all duration-300 text-left ${
                  selectedSong.id === song.id ? 'scale-105' : 'hover:scale-102'
                }`}
                style={{
                  background: selectedSong.id === song.id 
                    ? `linear-gradient(90deg, ${theme.colors.accent}40, ${theme.colors.notes[1]}40)`
                    : `${theme.colors.trackBg}`,
                  boxShadow: selectedSong.id === song.id 
                    ? `0 0 30px ${theme.colors.accent}40` 
                    : 'none',
                  border: `2px solid ${selectedSong.id === song.id ? theme.colors.accent : 'transparent'}`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold" style={{ color: theme.colors.text }}>
                      {song.name}
                    </h3>
                    <p style={{ color: theme.colors.textSecondary }} className="text-sm">
                      {song.artist}
                    </p>
                    {song.bpmChanges && song.bpmChanges.length > 0 && (
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs"
                            style={{ background: `${theme.colors.accent}33`, color: theme.colors.accent }}>
                        变速谱面
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-mono" style={{ color: theme.colors.notes[2] }}>
                      {song.baseBpm} BPM
                    </p>
                    <p style={{ color: theme.colors.textSecondary }} className="text-sm">
                      {Math.floor(song.duration / 1000)}秒
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
        
        <div className="space-y-3">
          <h2 className="text-xl font-bold" style={{ color: theme.colors.text }}>选择难度</h2>
          <div className="flex gap-3">
            {difficulties.map((diff) => {
              const color = getDifficultyColor(diff);
              const isSelected = selectedDifficulty === diff;
              
              return (
                <button
                  key={diff}
                  onClick={() => onSelectDifficulty(diff)}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                    isSelected ? 'scale-110' : 'hover:scale-105'
                  }`}
                  style={{
                    background: isSelected 
                      ? `linear-gradient(180deg, ${color} 0%, ${color}88 100%)`
                      : `${theme.colors.trackBg}`,
                    color: isSelected ? '#fff' : theme.colors.textSecondary,
                    boxShadow: isSelected ? `0 0 20px ${color}66` : 'none',
                    border: `2px solid ${isSelected ? color : 'rgba(255, 255, 255, 0.1)'}`,
                  }}
                >
                  {getDifficultyText(diff)}
                </button>
              );
            })}
          </div>
        </div>
        
        <div className="space-y-3">
          <h2 className="text-xl font-bold" style={{ color: theme.colors.text }}>选择主题</h2>
          <div className="grid grid-cols-5 gap-2">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`p-3 rounded-lg transition-all duration-300 ${
                  theme.id === t.id ? 'scale-110' : 'hover:scale-105'
                }`}
                style={{
                  background: t.colors.backgroundGradient,
                  border: `2px solid ${theme.id === t.id ? theme.colors.accent : 'transparent'}`,
                  boxShadow: theme.id === t.id ? `0 0 15px ${theme.colors.accent}66` : 'none',
                }}
                title={t.name}
              >
                <div className="flex gap-0.5 justify-center">
                  {t.colors.notes.map((color, i) => (
                    <div
                      key={i}
                      className="w-2 h-4 rounded-sm"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <p className="text-xs mt-1 text-center truncate" style={{ color: t.colors.text }}>
                  {t.name}
                </p>
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={onStartGame}
            className="flex-1 py-5 rounded-xl font-bold text-xl text-white transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              background: `linear-gradient(135deg, ${theme.colors.notes[0]}, ${theme.colors.notes[1]}, ${theme.colors.notes[2]})`,
              boxShadow: `0 0 40px ${theme.colors.accent}66`,
            }}
          >
            开始游戏
          </button>
          
          <button
            onClick={onOpenEditor}
            className="px-6 py-5 rounded-xl font-bold text-lg transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              background: theme.colors.trackBg,
              color: theme.colors.text,
              border: `2px solid ${theme.colors.accent}44`,
            }}
          >
            编辑器
          </button>
        </div>
        
        <div className="text-center text-sm" style={{ color: theme.colors.textSecondary }}>
          <p>按键说明：D F J K 对应四条轨道</p>
          <p className="mt-1 text-xs">支持 Tap / Hold / Slide / Rapid 多种音符类型</p>
        </div>
      </div>
    </div>
  );
};
