export interface BallData {
  x: number
  y: number
  dx: number
  dy: number
  radius: number
  speed: number
  baseSpeed: number
  pierce: boolean
  trail: { x: number; y: number; alpha: number }[]
}

export function createBall(
  canvasWidth: number,
  paddleY: number,
  paddleHeight: number
): BallData {
  return {
    x: canvasWidth / 2,
    y: paddleY - paddleHeight / 2 - 12,
    dx: 0,
    dy: 0,
    radius: 8,
    speed: 5.5,
    baseSpeed: 5.5,
    pierce: false,
    trail: [],
  }
}

export function launchBall(
  ball: BallData,
  paddleX: number
): void {
  const offset = (ball.x - paddleX) / 80
  const angle = -Math.PI / 2 + offset * (Math.PI / 5)
  ball.dx = ball.speed * Math.cos(angle)
  ball.dy = ball.speed * Math.sin(angle)
}

export function resetBall(
  ball: BallData,
  canvasWidth: number,
  paddleY: number,
  paddleHeight: number
): void {
  ball.x = canvasWidth / 2
  ball.y = paddleY - paddleHeight / 2 - ball.radius - 2
  ball.dx = 0
  ball.dy = 0
  ball.speed = ball.baseSpeed
  ball.pierce = false
  ball.trail = []
}

export function updateBall(ball: BallData): void {
  ball.trail.unshift({ x: ball.x, y: ball.y, alpha: 1 })
  if (ball.trail.length > 8) ball.trail.pop()
  for (const t of ball.trail) {
    t.alpha *= 0.85
  }

  ball.x += ball.dx
  ball.y += ball.dy
}

export function cloneBall(ball: BallData, angleOffset: number): BallData {
  const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy)
  const currentAngle = Math.atan2(ball.dy, ball.dx)
  const newAngle = currentAngle + angleOffset

  return {
    x: ball.x,
    y: ball.y,
    dx: speed * Math.cos(newAngle),
    dy: speed * Math.sin(newAngle),
    radius: ball.radius,
    speed: ball.speed,
    baseSpeed: ball.baseSpeed,
    pierce: ball.pierce,
    trail: [],
  }
}

export function applySlowEffect(balls: BallData[], active: boolean): void {
  for (const ball of balls) {
    const targetSpeed = active ? ball.baseSpeed * 0.5 : ball.baseSpeed
    const ratio = targetSpeed / ball.speed
    ball.dx *= ratio
    ball.dy *= ratio
    ball.speed = targetSpeed
  }
}

export function applyPierceEffect(balls: BallData[], active: boolean): void {
  for (const ball of balls) {
    ball.pierce = active
  }
}
