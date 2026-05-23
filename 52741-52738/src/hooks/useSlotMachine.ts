import { useState, useCallback, useEffect, useRef } from 'react';
import type { SymbolType, WinInfo, ThemeType, BonusGameState, RiskGameState } from '@/types/game';
import {
  BET_OPTIONS,
  PAYLINE_OPTIONS,
  INITIAL_BALANCE,
  INITIAL_JACKPOT,
  SPIN_DURATION,
  STORAGE_KEY_BALANCE,
  STORAGE_KEY_JACKPOT,
  STORAGE_KEY_THEME,
  generateReelSymbols,
  generateAllReels,
  checkWin,
  getVisibleSymbols,
  REEL_COUNT,
  JACKPOT_CONFIG,
  generateBonusGame,
  WILD_SYMBOL,
  SCATTER_SYMBOL,
  BONUS_SYMBOL,
} from '@/config/gameConfig';

export function useSlotMachine() {
  const [balance, setBalance] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_BALANCE);
      return saved ? parseInt(saved, 10) : INITIAL_BALANCE;
    }
    return INITIAL_BALANCE;
  });

  const [jackpotAmount, setJackpotAmount] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_JACKPOT);
      return saved ? parseInt(saved, 10) : INITIAL_JACKPOT;
    }
    return INITIAL_JACKPOT;
  });

  const [currentTheme, setCurrentTheme] = useState<ThemeType>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_THEME) as ThemeType;
      return saved || 'classic';
    }
    return 'classic';
  });

  const [betPerLine, setBetPerLineState] = useState<number>(BET_OPTIONS[0]);
  const [activePaylines, setActivePaylines] = useState<number[]>([0]);
  const [lastWin, setLastWin] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [reels, setReels] = useState<SymbolType[][]>(() =>
    generateAllReels(currentTheme)
  );
  const [reelStates, setReelStates] = useState<boolean[]>(Array(REEL_COUNT).fill(true));
  const [winInfo, setWinInfo] = useState<WinInfo | null>(null);
  const [showWinModal, setShowWinModal] = useState<boolean>(false);
  const [insufficientFunds, setInsufficientFunds] = useState<boolean>(false);

  const [freeSpinsRemaining, setFreeSpinsRemaining] = useState<number>(0);
  const [isFreeSpinsActive, setIsFreeSpinsActive] = useState<boolean>(false);
  const [showFreeSpinsModal, setShowFreeSpinsModal] = useState<boolean>(false);

  const [showBonusGame, setShowBonusGame] = useState<boolean>(false);
  const [bonusGameState, setBonusGameState] = useState<BonusGameState | null>(null);
  const [bonusMultiplier, setBonusMultiplier] = useState<number>(1);

  const [showRiskGame, setShowRiskGame] = useState<boolean>(false);
  const [riskGameState, setRiskGameState] = useState<RiskGameState | null>(null);

  const [autoSpinsRemaining, setAutoSpinsRemaining] = useState<number>(0);
  const [isAutoSpinActive, setIsAutoSpinActive] = useState<boolean>(false);

  const [showThemeSwitcher, setShowThemeSwitcher] = useState<boolean>(false);
  const [highlightedPositions, setHighlightedPositions] = useState<Set<string>>(new Set());
  const [showParticles, setShowParticles] = useState<boolean>(false);

  const spinTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSpinTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spinAnimationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spinTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const autoSpinsRemainingRef = useRef<number>(0);

  useEffect(() => {
    autoSpinsRemainingRef.current = autoSpinsRemaining;
  }, [autoSpinsRemaining]);

  useEffect(() => {
    return () => {
      if (spinAnimationIntervalRef.current) {
        clearInterval(spinAnimationIntervalRef.current);
      }
      spinTimeoutsRef.current.forEach(t => clearTimeout(t));
      if (autoSpinTimeoutRef.current) {
        clearTimeout(autoSpinTimeoutRef.current);
      }
    };
  }, []);

  const currentBet = betPerLine * activePaylines.length;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_BALANCE, balance.toString());
    }
  }, [balance]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_JACKPOT, jackpotAmount.toString());
    }
  }, [jackpotAmount]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_THEME, currentTheme);
    }
  }, [currentTheme]);

  const canBet = useCallback((): boolean => {
    return balance >= currentBet && !isSpinning && !showBonusGame && !showRiskGame;
  }, [balance, currentBet, isSpinning, showBonusGame, showRiskGame]);

  const setBetPerLine = useCallback((amount: number) => {
    if (!isSpinning && BET_OPTIONS.includes(amount)) {
      setBetPerLineState(amount);
      setInsufficientFunds(false);
    }
  }, [isSpinning]);

  const setPaylines = useCallback((count: number) => {
    if (!isSpinning && PAYLINE_OPTIONS.includes(count)) {
      const newPaylines = Array.from({ length: count }, (_, i) => i);
      setActivePaylines(newPaylines);
    }
  }, [isSpinning]);

  const togglePayline = useCallback((paylineId: number) => {
    if (!isSpinning && paylineId >= 0 && paylineId < PAYLINE_OPTIONS.length) {
      setActivePaylines(prev => {
        if (prev.includes(paylineId)) {
          if (prev.length === 1) return prev;
          return prev.filter(id => id !== paylineId);
        } else {
          return [...prev, paylineId].sort();
        }
      });
    }
  }, [isSpinning]);

  const changeTheme = useCallback((theme: ThemeType) => {
    setCurrentTheme(theme);
    setReels(generateAllReels(theme));
    setShowThemeSwitcher(false);
  }, []);

  const handleWin = useCallback((win: WinInfo) => {
    let totalPayout = win.totalWin;

    if (win.jackpotWon) {
      win.jackpotAmount = jackpotAmount;
      totalPayout += jackpotAmount;
      setJackpotAmount(INITIAL_JACKPOT);
    }

    if (totalPayout > 0) {
      setWinInfo(win);
      setLastWin(totalPayout);
      setBalance(prev => prev + totalPayout);
      setShowParticles(true);
      
      const positions = new Set<string>();
      win.wins.forEach(w => {
        w.positions.forEach(([col, row]) => {
          positions.add(`${col}-${row}`);
        });
      });
      setHighlightedPositions(positions);

      setTimeout(() => {
        setShowWinModal(true);
      }, 500);

      setTimeout(() => {
        setShowParticles(false);
        setHighlightedPositions(new Set());
      }, 3000);
    } else {
      setWinInfo(null);
      setLastWin(0);
    }

    if (win.freeSpinsWon > 0) {
      setFreeSpinsRemaining(prev => prev + win.freeSpinsWon);
      setIsFreeSpinsActive(true);
      setBonusMultiplier(2);
      setTimeout(() => {
        setShowFreeSpinsModal(true);
      }, 1000);
    }

    if (win.hasBonus) {
      setTimeout(() => {
        startBonusGame();
      }, 1500);
    }
  }, [jackpotAmount]);

  const spin = useCallback(() => {
    if (!canBet()) {
      if (balance < currentBet) {
        setInsufficientFunds(true);
        setTimeout(() => setInsufficientFunds(false), 1500);
      }
      return;
    }

    setIsSpinning(true);
    setWinInfo(null);
    setShowWinModal(false);
    setInsufficientFunds(false);
    setHighlightedPositions(new Set());
    setShowParticles(false);

    setFreeSpinsRemaining(prev => {
      if (isFreeSpinsActive) {
        const newVal = prev - 1;
        if (newVal <= 0) {
          setIsFreeSpinsActive(false);
          setBonusMultiplier(1);
        }
        return newVal;
      }
      return prev;
    });

    if (!isFreeSpinsActive) {
      setBalance(prev => prev - currentBet);
      const contribution = currentBet * JACKPOT_CONFIG.contributionRate;
      setJackpotAmount(prev => prev + contribution);
    }

    setReelStates(Array(REEL_COUNT).fill(false));

    if (spinAnimationIntervalRef.current) {
      clearInterval(spinAnimationIntervalRef.current);
    }
    spinAnimationIntervalRef.current = setInterval(() => {
      setReels(prev => prev.map(() => generateReelSymbols(currentTheme)));
    }, 80);

    const stopTimes: number[] = [];
    for (let i = 0; i < REEL_COUNT; i++) {
      stopTimes.push(
        SPIN_DURATION.min + Math.random() * (SPIN_DURATION.max - SPIN_DURATION.min) * (0.3 + i * 0.15) + SPIN_DURATION.delay * i
      );
    }

    const finalReels: SymbolType[][] = [];
    const stoppedReels = Array(REEL_COUNT).fill(false);

    spinTimeoutsRef.current.forEach(t => clearTimeout(t));
    spinTimeoutsRef.current = [];

    stopTimes.forEach((time, index) => {
      const timeout = setTimeout(() => {
        const finalReel = generateReelSymbols(currentTheme);
        finalReels[index] = finalReel;
        stoppedReels[index] = true;

        if (stoppedReels.every(s => s) && spinAnimationIntervalRef.current) {
          clearInterval(spinAnimationIntervalRef.current);
          spinAnimationIntervalRef.current = null;
        }

        setReels(prev => {
          const newReels = [...prev];
          newReels[index] = finalReel;
          return newReels;
        });
        setReelStates(prev => {
          const newStates = [...prev];
          newStates[index] = true;
          return newStates;
        });

        if (index === REEL_COUNT - 1) {
          const finalTimeout = setTimeout(() => {
            setIsSpinning(false);
            const win = checkWin(finalReels, betPerLine * bonusMultiplier, activePaylines, currentTheme);
            handleWin(win);

            if (isAutoSpinActive && autoSpinsRemainingRef.current > 0) {
              setAutoSpinsRemaining(prev => {
                const newVal = prev - 1;
                if (newVal <= 0) {
                  setIsAutoSpinActive(false);
                } else {
                  autoSpinTimeoutRef.current = setTimeout(() => {
                    spin();
                  }, 1500);
                }
                return newVal;
              });
            }
          }, 300);
          spinTimeoutsRef.current.push(finalTimeout);
        }
      }, time);
      spinTimeoutsRef.current.push(timeout);
    });
  }, [canBet, balance, currentBet, currentTheme, betPerLine, activePaylines, isFreeSpinsActive, bonusMultiplier, isAutoSpinActive, handleWin]);

  const startAutoSpin = useCallback((count: number) => {
    if (canBet()) {
      setAutoSpinsRemaining(count);
      setIsAutoSpinActive(true);
      spin();
    }
  }, [canBet, spin]);

  const stopAutoSpin = useCallback(() => {
    setIsAutoSpinActive(false);
    setAutoSpinsRemaining(0);
    if (autoSpinTimeoutRef.current) {
      clearTimeout(autoSpinTimeoutRef.current);
    }
  }, []);

  const startBonusGame = useCallback(() => {
    setBonusGameState(generateBonusGame());
    setShowBonusGame(true);
  }, []);

  const pickBonusBox = useCallback((index: number) => {
    if (!bonusGameState || bonusGameState.revealed[index] || bonusGameState.picksRemaining <= 0) {
      return;
    }

    setBonusGameState(prev => {
      if (!prev) return prev;
      const newRevealed = [...prev.revealed];
      newRevealed[index] = true;
      const prize = prev.prizes[index] * betPerLine;
      return {
        ...prev,
        revealed: newRevealed,
        totalPrize: prev.totalPrize + prize,
        picksRemaining: prev.picksRemaining - 1,
      };
    });
  }, [bonusGameState, betPerLine]);

  const closeBonusGame = useCallback(() => {
    if (bonusGameState) {
      setBalance(prev => prev + bonusGameState.totalPrize);
      setLastWin(prev => prev + bonusGameState.totalPrize);
    }
    setShowBonusGame(false);
    setBonusGameState(null);
  }, [bonusGameState]);

  const startRiskGame = useCallback(() => {
    if (lastWin > 0) {
      setRiskGameState({
        currentAmount: lastWin,
        targetAmount: lastWin * 2,
        result: null,
        choice: null,
        cardValue: null,
      });
      setShowRiskGame(true);
    }
  }, [lastWin]);

  const makeRiskChoice = useCallback((choice: 'high' | 'low') => {
    if (!riskGameState || riskGameState.result) return;

    const cardValue = Math.floor(Math.random() * 13) + 1;
    const midValue = 7;
    
    let result: 'win' | 'lose';
    if (choice === 'high') {
      result = cardValue > midValue ? 'win' : (cardValue < midValue ? 'lose' : (Math.random() > 0.5 ? 'win' : 'lose'));
    } else {
      result = cardValue < midValue ? 'win' : (cardValue > midValue ? 'lose' : (Math.random() > 0.5 ? 'win' : 'lose'));
    }

    setRiskGameState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        choice,
        cardValue,
        result,
        targetAmount: result === 'win' ? prev.currentAmount * 2 : 0,
      };
    });

    if (result === 'win') {
      setBalance(prev => prev + riskGameState.currentAmount);
      setLastWin(prev => prev + riskGameState.currentAmount);
    } else {
      setBalance(prev => prev - lastWin);
      setLastWin(0);
    }
  }, [riskGameState, lastWin]);

  const closeRiskGame = useCallback(() => {
    setShowRiskGame(false);
    setRiskGameState(null);
  }, []);

  const closeWinModal = useCallback(() => {
    setShowWinModal(false);
  }, []);

  const closeFreeSpinsModal = useCallback(() => {
    setShowFreeSpinsModal(false);
  }, []);

  const resetGame = useCallback(() => {
    setBalance(INITIAL_BALANCE);
    setLastWin(0);
    setWinInfo(null);
    setShowWinModal(false);
    setFreeSpinsRemaining(0);
    setIsFreeSpinsActive(false);
    setAutoSpinsRemaining(0);
    setIsAutoSpinActive(false);
    setShowBonusGame(false);
    setShowRiskGame(false);
    setBonusMultiplier(1);
    setHighlightedPositions(new Set());
    setShowParticles(false);
    setReels(generateAllReels(currentTheme));
  }, [currentTheme]);

  const takeWin = useCallback(() => {
    closeWinModal();
  }, [closeWinModal]);

  return {
    balance,
    currentBet,
    betPerLine,
    activePaylines,
    betOptions: BET_OPTIONS,
    paylineOptions: PAYLINE_OPTIONS,
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
    togglePayline,
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
    takeWin,
    changeTheme,
    setShowThemeSwitcher,
    resetGame,
    getVisibleSymbols: () => getVisibleSymbols(reels),
    specialSymbols: { WILD_SYMBOL, SCATTER_SYMBOL, BONUS_SYMBOL },
  };
}
