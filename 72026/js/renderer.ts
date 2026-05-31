import type { BallData } from './ball'
import type { PaddleData } from './paddle'
import type { BrickData } from './brick'
import type { ParticleData } from './particles'
import type { PowerUpData, ActivePowerUp } from './powerup'
import type { ComboSystem } from './combo'
import type { BossData, BulletData } from './boss'
import { getComboColor, getComboGlowColor } from './combo'

interface Star {
  x: number
  y: number
  size: number
  alpha: number
  twinkleSpeed: number
  phase: number
}

export class Renderer {
  private ctx: CanvasRenderingContext2D
  private width: number
  private height: number
  private stars: Star[] = []
  private frameCount = 0

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')!
    this.ctx = ctx
    this.width = canvas.width
    this.height = canvas.height
    this.initStars()
  }

  private initStars(): void {
    this.stars = []
    for (let i = 0; i < 100; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.5 + 0.3,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        phase: Math.random() * Math.PI * 2,
      })
    }
  }

  resize(width: number, height: number): void {
    this.width = width
    this.height = height
    this.initStars()
  }

  clear(): void {
    this.ctx.fillStyle = '#0a0e27'
    this.ctx.fillRect(0, 0, this.width, this.height)
  }

  drawBackground(): void {
    this.frameCount++
    this.clear()
    for (const star of this.stars) {
      const alpha =
        star.alpha +
        Math.sin(this.frameCount * star.twinkleSpeed + star.phase) * 0.2
      this.ctx.beginPath()
      this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
      this.ctx.fillStyle = `rgba(255,255,255,${Math.max(
        0.1,
        Math.min(1, alpha)
      )})`
      this.ctx.fill()
    }
  }

  drawBalls(balls: BallData[]): void {
    for (const ball of balls) {
      for (let i = ball.trail.length - 1; i >= 0; i--) {
        const t = ball.trail[i]
        this.ctx.save()
        this.ctx.globalAlpha = t.alpha * 0.4
        this.ctx.beginPath()
        this.ctx.arc(
          t.x,
          t.y,
          ball.radius * (1 - i / ball.trail.length) * 0.8,
          0,
          Math.PI * 2
        )
        this.ctx.fillStyle = ball.pierce ? '#eab308' : '#00d4ff'
        this.ctx.fill()
        this.ctx.restore()
      }

      this.ctx.save()
      const ballColor = ball.pierce ? '#eab308' : '#00d4ff'
      this.ctx.shadowColor = ballColor
      this.ctx.shadowBlur = ball.pierce ? 30 : 20

      const gradient = this.ctx.createRadialGradient(
        ball.x - 2,
        ball.y - 2,
        0,
        ball.x,
        ball.y,
        ball.radius
      )
      gradient.addColorStop(0, '#ffffff')
      gradient.addColorStop(0.4, ball.pierce ? '#fef08a' : '#b0efff')
      gradient.addColorStop(1, ballColor)

      this.ctx.beginPath()
      this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2)
      this.ctx.fillStyle = gradient
      this.ctx.fill()

      if (ball.pierce) {
        this.ctx.strokeStyle = '#ffffff'
        this.ctx.lineWidth = 2
        this.ctx.stroke()
      }

      this.ctx.restore()
    }
  }

  drawPaddle(paddle: PaddleData): void {
    this.ctx.save()
    const color = paddle.magnetActive ? '#ec4899' : '#00d4ff'
    this.ctx.shadowColor = color
    this.ctx.shadowBlur = paddle.magnetActive ? 25 : 16

    const halfW = paddle.width / 2
    const halfH = paddle.height / 2
    const x = paddle.x - halfW
    const y = paddle.y - halfH
    const r = halfH

    const gradient = this.ctx.createLinearGradient(x, y, x, y + paddle.height)
    gradient.addColorStop(0, paddle.magnetActive ? '#f472b6' : '#00ffcc')
    gradient.addColorStop(0.5, color)
    gradient.addColorStop(1, paddle.magnetActive ? '#be185d' : '#0088cc')

    this.ctx.beginPath()
    this.ctx.moveTo(x + r, y)
    this.ctx.lineTo(x + paddle.width - r, y)
    this.ctx.arcTo(x + paddle.width, y, x + paddle.width, y + r, r)
    this.ctx.arcTo(x + paddle.width, y + paddle.height, x + paddle.width - r, y + paddle.height, r)
    this.ctx.lineTo(x + r, y + paddle.height)
    this.ctx.arcTo(x, y + paddle.height, x, y + paddle.height - r, r)
    this.ctx.arcTo(x, y, x + r, y, r)
    this.ctx.closePath()
    this.ctx.fillStyle = gradient
    this.ctx.fill()

    this.ctx.shadowBlur = 0
    this.ctx.beginPath()
    this.ctx.moveTo(x + r + 4, y + 2)
    this.ctx.lineTo(x + paddle.width - r - 4, y + 2)
    this.ctx.strokeStyle = 'rgba(255,255,255,0.4)'
    this.ctx.lineWidth = 1.5
    this.ctx.stroke()

    this.ctx.restore()
  }

  drawBricks(bricks: BrickData[]): void {
    for (const brick of bricks) {
      if (!brick.alive) continue

      const x = brick.x + brick.shakeX
      const y = brick.y + brick.shakeY
      const r = 4

      this.ctx.save()
      this.ctx.shadowColor = brick.glowColor
      this.ctx.shadowBlur = brick.type === 'explosive' ? 12 : 6

      this.ctx.beginPath()
      this.ctx.moveTo(x + r, y)
      this.ctx.lineTo(x + brick.width - r, y)
      this.ctx.arcTo(x + brick.width, y, x + brick.width, y + r, r)
      this.ctx.arcTo(x + brick.width, y + brick.height, x + brick.width - r, y + brick.height, r)
      this.ctx.lineTo(x + r, y + brick.height)
      this.ctx.arcTo(x, y + brick.height, x, y + brick.height - r, r)
      this.ctx.arcTo(x, y, x + r, y, r)
      this.ctx.closePath()

      const gradient = this.ctx.createLinearGradient(x, y, x, y + brick.height)
      gradient.addColorStop(0, brick.color)
      gradient.addColorStop(1, this.darkenColor(brick.color, 0.35))
      this.ctx.fillStyle = gradient
      this.ctx.fill()

      this.ctx.shadowBlur = 0
      this.ctx.globalAlpha = 0.3
      this.ctx.beginPath()
      this.ctx.moveTo(x + r + 2, y + brick.height * 0.4)
      this.ctx.lineTo(x + brick.width - r - 2, y + brick.height * 0.4)
      this.ctx.strokeStyle = '#000000'
      this.ctx.lineWidth = brick.height * 0.3
      this.ctx.stroke()
      this.ctx.globalAlpha = 1

      if (brick.type === 'metal' && brick.maxHp > 1) {
        this.ctx.fillStyle = '#ffffff'
        this.ctx.font = 'bold 12px Orbitron'
        this.ctx.textAlign = 'center'
        this.ctx.textBaseline = 'middle'
        this.ctx.shadowColor = 'rgba(0,0,0,0.5)'
        this.ctx.shadowBlur = 3
        this.ctx.fillText(String(brick.hp), x + brick.width / 2, y + brick.height / 2)
      }

      if (brick.type === 'explosive') {
        this.ctx.fillStyle = '#ffffff'
        this.ctx.font = '14px sans-serif'
        this.ctx.textAlign = 'center'
        this.ctx.textBaseline = 'middle'
        this.ctx.fillText('💥', x + brick.width / 2, y + brick.height / 2)
      }

      if (brick.type === 'unbreakable') {
        this.ctx.fillStyle = 'rgba(255,255,255,0.6)'
        this.ctx.font = '12px sans-serif'
        this.ctx.textAlign = 'center'
        this.ctx.textBaseline = 'middle'
        this.ctx.fillText('🔒', x + brick.width / 2, y + brick.height / 2)
      }

      this.ctx.restore()
    }
  }

  drawBoss(boss: BossData): void {
    if (!boss.alive) return

    const x = boss.x + boss.shakeX
    const y = boss.y + boss.shakeY
    const halfW = boss.width / 2
    const halfH = boss.height / 2
    const pulse = 1 + Math.sin(boss.pulsePhase) * 0.05

    this.ctx.save()
    this.ctx.shadowColor = 'rgba(147,51,234,0.6)'
    this.ctx.shadowBlur = 25 * pulse

    const gradient = this.ctx.createLinearGradient(
      x - halfW,
      y - halfH,
      x + halfW,
      y + halfH
    )
    gradient.addColorStop(0, '#9333ea')
    gradient.addColorStop(0.5, '#7c3aed')
    gradient.addColorStop(1, '#6d28d9')

    const r = 12
    this.ctx.beginPath()
    this.ctx.moveTo(x - halfW + r, y - halfH)
    this.ctx.lineTo(x + halfW - r, y - halfH)
    this.ctx.arcTo(x + halfW, y - halfH, x + halfW, y - halfH + r, r)
    this.ctx.arcTo(x + halfW, y + halfH, x + halfW - r, y + halfH, r)
    this.ctx.lineTo(x - halfW + r, y + halfH)
    this.ctx.arcTo(x - halfW, y + halfH, x - halfW, y + halfH - r, r)
    this.ctx.arcTo(x - halfW, y - halfH, x - halfW + r, y - halfH, r)
    this.ctx.closePath()
    this.ctx.fillStyle = gradient
    this.ctx.fill()

    this.ctx.fillStyle = '#fbbf24'
    this.ctx.font = 'bold 24px sans-serif'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText('👾', x, y)

    this.ctx.restore()

    const barWidth = boss.width
    const barHeight = 10
    const barX = x - barWidth / 2
    const barY = y - halfH - 20

    this.ctx.fillStyle = 'rgba(0,0,0,0.5)'
    this.ctx.fillRect(barX, barY, barWidth, barHeight)

    const hpPercent = boss.hp / boss.maxHp
    const hpGradient = this.ctx.createLinearGradient(barX, barY, barX, barY + barHeight)
    hpGradient.addColorStop(0, '#f472b6')
    hpGradient.addColorStop(1, '#ec4899')
    this.ctx.fillStyle = hpGradient
    this.ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight)

    this.ctx.strokeStyle = '#9333ea'
    this.ctx.lineWidth = 2
    this.ctx.strokeRect(barX, barY, barWidth, barHeight)
  }

  drawBullets(bullets: BulletData[]): void {
    for (const bullet of bullets) {
      if (!bullet.active) continue

      this.ctx.save()
      this.ctx.shadowColor = '#f97316'
      this.ctx.shadowBlur = 10

      this.ctx.fillStyle = '#fbbf24'
      this.ctx.beginPath()
      this.ctx.ellipse(bullet.x, bullet.y, 3, 8, 0, 0, Math.PI * 2)
      this.ctx.fill()

      this.ctx.restore()
    }
  }

  drawPowerUps(powerUps: PowerUpData[]): void {
    for (const p of powerUps) {
      if (p.collected) continue

      this.ctx.save()
      this.ctx.translate(p.x, p.y)
      this.ctx.rotate(p.rotation)

      this.ctx.shadowColor = p.color
      this.ctx.shadowBlur = 15

      const size = 18
      this.ctx.beginPath()
      this.ctx.arc(0, 0, size, 0, Math.PI * 2)
      this.ctx.fillStyle = p.color
      this.ctx.fill()

      this.ctx.strokeStyle = '#ffffff'
      this.ctx.lineWidth = 2
      this.ctx.stroke()

      this.ctx.shadowBlur = 0
      this.ctx.rotate(-p.rotation)
      this.ctx.font = '16px sans-serif'
      this.ctx.textAlign = 'center'
      this.ctx.textBaseline = 'middle'
      this.ctx.fillText(p.icon, 0, 0)

      this.ctx.restore()
    }
  }

  drawParticles(particles: ParticleData[]): void {
    for (const p of particles) {
      const alpha = p.life / p.maxLife
      this.ctx.save()
      this.ctx.globalAlpha = alpha
      this.ctx.shadowColor = p.color
      this.ctx.shadowBlur = p.type === 'explosion' ? 8 : 4
      this.ctx.beginPath()
      this.ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2)
      this.ctx.fillStyle = p.color
      this.ctx.fill()
      this.ctx.restore()
    }
  }

  drawCombo(combo: ComboSystem): void {
    if (combo.displayAlpha <= 0 || combo.displayComboNum < 3) return

    this.ctx.save()
    this.ctx.globalAlpha = combo.displayAlpha

    const color = getComboColor(combo.displayComboNum)
    const glowColor = getComboGlowColor(combo.displayComboNum)

    this.ctx.translate(combo.displayX, combo.displayY)
    this.ctx.scale(combo.displayScale, combo.displayScale)

    this.ctx.shadowColor = glowColor
    this.ctx.shadowBlur = 30
    this.ctx.font = '900 48px Orbitron'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillStyle = color
    this.ctx.fillText(`COMBO x${combo.displayComboNum}`, 0, 0)

    if (combo.multiplier > 1) {
      this.ctx.shadowBlur = 15
      this.ctx.font = 'bold 20px Rajdhani'
      this.ctx.fillStyle = '#fbbf24'
      this.ctx.fillText(`${combo.multiplier.toFixed(1)}x 分数倍率`, 0, 35)
    }

    this.ctx.restore()
  }

  drawActivePowerUps(powerUps: ActivePowerUp[]): void {
    let x = 20
    const y = 60

    for (const p of powerUps) {
      if (p.duration < 0) continue

      this.ctx.save()
      const size = 28
      const progress = p.duration / p.maxDuration

      this.ctx.beginPath()
      this.ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2)
      this.ctx.fillStyle = 'rgba(0,0,0,0.5)'
      this.ctx.fill()

      this.ctx.beginPath()
      this.ctx.moveTo(x + size / 2, y + size / 2)
      this.ctx.arc(
        x + size / 2,
        y + size / 2,
        size / 2,
        -Math.PI / 2,
        -Math.PI / 2 + Math.PI * 2 * progress
      )
      this.ctx.closePath()
      this.ctx.fillStyle = this.getPowerUpColor(p.type)
      this.ctx.fill()

      this.ctx.font = '14px sans-serif'
      this.ctx.textAlign = 'center'
      this.ctx.textBaseline = 'middle'
      this.ctx.fillText(this.getPowerUpIcon(p.type), x + size / 2, y + size / 2)

      this.ctx.restore()
      x += size + 8
    }
  }

  private getPowerUpColor(type: string): string {
    const colors: Record<string, string> = {
      widen: '#22c55e',
      multiball: '#8b5cf6',
      shoot: '#f97316',
      magnet: '#ec4899',
      slow: '#06b6d4',
      pierce: '#eab308',
    }
    return colors[type] || '#ffffff'
  }

  private getPowerUpIcon(type: string): string {
    const icons: Record<string, string> = {
      widen: '📏',
      multiball: '🔮',
      shoot: '🔫',
      magnet: '🧲',
      slow: '🐢',
      pierce: '⚡',
    }
    return icons[type] || '?'
  }

  private darkenColor(hex: string, amount: number): string {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    const dr = Math.round(r * (1 - amount))
    const dg = Math.round(g * (1 - amount))
    const db = Math.round(b * (1 - amount))
    return `rgb(${dr},${dg},${db})`
  }
}
