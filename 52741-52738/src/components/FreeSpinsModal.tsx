import React, { useEffect, useState } from 'react';
import { X, Sparkles, RotateCcw } from 'lucide-react';

interface FreeSpinsModalProps {
  freeSpinsCount: number;
  remainingSpins: number;
  multiplier: number;
  onClose: () => void;
}

export const FreeSpinsModal: React.FC<FreeSpinsModalProps> = React.memo(({
  freeSpinsCount,
  remainingSpins,
  multiplier,
  onClose,
}) => {
  const [showContent, setShowContent] = useState(false);
  const [displayCount, setDisplayCount] = useState(0);

  useEffect(() => {
    setShowContent(false);
    setDisplayCount(0);

    const showTimer = setTimeout(() => setShowContent(true), 100);

    const start = 0;
    const end = freeSpinsCount;
    const duration = 1000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * easeProgress);
      setDisplayCount(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    const countTimer = setTimeout(() => {
      requestAnimationFrame(animate);
    }, 200);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(countTimer);
    };
  }, [freeSpinsCount]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className={`
          relative bg-gradient-to-b from-purple-900 via-indigo-900 to-black
          border-4 border-cyan-400
          rounded-3xl p-8 max-w-md w-full
          transform transition-all duration-500
          ${showContent ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}
          shadow-[0_0_60px_rgba(0,255,255,0.5)]
        `}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative animate-bounce">
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center">
                <RotateCcw className="w-12 h-12 text-white" />
              </div>
              <div className="absolute inset-0 animate-ping opacity-50 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500" />
            </div>
          </div>

          <h2 className="font-display text-4xl text-cyan-400 animate-neon-pulse mb-2">
            🎉 免费旋转！
          </h2>

          <p className="text-gray-400 mb-6">
            恭喜获得免费旋转机会！
          </p>

          <div className="bg-gradient-to-r from-cyan-500/10 via-purple-500/20 to-cyan-500/10 rounded-2xl p-6 border border-cyan-400/30 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm mb-1">获得旋转</p>
                <p className="font-display text-4xl text-cyan-400">
                  {displayCount}
                  <span className="text-xl text-gray-400 ml-1">次</span>
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">倍率</p>
                <p className="font-display text-4xl text-purple-400">
                  ×{multiplier}
                </p>
              </div>
            </div>
          </div>

          {remainingSpins > 0 && (
            <div className="mb-6">
              <p className="text-gray-400 text-sm">
                剩余免费旋转：
                <span className="text-cyan-400 font-bold font-digital text-xl ml-2">
                  {remainingSpins}
                </span>
                {' '}次
              </p>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-yellow-400 mb-6">
            <Sparkles className="w-5 h-5" />
            <span className="text-sm">免费旋转期间所有奖励翻倍！</span>
            <Sparkles className="w-5 h-5" />
          </div>

          <button
            onClick={onClose}
            className="w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold text-xl rounded-xl hover:scale-105 active:scale-95 transition-transform shadow-[0_0_30px_rgba(0,255,255,0.4)]"
          >
            开始免费旋转！
          </button>
        </div>
      </div>
    </div>
  );
});

FreeSpinsModal.displayName = 'FreeSpinsModal';
