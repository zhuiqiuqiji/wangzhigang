import React, { useState } from 'react';
import { GameStatus, Song, Difficulty, ReplayData } from '@/types/game';
import { calculateAccuracy, calculateRating, getRatingColor } from '@/utils/score';
import { getDifficultyText, getDifficultyColor } from '@/data/songs';
import { useTheme } from '@/hooks/useTheme';

interface ResultScreenProps {
  song: Song;
  difficulty: Difficulty;
  status: GameStatus;
  replay?: ReplayData | null;
  onRestart: () => void;
  onBackToMenu: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  song,
  difficulty,
  status,
  replay,
  onRestart,
  onBackToMenu,
}) => {
  const { theme } = useTheme();
  const [shareCopied, setShareCopied] = useState(false);
  
  const accuracy = calculateAccuracy(status);
  const rating = calculateRating(accuracy);
  const ratingColor = getRatingColor(rating);
  const difficultyColor = getDifficultyColor(difficulty);
  const totalNotes = status.perfect + status.great + status.good + status.miss;
  
  const handleExportReplay = () => {
    if (!replay) return;
    
    const dataStr = JSON.stringify(replay);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `replay-${song.name}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const handleShare = async () => {
    if (!replay) return;
    
    const shareData = {
      song: song.name,
      score: status.score,
      rating,
      accuracy: (accuracy * 100).toFixed(1),
      maxCombo: status.maxCombo,
      replay: btoa(unescape(encodeURIComponent(JSON.stringify(replay)))),
    };
    
    const shareUrl = `${window.location.origin}?replay=${btoa(JSON.stringify({ songId: song.id, score: status.score }))}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch (err) {
      alert('分享链接已生成: ' + shareUrl);
    }
  };
  
  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden"
      style={{ background: theme.colors.backgroundGradient }}
    >
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(circle at 30% 70%, ${ratingColor}44 0%, transparent 50%),
            radial-gradient(circle at 70% 30%, ${theme.colors.notes[2]}44 0%, transparent 50%)
          `,
          animation: 'bgPulse 4s ease-in-out infinite',
        }} />
      </div>
      
      <div className="relative z-10 w-full max-w-2xl">
        <div className="text-center mb-8 animate-fade-in">
          <h2 className="text-2xl mb-2" style={{ color: theme.colors.textSecondary }}>演奏完成</h2>
          <h1 className="text-4xl font-bold mb-2" style={{ color: theme.colors.text }}>{song.name}</h1>
          <p className="text-lg" style={{ color: theme.colors.textSecondary }}>{song.artist}</p>
          <span 
            className="inline-block mt-2 px-4 py-1 rounded-full text-sm font-bold"
            style={{ 
              background: `${difficultyColor}33`,
              color: difficultyColor,
              border: `1px solid ${difficultyColor}66`,
            }}
          >
            {getDifficultyText(difficulty)}
          </span>
        </div>
        
        <div className="relative mb-8 animate-scale-in">
          <div 
            className="text-center py-8 rounded-3xl"
            style={{
              background: `linear-gradient(180deg, ${ratingColor}22 0%, ${ratingColor}11 100%)`,
              border: `2px solid ${ratingColor}44`,
              boxShadow: `0 0 60px ${ratingColor}22`,
            }}
          >
            <div 
              className="text-9xl font-bold mb-4"
              style={{
                color: ratingColor,
                textShadow: `0 0 60px ${ratingColor}88, 0 0 120px ${ratingColor}44`,
              }}
            >
              {rating}
            </div>
            <div className="text-6xl font-bold font-mono mb-2" style={{ color: theme.colors.text }}>
              {status.score.toLocaleString()}
            </div>
            <div style={{ color: theme.colors.textSecondary }} className="text-xl">总分</div>
          </div>
          
          <div 
            className="absolute -top-4 -right-4 px-6 py-2 rounded-full font-bold text-lg shadow-lg"
            style={{ 
              background: `linear-gradient(90deg, ${theme.colors.notes[0]}, ${theme.colors.accent})`,
              color: '#fff',
            }}
          >
            准确率 {(accuracy * 100).toFixed(1)}%
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 rounded-xl border" style={{ 
            background: theme.colors.trackBg, 
            borderColor: 'rgba(255,255,255,0.1)' 
          }}>
            <div className="text-3xl font-bold text-yellow-400 mb-1">{status.perfect}</div>
            <div className="text-sm" style={{ color: theme.colors.textSecondary }}>Perfect</div>
          </div>
          <div className="text-center p-4 rounded-xl border" style={{ 
            background: theme.colors.trackBg, 
            borderColor: 'rgba(255,255,255,0.1)' 
          }}>
            <div className="text-3xl font-bold text-green-400 mb-1">{status.great}</div>
            <div className="text-sm" style={{ color: theme.colors.textSecondary }}>Great</div>
          </div>
          <div className="text-center p-4 rounded-xl border" style={{ 
            background: theme.colors.trackBg, 
            borderColor: 'rgba(255,255,255,0.1)' 
          }}>
            <div className="text-3xl font-bold text-blue-400 mb-1">{status.good}</div>
            <div className="text-sm" style={{ color: theme.colors.textSecondary }}>Good</div>
          </div>
          <div className="text-center p-4 rounded-xl border" style={{ 
            background: theme.colors.trackBg, 
            borderColor: 'rgba(255,255,255,0.1)' 
          }}>
            <div className="text-3xl font-bold text-red-400 mb-1">{status.miss}</div>
            <div className="text-sm" style={{ color: theme.colors.textSecondary }}>Miss</div>
          </div>
        </div>
        
        <div className="flex justify-center gap-8 mb-6">
          <div className="text-center">
            <div className="text-4xl font-bold mb-1" style={{ color: theme.colors.notes[2] }}>{status.maxCombo}</div>
            <div className="text-sm" style={{ color: theme.colors.textSecondary }}>最大连击</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold mb-1" style={{ color: theme.colors.notes[1] }}>{totalNotes}</div>
            <div className="text-sm" style={{ color: theme.colors.textSecondary }}>总音符数</div>
          </div>
        </div>
        
        {replay && (
          <div className="flex gap-3 mb-6">
            <button
              onClick={handleExportReplay}
              className="flex-1 py-3 px-4 rounded-xl font-bold transition-all duration-300 hover:scale-105"
              style={{
                background: `${theme.colors.accent}22`,
                color: theme.colors.accent,
                border: `2px solid ${theme.colors.accent}44`,
              }}
            >
              📤 导出录像
            </button>
            <button
              onClick={handleShare}
              className="flex-1 py-3 px-4 rounded-xl font-bold transition-all duration-300 hover:scale-105"
              style={{
                background: `${theme.colors.notes[0]}22`,
                color: theme.colors.notes[0],
                border: `2px solid ${theme.colors.notes[0]}44`,
              }}
            >
              {shareCopied ? '✓ 已复制' : '🔗 分享'}
            </button>
          </div>
        )}
        
        <div className="flex gap-4">
          <button
            onClick={onRestart}
            className="flex-1 py-4 px-6 rounded-xl font-bold text-lg text-white transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              background: `linear-gradient(135deg, ${theme.colors.notes[0]}, ${theme.colors.notes[2]})`,
              boxShadow: `0 0 40px ${theme.colors.accent}44`,
            }}
          >
            再来一次
          </button>
          <button
            onClick={onBackToMenu}
            className="flex-1 py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              background: theme.colors.trackBg,
              color: theme.colors.text,
              border: `2px solid rgba(255, 255, 255, 0.2)`,
            }}
          >
            返回菜单
          </button>
        </div>
      </div>
    </div>
  );
};
