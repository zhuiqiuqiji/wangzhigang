import React, { useEffect, useState } from 'react';

interface CoinParticlesProps {
  active: boolean;
  count?: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
  rotation: number;
}

export const CoinParticles: React.FC<CoinParticlesProps> = React.memo(({ active, count = 30 }) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (active) {
      const colors = ['#FFD700', '#FFA500', '#FFEC8B', '#FFF8DC', '#F0E68C'];
      const newParticles: Particle[] = [];
      
      for (let i = 0; i < count; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: -10 - Math.random() * 20,
          size: 12 + Math.random() * 20,
          color: colors[Math.floor(Math.random() * colors.length)],
          delay: Math.random() * 0.5,
          duration: 2 + Math.random() * 2,
          rotation: Math.random() * 720 - 360,
        });
      }
      
      setParticles(newParticles);

      const timer = setTimeout(() => {
        setParticles([]);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [active, count]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            animation: `coin-fall-${particle.id} ${particle.duration}s ease-out ${particle.delay}s forwards`,
          }}
        >
          <div
            className="w-full h-full rounded-full flex items-center justify-center text-lg font-bold"
            style={{
              background: `radial-gradient(circle at 30% 30%, ${particle.color}, #B8860B)`,
              boxShadow: `0 0 ${particle.size / 2}px ${particle.color}, inset -2px -2px 4px rgba(0,0,0,0.3)`,
              border: '2px solid #8B6914',
            }}
          >
            💰
          </div>
          <style>{`
            @keyframes coin-fall-${particle.id} {
              0% {
                transform: translateY(0) rotate(0deg);
                opacity: 1;
              }
              100% {
                transform: translateY(120vh) rotate(${particle.rotation}deg);
                opacity: 0;
              }
            }
          `}</style>
        </div>
      ))}
    </div>
  );
});

CoinParticles.displayName = 'CoinParticles';
