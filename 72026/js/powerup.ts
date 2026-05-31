export type PowerUpType = 'widen' | 'multiball' | 'shoot' | 'magnet' | 'slow' | 'pierce'

export interface PowerUpData {
  x: number
  y: number
  dy: number
  type: PowerUpType
  color: string
  icon: string
  collected: boolean
  rotation: number
}

export interface ActivePowerUp {
  type: PowerUpType
  duration: number
  maxDuration: number
}

const POWERUP_CONFIGS: Record<PowerUpType, { color: string; icon: string; duration: number }> = {
  widen: { color: '#22c55e', icon: '📏', duration: 900 },
  multiball: { color: '#8b5cf6', icon: '🔮', duration: -1 },
  shoot: { color: '#f97316', icon: '🔫', duration: 600 },
  magnet: { color: '#ec4899', icon: '🧲', duration: 720 },
  slow: { color: '#06b6d4', icon: '🐢', duration: 480 },
  pierce: { color: '#eab308', icon: '⚡', duration: 360 },
}

export function createPowerUp(x: number, y: number): PowerUpData {
  const types: PowerUpType[] = ['widen', 'multiball', 'shoot', 'magnet', 'slow', 'pierce']
  const weights = [1.2, 0.8, 1, 1, 1, 0.9]
  const totalWeight = weights.reduce((a, b) => a + b, 0)
  let random = Math.random() * totalWeight
  let selected = types[0]

  for (let i = 0; i < types.length; i++) {
    random -= weights[i]
    if (random <= 0) {
      selected = types[i]
      break
    }
  }

  const config = POWERUP_CONFIGS[selected]
  return {
    x,
    y,
    dy: 2,
    type: selected,
    color: config.color,
    icon: config.icon,
    collected: false,
    rotation: 0,
  }
}

export function getPowerUpDuration(type: PowerUpType): number {
  return POWERUP_CONFIGS[type].duration
}

export function updatePowerUp(powerUp: PowerUpData): void {
  powerUp.y += powerUp.dy
  powerUp.rotation += 0.05
}

export function checkPowerUpPaddleCollision(
  powerUp: PowerUpData,
  paddleX: number,
  paddleY: number,
  paddleWidth: number,
  paddleHeight: number
): boolean {
  const halfW = paddleWidth / 2
  const halfH = paddleHeight / 2

  return (
    powerUp.x + 15 >= paddleX - halfW &&
    powerUp.x - 15 <= paddleX + halfW &&
    powerUp.y + 15 >= paddleY - halfH &&
    powerUp.y - 15 <= paddleY + halfH
  )
}

export function addActivePowerUp(
  activePowerUps: ActivePowerUp[],
  type: PowerUpType
): void {
  const existing = activePowerUps.find(p => p.type === type)
  const duration = getPowerUpDuration(type)

  if (duration < 0) {
    if (!existing) {
      activePowerUps.push({ type, duration: -1, maxDuration: -1 })
    }
  } else {
    if (existing) {
      existing.duration = Math.max(existing.duration, duration)
    } else {
      activePowerUps.push({ type, duration, maxDuration: duration })
    }
  }
}

export function updateActivePowerUps(activePowerUps: ActivePowerUp[]): void {
  for (let i = activePowerUps.length - 1; i >= 0; i--) {
    const p = activePowerUps[i]
    if (p.duration > 0) {
      p.duration--
      if (p.duration <= 0) {
        activePowerUps.splice(i, 1)
      }
    }
  }
}

export function hasActivePowerUp(
  activePowerUps: ActivePowerUp[],
  type: PowerUpType
): boolean {
  return activePowerUps.some(p => p.type === type)
}
