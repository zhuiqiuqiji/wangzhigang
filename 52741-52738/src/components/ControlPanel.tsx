import React from 'react';
import { Play, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ControlPanelProps {
  betPerLine: number;
  activePaylines: number[];
  betOptions: number[];
  paylineOptions: number[];
  isSpinning: boolean;
  canBet: boolean;
  isFreeSpinsActive: boolean;
  freeSpinsRemaining: number;
  bonusMultiplier: number;
  lastWin: number;
  onSetBetPerLine: (amount: number) => void;
  onSetPaylines: (count: number) => void;
  onSpin: () => void;
  onStartRiskGame: () => void;
  currentBet: number;
  themeAccentColor?: string;
}

export const ControlPanel: React.FC<ControlPanelProps> = React.memo(
  ({ 
    betPerLine, 
    activePaylines, 
    betOptions, 
    paylineOptions,
    isSpinning, 
    canBet, 
    isFreeSpinsActive,
    freeSpinsRemaining,
    bonusMultiplier,
    lastWin,
    onSetBetPerLine, 
    onSetPaylines, 
    onSpin,
    onStartRiskGame,
    currentBet,
    themeAccentColor = '#FFD700',
  }) => {
    return (
      <div className="w-full max-w-4xl mx-auto mt-6">
        {isFreeSpinsActive && (
          <div className="mb-4 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-cyan-500/20 border-2 border-cyan-400 rounded-xl animate-pulse">
              <span className="text-2xl">🎰</span>
              <span className="text-cyan-400 font-bold text-lg">
                免费旋转中！剩余 {freeSpinsRemaining} 次，倍率 ×{bonusMultiplier}
              </span>
              <span className="text-2xl">🎰</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-center text-gray-400 text-sm mb-3 uppercase tracking-wider">
              选择每条线下注
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {betOptions.map((amount) => (
                <button
                  key={amount}
                  onClick={() => onSetBetPerLine(amount)}
                  disabled={isSpinning || isFreeSpinsActive}
                  className={cn(
                    'px-3 py-2 sm:px-4 sm:py-2 rounded-xl font-bold text-base sm:text-lg',
                    'transition-all duration-200 transform',
                    betPerLine === amount
                      ? 'text-casino-darker scale-105 shadow-[0_0_20px_rgba(255,215,0,0.5)]'
                      : 'bg-gradient-to-b from-gray-700 to-gray-800 text-gray-300 hover:from-gray-600 hover:to-gray-700',
                    isSpinning || isFreeSpinsActive
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:scale-105 active:scale-95 cursor-pointer',
                    'border-2',
                    betPerLine === amount ? 'border-casino-gold' : 'border-gray-600'
                  )}
                  style={{
                    background: betPerLine === amount 
                      ? `linear-gradient(to bottom, ${themeAccentColor}, ${themeAccentColor}dd)` 
                      : undefined,
                  }}
                >
                  💰 {amount}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-center text-gray-400 text-sm mb-3 uppercase tracking-wider">
              选择中奖线数
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {paylineOptions.map((count) => (
                <button
                  key={count}
                  onClick={() => onSetPaylines(count)}
                  disabled={isSpinning || isFreeSpinsActive}
                  className={cn(
                    'px-3 py-2 sm:px-4 sm:py-2 rounded-xl font-bold text-base sm:text-lg',
                    'transition-all duration-200 transform',
                    activePaylines.length === count
                      ? 'bg-gradient-to-b from-casino-neonGreen to-green-700 text-casino-darker scale-105 shadow-[0_0_20px_rgba(57,255,20,0.5)]'
                      : 'bg-gradient-to-b from-gray-700 to-gray-800 text-gray-300 hover:from-gray-600 hover:to-gray-700',
                    isSpinning || isFreeSpinsActive
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:scale-105 active:scale-95 cursor-pointer',
                    'border-2',
                    activePaylines.length === count ? 'border-casino-neonGreen' : 'border-gray-600'
                  )}
                >
                  📊 {count}线
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <button
              onClick={onSpin}
              disabled={!canBet || isSpinning}
              className={cn(
                'relative px-12 py-4 sm:px-16 sm:py-5 rounded-2xl font-display text-2xl sm:text-3xl',
                'transition-all duration-200 transform',
                canBet && !isSpinning
                  ? 'text-casino-darker hover:scale-105 active:scale-95 cursor-pointer'
                  : 'bg-gradient-to-b from-gray-600 to-gray-800 text-gray-500 cursor-not-allowed',
                'border-4 overflow-hidden'
              )}
              style={{
                background: canBet && !isSpinning
                  ? `linear-gradient(to bottom, ${themeAccentColor}, #DAA520)`
                  : undefined,
                borderColor: themeAccentColor,
                boxShadow: canBet && !isSpinning
                  ? `0 0 30px ${themeAccentColor}66`
                  : undefined,
              }}
            >
              <span className="relative z-10 flex items-center gap-3">
                <Play className="w-8 h-8 fill-current" />
                {isSpinning ? '旋转中...' : isFreeSpinsActive ? '免费旋转' : '开始旋转'}
              </span>
              <div
                className={cn(
                  'absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent',
                  canBet && !isSpinning ? 'animate-[shimmer_2s_infinite]' : ''
                )}
                style={{ transform: 'skewX(-20deg)' }}
              />
            </button>

            {lastWin > 0 && !isSpinning && !isFreeSpinsActive && (
              <button
                onClick={onStartRiskGame}
                className="px-6 py-4 sm:px-8 sm:py-5 rounded-2xl font-display text-xl sm:text-2xl bg-gradient-to-b from-red-500 to-red-700 text-white border-4 border-red-400 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)]"
              >
                <span className="flex items-center gap-2">
                  <TrendingUp className="w-6 h-6" />
                  博大小
                  <span className="text-yellow-300">×2</span>
                </span>
              </button>
            )}
          </div>

          <div className="flex items-center justify-center gap-6 text-gray-400 text-sm">
            <p>
              单线下注：
              <span className="text-casino-gold font-bold font-digital text-xl ml-2">
                {betPerLine.toLocaleString()}
              </span>
              {' '}金币
            </p>
            <p>
              押注线数：
              <span className="text-casino-neonGreen font-bold font-digital text-xl ml-2">
                {activePaylines.length}
              </span>
              {' '}线
            </p>
            <p>
              总计下注：
              <span className="text-casino-gold font-bold font-digital text-xl ml-2">
                {currentBet.toLocaleString()}
              </span>
              {' '}金币
            </p>
          </div>
        </div>

        <style>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%) skewX(-20deg); }
            100% { transform: translateX(200%) skewX(-20deg); }
          }
        `}</style>
      </div>
    );
  }
);

ControlPanel.displayName = 'ControlPanel';
