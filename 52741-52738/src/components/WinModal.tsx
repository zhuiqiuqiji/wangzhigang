import React, { useEffect, useState, useRef } from 'react';
import { X, Sparkles } from 'lucide-react';
import type { WinInfo } from '@/types/game';

interface WinModalProps {
  winInfo: WinInfo;
  onClose: () => void;
}

export const WinModal: React.FC<WinModalProps> = React.memo(({ winInfo, onClose }) => {
  const [showContent, setShowContent] = useState(false);
  const [displayAmount, setDisplayAmount] = useState(0);
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; color: string; delay: number }>>([]);
  const animationRef = useRef<number | null>(null);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setShowContent(false);
    setDisplayAmount(0);
    
    const colors = ['#FFD700', '#FF00FF', '#39FF14', '#FF6B6B', '#4ECDC4', '#FFE66D'];
    const particles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.5,
    }));
    setConfetti(particles);

    showTimerRef.current = setTimeout(() => setShowContent(true), 100);

    const start = 0;
    const end = winInfo.totalWin;
    const duration = 1500;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * easeProgress);
      setDisplayAmount(current);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        animationRef.current = null;
      }
    };

    startTimerRef.current = setTimeout(() => {
      animationRef.current = requestAnimationFrame(animate);
    }, 200);

    return () => {
      if (showTimerRef.current) {
        clearTimeout(showTimerRef.current);
      }
      if (startTimerRef.current) {
        clearTimeout(startTimerRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [winInfo]);

  const isBigWin = winInfo.totalWin >= 1000;
  const isJackpot = winInfo.jackpotWon;
  const hasFreeSpins = winInfo.freeSpinsWon > 0;

  const getMaxMultiplier = () => {
    if (winInfo.wins.length === 0) return 1;
    return Math.max(...winInfo.wins.map(w => w.multiplier));
  };

  const getWinName = () => {
    if (isJackpot) return '🎉 大奖！';
    if (winInfo.wins.length > 1) return `🎊 ${winInfo.wins.length}条线中奖！`;
    if (winInfo.wins.length === 1) return `🎉 ${winInfo.wins[0].name}！`;
    if (hasFreeSpins) return '🎁 免费旋转！';
    return '🎉 恭喜中奖！';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {confetti.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-3 h-3 rounded-full pointer-events-none"
          style={{
            left: `${particle.x}%`,
            backgroundColor: particle.color,
            animation: `confetti-fall 3s ease-out ${particle.delay}s forwards`,
          }}
        />
      ))}

      <div
        className={`
          relative bg-gradient-to-b from-gray-800 via-gray-900 to-black
          border-4 rounded-3xl p-8 max-w-md w-full
          transform transition-all duration-500
          ${showContent ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}
        `}
        style={{
          borderColor: isJackpot ? '#FF00FF' : isBigWin ? '#FFD700' : '#39FF14',
          boxShadow: isJackpot 
            ? '0 0 60px rgba(255, 0, 255, 0.5)' 
            : isBigWin 
            ? '0 0 60px rgba(255, 215, 0, 0.5)' 
            : '0 0 40px rgba(57, 255, 20, 0.3)',
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className={`relative ${isJackpot || isBigWin ? 'animate-bounce' : 'animate-pulse'}`}>
              <Sparkles
                className={`w-16 h-16`}
                style={{
                  color: isJackpot ? '#FF00FF' : isBigWin ? '#FFD700' : '#39FF14',
                }}
              />
              {(isJackpot || isBigWin) && (
                <div className="absolute inset-0 animate-ping opacity-50">
                  <Sparkles
                    className="w-16 h-16"
                    style={{
                      color: isJackpot ? '#FF00FF' : '#FFD700',
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <h2
            className={`font-display text-3xl md:text-4xl mb-2 animate-neon-pulse`}
            style={{
              color: isJackpot ? '#FF00FF' : isBigWin ? '#FFD700' : '#39FF14',
            }}
          >
            {getWinName()}
          </h2>

          {winInfo.wins.length > 0 && (
            <div className="flex flex-wrap justify-center items-center gap-1 text-2xl md:text-3xl my-4">
              {winInfo.wins[0].combination.slice(0, 5).map((symbol, idx) => (
                <span
                  key={idx}
                  className="animate-win-bounce inline-block"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  {symbol}
                </span>
              ))}
            </div>
          )}

          {winInfo.wins.length > 1 && (
            <div className="mb-4 max-h-32 overflow-y-auto bg-gray-800/50 rounded-lg p-3">
              <p className="text-gray-400 text-xs mb-2">中奖详情：</p>
              {winInfo.wins.map((win, idx) => (
                <div key={idx} className="flex justify-between text-sm py-1 border-b border-gray-700/50">
                  <span className="text-gray-300">{win.name}</span>
                  <span className="text-yellow-400">+{win.winAmount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-center gap-4 mb-4">
            {winInfo.hasWild && (
              <div className="bg-purple-500/20 px-3 py-1 rounded-full border border-purple-400/50">
                <span className="text-purple-400 text-sm">含万能图标</span>
              </div>
            )}
            {winInfo.hasScatter && (
              <div className="bg-cyan-500/20 px-3 py-1 rounded-full border border-cyan-400/50">
                <span className="text-cyan-400 text-sm">免费旋转</span>
              </div>
            )}
            {winInfo.hasBonus && (
              <div className="bg-orange-500/20 px-3 py-1 rounded-full border border-orange-400/50">
                <span className="text-orange-400 text-sm">Bonus游戏</span>
              </div>
            )}
          </div>

          {hasFreeSpins && (
            <div className="mb-4 bg-cyan-500/20 rounded-xl p-3 border border-cyan-400/30">
              <p className="text-cyan-400 font-bold">
                🎁 获得 {winInfo.freeSpinsWon} 次免费旋转！
              </p>
            </div>
          )}

          {isJackpot && (
            <div className="mb-4 bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-purple-500/30 rounded-xl p-4 border border-purple-400/50">
              <p className="text-purple-300 font-bold text-lg">
                👑 恭喜获得累计奖池！
              </p>
              <p className="text-yellow-400 font-digital text-2xl">
                +{winInfo.jackpotAmount.toLocaleString()}
              </p>
            </div>
          )}

          <div className="bg-gradient-to-r from-yellow-500/10 via-yellow-500/20 to-yellow-500/10 rounded-2xl p-6 border border-yellow-500/30">
            <p className="text-gray-400 text-sm mb-1">总共获得</p>
            <p
              className={`font-digital text-4xl md:text-5xl font-bold`}
              style={{
                color: isJackpot ? '#FF00FF' : '#FFD700',
              }}
            >
              {displayAmount.toLocaleString()}
            </p>
            <p className="text-yellow-500 text-lg mt-1">💰 金币</p>
          </div>

          <button
            onClick={onClose}
            className={`
              mt-6 px-8 py-3 rounded-xl font-bold text-lg
              transition-all duration-200 transform hover:scale-105 active:scale-95
              text-gray-900
            `}
            style={{
              background: isJackpot
                ? 'linear-gradient(to right, #FF00FF, #8B00FF)'
                : 'linear-gradient(to right, #FFD700, #DAA520)',
            }}
          >
            继续游戏
          </button>
        </div>
      </div>

      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-10vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
});

WinModal.displayName = 'WinModal';
