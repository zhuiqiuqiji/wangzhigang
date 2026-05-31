import { useState, useEffect } from 'react';
import { leaderboardApi } from '@/utils/api';
import { useAuth } from '@/hooks/useAuth';
import { TestMode, MODE_CONFIG, AGE_GROUP_LABELS, REGION_OPTIONS, LeaderboardEntry } from '@/../shared/types';
import { cn } from '@/lib/utils';
import { Trophy, Medal, Globe, Users, Filter } from 'lucide-react';

const MODES: TestMode[] = ['visual', 'audio', 'choice', 'inhibition'];

const MEDAL_ICONS: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
};

const RANK_STYLES: Record<number, string> = {
  1: 'bg-yellow-500/10 border-yellow-500/30',
  2: 'bg-gray-400/10 border-gray-400/30',
  3: 'bg-amber-700/10 border-amber-700/30',
};

export default function Leaderboard() {
  const { user, isAuthenticated } = useAuth();
  const [mode, setMode] = useState<TestMode>('visual');
  const [ageGroup, setAgeGroup] = useState<string>('all');
  const [region, setRegion] = useState<string>('all');
  const [rankings, setRankings] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setLoading(true);
    const params: { mode: TestMode; ageGroup?: string; region?: string } = { mode };
    if (ageGroup !== 'all') params.ageGroup = ageGroup;
    if (region !== 'all') params.region = region;
    leaderboardApi
      .getLeaderboard(params)
      .then((data) => setRankings(data.rankings))
      .catch(() => setRankings([]))
      .finally(() => setLoading(false));
  }, [mode, ageGroup, region]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Trophy className="w-8 h-8 text-neon-yellow" />
        <h1 className="font-display text-3xl text-white neon-glow">全球排行榜</h1>
      </div>

      <div className="card glass p-4 neon-border">
        <div className="flex items-center justify-between mb-3">
          <span className="font-body text-sm text-gray-400 flex items-center gap-2">
            <Filter size={14} />
            模式筛选
          </span>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'sm:hidden px-3 py-1.5 rounded-lg text-xs font-body transition-colors',
              showFilters ? 'bg-neon-purple text-white' : 'bg-dark-700 text-gray-400'
            )}
          >
            更多筛选
          </button>
        </div>

        <div className="flex gap-2 flex-wrap">
          {MODES.map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-body transition-all duration-200',
                mode === m
                  ? 'bg-neon-purple text-white shadow-[0_0_12px_rgba(168,85,247,0.5)]'
                  : 'bg-dark-700 text-gray-400 hover:text-white hover:bg-dark-600'
              )}
            >
              {MODE_CONFIG[m].icon} {MODE_CONFIG[m].name}
            </button>
          ))}
        </div>

        <div className={cn('mt-4 flex flex-col sm:flex-row gap-3', showFilters ? 'flex' : 'hidden sm:flex')}>
          <div className="flex-1">
            <label className="font-body text-xs text-gray-500 mb-1 flex items-center gap-1">
              <Users size={12} /> 年龄组
            </label>
            <select
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value)}
              className="w-full bg-dark-700 text-white font-body text-sm rounded-lg px-3 py-2 border border-white/10 focus:border-neon-purple/50 focus:outline-none transition-colors"
            >
              <option value="all">全部年龄</option>
              {Object.entries(AGE_GROUP_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="font-body text-xs text-gray-500 mb-1 flex items-center gap-1">
              <Globe size={12} /> 地区
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full bg-dark-700 text-white font-body text-sm rounded-lg px-3 py-2 border border-white/10 focus:border-neon-purple/50 focus:outline-none transition-colors"
            >
              <option value="all">全部地区</option>
              {REGION_OPTIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Trophy className="w-10 h-10 text-neon-cyan animate-pulse" />
          <p className="text-gray-400 font-body">正在加载排行榜...</p>
        </div>
      ) : rankings.length === 0 ? (
        <div className="card glass p-10 text-center neon-border">
          <Medal className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h2 className="font-display text-xl text-gray-400 mb-2">暂无排行数据</h2>
          <p className="text-gray-500 font-body">该筛选条件下还没有记录，快去测试争取上榜吧</p>
        </div>
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="font-display text-xs text-gray-500 uppercase tracking-wider px-4 py-3 text-left">排名</th>
                  <th className="font-display text-xs text-gray-500 uppercase tracking-wider px-4 py-3 text-left">昵称</th>
                  <th className="font-display text-xs text-gray-500 uppercase tracking-wider px-4 py-3 text-left">地区</th>
                  <th className="font-display text-xs text-gray-500 uppercase tracking-wider px-4 py-3 text-left">年龄组</th>
                  <th className="font-display text-xs text-gray-500 uppercase tracking-wider px-4 py-3 text-right">平均时间</th>
                  <th className="font-display text-xs text-gray-500 uppercase tracking-wider px-4 py-3 text-center">评级</th>
                  <th className="font-display text-xs text-gray-500 uppercase tracking-wider px-4 py-3 text-right">测试次数</th>
                </tr>
              </thead>
              <tbody>
                {rankings.map((entry) => {
                  const isCurrentUser = isAuthenticated && user?.id === entry.userId;
                  return (
                    <tr
                      key={entry.userId}
                      className={cn(
                        'border-b border-white/5 transition-colors',
                        entry.rank <= 3
                          ? RANK_STYLES[entry.rank]
                          : 'hover:bg-white/5',
                        isCurrentUser && 'border-2 border-neon-purple/60 bg-neon-purple/10'
                      )}
                    >
                      <td className="px-4 py-3 font-display text-lg">
                        {MEDAL_ICONS[entry.rank] || (
                          <span className="text-gray-400">{entry.rank}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-body text-white font-medium">
                        {entry.nickname}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs text-neon-purple font-normal">(你)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-body text-gray-400">{entry.region}</td>
                      <td className="px-4 py-3 font-body text-gray-400">
                        {AGE_GROUP_LABELS[entry.ageGroup]}
                      </td>
                      <td className="px-4 py-3 font-display text-right" style={{ color: entry.rating.color }}>
                        {entry.averageTime.toFixed(0)}ms
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-body"
                          style={{
                            color: entry.rating.color,
                            backgroundColor: `${entry.rating.color}15`,
                          }}
                        >
                          {entry.rating.icon} {entry.rating.level}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-body text-gray-400 text-right">
                        {entry.testCount}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {rankings.map((entry) => {
              const isCurrentUser = isAuthenticated && user?.id === entry.userId;
              return (
                <div
                  key={entry.userId}
                  className={cn(
                    'card glass p-4 border transition-colors',
                    entry.rank <= 3
                      ? RANK_STYLES[entry.rank]
                      : 'border-white/10',
                    isCurrentUser && 'border-2 border-neon-purple/60 bg-neon-purple/10'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-lg">
                        {MEDAL_ICONS[entry.rank] || (
                          <span className="text-gray-400">#{entry.rank}</span>
                        )}
                      </span>
                      <span className="font-body text-white font-medium">
                        {entry.nickname}
                      </span>
                      {isCurrentUser && (
                        <span className="text-xs text-neon-purple">(你)</span>
                      )}
                    </div>
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-body"
                      style={{
                        color: entry.rating.color,
                        backgroundColor: `${entry.rating.color}15`,
                      }}
                    >
                      {entry.rating.icon} {entry.rating.level}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-body">
                    <div className="flex items-center gap-3 text-gray-400">
                      <span className="flex items-center gap-1"><Globe size={12} />{entry.region}</span>
                      <span className="flex items-center gap-1"><Users size={12} />{AGE_GROUP_LABELS[entry.ageGroup]}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500">{entry.testCount}次</span>
                      <span className="font-display font-bold" style={{ color: entry.rating.color }}>
                        {entry.averageTime.toFixed(0)}ms
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
