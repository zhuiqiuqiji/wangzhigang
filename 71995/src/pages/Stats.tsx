import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { testApi } from '@/utils/api';
import { useAuth } from '@/hooks/useAuth';
import { TestMode, MODE_CONFIG, StatsData } from '@/../shared/types';
import { cn } from '@/lib/utils';
import { BarChart3, TrendingUp, Percent, Zap } from 'lucide-react';

const MODES: TestMode[] = ['visual', 'audio', 'choice', 'inhibition'];

export default function Stats() {
  const { isAuthenticated } = useAuth();
  const [activeMode, setActiveMode] = useState<TestMode>('visual');
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    testApi
      .getStats(activeMode)
      .then((data) => setStats(data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [activeMode, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="card glass p-10 text-center neon-border max-w-md w-full">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-neon-purple" />
          <h2 className="font-display text-2xl text-white mb-2">数据分析</h2>
          <p className="text-gray-400 mb-6">请先登录以查看你的反应数据统计</p>
          <a href="/login" className="btn-primary inline-block">
            去登录
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="font-display text-3xl text-white neon-glow">数据分析</h1>
        <div className="flex gap-2 flex-wrap">
          {MODES.map((mode) => (
            <button
              key={mode}
              onClick={() => setActiveMode(mode)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-body transition-all duration-200',
                activeMode === mode
                  ? 'bg-neon-purple text-white shadow-[0_0_12px_rgba(168,85,247,0.5)]'
                  : 'bg-dark-700 text-gray-400 hover:text-white hover:bg-dark-600'
              )}
            >
              {MODE_CONFIG[mode].icon} {MODE_CONFIG[mode].name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Zap className="w-10 h-10 text-neon-cyan animate-pulse" />
          <p className="text-gray-400 font-body">正在加载数据...</p>
        </div>
      ) : !stats ? (
        <div className="card glass p-10 text-center neon-border">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h2 className="font-display text-xl text-gray-400 mb-2">暂无数据</h2>
          <p className="text-gray-500 font-body">完成一些测试后再来查看你的数据分析吧</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="card glass p-6 neon-border">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="w-6 h-6 text-neon-purple" />
              <h2 className="font-display text-lg text-white">反应时间分布</h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.distribution} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="bucket" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.2)' }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.2)' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a2e',
                    border: '1px solid rgba(168,85,247,0.4)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: 13,
                  }}
                  labelStyle={{ color: '#a855f7' }}
                />
                <Bar dataKey="count" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card glass p-6 neon-border">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-6 h-6 text-neon-cyan" />
              <h2 className="font-display text-lg text-white">趋势变化</h2>
            </div>
            {stats.trend.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-gray-500 font-body">
                暂无趋势数据
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.trend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.2)' }} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.2)' }} unit="ms" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a2e',
                      border: '1px solid rgba(6,182,212,0.4)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: 13,
                    }}
                    labelStyle={{ color: '#06b6d4' }}
                    formatter={(value: number) => [`${value} ms`, '平均反应时间']}
                  />
                  <Line
                    type="monotone"
                    dataKey="average"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    dot={{ fill: '#06b6d4', r: 4, strokeWidth: 2, stroke: '#0e7490' }}
                    activeDot={{ r: 6, fill: '#22d3ee', stroke: '#06b6d4', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="card glass p-6 neon-border">
            <div className="flex items-center gap-3 mb-6">
              <Percent className="w-6 h-6 text-neon-yellow" />
              <h2 className="font-display text-lg text-white">百分位排名</h2>
            </div>
            <div className="flex flex-col items-center py-8">
              <span className="font-display text-7xl text-neon-yellow neon-glow animate-pulse">
                {stats.percentile}
              </span>
              <span className="text-gray-400 text-lg mt-2 font-body">百分位</span>
              <p className="text-gray-300 mt-4 font-body text-center">
                你超过了 <span className="text-neon-yellow font-bold">{stats.percentile}%</span> 的用户
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
