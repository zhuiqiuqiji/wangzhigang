export interface PaddleData {
  x: number
  y: number
  width: number
  height: number
  baseWidth: number
  speed: number
  magnetActive: boolean
  shootCooldown: number
}

export function createPaddle(canvasWidth: number, canvasHeight: number): PaddleData {
  return {
    x: canvasWidth / 2,
    y: canvasHeight - 50,
    width: 100,
    height: 16,
    baseWidth: 100,
    speed: 8,
    magnetActive: false,
    shootCooldown: 0,
  }
}

export function movePaddle(
  paddle: PaddleData,
  direction: number,
  canvasWidth: number
): void {
  paddle.x += direction * paddle.speed
  constrainPaddle(paddle, canvasWidth)
}

export function movePaddleTo(
  paddle: PaddleData,
  targetX: number,
  canvasWidth: number
): void {
  paddle.x = targetX
  constrainPaddle(paddle, canvasWidth)
}

function constrainPaddle(paddle: PaddleData, canvasWidth: number): void {
  const half = paddle.width / 2
  if (paddle.x - half < 0) paddle.x = half
  if (paddle.x + half > canvasWidth) paddle.x = canvasWidth - half
}

export function applyWidenEffect(
  paddle: PaddleData,
  active: boolean
): void {
  paddle.width = active ? paddle.baseWidth * 2 : paddle.baseWidth
}

export function applyMagnetEffect(
  paddle: PaddleData,
  active: boolean
): void {
  paddle.magnetActive = active
}

export function applyMagnetPull(
  paddle: PaddleData,
  ballX: number,
  ballY: number,
  ballDy: number
): number | null {
  if (!paddle.magnetActive || ballDy < 0) return null

  const distY = paddle.y - ballY
  if (distY > 100 || distY < 0) return null

  const distX = paddle.x - ballX
  const pullStrength = 0.15 * (1 - distY / 100)
  return distX * pullStrength
}

export function updateShootCooldown(paddle: PaddleData): void {
  if (paddle.shootCooldown > 0) {
    paddle.shootCooldown--
  }
}

export function canShoot(paddle: PaddleData): boolean {
  return paddle.shootCooldown <= 0
}

export function resetShootCooldown(paddle: PaddleData): void {
  paddle.shootCooldown = 12
}
