import { useNavigate } from 'react-router-dom';
import { Zap, Trophy, BarChart3, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { MODE_CONFIG, type TestMode } from '@/../shared/types';

const TEST_MODES: TestMode[] = ['visual', 'audio', 'choice', 'inhibition'];

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <section className="relative px-6 pt-16 pb-12 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-neon-purple/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-purple/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <h1 className="font-display text-5xl md:text-7xl font-black tracking-wider mb-4">
            <span className="bg-gradient-to-r from-neon-purple via-neon-cyan to-neon-purple bg-clip-text text-transparent animate-pulse">
              反应速度测试平台
            </span>
          </h1>
          <p className="font-body text-white/50 text-lg md:text-xl max-w-xl mx-auto leading-relaxed">
            测量你的反应速度，挑战极限，与全球玩家一较高下
          </p>

          {!isAuthenticated && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                onClick={() => navigate('/login')}
                className="btn-secondary px-8 py-3 text-base font-body"
              >
                登录
              </button>
              <button
                onClick={() => navigate('/register')}
                className="btn-primary px-8 py-3 text-base font-body neon-glow"
              >
                立即注册
              </button>
            </div>
          )}

          {isAuthenticated && (
            <p className="mt-6 font-body text-white/60 text-base">
              欢迎回来，<span className="text-neon-purple font-semibold">{user?.nickname}</span>
            </p>
          )}
        </div>
      </section>

      <section className="px-6 py-8 max-w-5xl mx-auto">
        <h2 className="font-display text-2xl font-bold text-white mb-6 tracking-wide">
          选择测试模式
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TEST_MODES.map((mode) => {
            const config = MODE_CONFIG[mode];
            return (
              <button
                key={mode}
                onClick={() => navigate(`/test/${mode}`)}
                className={cn(
                  'group relative glass rounded-2xl p-6 text-left transition-all duration-300',
                  'hover:scale-[1.02] hover:shadow-lg hover:shadow-neon-purple/20',
                  'border border-white/10 hover:border-neon-purple/40'
                )}
              >
                <div className={cn(
                  'absolute inset-0 rounded-2xl bg-gradient-to-br opacity-10 group-hover:opacity-20 transition-opacity duration-300',
                  config.bgColor
                )} />

                <div className="relative z-10">
                  <span className="text-4xl block mb-3">{config.icon}</span>
                  <h3 className="font-display text-lg font-bold text-white mb-1 tracking-wide">
                    {config.name}
                  </h3>
                  <p className="font-body text-white/50 text-sm">{config.description}</p>
                </div>

                <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Zap size={16} className="text-neon-purple" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {isAuthenticated && (
        <section className="px-6 py-8 max-w-5xl mx-auto">
          <h2 className="font-display text-2xl font-bold text-white mb-6 tracking-wide">
            数据概览
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Zap, label: '测试次数', value: '--', color: 'text-neon-purple' },
              { icon: BarChart3, label: '平均反应', value: '--', color: 'text-neon-cyan' },
              { icon: Trophy, label: '最佳排名', value: '--', color: 'text-neon-yellow' },
              { icon: User, label: '等级评定', value: '--', color: 'text-neon-green' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="glass rounded-xl p-4 border border-white/10 text-center"
              >
                <stat.icon size={24} className={cn('mx-auto mb-2', stat.color)} />
                <p className="font-display text-xl font-bold text-white">{stat.value}</p>
                <p className="font-body text-xs text-white/40 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="px-6 py-12 max-w-5xl mx-auto text-center">
        <h2 className="font-display text-2xl font-bold text-white mb-3 tracking-wide">
          快速开始
        </h2>
        <p className="font-body text-white/40 mb-6">选择一个模式，5轮测试即可获得你的反应速度评级</p>
        <button
          onClick={() => navigate('/test/visual')}
          className={cn(
            'btn-primary px-12 py-4 text-lg font-display tracking-wider neon-glow',
            'transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-neon-purple/30'
          )}
        >
          开始测试
        </button>
      </section>
    </div>
  );
}
