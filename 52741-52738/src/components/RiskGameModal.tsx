import React from 'react';
import { X, TrendingUp, TrendingDown, Trophy, AlertTriangle } from 'lucide-react';
import type { RiskGameState } from '@/types/game';

interface RiskGameModalProps {
  gameState: RiskGameState | null;
  onMakeChoice: (choice: 'high' | 'low') => void;
  onClose: () => void;
}

const CARD_SUITS = ['♠', '♥', '♦', '♣'];
const CARD_VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const RiskGameModal: React.FC<RiskGameModalProps> = React.memo(({
  gameState,
  onMakeChoice,
  onClose,
}) => {
  if (!gameState) return null;

  const isGameComplete = gameState.result !== null;

  const getCardDisplay = () => {
    if (gameState.cardValue === null) return '?';
    return CARD_VALUES[gameState.cardValue - 1];
  };

  const getCardSuit = () => {
    if (gameState.cardValue === null) return '🎴';
    return CARD_SUITS[gameState.cardValue % 4];
  };

  const isRed = gameState.cardValue !== null && (gameState.cardValue % 4 === 1 || gameState.cardValue % 4 === 2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      <div className="relative bg-gradient-to-b from-green-900 via-emerald-900 to-black border-4 border-green-400 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-[0_0_60px_rgba(0,255,0,0.5)]">
        <button
          onClick={onClose}
          disabled={!isGameComplete}
          className={`absolute top-4 right-4 transition-colors ${isGameComplete ? 'text-gray-400 hover:text-white' : 'text-gray-600 cursor-not-allowed'}`}
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-white" />
            </div>
          </div>

          <h2 className="font-display text-3xl text-green-400 mb-2">
            ⚠️ 风险博大小
          </h2>

          <p className="text-gray-400 mb-6">
            猜中可赢取双倍奖金，猜错则失去全部！
          </p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-red-500/20 rounded-xl p-4 border border-red-400/30">
              <p className="text-gray-400 text-sm mb-1">当前奖金</p>
              <p className="font-digital text-2xl text-yellow-400">
                {gameState.currentAmount.toLocaleString()}
              </p>
            </div>
            <div className={`rounded-xl p-4 border ${isGameComplete && gameState.result === 'win' ? 'bg-green-500/20 border-green-400/30' : isGameComplete && gameState.result === 'lose' ? 'bg-red-500/20 border-red-400/30' : 'bg-green-500/10 border-green-400/20'}`}>
              <p className="text-gray-400 text-sm mb-1">目标奖金</p>
              <p className={`font-digital text-2xl ${isGameComplete && gameState.result === 'win' ? 'text-green-400' : isGameComplete && gameState.result === 'lose' ? 'text-red-400' : 'text-green-400'}`}>
                {gameState.targetAmount.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex justify-center mb-6">
            <div
              className={`
                w-28 h-36 sm:w-32 sm:h-40 rounded-xl flex flex-col items-center justify-center
                transition-all duration-500 transform
                ${gameState.cardValue !== null
                  ? isRed
                    ? 'bg-gradient-to-b from-red-100 to-red-200 border-4 border-red-500'
                    : 'bg-gradient-to-b from-gray-100 to-gray-200 border-4 border-gray-800'
                  : 'bg-gradient-to-b from-green-600 to-green-800 border-4 border-green-400'
                }
                ${isGameComplete ? 'scale-110' : 'animate-pulse'}
              `}
            >
              <span className={`text-4xl sm:text-5xl font-bold ${isRed ? 'text-red-600' : 'text-gray-800'}`}>
                {getCardDisplay()}
              </span>
              <span className={`text-3xl sm:text-4xl ${isRed ? 'text-red-600' : 'text-gray-800'}`}>
                {getCardSuit()}
              </span>
            </div>
          </div>

          {isGameComplete && (
            <div className={`mb-6 p-4 rounded-xl ${gameState.result === 'win' ? 'bg-green-500/20 border border-green-400/30' : 'bg-red-500/20 border border-red-400/30'}`}>
              <div className="flex items-center justify-center gap-2">
                {gameState.result === 'win' ? (
                  <>
                    <Trophy className="w-6 h-6 text-green-400" />
                    <span className="text-green-400 font-bold text-xl">🎉 恭喜赢取双倍奖金！</span>
                  </>
                ) : (
                  <>
                    <X className="w-6 h-6 text-red-400" />
                    <span className="text-red-400 font-bold text-xl">😢 很遗憾，失去了奖金！</span>
                  </>
                )}
              </div>
              <p className="text-gray-400 text-sm mt-2">
                你选择了{gameState.choice === 'high' ? '大' : '小'}，
                牌面是 {CARD_VALUES[(gameState.cardValue || 1) - 1]}（{gameState.cardValue || 0}点），
                7点为分界
              </p>
            </div>
          )}

          {!isGameComplete ? (
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => onMakeChoice('low')}
                className="py-4 bg-gradient-to-b from-blue-500 to-blue-700 text-white font-bold text-xl rounded-xl hover:scale-105 active:scale-95 transition-transform border-2 border-blue-400 hover:shadow-[0_0_20px_rgba(59,130,246,0.6)]"
              >
                <TrendingDown className="w-6 h-6 inline mr-2" />
                小
                <span className="block text-xs font-normal opacity-80">1-6点</span>
              </button>
              <button
                onClick={() => onMakeChoice('high')}
                className="py-4 bg-gradient-to-b from-red-500 to-red-700 text-white font-bold text-xl rounded-xl hover:scale-105 active:scale-95 transition-transform border-2 border-red-400 hover:shadow-[0_0_20px_rgba(239,68,68,0.6)]"
              >
                <TrendingUp className="w-6 h-6 inline mr-2" />
                大
                <span className="block text-xs font-normal opacity-80">8-13点</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-xl rounded-xl hover:scale-105 active:scale-95 transition-transform"
            >
              {gameState.result === 'win' ? '继续游戏' : '返回游戏'}
            </button>
          )}

          {!isGameComplete && (
            <p className="text-gray-500 text-xs mt-4">
              提示：7点为分界，猜大猜小各50%概率，7点随机判定
            </p>
          )}
        </div>
      </div>
    </div>
  );
});

RiskGameModal.displayName = 'RiskGameModal';
