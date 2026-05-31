import {
  createBall,
  launchBall,
  updateBall,
  cloneBall,
  applySlowEffect,
  applyPierceEffect,
  type BallData,
} from './ball'
import {
  createPaddle,
  movePaddle,
  movePaddleTo,
  applyWidenEffect,
  applyMagnetEffect,
  applyMagnetPull,
  updateShootCooldown,
  canShoot,
  resetShootCooldown,
  type PaddleData,
} from './paddle'
import {
  createBricksFromGrid,
  hitBrick,
  updateBrickShake,
  getExplosionTargets,
  allDestroyableBricksCleared,
  type BrickData,
} from './brick'
import {
  checkWallCollision,
  checkPaddleCollision,
  checkBrickCollision,
  checkBossCollision,
  checkBulletBrickCollision,
  checkBallLost,
} from './collision'
import {
  createExplosion,
  createSparks,
  createBigExplosion,
  createShockwave,
  updateParticles,
  type ParticleData,
} from './particles'
import {
  createPowerUp,
  updatePowerUp,
  checkPowerUpPaddleCollision,
  addActivePowerUp,
  updateActivePowerUps,
  hasActivePowerUp,
  type PowerUpData,
  type ActivePowerUp,
} from './powerup'
import {
  createComboSystem,
  addCombo,
  updateCombo,
  type ComboSystem,
} from './combo'
import {
  createBoss,
  updateBoss,
  hitBoss,
  fireBullets,
  updateBullet,
  type BossData,
  type BulletData,
} from './boss'
import { createInputState, setupInputListeners, type InputState } from './input'
import { Renderer } from './renderer'
import { getLevelDef } from './levels'
import {
  unlockLevel,
  saveLevelScore,
  calculateStars,
} from './storage'

const urlParams = new URLSearchParams(window.location.search)
const initialLevel = parseInt(urlParams.get('level') || '1', 10)
const isTestLevel = urlParams.get('test') === '1'

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement
const overlay = document.getElementById('overlay') as HTMLDivElement
const overlayTitle = document.getElementById('overlay-title') as HTMLHeadingElement
const overlaySubtitle = document.getElementById('overlay-subtitle') as HTMLParagraphElement
const startBtn = document.getElementById('start-btn') as HTMLButtonElement
const scoreEl = document.getElementById('score') as HTMLSpanElement
const levelEl = document.getElementById('level') as HTMLSpanElement
const livesEl = document.getElementById('lives') as HTMLSpanElement
const backBtn = document.createElement('button')
backBtn.textContent = '返回选关'
backBtn.style.cssText = `
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 15;
  background: rgba(0,212,255,0.2);
  color: #00d4ff;
  border: 1px solid rgba(0,212,255,0.4);
  padding: 6px 16px;
  border-radius: 20px;
  font-family: Rajdhani, sans-serif;
  font-size: 13px;
  cursor: pointer;
  pointer-events: all;
`
document.getElementById('hud')?.appendChild(backBtn)

const renderer = new Renderer(canvas)
const input: InputState = createInputState()
setupInputListeners(input)

type GameStatus = 'idle' | 'playing' | 'won' | 'lost'

interface GameState {
  status: GameStatus
  score: number
  lives: number
  currentLevel: number
  maxLives: number
  ballLaunched: boolean
  frameCount: number
}

let state: GameState = {
  status: 'idle',
  score: 0,
  lives: 3,
  currentLevel: 1,
  maxLives: 3,
  ballLaunched: false,
  frameCount: 0,
}

let balls: BallData[] = []
let paddle: PaddleData
let bricks: BrickData[] = []
let boss: BossData | null = null
let bullets: BulletData[] = []
let powerUps: PowerUpData[] = []
let activePowerUps: ActivePowerUp[] = []
let particles: ParticleData[] = []
let combo: ComboSystem

function resizeCanvas(): void {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  renderer.resize(canvas.width, canvas.height)
}

function initGame(levelId: number = 1): void {
  resizeCanvas()
  state.currentLevel = isTestLevel ? 99 : levelId
  paddle = createPaddle(canvas.width, canvas.height)
  combo = createComboSystem(canvas.width, canvas.height)
  loadLevel(levelId)
  const levelTitle = isTestLevel ? '测试关卡' : `第 ${levelId} 关`
  const levelName = isTestLevel
    ? localStorage.getItem('bb_test_name') || '测试关卡'
    : getLevelDef(levelId)?.name || ''
  showOverlay('击球砖块弹射 v2.0', `${levelTitle} - ${levelName}`, '开始游戏')
}

function loadLevel(levelId: number): void {
  let grid: number[][] = []
  let hasBoss = false
  let bossHp = 0

  if (isTestLevel) {
    const saved = localStorage.getItem('bb_test_level')
    if (saved) {
      try {
        grid = JSON.parse(saved)
      } catch {
        grid = []
      }
    }
  } else {
    const levelDef = getLevelDef(levelId)
    if (!levelDef) {
      showOverlay('恭喜通关!', '你已完成所有关卡!', '重新开始')
      state.status = 'won'
      return
    }
    grid = levelDef.grid
    hasBoss = levelDef.hasBoss || false
    bossHp = levelDef.bossHp || 0
  }

  bricks = createBricksFromGrid(grid, canvas.width, hasBoss ? 180 : 100)
  balls = [createBall(canvas.width, paddle.y, paddle.height)]
  bullets = []
  powerUps = []
  activePowerUps = []
  particles = []

  if (hasBoss && bossHp > 0) {
    boss = createBoss(canvas.width, bossHp)
  } else {
    boss = null
  }

  levelEl.textContent = isTestLevel ? '测试' : String(levelId)
}

function startLevel(levelId: number): void {
  state.status = 'playing'
  state.score = 0
  state.lives = state.maxLives
  state.currentLevel = levelId
  state.ballLaunched = false
  state.frameCount = 0

  paddle = createPaddle(canvas.width, canvas.height)
  combo = createComboSystem(canvas.width, canvas.height)
  loadLevel(levelId)
  hideOverlay()
  updateHUD()
}

function showOverlay(title: string, subtitle: string, btnText: string): void {
  overlayTitle.textContent = title
  overlaySubtitle.textContent = subtitle
  startBtn.textContent = btnText
  overlay.classList.add('visible')
}

function hideOverlay(): void {
  overlay.classList.remove('visible')
}

function updateHUD(): void {
  scoreEl.textContent = state.score.toString()
  levelEl.textContent = String(state.currentLevel)
  livesEl.textContent = '❤'.repeat(state.lives)
}

function triggerExplosion(brick: BrickData, allBricks: BrickData[]): void {
  const targets = getExplosionTargets(brick, allBricks)
  for (const target of targets) {
    hitBrick(target, 2)
    if (!target.alive) {
      particles.push(...createExplosion(target.x + target.width / 2, target.y + target.height / 2, target.color, 8))
    }
  }
  particles.push(...createBigExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, '#ff4444'))
  particles.push(...createShockwave(brick.x + brick.width / 2, brick.y + brick.height / 2))
}

function collectPowerUp(powerUp: PowerUpData): void {
  addActivePowerUp(activePowerUps, powerUp.type)
  powerUp.collected = true

  switch (powerUp.type) {
    case 'widen':
      applyWidenEffect(paddle, true)
      break
    case 'multiball':
      if (balls.length < 10) {
        const newBalls: BallData[] = []
        for (const ball of balls) {
          if (ball.dy !== 0) {
            newBalls.push(cloneBall(ball, -0.35))
            newBalls.push(cloneBall(ball, 0.35))
          }
        }
        balls.push(...newBalls)
      }
      break
    case 'magnet':
      applyMagnetEffect(paddle, true)
      break
    case 'slow':
      applySlowEffect(balls, true)
      break
    case 'pierce':
      applyPierceEffect(balls, true)
      break
  }

  particles.push(...createSparks(powerUp.x, powerUp.y, powerUp.color, 10))
}

function endLevel(won: boolean): void {
  if (won) {
    if (isTestLevel) {
      showOverlay('测试完成!', `得分: ${state.score}`, '返回编辑器')
    } else {
      const stars = calculateStars(state.score, state.lives, combo.maxCombo)
      saveLevelScore(state.currentLevel, state.score, stars)
      unlockLevel(state.currentLevel + 1)

      const starStr = '⭐'.repeat(stars)
      showOverlay(
        `${state.currentLevel < 10 ? '通关!' : 'BOSS 击败!'}`,
        `得分: ${state.score} | ${starStr}`,
        state.currentLevel < 10 ? '下一关' : '返回选关'
      )
    }
    state.status = 'won'
  } else {
    showOverlay('游戏结束', `最终得分: ${state.score}`, isTestLevel ? '返回编辑器' : '重新开始')
    state.status = 'lost'
  }
}

function gameLoop(): void {
  requestAnimationFrame(gameLoop)
  state.frameCount++

  renderer.drawBackground()

  if (state.status !== 'playing') {
    renderer.drawBricks(bricks)
    if (boss) renderer.drawBoss(boss)
    renderer.drawPaddle(paddle)
    renderer.drawBalls(balls)
    renderer.drawParticles(particles)
    particles = updateParticles(particles)
    return
  }

  if (input.useMouse && input.mouseX !== null) {
    movePaddleTo(paddle, input.mouseX, canvas.width)
  } else {
    if (input.left) movePaddle(paddle, -1, canvas.width)
    if (input.right) movePaddle(paddle, 1, canvas.width)
  }

  if (!state.ballLaunched) {
    for (const ball of balls) {
      ball.x = paddle.x
      ball.y = paddle.y - paddle.height / 2 - ball.radius - 2
    }
  } else {
    for (let i = balls.length - 1; i >= 0; i--) {
      const ball = balls[i]

      const magnetPull = applyMagnetPull(paddle, ball.x, ball.y, ball.dy)
      if (magnetPull !== null) {
        ball.x += magnetPull
      }

      updateBall(ball)
      checkWallCollision(ball, canvas.width)
      checkPaddleCollision(ball, paddle)

      const hitResult = checkBrickCollision(ball, bricks)
      if (hitResult) {
        const brick = bricks.find(
          (b) =>
            b.alive &&
            Math.abs(b.x + b.width / 2 - hitResult.hitX) < 1 &&
            Math.abs(b.y + b.height / 2 - hitResult.hitY) < 1
        )

        if (brick) {
          const destroyed = hitBrick(brick)
          if (destroyed) {
            addCombo(combo, state.frameCount)
            const finalScore = Math.round(hitResult.score * combo.multiplier)
            state.score += finalScore

            if (hitResult.isExplosive) {
              triggerExplosion(brick, bricks)
            } else {
              particles.push(...createExplosion(hitResult.hitX, hitResult.hitY, hitResult.hitColor))
            }

            if (hitResult.dropPowerUp) {
              powerUps.push(createPowerUp(hitResult.hitX, hitResult.hitY))
            }
          } else {
            particles.push(...createSparks(hitResult.hitX, hitResult.hitY, hitResult.hitColor, 4))
          }
          updateHUD()
        }
      }

      if (boss) {
        const bossHit = checkBossCollision(ball, boss)
        if (bossHit) {
          hitBoss(boss, 1)
          if (!boss.alive) {
            particles.push(...createBigExplosion(boss.x, boss.y, '#9333ea'))
            state.score += 5000
            updateHUD()
          } else if (bossHit.dropPowerUp) {
            powerUps.push(createPowerUp(boss.x + (Math.random() - 0.5) * boss.width * 0.5, boss.y + boss.height / 2))
          } else {
            particles.push(...createSparks(ball.x, ball.y, '#fbbf24', 5))
          }
        }
      }

      if (checkBallLost(ball, canvas.height)) {
        if (balls.length > 1) {
          balls.splice(i, 1)
        } else {
          state.lives--
          combo.comboCount = 0
          combo.multiplier = 1
          updateHUD()

          if (state.lives <= 0) {
            endLevel(false)
            return
          } else {
            balls = [createBall(canvas.width, paddle.y, paddle.height)]
            state.ballLaunched = false
            activePowerUps = activePowerUps.filter((p) => p.type === 'multiball')
            applyWidenEffect(paddle, hasActivePowerUp(activePowerUps, 'widen'))
            applyMagnetEffect(paddle, hasActivePowerUp(activePowerUps, 'magnet'))
            applySlowEffect(balls, hasActivePowerUp(activePowerUps, 'slow'))
            applyPierceEffect(balls, hasActivePowerUp(activePowerUps, 'pierce'))
          }
        }
      }
    }

    if (hasActivePowerUp(activePowerUps, 'shoot')) {
      updateShootCooldown(paddle)
      if (canShoot(paddle)) {
        bullets.push(...fireBullets(paddle.x, paddle.y, paddle.height))
        resetShootCooldown(paddle)
      }
    }

    for (const bullet of bullets) {
      if (!bullet.active) continue
      updateBullet(bullet)

      const bulletHit = checkBulletBrickCollision(bullet, bricks)
      if (bulletHit) {
        const brick = bricks.find(
          (b) =>
            b.alive &&
            Math.abs(b.x + b.width / 2 - bulletHit.hitX) < 1 &&
            Math.abs(b.y + b.height / 2 - bulletHit.hitY) < 1
        )
        if (brick) {
          const destroyed = hitBrick(brick)
          if (destroyed) {
            addCombo(combo, state.frameCount)
            state.score += Math.round(bulletHit.score * combo.multiplier)

            if (bulletHit.isExplosive) {
              triggerExplosion(brick, bricks)
            } else {
              particles.push(...createExplosion(bulletHit.hitX, bulletHit.hitY, bulletHit.hitColor, 8))
            }

            if (bulletHit.dropPowerUp) {
              powerUps.push(createPowerUp(bulletHit.hitX, bulletHit.hitY))
            }
            updateHUD()
          }
        }
      }
    }
    bullets = bullets.filter((b) => b.active)

    updateActivePowerUps(activePowerUps)
    applyWidenEffect(paddle, hasActivePowerUp(activePowerUps, 'widen'))
    applyMagnetEffect(paddle, hasActivePowerUp(activePowerUps, 'magnet'))
    applySlowEffect(balls, hasActivePowerUp(activePowerUps, 'slow'))
    applyPierceEffect(balls, hasActivePowerUp(activePowerUps, 'pierce'))

    for (const pu of powerUps) {
      if (pu.collected) continue
      updatePowerUp(pu)

      if (checkPowerUpPaddleCollision(pu, paddle.x, paddle.y, paddle.width, paddle.height)) {
        collectPowerUp(pu)
      }
    }
    powerUps = powerUps.filter((p) => !p.collected && p.y < canvas.height + 50)

    if (boss) {
      updateBoss(boss)
      if (!boss.alive && state.status === 'playing') {
        state.status = 'won'
        setTimeout(() => endLevel(true), 1000)
      }
    } else if (allDestroyableBricksCleared(bricks)) {
      endLevel(true)
    }
  }

  updateCombo(combo, state.frameCount)
  updateBrickShake(bricks)

  renderer.drawBricks(bricks)
  if (boss) renderer.drawBoss(boss)
  renderer.drawPowerUps(powerUps)
  renderer.drawBullets(bullets)
  renderer.drawPaddle(paddle)
  renderer.drawBalls(balls)
  renderer.drawParticles(particles)
  renderer.drawCombo(combo)
  renderer.drawActivePowerUps(activePowerUps)
  particles = updateParticles(particles)
}

canvas.addEventListener('click', () => {
  if (state.status === 'playing' && !state.ballLaunched) {
    state.ballLaunched = true
    for (const ball of balls) {
      launchBall(ball, paddle.x)
    }
  }
})

startBtn.addEventListener('click', () => {
  if (state.status === 'won') {
    if (isTestLevel) {
      location.href = './editor.html'
    } else if (state.currentLevel < 10) {
      startLevel(state.currentLevel + 1)
    } else {
      location.href = './level-select.html'
    }
  } else if (state.status === 'lost') {
    if (isTestLevel) {
      location.href = './editor.html'
    } else {
      startLevel(state.currentLevel)
    }
  } else {
    startLevel(state.currentLevel)
  }
})

backBtn.addEventListener('click', () => {
  location.href = './level-select.html'
})

window.addEventListener('resize', () => {
  const oldWidth = canvas.width
  const oldHeight = canvas.height
  resizeCanvas()
  const scaleX = canvas.width / oldWidth
  const scaleY = canvas.height / oldHeight

  paddle.x *= scaleX
  paddle.y = canvas.height - 50

  for (const ball of balls) {
    ball.x *= scaleX
    ball.y *= scaleY
  }

  for (const brick of bricks) {
    brick.x *= scaleX
    brick.y *= scaleY
  }

  if (boss) {
    boss.x *= scaleX
    boss.y *= scaleY
  }

  if (!state.ballLaunched && balls.length > 0) {
    balls[0].x = paddle.x
    balls[0].y = paddle.y - paddle.height / 2 - balls[0].radius - 2
  }
})

document.addEventListener('keydown', (e) => {
  if (e.key === ' ' && state.status === 'playing' && !state.ballLaunched) {
    state.ballLaunched = true
    for (const ball of balls) {
      launchBall(ball, paddle.x)
    }
  }
})

initGame(initialLevel)
gameLoop()
