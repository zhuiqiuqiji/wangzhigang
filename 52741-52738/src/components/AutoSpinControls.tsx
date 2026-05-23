import React from 'react';
import { Play, Square, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AutoSpinControlsProps {
  isActive: boolean;
  remaining: number;
  isSpinning: boolean;
  canStart: boolean;
  onStart: (count: number) => void;
  onStop: () => void;
}

const AUTO_SPIN_OPTIONS = [10, 25, 50, 100];

export const AutoSpinControls: React.FC<AutoSpinControlsProps> = React.memo(({
  isActive,
  remaining,
  isSpinning,
  canStart,
  onStart,
  onStop,
}) => {
  return (
    <div className="w-full max-w-2xl mx-auto mt-4">
      <div className="bg-gradient-to-r from-casino-darker to-casino-dark border-2 border-casino-gold/50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-casino-gold" />
            <span className="text-gray-300 font-medium">自动旋转</span>
          </div>
          {isActive && (
            <div className="flex items-center gap-2 text-casino-neonGreen">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-casino-neonGreen opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-casino-neonGreen"></span>
              </span>
              <span className="font-digital text-lg">
                剩余 {remaining} 次
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {isActive ? (
            <button
              onClick={onStop}
              className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold rounded-lg hover:scale-102 active:scale-98 transition-transform flex items-center justify-center gap-2"
            >
              <Square className="w-5 h-5" />
              停止自动旋转
            </button>
          ) : (
            <>
              {AUTO_SPIN_OPTIONS.map((count) => (
                <button
                  key={count}
                  onClick={() => onStart(count)}
                  disabled={!canStart || isSpinning}
                  className={cn(
                    'flex-1 py-3 font-bold rounded-lg transition-all duration-200',
                    'flex items-center justify-center gap-1 text-sm sm:text-base',
                    canStart && !isSpinning
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:scale-105 active:scale-95 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
                  )}
                >
                  <Play className="w-4 h-4" />
                  {count}次
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
});

AutoSpinControls.displayName = 'AutoSpinControls';
