export type BrickType = 'normal' | 'metal' | 'explosive' | 'unbreakable'

export interface BrickData {
  x: number
  y: number
  width: number
  height: number
  type: BrickType
  hp: number
  maxHp: number
  color: string
  glowColor: string
  alive: boolean
  points: number
  dropPowerUp: boolean
  shakeX: number
  shakeY: number
}

const BRICK_CONFIGS: Record<number, { type: BrickType; hp: number; color: string; glowColor: string; points: number }> = {
  1: { type: 'normal', hp: 1, color: '#00d4ff', glowColor: 'rgba(0,212,255,0.5)', points: 50 },
  2: { type: 'metal', hp: 2, color: '#c0c0c0', glowColor: 'rgba(192,192,192,0.5)', points: 150 },
  3: { type: 'metal', hp: 3, color: '#808080', glowColor: 'rgba(128,128,128,0.6)', points: 250 },
  4: { type: 'explosive', hp: 1, color: '#ff4444', glowColor: 'rgba(255,68,68,0.6)', points: 100 },
  5: { type: 'unbreakable', hp: 999999, color: '#2a2a3e', glowColor: 'rgba(42,42,62,0.3)', points: 0 },
}

export function createBricksFromGrid(
  grid: number[][],
  canvasWidth: number,
  topOffset: number = 80
): BrickData[] {
  const bricks: BrickData[] = []
  const brickPadding = 4
  const sideOffset = 40
  const cols = Math.max(...grid.map(row => row.length), 10)
  const brickWidth = Math.min(70, (canvasWidth - sideOffset * 2 - brickPadding * (cols - 1)) / cols)
  const brickHeight = 24

  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      const cellValue = grid[r][c]
      if (cellValue === 0) continue

      const config = BRICK_CONFIGS[cellValue] || BRICK_CONFIGS[1]
      const dropChance = cellValue === 4 ? 0.8 : cellValue >= 2 ? 0.3 : 0.1

      bricks.push({
        x: sideOffset + c * (brickWidth + brickPadding),
        y: topOffset + r * (brickHeight + brickPadding),
        width: brickWidth,
        height: brickHeight,
        type: config.type,
        hp: config.hp,
        maxHp: config.hp,
        color: config.color,
        glowColor: config.glowColor,
        alive: true,
        points: config.points,
        dropPowerUp: Math.random() < dropChance,
        shakeX: 0,
        shakeY: 0,
      })
    }
  }

  return bricks
}

export function hitBrick(brick: BrickData, damage: number = 1): boolean {
  if (brick.type === 'unbreakable') return false

  brick.hp -= damage
  brick.shakeX = (Math.random() - 0.5) * 6
  brick.shakeY = (Math.random() - 0.5) * 4

  if (brick.hp <= 0) {
    brick.alive = false
    return true
  }
  return false
}

export function updateBrickShake(bricks: BrickData[]): void {
  for (const brick of bricks) {
    if (brick.shakeX !== 0) brick.shakeX *= 0.7
    if (brick.shakeY !== 0) brick.shakeY *= 0.7
    if (Math.abs(brick.shakeX) < 0.1) brick.shakeX = 0
    if (Math.abs(brick.shakeY) < 0.1) brick.shakeY = 0
  }
}

export function getExplosionTargets(
  brick: BrickData,
  bricks: BrickData[]
): BrickData[] {
  const cx = brick.x + brick.width / 2
  const cy = brick.y + brick.height / 2
  const range = Math.max(brick.width, brick.height) * 1.8

  return bricks.filter(b => {
    if (!b.alive || b === brick) return false
    const bx = b.x + b.width / 2
    const by = b.y + b.height / 2
    return Math.sqrt((bx - cx) ** 2 + (by - cy) ** 2) <= range
  })
}

export function allDestroyableBricksCleared(bricks: BrickData[]): boolean {
  return bricks.filter(b => b.type !== 'unbreakable').every(b => !b.alive)
}
