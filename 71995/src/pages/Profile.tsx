import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { testApi, exportApi } from '@/utils/api';
import {
  TestMode,
  MODE_CONFIG,
  TestSession,
  AGE_GROUP_LABELS,
} from '@/../shared/types';
import { cn } from '@/lib/utils';
import {
  User,
  Mail,
  MapPin,
  Calendar,
  Download,
  Clock,
  BarChart3,
  LogOut,
  ChevronRight,
  FileDown,
} from 'lucide-react';

const MODES: TestMode[] = ['visual', 'audio', 'choice', 'inhibition'];
const PAGE_SIZE = 10;

export default function Profile() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState<TestSession[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [modeFilter, setModeFilter] = useState<TestMode | ''>('');
  const [offset, setOffset] = useState(0);

  const [exportMode, setExportMode] = useState<TestMode | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    setOffset(0);
    setSessions([]);
    testApi
      .getHistory({
        mode: modeFilter || undefined,
        limit: PAGE_SIZE,
        offset: 0,
      })
      .then((data) => {
        setSessions(data.records);
        setTotal(data.total);
        setOffset(PAGE_SIZE);
      })
      .catch(() => {
        setSessions([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated, modeFilter]);

  const loadMore = () => {
    if (loading) return;
    setLoading(true);
    testApi
      .getHistory({
        mode: modeFilter || undefined,
        limit: PAGE_SIZE,
        offset,
      })
      .then((data) => {
        setSessions((prev) => [...prev, ...data.records]);
        setTotal(data.total);
        setOffset((prev) => prev + PAGE_SIZE);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleExport = () => {
    const url = exportApi.getExportUrl({
      mode: exportMode || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
    const token = localStorage.getItem('token');
    const separator = url.includes('?') ? '&' : '?';
    const fullUrl = token ? `${url}${separator}token=${encodeURIComponent(token)}` : url;
    window.open(fullUrl, '_blank');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const totalTests = total;
  const avgTime =
    sessions.length > 0
      ? Math.round(
          sessions
            .filter((s) => s.average !== null)
            .reduce((sum, s) => sum + (s.average ?? 0), 0) /
            sessions.filter((s) => s.average !== null).length
        )
      : null;

  const bestMode = (() => {
    if (sessions.length === 0) return '--';
    const modeAvgs: Record<string, { total: number; count: number }> = {};
    for (const s of sessions) {
      if (s.average === null) continue;
      if (!modeAvgs[s.mode]) modeAvgs[s.mode] = { total: 0, count: 0 };
      modeAvgs[s.mode].total += s.average;
      modeAvgs[s.mode].count += 1;
    }
    let best: string | null = null;
    let bestAvg = Infinity;
    for (const [mode, { total: t, count: c }] of Object.entries(modeAvgs)) {
      const avg = t / c;
      if (avg < bestAvg) {
        bestAvg = avg;
        best = mode;
      }
    }
    return best ? MODE_CONFIG[best as TestMode].name : '--';
  })();

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      <div className="relative card glass overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/20 via-neon-blue/10 to-neon-cyan/20 pointer-events-none" />
        <div className="relative z-10 p-8 flex flex-col sm:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-neon-purple to-neon-cyan flex items-center justify-center text-4xl font-display font-bold text-white shadow-lg shadow-neon-purple/30">
            {user?.nickname?.charAt(0) ?? 'U'}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="font-display text-2xl font-bold text-white tracking-wide">
              {user?.nickname}
            </h1>
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-1 text-white/50">
              <Mail size={14} />
              <span className="font-body text-sm">{user?.email}</span>
            </div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-neon-purple/20 text-neon-purple text-xs font-body border border-neon-purple/30">
                <MapPin size={12} />
                {user?.region}
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-neon-cyan/20 text-neon-cyan text-xs font-body border border-neon-cyan/30">
                <Calendar size={12} />
                {user?.ageGroup ? AGE_GROUP_LABELS[user.ageGroup] : ''}
              </span>
            </div>
            <p className="text-white/30 text-xs font-body mt-2">
              注册于 {user?.createdAt ? formatDate(user.createdAt) : '--'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card glass p-4 text-center">
          <BarChart3 className="w-6 h-6 mx-auto mb-2 text-neon-purple" />
          <p className="font-display text-2xl font-bold text-white">{totalTests}</p>
          <p className="font-body text-xs text-white/40 mt-1">测试次数</p>
        </div>
        <div className="card glass p-4 text-center">
          <Clock className="w-6 h-6 mx-auto mb-2 text-neon-cyan" />
          <p className="font-display text-2xl font-bold text-white">
            {avgTime !== null ? `${avgTime}` : '--'}
          </p>
          <p className="font-body text-xs text-white/40 mt-1">平均时间(ms)</p>
        </div>
        <div className="card glass p-4 text-center">
          <User className="w-6 h-6 mx-auto mb-2 text-neon-green" />
          <p className="font-display text-lg font-bold text-white">{bestMode}</p>
          <p className="font-body text-xs text-white/40 mt-1">最佳模式</p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl text-white tracking-wide">测试历史</h2>
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value as TestMode | '')}
            className="bg-dark-700 border border-white/10 rounded-lg px-3 py-2 text-sm font-body text-white/70 focus:outline-none focus:border-neon-purple/50"
          >
            <option value="">全部模式</option>
            {MODES.map((mode) => (
              <option key={mode} value={mode}>
                {MODE_CONFIG[mode].icon} {MODE_CONFIG[mode].name}
              </option>
            ))}
          </select>
        </div>

        {sessions.length === 0 && !loading ? (
          <div className="card glass p-10 text-center">
            <Clock className="w-12 h-12 mx-auto mb-3 text-gray-600" />
            <p className="font-body text-gray-500">暂无测试记录</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => {
              const config = MODE_CONFIG[session.mode];
              return (
                <div
                  key={session.sessionId}
                  className="card glass p-4 flex items-center gap-4 transition-all duration-200 hover:border-opacity-60 border border-white/10"
                  style={{ borderLeftColor: config.color, borderLeftWidth: '3px' }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{ backgroundColor: `${config.color}20` }}
                  >
                    {config.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-body text-sm font-medium text-white">
                        {config.name}
                      </span>
                      {session.rating && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-body"
                          style={{
                            backgroundColor: `${session.rating.color}20`,
                            color: session.rating.color,
                          }}
                        >
                          {session.rating.icon} {session.rating.level}
                        </span>
                      )}
                    </div>
                    <p className="font-body text-xs text-white/30 mt-0.5">
                      {formatDate(session.createdAt)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className="font-display text-lg font-bold"
                      style={{ color: config.color }}
                    >
                      {session.average !== null ? `${session.average}` : '--'}
                      <span className="text-xs text-white/30 ml-0.5">ms</span>
                    </p>
                    <p className="font-body text-xs text-white/30">
                      {session.rounds.length} 轮
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-white/20 shrink-0" />
                </div>
              );
            })}

            {sessions.length < total && (
              <button
                onClick={loadMore}
                disabled={loading}
                className={cn(
                  'w-full py-3 rounded-xl font-body text-sm transition-all duration-200',
                  'bg-dark-700 text-white/60 border border-white/10',
                  'hover:bg-dark-600 hover:text-white hover:border-neon-purple/30',
                  loading && 'opacity-50 cursor-not-allowed'
                )}
              >
                {loading ? '加载中...' : '加载更多'}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="card glass p-6 neon-border">
        <div className="flex items-center gap-3 mb-5">
          <FileDown className="w-6 h-6 text-neon-green" />
          <h2 className="font-display text-lg text-white tracking-wide">导出数据</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <div>
            <label className="font-body text-xs text-white/40 mb-1 block">测试模式</label>
            <select
              value={exportMode}
              onChange={(e) => setExportMode(e.target.value as TestMode | '')}
              className="w-full bg-dark-700 border border-white/10 rounded-lg px-3 py-2 text-sm font-body text-white/70 focus:outline-none focus:border-neon-purple/50"
            >
              <option value="">全部模式</option>
              {MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {MODE_CONFIG[mode].icon} {MODE_CONFIG[mode].name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="font-body text-xs text-white/40 mb-1 block">开始日期</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-dark-700 border border-white/10 rounded-lg px-3 py-2 text-sm font-body text-white/70 focus:outline-none focus:border-neon-purple/50"
            />
          </div>
          <div>
            <label className="font-body text-xs text-white/40 mb-1 block">结束日期</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-dark-700 border border-white/10 rounded-lg px-3 py-2 text-sm font-body text-white/70 focus:outline-none focus:border-neon-purple/50"
            />
          </div>
        </div>
        <button
          onClick={handleExport}
          className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3"
        >
          <Download size={18} />
          导出CSV
        </button>
      </div>

      <button
        onClick={handleLogout}
        className="w-full py-3 rounded-xl font-body text-sm transition-all duration-200 bg-dark-800 text-neon-red/70 border border-neon-red/20 hover:bg-neon-red/10 hover:text-neon-red hover:border-neon-red/40 flex items-center justify-center gap-2"
      >
        <LogOut size={18} />
        退出登录
      </button>
    </div>
  );
}
