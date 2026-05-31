import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Trophy, Star, Lock, Unlock, Flame, Target, ArrowRight, RotateCcw } from 'lucide-react';
import { useTestEngine } from '@/hooks/useTestEngine';
import { trainingApi } from '@/utils/api';
import { useAuth } from '@/hooks/useAuth';
import { TestMode, MODE_CONFIG, TrainingStatus } from '@/../shared/types';
import { cn } from '@/lib/utils';

const LEVEL_NAMES = ['新手', '入门', '进阶', '高手', '大师'];
const LEVEL_THRESHOLDS = [500, 400, 300, 250, 200];
const MODES: TestMode[] = ['visual', 'audio', 'choice', 'inhibition'];

const ACHIEVEMENT_KEYS = ['first_test', 'speed_demon', 'consistency', 'marathon', 'master'] as const;
const ACHIEVEMENT_LABELS: Record<string, string> = {
  first_test: '初次尝试',
  speed_demon: '闪电侠',
  consistency: '稳如泰山',
  marathon: '马拉松',
  master: '大师之路',
};
const ACHIEVEMENT_ICONS: Record<string, React.ReactNode> = {
  first_test: <Star size={24} />,
  speed_demon: <Flame size={24} />,
  consistency: <Target size={24} />,
  marathon: <Dumbbell size={24} />,
  master: <Trophy size={24} />,
};

function computeAverage(results: { reactionTime: number | null; isFoul: boolean }[]): number | null {
  const valid = results.filter((r) => !r.isFoul && r.reactionTime !== null);
  if (valid.length === 0) return null;
  return Math.round(valid.reduce((s, r) => s + (r.reactionTime ?? 0), 0) / valid.length);
}

export default function Training() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [selectedMode, setSelectedMode] = useState<TestMode>('visual');
  const [trainingStatuses, setTrainingStatuses] = useState<TrainingStatus[]>([]);
  const [allAchievements, setAllAchievements] = useState<string[]>([]);
  const [dailyChallenge, setDailyChallenge] = useState<{ mode: TestMode; targetTime: number; completed: boolean } | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [levelPassed, setLevelPassed] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const engine = useTestEngine(selectedMode);

  const currentStatus = trainingStatuses.find((s) => s.mode === selectedMode) ?? {
    mode: selectedMode,
    currentLevel: 1,
    bestTime: null,
    achievements: [],
  };
  const currentLevel = currentStatus.currentLevel;
  const bestTime = currentStatus.bestTime;
  const threshold = LEVEL_THRESHOLDS[Math.min(currentLevel - 1, LEVEL_THRESHOLDS.length - 1)];

  const loadStatus = useCallback(async () => {
    try {
      const data = await trainingApi.getTrainingStatus();
      setTrainingStatuses(data.trainingStatus);
      setAllAchievements(data.achievements);
      setDailyChallenge(data.dailyChallenge);
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadStatus();
    }
  }, [isAuthenticated, loadStatus]);

  const handleStartTraining = () => {
    setIsTraining(true);
    setLevelPassed(false);
    setShowCelebration(false);
    engine.start();
  };

  const handleReset = () => {
    setIsTraining(false);
    setLevelPassed(false);
    setShowCelebration(false);
    engine.reset();
  };

  useEffect(() => {
    if (engine.testState === 'complete' && isTraining) {
      const avg = computeAverage(engine.results);
      const passed = avg !== null && avg <= threshold;
      setLevelPassed(passed);

      trainingApi
        .completeTrainingRound({
          mode: selectedMode,
          level: currentLevel,
          results: engine.results.map((r) => ({ reactionTime: r.reactionTime, isFoul: r.isFoul })),
        })
        .then((res) => {
          if (res.passed && passed) {
            setShowCelebration(true);
          }
          loadStatus();
        })
        .catch(() => {});
    }
  }, [engine.testState, isTraining, engine.results, threshold, selectedMode, currentLevel, loadStatus]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
        <div className="card p-8 text-center max-w-md">
          <Dumbbell size={48} className="mx-auto mb-4 text-neon-purple" />
          <h2 className="font-display text-2xl font-bold text-white mb-2">训练模式</h2>
          <p className="text-white/60 mb-6 font-body">登录后即可开始训练，解锁成就和提升等级</p>
          <button onClick={() => navigate('/login')} className="btn-primary px-8 py-3 flex items-center gap-2 mx-auto">
            去登录
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="text-center">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-white tracking-wider">
          训练模式
        </h1>
        <p className="text-white/50 mt-2 font-body">逐步提升你的反应速度，解锁成就</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {MODES.map((mode) => {
          const config = MODE_CONFIG[mode];
          const isActive = selectedMode === mode;
          return (
            <button
              key={mode}
              onClick={() => {
                setSelectedMode(mode);
                handleReset();
              }}
              className={cn(
                'flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-neon-purple/20 text-neon-purple neon-border'
                  : 'bg-dark-700 text-white/50 hover:text-white hover:bg-dark-600'
              )}
            >
              <span>{config.icon}</span>
              <span>{config.name}</span>
            </button>
          );
        })}
      </div>

      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold text-white/60 tracking-wider uppercase">等级进度</h3>
          <span className="text-xs text-white/40 font-body">Lv.{currentLevel} / {LEVEL_NAMES.length}</span>
        </div>

        <div className="flex items-center gap-1">
          {LEVEL_NAMES.map((name, idx) => {
            const levelNum = idx + 1;
            const isUnlocked = levelNum <= currentLevel;
            const isCurrent = levelNum === currentLevel;
            return (
              <div key={levelNum} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className={cn(
                    'w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-sm font-display font-bold transition-all duration-300',
                    isUnlocked && !isCurrent && 'bg-neon-green/20 text-neon-green border border-neon-green/40',
                    isCurrent && 'bg-neon-purple/30 text-neon-purple neon-glow border border-neon-purple/60 scale-110',
                    !isUnlocked && 'bg-dark-700 text-white/20 border border-white/10'
                  )}
                >
                  {isUnlocked ? levelNum : <Lock size={16} />}
                </div>
                <span className={cn(
                  'text-[10px] md:text-xs font-body',
                  isCurrent ? 'text-neon-purple font-semibold' : isUnlocked ? 'text-neon-green' : 'text-white/20'
                )}>
                  {name}
                </span>
              </div>
            );
          })}
        </div>

        <div className="w-full bg-dark-700 rounded-full h-2 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-neon-purple to-neon-cyan transition-all duration-500"
            style={{ width: `${(currentLevel / LEVEL_NAMES.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-xl font-bold text-white">
              {LEVEL_NAMES[Math.min(currentLevel - 1, LEVEL_NAMES.length - 1)]}
            </h3>
            <p className="text-white/40 text-sm font-body mt-1">第 {currentLevel} 级</p>
          </div>
          <div className="text-right">
            <p className="text-neon-cyan font-display text-lg font-bold">{threshold}ms</p>
            <p className="text-white/40 text-xs font-body">目标时间</p>
          </div>
        </div>

        {bestTime !== null && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-700/50">
            <Flame size={16} className="text-neon-yellow" />
            <span className="text-sm text-white/60 font-body">最佳记录:</span>
            <span className="font-display text-neon-yellow font-bold">{bestTime}ms</span>
          </div>
        )}

        {!isTraining && (
          <button
            onClick={handleStartTraining}
            className="btn-primary w-full py-3 text-lg font-display tracking-wider flex items-center justify-center gap-2"
          >
            开始训练
            <ArrowRight size={20} />
          </button>
        )}

        {isTraining && engine.testState !== 'complete' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/50 font-body">
                第 {engine.currentRound} / {engine.totalRounds} 轮
              </span>
              <span
                className={cn(
                  'font-display font-semibold',
                  engine.testState === 'waiting' && 'text-neon-yellow',
                  engine.testState === 'ready' && 'text-neon-green',
                  engine.testState === 'foul' && 'text-neon-red'
                )}
              >
                {engine.testState === 'waiting' && '准备...'}
                {engine.testState === 'ready' && '点击！'}
                {engine.testState === 'foul' && '犯规！点击继续'}
              </span>
            </div>

            <div
              className={cn(
                'w-full h-40 md:h-56 rounded-2xl flex items-center justify-center cursor-pointer select-none transition-colors duration-150',
                engine.testState === 'waiting' && 'bg-dark-700 border-2 border-white/10',
                engine.testState === 'ready' && (selectedMode === 'visual' ? 'bg-neon-green/30 border-2 border-neon-green neon-glow' : 'bg-neon-purple/30 border-2 border-neon-purple neon-glow'),
                engine.testState === 'foul' && 'bg-neon-red/20 border-2 border-neon-red'
              )}
              onClick={() => engine.handleClick()}
            >
              {engine.testState === 'waiting' && (
                <span className="text-white/30 font-display text-xl">等待信号...</span>
              )}
              {engine.testState === 'ready' && (
                <span className="text-white font-display text-3xl animate-pulse">点击！</span>
              )}
              {engine.testState === 'foul' && (
                <span className="text-neon-red font-display text-xl">太早了！点击继续</span>
              )}
            </div>

            <button
              onClick={handleReset}
              className="btn-secondary w-full py-2 flex items-center justify-center gap-2"
            >
              <RotateCcw size={16} />
              放弃训练
            </button>
          </div>
        )}

        {isTraining && engine.testState === 'complete' && (
          <div className="space-y-4">
            <div
              className={cn(
                'rounded-2xl p-6 text-center',
                levelPassed ? 'bg-neon-green/10 border border-neon-green/40' : 'bg-neon-red/10 border border-neon-red/40'
              )}
            >
              {levelPassed ? (
                <>
                  <Trophy size={40} className="mx-auto mb-2 text-neon-yellow" />
                  <h4 className="font-display text-xl font-bold text-neon-green">通过！</h4>
                  <p className="text-white/60 font-body mt-1">
                    平均反应时间: <span className="text-neon-cyan font-display font-bold">{computeAverage(engine.results)}ms</span>
                  </p>
                </>
              ) : (
                <>
                  <Target size={40} className="mx-auto mb-2 text-neon-red" />
                  <h4 className="font-display text-xl font-bold text-neon-red">未达标</h4>
                  <p className="text-white/60 font-body mt-1">
                    平均反应时间: <span className="text-neon-cyan font-display font-bold">{computeAverage(engine.results) ?? '—'}ms</span>，需要 {threshold}ms 以下
                  </p>
                </>
              )}
            </div>

            {showCelebration && (
              <div className="relative rounded-2xl p-6 text-center bg-gradient-to-br from-neon-purple/20 via-neon-cyan/10 to-neon-yellow/20 neon-border overflow-hidden">
                <div className="absolute inset-0 bg-neon-purple/5 animate-pulse" />
                <div className="relative z-10">
                  <Star size={48} className="mx-auto mb-3 text-neon-yellow animate-bounce" />
                  <h4 className="font-display text-2xl font-bold text-white mb-1">等级提升！</h4>
                  <p className="text-neon-cyan font-body">
                    解锁: {LEVEL_NAMES[Math.min(currentLevel, LEVEL_NAMES.length - 1)]}
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={handleReset}
              className="btn-primary w-full py-3 font-display tracking-wider flex items-center justify-center gap-2"
            >
              <RotateCcw size={18} />
              再来一次
            </button>
          </div>
        )}
      </div>

      {dailyChallenge && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Flame size={20} className="text-neon-yellow" />
            <h3 className="font-display text-sm font-semibold text-white/80 tracking-wider uppercase">每日挑战</h3>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-body">
                {MODE_CONFIG[dailyChallenge.mode].icon} {MODE_CONFIG[dailyChallenge.mode].name}
              </p>
              <p className="text-white/40 text-sm font-body">
                目标: <span className="text-neon-cyan font-display">{dailyChallenge.targetTime}ms</span>
              </p>
            </div>
            {dailyChallenge.completed ? (
              <div className="flex items-center gap-1 text-neon-green">
                <Unlock size={18} />
                <span className="text-sm font-display">已完成</span>
              </div>
            ) : (
              <button
                onClick={() => {
                  setSelectedMode(dailyChallenge.mode);
                  handleReset();
                }}
                className="btn-secondary px-4 py-2 flex items-center gap-1 text-sm"
              >
                挑战
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-display text-sm font-semibold text-white/60 tracking-wider uppercase mb-4">成就</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {ACHIEVEMENT_KEYS.map((key) => {
            const unlocked = allAchievements.includes(key);
            return (
              <div
                key={key}
                className={cn(
                  'card p-4 flex flex-col items-center gap-2 text-center transition-all duration-300',
                  unlocked && 'neon-glow border-neon-purple/40',
                  !unlocked && 'opacity-40'
                )}
              >
                <div
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center',
                    unlocked ? 'bg-neon-purple/20 text-neon-purple' : 'bg-dark-700 text-white/30'
                  )}
                >
                  {unlocked ? ACHIEVEMENT_ICONS[key] : <Lock size={24} />}
                </div>
                <span className={cn('text-xs font-body', unlocked ? 'text-white' : 'text-white/30')}>
                  {ACHIEVEMENT_LABELS[key]}
                </span>
                {unlocked && <Star size={12} className="text-neon-yellow" />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
