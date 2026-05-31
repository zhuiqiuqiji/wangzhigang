export interface ParticleData {
  x: number
  y: number
  dx: number
  dy: number
  life: number
  maxLife: number
  color: string
  size: number
  type: 'normal' | 'spark' | 'explosion' | 'trail'
}

export function createExplosion(
  x: number,
  y: number,
  color: string,
  count: number = 12
): ParticleData[] {
  const particles: ParticleData[] = []
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6
    const speed = 1.5 + Math.random() * 4
    particles.push({
      x,
      y,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      life: 1,
      maxLife: 1,
      color,
      size: 2 + Math.random() * 4,
      type: 'explosion',
    })
  }
  return particles
}

export function createSparks(
  x: number,
  y: number,
  color: string,
  count: number = 6
): ParticleData[] {
  const particles: ParticleData[] = []
  for (let i = 0; i < count; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI
    const speed = 2 + Math.random() * 3
    particles.push({
      x,
      y,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      life: 1,
      maxLife: 1,
      color,
      size: 1.5 + Math.random() * 2,
      type: 'spark',
    })
  }
  return particles
}

export function createBigExplosion(
  x: number,
  y: number,
  color: string
): ParticleData[] {
  const particles: ParticleData[] = []
  for (let i = 0; i < 25; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 2 + Math.random() * 6
    particles.push({
      x,
      y,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      life: 1,
      maxLife: 1,
      color,
      size: 3 + Math.random() * 5,
      type: 'explosion',
    })
  }
  for (let i = 0; i < 15; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 1 + Math.random() * 2
    particles.push({
      x,
      y,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      life: 1,
      maxLife: 1,
      color: '#ffd700',
      size: 2 + Math.random() * 3,
      type: 'spark',
    })
  }
  return particles
}

export function createShockwave(x: number, y: number): ParticleData[] {
  const particles: ParticleData[] = []
  for (let i = 0; i < 16; i++) {
    const angle = (Math.PI * 2 * i) / 16
    particles.push({
      x,
      y,
      dx: Math.cos(angle) * 8,
      dy: Math.sin(angle) * 8,
      life: 0.6,
      maxLife: 0.6,
      color: '#ffffff',
      size: 4,
      type: 'explosion',
    })
  }
  return particles
}

export function updateParticles(particles: ParticleData[]): ParticleData[] {
  return particles.filter(p => {
    p.x += p.dx
    p.y += p.dy
    p.dy += 0.08
    p.life -= 0.02
    return p.life > 0
  })
}
