import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { UserPlus } from 'lucide-react';
import { AGE_GROUP_LABELS, REGION_OPTIONS } from '@/../shared/types';
import type { AgeGroup } from '@/../shared/types';

export default function Register() {
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [region, setRegion] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('密码至少6个字符');
      return;
    }
    try {
      await register({ email, password, nickname, region, ageGroup });
      navigate('/');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '注册失败，请重试';
      setError(message);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-black text-neon-purple tracking-widest">
            REACT
          </h1>
          <p className="font-body text-white/40 mt-2">反应速度测试平台</p>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 space-y-4 neon-border">
          <div className="flex items-center justify-center gap-2 mb-2">
            <UserPlus size={20} className="text-neon-purple" />
            <h2 className="font-display text-lg font-bold text-white tracking-wide">注册</h2>
          </div>

          <div>
            <label className="block text-sm text-white/60 font-body mb-1">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-white font-body text-sm focus:outline-none focus:ring-2 focus:ring-neon-purple focus:border-transparent transition-all"
              placeholder="请输入邮箱"
            />
          </div>

          <div>
            <label className="block text-sm text-white/60 font-body mb-1">昵称</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              required
              className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-white font-body text-sm focus:outline-none focus:ring-2 focus:ring-neon-purple focus:border-transparent transition-all"
              placeholder="请输入昵称"
            />
          </div>

          <div>
            <label className="block text-sm text-white/60 font-body mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-white font-body text-sm focus:outline-none focus:ring-2 focus:ring-neon-purple focus:border-transparent transition-all"
              placeholder="至少6个字符"
            />
          </div>

          <div>
            <label className="block text-sm text-white/60 font-body mb-1">地区</label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              required
              className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-white font-body text-sm focus:outline-none focus:ring-2 focus:ring-neon-purple focus:border-transparent transition-all appearance-none"
            >
              <option value="" disabled>请选择地区</option>
              {REGION_OPTIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-white/60 font-body mb-1">年龄段</label>
            <select
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value)}
              required
              className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-white font-body text-sm focus:outline-none focus:ring-2 focus:ring-neon-purple focus:border-transparent transition-all appearance-none"
            >
              <option value="" disabled>请选择年龄段</option>
              {(Object.entries(AGE_GROUP_LABELS) as [AgeGroup, string][]).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-neon-red text-sm font-body">{error}</p>
          )}

          <button
            type="submit"
            className="w-full btn-primary py-3 font-display tracking-wide text-sm"
          >
            注册
          </button>

          <p className="text-center text-sm text-white/40 font-body">
            已有账号？
            <Link to="/login" className="text-neon-purple hover:text-neon-cyan transition-colors ml-1">
              登录
            </Link>
          </p>
        </form>

        <div className="text-center mt-6">
          <Link
            to="/"
            className="text-white/30 hover:text-white/60 text-sm font-body transition-colors"
          >
            ← 返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
