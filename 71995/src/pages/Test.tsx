import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, RotateCcw, Download, ArrowLeft, Check, X, Volume2, Hand } from 'lucide-react';
import { useTestEngine } from '@/hooks/useTestEngine';
import { useAuth } from '@/hooks/useAuth';
import { testApi } from '@/utils/api';
import { getRating } from '@/utils/rating';
import { exportToCsv } from '@/utils/csv';
import { cn } from '@/lib/utils';
import type { TestMode } from '@/../shared/types';
import { MODE_CONFIG } from '@/../shared/types';

const VALID_MODES: TestMode[] = ['visual', 'audio', 'choice', 'inhibition'];

const CHOICE_BUTTON_COLORS: Record<string, string> = {
  red: 'bg-red-500 hover:bg-red-400 border-red-400',
  blue: 'bg-blue-500 hover:bg-blue-400 border-blue-400',
  green: 'bg-green-500 hover:bg-green-400 border-green-400',
  yellow: 'bg-yellow-500 hover:bg-yellow-400 border-yellow-400',
};

const CHOICE_COLOR_LABELS: Record<string, string> = {
  red: '红色',
  blue: '蓝色',
  green: '绿色',
  yellow: '黄色',
};

function ModeSelector() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-2 tracking-wider">
        选择测试模式
      </h2>
      <p className="text-white/50 mb-10 font-body">每种模式测试不同的反应能力维度</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-2xl">
        {VALID_MODES.map((mode) => {
          const config = MODE_CONFIG[mode];
          return (
            <button
              key={mode}
              onClick={() => navigate(`/test/${mode}`)}
              className={cn(
                'card text-left group cursor-pointer hover:scale-[1.02] active:scale-[0.98]',
                'hover:shadow-lg hover:shadow-purple-500/10'
              )}
            >
              <div className="flex items-center gap-4">
                <span className="text-4xl">{config.icon}</span>
                <div>
                  <h3 className="font-display text-lg font-bold text-white group-hover:text-neon-purple transition-colors">
                    {config.name}
                  </h3>
                  <p className="text-sm text-white/50 mt-1 font-body">{config.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TestContent({ mode }: { mode: TestMode }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const {
    testState,
    currentRound,
    totalRounds,
    results,
    stimulusData,
    start,
    handleClick,
    handleKeyPress,
    reset,
  } = useTestEngine(mode);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const config = MODE_CONFIG[mode];

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      handleKeyPress(e.key);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleKeyPress]);

  const average = useMemo(() => {
    const valid = results.filter((r) => !r.isFoul && r.reactionTime !== null);
    if (valid.length === 0) return null;
    return Math.round(valid.reduce((sum, r) => sum + (r.reactionTime ?? 0), 0) / valid.length);
  }, [results]);

  const rating = useMemo(() => {
    if (average === null) return null;
    return getRating(average, mode);
  }, [average, mode]);

  const handleSubmit = async () => {
    if (!average || submitting) return;
    setSubmitting(true);
    try {
      await testApi.submitTest({
        mode,
        rounds: results.map((r) => ({
          reactionTime: r.reactionTime,
          isFoul: r.isFoul,
          stimulusDetail: r.stimulusDetail,
        })),
      });
      setSubmitted(true);
    } catch {
      alert('提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExport = () => {
    const sessionId = Date.now().toString(36);
    exportToCsv(results, mode, sessionId);
  };

  const handleRetry = () => {
    setSubmitted(false);
    reset();
  };

  if (testState === 'idle') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <button
          onClick={() => navigate('/test')}
          className="absolute top-6 left-6 flex items-center gap-2 text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-body text-sm">返回选择</span>
        </button>

        <span className="text-6xl mb-6">{config.icon}</span>
        <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-3 tracking-wider">
          {config.name}
        </h2>
        <p className="text-white/50 mb-3 font-body text-center max-w-md">{config.description}</p>
        <p className="text-white/30 text-sm font-body mb-10">
          共 {totalRounds} 轮 · 按空格键或点击开始
        </p>

        <button
          onClick={start}
          className="btn-primary text-lg px-10 py-4 flex items-center gap-3 font-display tracking-wider"
        >
          <Play size={24} />
          开始测试
        </button>
      </div>
    );
  }

  if (testState === 'waiting') {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center cursor-pointer select-none"
        onClick={() => handleClick()}
        style={{
          background: 'linear-gradient(135deg, #7f1d1d 0%, #1e1b4b 50%, #0f172a 100%)',
        }}
      >
        <div className="text-center">
          {currentRound > 0 && (
            <p className="text-white/30 text-sm font-display mb-8 tracking-wider">
              第 {currentRound}/{totalRounds} 轮
            </p>
          )}
          <p className="font-display text-4xl md:text-5xl font-bold text-red-400/80 tracking-wider animate-pulse-slow">
            等待...
          </p>
          <p className="text-white/20 text-sm font-body mt-8">不要点击，等待信号出现</p>
        </div>
      </div>
    );
  }

  if (testState === 'ready') {
    if (mode === 'visual') {
      return (
        <div
          className="min-h-screen flex flex-col items-center justify-center cursor-pointer select-none"
          onClick={() => handleClick()}
          style={{ background: 'linear-gradient(135deg, #14532d 0%, #166534 50%, #22c55e 100%)' }}
        >
          <p className="text-white/30 text-sm font-display mb-8 tracking-wider">
            第 {currentRound}/{totalRounds} 轮
          </p>
          <div className="w-40 h-40 md:w-56 md:h-56 rounded-full bg-green-400 neon-glow flex items-center justify-center animate-glow"
               style={{ boxShadow: '0 0 60px rgba(34, 197, 94, 0.6), 0 0 120px rgba(34, 197, 94, 0.3)' }}>
            <span className="font-display text-2xl md:text-3xl font-bold text-white tracking-wider">点击!</span>
          </div>
        </div>
      );
    }

    if (mode === 'audio') {
      return (
        <div
          className="min-h-screen flex flex-col items-center justify-center cursor-pointer select-none"
          onClick={() => handleClick()}
          style={{ background: 'linear-gradient(135deg, #164e63 0%, #0e7490 50%, #06b6d4 100%)' }}
        >
          <p className="text-white/30 text-sm font-display mb-8 tracking-wider">
            第 {currentRound}/{totalRounds} 轮
          </p>
          <div className="w-40 h-40 md:w-56 md:h-56 rounded-full bg-cyan-500/20 border-4 border-cyan-400 flex items-center justify-center animate-pulse-slow"
               style={{ boxShadow: '0 0 40px rgba(6, 182, 212, 0.5), 0 0 80px rgba(6, 182, 212, 0.2)' }}>
            <Volume2 size={64} className="text-cyan-300" />
          </div>
          <p className="font-display text-xl md:text-2xl font-bold text-white mt-8 tracking-wider">
            听到声音后点击
          </p>
        </div>
      );
    }

    if (mode === 'choice') {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 select-none"
             style={{ background: 'linear-gradient(135deg, #3b0764 0%, #581c87 50%, #7c3aed 100%)' }}>
          <p className="text-white/30 text-sm font-display mb-6 tracking-wider">
            第 {currentRound}/{totalRounds} 轮
          </p>
          <p className="font-body text-lg text-white/60 mb-4">选择正确的颜色</p>
          <p className="font-display text-5xl md:text-6xl font-bold text-white mb-10 tracking-wider">
            {CHOICE_COLOR_LABELS[stimulusData ?? 'red'] ?? stimulusData}
          </p>
          <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
            {(['red', 'blue', 'green', 'yellow'] as const).map((color) => (
              <button
                key={color}
                onClick={() => handleClick(color)}
                className={cn(
                  'h-24 md:h-28 rounded-2xl border-2 transition-all duration-150 active:scale-95',
                  CHOICE_BUTTON_COLORS[color]
                )}
              >
                <span className="font-body text-white font-bold text-lg">
                  {CHOICE_COLOR_LABELS[color]}
                </span>
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (mode === 'inhibition') {
      const isGo = stimulusData === 'go';
      return (
        <div
          className="min-h-screen flex flex-col items-center justify-center cursor-pointer select-none"
          onClick={() => handleClick()}
          style={{
            background: isGo
              ? 'linear-gradient(135deg, #14532d 0%, #166534 50%, #22c55e 100%)'
              : 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #dc2626 100%)',
          }}
        >
          <p className="text-white/30 text-sm font-display mb-8 tracking-wider">
            第 {currentRound}/{totalRounds} 轮
          </p>
          {isGo ? (
            <>
              <div className="w-40 h-40 md:w-56 md:h-56 rounded-full bg-green-500/20 border-4 border-green-400 flex items-center justify-center"
                   style={{ boxShadow: '0 0 40px rgba(34, 197, 94, 0.5)' }}>
                <span className="font-display text-4xl md:text-5xl font-bold text-green-300 tracking-wider">
                  GO
                </span>
              </div>
              <p className="text-white/70 font-body mt-6 text-lg">点击!</p>
            </>
          ) : (
            <>
              <div className="w-40 h-40 md:w-56 md:h-56 rounded-full bg-red-500/20 border-4 border-red-400 flex items-center justify-center"
                   style={{ boxShadow: '0 0 40px rgba(220, 38, 38, 0.5)' }}>
                <Hand size={72} className="text-red-300" />
              </div>
              <p className="text-white/70 font-body mt-6 text-lg">不要点击!</p>
            </>
          )}
        </div>
      );
    }
  }

  if (testState === 'foul') {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center cursor-pointer select-none"
        onClick={() => handleClick()}
        style={{ background: 'linear-gradient(135deg, #450a0a 0%, #7f1d1d 50%, #0f172a 100%)' }}
      >
        <p className="text-white/30 text-sm font-display mb-8 tracking-wider">
          第 {currentRound}/{totalRounds} 轮
        </p>
        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-red-600/30 border-4 border-red-500 flex items-center justify-center mb-6"
             style={{ boxShadow: '0 0 30px rgba(220, 38, 38, 0.5)' }}>
          <X size={56} className="text-red-400" />
        </div>
        <p className="font-display text-3xl md:text-4xl font-bold text-red-400 tracking-wider">
          犯规!
        </p>
        <p className="text-white/40 font-body mt-4 text-sm">过早点击或错误操作</p>
        <button
          className="btn-secondary mt-8 font-body"
          onClick={(e) => { e.stopPropagation(); handleClick(); }}
        >
          继续
        </button>
      </div>
    );
  }

  if (testState === 'complete') {
    const foulCount = results.filter((r) => r.isFoul).length;

    return (
      <div className="min-h-screen flex flex-col items-center px-4 py-12">
        <button
          onClick={() => navigate('/test')}
          className="absolute top-6 left-6 flex items-center gap-2 text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-body text-sm">返回选择</span>
        </button>

        <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-2 tracking-wider">
          测试完成
        </h2>
        <p className="text-white/40 font-body mb-8">{config.name} · {totalRounds} 轮</p>

        {average !== null && rating && (
          <div className="card w-full max-w-md mb-8 text-center">
            <p className="text-white/40 font-body text-sm mb-2">平均反应时间</p>
            <p className="font-display text-5xl md:text-6xl font-bold tracking-wider"
               style={{ color: rating.color }}>
              {average}
              <span className="text-2xl ml-1">ms</span>
            </p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="text-2xl">{rating.icon}</span>
              <span className="font-display text-xl font-bold tracking-wider" style={{ color: rating.color }}>
                {rating.level}
              </span>
            </div>
            {foulCount > 0 && (
              <p className="text-white/30 font-body text-sm mt-3">
                犯规 {foulCount} 次 · 仅计算有效轮次
              </p>
            )}
          </div>
        )}

        {average === null && (
          <div className="card w-full max-w-md mb-8 text-center">
            <X size={48} className="text-red-400 mx-auto mb-3" />
            <p className="font-display text-xl font-bold text-red-400 tracking-wider">全部犯规</p>
            <p className="text-white/40 font-body text-sm mt-2">没有有效数据可供统计</p>
          </div>
        )}

        <div className="card w-full max-w-md mb-8">
          <h3 className="font-display text-sm font-bold text-white/60 tracking-wider mb-4">各轮详情</h3>
          <div className="space-y-2">
            {results.map((r) => (
              <div key={r.round} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <span className="text-white/50 font-body text-sm">第 {r.round} 轮</span>
                {r.isFoul ? (
                  <span className="flex items-center gap-1.5 text-red-400 font-body text-sm">
                    <X size={14} /> 犯规
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-neon-green font-body text-sm font-medium">
                    <Check size={14} /> {r.reactionTime} ms
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
          <button onClick={handleRetry} className="btn-primary flex-1 flex items-center justify-center gap-2 font-body">
            <RotateCcw size={18} /> 再来一次
          </button>
          {average !== null && (
            <button onClick={handleExport} className="btn-secondary flex-1 flex items-center justify-center gap-2 font-body">
              <Download size={18} /> 导出CSV
            </button>
          )}
        </div>

        {isAuthenticated && average !== null && !submitted && (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={cn(
              'mt-4 w-full max-w-md py-3 rounded-xl font-body font-semibold transition-all duration-300',
              submitting
                ? 'bg-dark-700 text-white/40 cursor-not-allowed'
                : 'bg-neon-blue hover:bg-neon-blue/80 text-white active:scale-95'
            )}
          >
            {submitting ? '提交中...' : '提交成绩到排行榜'}
          </button>
        )}

        {submitted && (
          <p className="mt-4 text-neon-green font-body text-sm flex items-center gap-1.5">
            <Check size={16} /> 成绩已提交
          </p>
        )}
      </div>
    );
  }

  return null;
}

export default function Test() {
  const { mode } = useParams<{ mode: string }>();
  const validMode = (mode && VALID_MODES.includes(mode as TestMode)) ? (mode as TestMode) : null;

  if (!validMode) {
    return <ModeSelector />;
  }

  return <TestContent mode={validMode} />;
}
