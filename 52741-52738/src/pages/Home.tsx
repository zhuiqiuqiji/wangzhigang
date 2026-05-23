import React, { useState, useMemo } from 'react';
import { RotateCcw, HelpCircle, Palette } from 'lucide-react';
import { useSlotMachine } from '@/hooks/useSlotMachine';
import { Reel } from '@/components/Reel';
import { ControlPanel } from '@/components/ControlPanel';
import { InfoPanel } from '@/components/InfoPanel';
import { WinModal } from '@/components/WinModal';
import { PaylinesDisplay } from '@/components/PaylinesDisplay';
import { JackpotDisplay } from '@/components/JackpotDisplay';
import { AutoSpinControls } from '@/components/AutoSpinControls';
import { BonusGameModal } from '@/components/BonusGameModal';
import { FreeSpinsModal } from '@/components/FreeSpinsModal';
import { RiskGameModal } from '@/components/RiskGameModal';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { CoinParticles } from '@/components/CoinParticles';
import { WIN_COMBINATIONS, THEMES } from '@/config/gameConfig';

export default function Home() {
  const {
    balance,
    currentBet,
    betPerLine,
    activePaylines,
    betOptions,
    paylineOptions,
    lastWin,
    isSpinning,
    reels,
    reelStates,
    winInfo,
    showWinModal,
    insufficientFunds,
    freeSpinsRemaining,
    isFreeSpinsActive,
    showFreeSpinsModal,
    showBonusGame,
    bonusGameState,
    bonusMultiplier,
    showRiskGame,
    riskGameState,
    autoSpinsRemaining,
    isAutoSpinActive,
    jackpotAmount,
    currentTheme,
    showThemeSwitcher,
    highlightedPositions,
    showParticles,
    canBet,
    setBetPerLine,
    setPaylines,
    spin,
    startAutoSpin,
    stopAutoSpin,
    pickBonusBox,
    closeBonusGame,
    startRiskGame,
    makeRiskChoice,
    closeRiskGame,
    closeWinModal,
    closeFreeSpinsModal,
    changeTheme,
    setShowThemeSwitcher,
    resetGame,
    getVisibleSymbols,
    specialSymbols,
  } = useSlotMachine();

  const [showPaytable, setShowPaytable] = useState(false);
  const isWinning = winInfo !== null && winInfo.totalWin > 0 && reelStates.every(s => s);
  const themeConfig = THEMES[currentTheme];

  const highlightedRowsPerReel = useMemo(() => {
    const rows: Map<number, Set<number>> = new Map();
    highlightedPositions.forEach((pos) => {
      const [col, row] = pos.split('-').map(Number);
      if (!rows.has(col)) {
        rows.set(col, new Set());
      }
      rows.get(col)!.add(row);
    });
    return rows;
  }, [highlightedPositions]);

  return (
    <div 
      className="min-h-screen relative z-10 py-8 px-4"
      style={{ background: themeConfig.background }}
    >
      <div className="fixed inset-0 bg-noise pointer-events-none z-0" />
      <CoinParticles active={showParticles} count={50} />

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h1 
            className="font-display text-4xl sm:text-5xl md:text-6xl animate-neon-pulse mb-2"
            style={{ color: themeConfig.accentColor, textShadow: `0 0 20px ${themeConfig.glowColor}` }}
          >
            🎰 {themeConfig.name} 🎰
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            五条滚轮，多条中奖线，无限惊喜！选择下注金额，点击旋转赢取大奖！
          </p>
        </div>

        <JackpotDisplay 
          amount={jackpotAmount} 
          isWinning={winInfo?.jackpotWon || false}
        />

        <div className="flex justify-end gap-2 mb-4 mt-4">
          <button
            onClick={() => setShowPaytable(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 rounded-lg transition-all border border-gray-700"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="text-sm">赔率表</span>
          </button>
          <button
            onClick={() => setShowThemeSwitcher(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 rounded-lg transition-all border border-gray-700"
          >
            <Palette className="w-4 h-4" />
            <span className="text-sm">主题</span>
          </button>
          <button
            onClick={resetGame}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 rounded-lg transition-all border border-gray-700"
            title="重置游戏"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-sm">重置</span>
          </button>
        </div>

        <InfoPanel
          balance={balance}
          lastWin={lastWin}
          insufficientFunds={insufficientFunds}
        />

        <div 
          className="relative bg-gradient-to-b from-gray-800 via-gray-900 to-black border-4 rounded-3xl p-4 sm:p-6 shadow-2xl"
          style={{ 
            borderColor: themeConfig.borderColor,
            boxShadow: `0 0 40px ${themeConfig.glowColor}`,
          }}
        >
          <div className="absolute inset-0 rounded-3xl border pointer-events-none" style={{ borderColor: `${themeConfig.accentColor}20` }} />
          
          <div 
            className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-gray-900 font-bold text-sm rounded-full"
            style={{ backgroundColor: themeConfig.accentColor }}
          >
            中奖线：{activePaylines.length}条
          </div>

          <div className="relative py-6">
            <PaylinesDisplay
              activePaylines={activePaylines}
              highlightedPositions={highlightedPositions}
              currentTheme={currentTheme}
              reelWidth={100}
              reelHeight={200}
              gap={16}
            />

            <div className="flex justify-center items-center gap-2 sm:gap-3 md:gap-4">
              {reels.map((symbols, index) => (
                <Reel
                  key={index}
                  index={index}
                  symbols={symbols}
                  isSpinning={!reelStates[index]}
                  isWinning={isWinning}
                  highlightedRows={highlightedRowsPerReel.get(index) || new Set()}
                  themeAccentColor={themeConfig.accentColor}
                />
              ))}
            </div>
          </div>

          <div 
            className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-40 pointer-events-none"
            style={{ color: themeConfig.accentColor }}
          >
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full" style={{ backgroundColor: themeConfig.accentColor, boxShadow: `0 0 15px ${themeConfig.accentColor}` }} />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full" style={{ backgroundColor: themeConfig.accentColor, boxShadow: `0 0 15px ${themeConfig.accentColor}` }} />
          </div>

          <div className="absolute -bottom-2 left-4 right-4 h-4 bg-gradient-to-b from-black/50 to-transparent rounded-full blur-md" />
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-3 text-sm">
          <div className="flex items-center gap-2 bg-purple-900/30 px-3 py-1 rounded-lg border border-purple-500/30">
            <span className="text-xl">{specialSymbols.WILD_SYMBOL}</span>
            <span className="text-purple-400">万能</span>
          </div>
          <div className="flex items-center gap-2 bg-cyan-900/30 px-3 py-1 rounded-lg border border-cyan-500/30">
            <span className="text-xl">{specialSymbols.SCATTER_SYMBOL}</span>
            <span className="text-cyan-400">免费旋转</span>
          </div>
          <div className="flex items-center gap-2 bg-orange-900/30 px-3 py-1 rounded-lg border border-orange-500/30">
            <span className="text-xl">{specialSymbols.BONUS_SYMBOL}</span>
            <span className="text-orange-400">Bonus游戏</span>
          </div>
        </div>

        <ControlPanel
          betPerLine={betPerLine}
          activePaylines={activePaylines}
          betOptions={betOptions}
          paylineOptions={paylineOptions}
          isSpinning={isSpinning}
          canBet={canBet()}
          isFreeSpinsActive={isFreeSpinsActive}
          freeSpinsRemaining={freeSpinsRemaining}
          bonusMultiplier={bonusMultiplier}
          lastWin={lastWin}
          onSetBetPerLine={setBetPerLine}
          onSetPaylines={setPaylines}
          onSpin={spin}
          onStartRiskGame={startRiskGame}
          currentBet={currentBet}
          themeAccentColor={themeConfig.accentColor}
        />

        <AutoSpinControls
          isActive={isAutoSpinActive}
          remaining={autoSpinsRemaining}
          isSpinning={isSpinning}
          canStart={canBet()}
          onStart={startAutoSpin}
          onStop={stopAutoSpin}
        />

        <div className="mt-8 text-center text-gray-500 text-xs">
          <p>💡 提示：三个相同图标获得高倍率奖励，Wild万能可替代任意图标，3个以上Scatter触发免费旋转！</p>
        </div>
      </div>

      {showWinModal && winInfo && (
        <WinModal winInfo={winInfo} onClose={closeWinModal} />
      )}

      {showFreeSpinsModal && (
        <FreeSpinsModal
          freeSpinsCount={winInfo?.freeSpinsWon || 0}
          remainingSpins={freeSpinsRemaining}
          multiplier={bonusMultiplier}
          onClose={closeFreeSpinsModal}
        />
      )}

      {showBonusGame && (
        <BonusGameModal
          gameState={bonusGameState}
          onPickBox={pickBonusBox}
          onClose={closeBonusGame}
          betPerLine={betPerLine}
        />
      )}

      {showRiskGame && (
        <RiskGameModal
          gameState={riskGameState}
          onMakeChoice={makeRiskChoice}
          onClose={closeRiskGame}
        />
      )}

      {showThemeSwitcher && (
        <ThemeSwitcher
          isOpen={showThemeSwitcher}
          currentTheme={currentTheme}
          onClose={() => setShowThemeSwitcher(false)}
          onChangeTheme={changeTheme}
        />
      )}

      {showPaytable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowPaytable(false)}
          />
          <div className="relative bg-gradient-to-b from-gray-800 via-gray-900 to-black border-4 rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto" style={{ borderColor: themeConfig.accentColor }}>
            <h3 className="font-display text-2xl mb-4 text-center" style={{ color: themeConfig.accentColor }}>
              💰 赔率表 💰
            </h3>
            <div className="space-y-3">
              {WIN_COMBINATIONS.filter(c => typeof c.symbols === 'string').map((combo, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-gray-800/50 rounded-lg px-4 py-3 border border-gray-700"
                >
                  <div className="flex items-center gap-1 text-2xl">
                    <span>{combo.symbols}</span>
                    <span>{combo.symbols}</span>
                    <span>{combo.symbols}</span>
                    <span className="text-gray-500">+</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold font-digital text-xl" style={{ color: themeConfig.accentColor }}>×{combo.multiplier}</div>
                    <div className="text-gray-400 text-xs">{combo.name}</div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowPaytable(false)}
              className="w-full mt-6 py-3 text-gray-900 font-bold rounded-xl hover:scale-105 transition-transform"
              style={{ background: `linear-gradient(to right, ${themeConfig.accentColor}, ${themeConfig.secondaryColor})` }}
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
