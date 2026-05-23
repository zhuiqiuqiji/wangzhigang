import React from 'react';
import { X, Gift, Sparkles } from 'lucide-react';
import type { BonusGameState } from '@/types/game';

interface BonusGameModalProps {
  gameState: BonusGameState | null;
  onPickBox: (index: number) => void;
  onClose: () => void;
  betPerLine: number;
}

export const BonusGameModal: React.FC<BonusGameModalProps> = React.memo(({
  gameState,
  onPickBox,
  onClose,
  betPerLine,
}) => {
  if (!gameState) return null;

  const isGameComplete = gameState.picksRemaining <= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      <div className="relative bg-gradient-to-b from-orange-900 via-red-900 to-black border-4 border-orange-400 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-[0_0_60px_rgba(255,165,0,0.5)]">
        <button
          onClick={onClose}
          disabled={!isGameComplete}
          className={`absolute top-4 right-4 transition-colors ${isGameComplete ? 'text-gray-400 hover:text-white' : 'text-gray-600 cursor-not-allowed'}`}
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Gift className="w-16 h-16 text-orange-400 animate-bounce" />
              <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-400 animate-pulse" />
            </div>
          </div>

          <h2 className="font-display text-3xl sm:text-4xl text-orange-400 animate-neon-pulse mb-2">
            🎁 Bonus 小游戏！
          </h2>

          <p className="text-gray-400 mb-4">
            选择宝箱赢取额外奖励！
          </p>

          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="bg-orange-500/20 rounded-lg px-4 py-2 border border-orange-400/30">
              <p className="text-gray-400 text-xs">剩余次数</p>
              <p className="font-digital text-2xl text-orange-400">{gameState.picksRemaining}</p>
            </div>
            <div className="bg-green-500/20 rounded-lg px-4 py-2 border border-green-400/30">
              <p className="text-gray-400 text-xs">已赢取</p>
              <p className="font-digital text-2xl text-green-400">{gameState.totalPrize.toLocaleString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
            {gameState.prizes.map((prize, index) => (
              <button
                key={index}
                onClick={() => onPickBox(index)}
                disabled={gameState.revealed[index] || gameState.picksRemaining <= 0}
                className={`
                  relative aspect-square rounded-xl transition-all duration-300 transform
                  ${gameState.revealed[index]
                    ? 'bg-gradient-to-b from-green-600 to-green-800 border-2 border-green-400 scale-105'
                    : gameState.picksRemaining <= 0
                    ? 'bg-gradient-to-b from-gray-700 to-gray-900 border-2 border-gray-600 opacity-50'
                    : 'bg-gradient-to-b from-orange-500 to-red-600 border-2 border-orange-400 hover:scale-105 active:scale-95 cursor-pointer hover:shadow-[0_0_20px_rgba(255,165,0,0.6)]'
                  }
                `}
              >
                {gameState.revealed[index] ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <span className="text-2xl sm:text-3xl mb-1">💰</span>
                    <span className="text-white font-bold text-sm sm:text-base font-digital">
                      {(prize * betPerLine).toLocaleString()}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <span className="text-3xl sm:text-4xl">🎁</span>
                    <span className="text-white/80 text-xs mt-1">点击打开</span>
                  </div>
                )}
              </button>
            ))}
          </div>

          {isGameComplete && (
            <div className="animate-coin-pop">
              <div className="bg-gradient-to-r from-green-500/20 via-yellow-500/20 to-green-500/20 rounded-2xl p-4 border border-green-400/30 mb-4">
                <p className="text-gray-400 text-sm">恭喜总共获得</p>
                <p className="font-digital text-3xl text-green-400">
                  {gameState.totalPrize.toLocaleString()} 💰
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-xl rounded-xl hover:scale-105 active:scale-95 transition-transform shadow-[0_0_30px_rgba(255,165,0,0.4)]"
              >
                领取奖励
              </button>
            </div>
          )}

          {!isGameComplete && (
            <p className="text-orange-400/80 text-sm animate-pulse">
              还有 {gameState.picksRemaining} 次机会，点击宝箱继续！
            </p>
          )}
        </div>
      </div>
    </div>
  );
});

BonusGameModal.displayName = 'BonusGameModal';
