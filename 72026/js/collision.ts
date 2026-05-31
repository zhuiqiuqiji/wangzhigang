import type { BallData } from './ball'
import type { PaddleData } from './paddle'
import type { BrickData } from './brick'
import type { BulletData, BossData } from './boss'
import { shouldBossDropPowerUp } from './boss'

export interface BrickHitResult {
  destroyed: boolean
  score: number
  hitX: number
  hitY: number
  hitColor: string
  isExplosive: boolean
  dropPowerUp: boolean
}

export function checkWallCollision(ball: BallData, canvasWidth: number): void {
  if (ball.x - ball.radius <= 0) {
    ball.x = ball.radius
    ball.dx = Math.abs(ball.dx)
  }
  if (ball.x + ball.radius >= canvasWidth) {
    ball.x = canvasWidth - ball.radius
    ball.dx = -Math.abs(ball.dx)
  }
  if (ball.y - ball.radius <= 0) {
    ball.y = ball.radius
    ball.dy = Math.abs(ball.dy)
  }
}

export function checkPaddleCollision(
  ball: BallData,
  paddle: PaddleData
): boolean {
  const halfW = paddle.width / 2
  const halfH = paddle.height / 2
  const closestX = Math.max(
    paddle.x - halfW,
    Math.min(ball.x, paddle.x + halfW)
  )
  const closestY = Math.max(
    paddle.y - halfH,
    Math.min(ball.y, paddle.y + halfH)
  )
  const distX = ball.x - closestX
  const distY = ball.y - closestY
  const dist = Math.sqrt(distX * distX + distY * distY)

  if (dist <= ball.radius && ball.dy > 0) {
    const hitPos = (ball.x - paddle.x) / halfW
    const angle = hitPos * (Math.PI / 3)
    const speed = ball.speed
    ball.dx = speed * Math.sin(angle)
    ball.dy = -speed * Math.cos(angle)
    ball.y = paddle.y - halfH - ball.radius
    return true
  }
  return false
}

export function checkBrickCollision(
  ball: BallData,
  bricks: BrickData[]
): BrickHitResult | null {
  for (const brick of bricks) {
    if (!brick.alive) continue

    const brickLeft = brick.x
    const brickRight = brick.x + brick.width
    const brickTop = brick.y
    const brickBottom = brick.y + brick.height

    if (
      ball.x + ball.radius < brickLeft ||
      ball.x - ball.radius > brickRight ||
      ball.y + ball.radius < brickTop ||
      ball.y - ball.radius > brickBottom
    ) {
      continue
    }

    const overlapLeft = ball.x + ball.radius - brickLeft
    const overlapRight = brickRight - (ball.x - ball.radius)
    const overlapTop = ball.y + ball.radius - brickTop
    const overlapBottom = brickBottom - (ball.y - ball.radius)

    const minOverlapX = Math.min(overlapLeft, overlapRight)
    const minOverlapY = Math.min(overlapTop, overlapBottom)

    if (!ball.pierce) {
      if (minOverlapX < minOverlapY) {
        if (overlapLeft < overlapRight) {
          ball.x = brickLeft - ball.radius
        } else {
          ball.x = brickRight + ball.radius
        }
        ball.dx = -ball.dx
      } else {
        if (overlapTop < overlapBottom) {
          ball.y = brickTop - ball.radius
        } else {
          ball.y = brickBottom + ball.radius
        }
        ball.dy = -ball.dy
      }
    }

    if (brick.type === 'unbreakable') {
      return null
    }

    return {
      destroyed: brick.hp <= 1,
      score: brick.hp <= 1 ? brick.points : 0,
      hitX: brick.x + brick.width / 2,
      hitY: brick.y + brick.height / 2,
      hitColor: brick.color,
      isExplosive: brick.type === 'explosive',
      dropPowerUp: brick.dropPowerUp && brick.hp <= 1,
    }
  }

  return null
}

export function checkBossCollision(
  ball: BallData,
  boss: BossData
): { hit: boolean; dropPowerUp: boolean } | null {
  if (!boss.alive) return null

  const halfW = boss.width / 2
  const halfH = boss.height / 2

  if (
    ball.x + ball.radius < boss.x - halfW ||
    ball.x - ball.radius > boss.x + halfW ||
    ball.y + ball.radius < boss.y - halfH ||
    ball.y - ball.radius > boss.y + halfH
  ) {
    return null
  }

  const overlapTop = ball.y + ball.radius - (boss.y - halfH)
  const overlapBottom = boss.y + halfH - (ball.y - ball.radius)
  const overlapLeft = ball.x + ball.radius - (boss.x - halfW)
  const overlapRight = boss.x + halfW - (ball.x - ball.radius)

  const minOverlapY = Math.min(overlapTop, overlapBottom)
  const minOverlapX = Math.min(overlapLeft, overlapRight)

  if (minOverlapY < minOverlapX) {
    if (overlapTop < overlapBottom) {
      ball.y = boss.y - halfH - ball.radius
      ball.dy = -Math.abs(ball.dy)
    } else {
      ball.y = boss.y + halfH + ball.radius
      ball.dy = Math.abs(ball.dy)
    }
  } else {
    if (overlapLeft < overlapRight) {
      ball.x = boss.x - halfW - ball.radius
      ball.dx = -Math.abs(ball.dx)
    } else {
      ball.x = boss.x + halfW + ball.radius
      ball.dx = Math.abs(ball.dx)
    }
  }

  const dropPowerUp = shouldBossDropPowerUp(boss)
  if (dropPowerUp) {
    boss.dropCooldown = 120
  }

  return {
    hit: true,
    dropPowerUp,
  }
}

export function checkBulletBrickCollision(
  bullet: BulletData,
  bricks: BrickData[]
): BrickHitResult | null {
  if (!bullet.active) return null

  for (const brick of bricks) {
    if (!brick.alive) continue

    if (
      bullet.x >= brick.x &&
      bullet.x <= brick.x + brick.width &&
      bullet.y >= brick.y &&
      bullet.y <= brick.y + brick.height
    ) {
      bullet.active = false

      if (brick.type === 'unbreakable') {
        return null
      }

      return {
        destroyed: brick.hp <= 1,
        score: brick.hp <= 1 ? brick.points : 0,
        hitX: brick.x + brick.width / 2,
        hitY: brick.y + brick.height / 2,
        hitColor: brick.color,
        isExplosive: brick.type === 'explosive',
        dropPowerUp: brick.dropPowerUp && brick.hp <= 1,
      }
    }
  }

  return null
}

export function checkBallLost(ball: BallData, canvasHeight: number): boolean {
  return ball.y - ball.radius > canvasHeight
}
