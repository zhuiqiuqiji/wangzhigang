import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LogIn } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '登录失败，请重试';
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
            <LogIn size={20} className="text-neon-purple" />
            <h2 className="font-display text-lg font-bold text-white tracking-wide">登录</h2>
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
            <label className="block text-sm text-white/60 font-body mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-white font-body text-sm focus:outline-none focus:ring-2 focus:ring-neon-purple focus:border-transparent transition-all"
              placeholder="请输入密码"
            />
          </div>

          {error && (
            <p className="text-neon-red text-sm font-body">{error}</p>
          )}

          <button
            type="submit"
            className="w-full btn-primary py-3 font-display tracking-wide text-sm"
          >
            登录
          </button>

          <p className="text-center text-sm text-white/40 font-body">
            还没有账号？
            <Link to="/register" className="text-neon-purple hover:text-neon-cyan transition-colors ml-1">
              注册
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
