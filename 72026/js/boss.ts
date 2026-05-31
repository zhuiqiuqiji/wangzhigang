export interface BossData {
  x: number
  y: number
  width: number
  height: number
  hp: number
  maxHp: number
  alive: boolean
  pulsePhase: number
  dropCooldown: number
  shakeX: number
  shakeY: number
}

export function createBoss(
  canvasWidth: number,
  hp: number
): BossData {
  return {
    x: canvasWidth / 2,
    y: 140,
    width: Math.min(canvasWidth * 0.6, 300),
    height: 80,
    hp,
    maxHp: hp,
    alive: true,
    pulsePhase: 0,
    dropCooldown: 0,
    shakeX: 0,
    shakeY: 0,
  }
}

export function updateBoss(boss: BossData): void {
  boss.pulsePhase += 0.05
  boss.dropCooldown = Math.max(0, boss.dropCooldown - 1)

  if (boss.shakeX !== 0) boss.shakeX *= 0.7
  if (boss.shakeY !== 0) boss.shakeY *= 0.7
  if (Math.abs(boss.shakeX) < 0.1) boss.shakeX = 0
  if (Math.abs(boss.shakeY) < 0.1) boss.shakeY = 0
}

export function hitBoss(boss: BossData, damage: number = 1): boolean {
  boss.hp -= damage
  boss.shakeX = (Math.random() - 0.5) * 10
  boss.shakeY = (Math.random() - 0.5) * 6

  if (boss.hp <= 0) {
    boss.alive = false
    return true
  }
  return false
}

export function shouldBossDropPowerUp(boss: BossData): boolean {
  if (boss.dropCooldown > 0) return false
  if (Math.random() < 0.08) {
    boss.dropCooldown = 120
    return true
  }
  return false
}

export interface BulletData {
  x: number
  y: number
  dy: number
  active: boolean
}

export function createBullet(x: number, y: number): BulletData {
  return {
    x,
    y,
    dy: -8,
    active: true,
  }
}

export function updateBullet(bullet: BulletData): void {
  bullet.y += bullet.dy
  if (bullet.y < -20) {
    bullet.active = false
  }
}

export function fireBullets(
  paddleX: number,
  paddleY: number,
  paddleHeight: number
): BulletData[] {
  return [
    createBullet(paddleX - 30, paddleY - paddleHeight / 2 - 5),
    createBullet(paddleX + 30, paddleY - paddleHeight / 2 - 5),
  ]
}
