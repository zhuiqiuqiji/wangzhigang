export type GameStatus = 'idle' | 'playing' | 'won' | 'lost'

export interface GameState {
  status: GameStatus
  score: number
  lives: number
  level: number
  maxLives: number
  ballLaunched: boolean
}

export function createGameState(): GameState {
  return {
    status: 'idle',
    score: 0,
    lives: 3,
    level: 1,
    maxLives: 3,
    ballLaunched: false,
  }
}

export function addScore(state: GameState, points: number): void {
  state.score += points
}

export function loseLife(state: GameState): boolean {
  state.lives--
  return state.lives <= 0
}

export function resetForNewGame(state: GameState): void {
  state.status = 'playing'
  state.score = 0
  state.lives = state.maxLives
  state.level = 1
  state.ballLaunched = false
}

export function resetBallOnPaddle(state: GameState): void {
  state.ballLaunched = false
}
