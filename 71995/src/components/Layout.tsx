import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Home, Zap, Dumbbell, Trophy, User, LogIn, UserPlus, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/', label: '首页', icon: Home },
  { to: '/test', label: '测试模式', icon: Zap },
  { to: '/training', label: '训练', icon: Dumbbell },
  { to: '/leaderboard', label: '排行榜', icon: Trophy },
  { to: '/profile', label: '个人', icon: User },
];

function Sidebar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-dark-800 border-r border-white/10 z-30">
      <div className="p-6 border-b border-white/10">
        <h1 className="font-display text-xl font-bold text-neon-purple tracking-wider">
          REACT
        </h1>
        <p className="text-xs text-white/40 mt-1 font-body">反应速度测试平台</p>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-neon-purple/20 text-neon-purple neon-border'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              )
            }
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        {isAuthenticated ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-neon-purple/30 flex items-center justify-center text-neon-purple font-bold text-sm">
              {user?.nickname?.charAt(0) ?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.nickname}</p>
              <p className="text-xs text-white/40 truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="p-2 text-white/40 hover:text-neon-red transition-colors"
              title="退出登录"
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => navigate('/login')} className="btn-secondary flex-1 text-sm py-2 flex items-center justify-center gap-2">
              <LogIn size={16} />
              登录
            </button>
            <button onClick={() => navigate('/register')} className="btn-primary flex-1 text-sm py-2 flex items-center justify-center gap-2">
              <UserPlus size={16} />
              注册
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

function BottomTabBar() {
  const { isAuthenticated } = useAuth();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-dark-800/95 backdrop-blur-xl border-t border-white/10 z-30 safe-area-bottom">
      <div className="flex items-center justify-around py-2 px-2">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-xs transition-all duration-200 min-w-[56px]',
                isActive
                  ? 'text-neon-purple'
                  : 'text-white/40 hover:text-white/70'
              )
            }
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
        {!isAuthenticated && (
          <NavLink
            to="/login"
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-xs transition-all duration-200 min-w-[56px]',
                isActive
                  ? 'text-neon-purple'
                  : 'text-white/40 hover:text-white/70'
              )
            }
          >
            <LogIn size={20} />
            <span>登录</span>
          </NavLink>
        )}
      </div>
    </nav>
  );
}

export default function Layout() {
  return (
    <div className="min-h-screen bg-dark-900">
      <Sidebar />
      <main className="md:ml-64 pb-20 md:pb-0 min-h-screen">
        <Outlet />
      </main>
      <BottomTabBar />
    </div>
  );
}
