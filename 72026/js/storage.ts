const STORAGE_KEYS = {
  UNLOCKED: 'bb_unlocked_levels',
  SCORES: 'bb_level_scores',
  STARS: 'bb_level_stars',
  CUSTOM: 'bb_custom_levels',
  PLAYER: 'bb_player_name',
}

export interface LevelProgress {
  unlocked: boolean
  highScore: number
  stars: number
}

export interface CustomLevel {
  id: string
  name: string
  author: string
  grid: number[][]
  createdAt: number
}

export interface LeaderboardEntry {
  name: string
  score: number
  date: number
}

function safeGet<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return defaultValue
    return JSON.parse(raw) as T
  } catch {
    return defaultValue
  }
}

function safeSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    console.warn('Failed to save to localStorage')
  }
}

export function getLevelProgress(levelId: number): LevelProgress {
  const unlocked = safeGet<number[]>(STORAGE_KEYS.UNLOCKED, [1])
  const scores = safeGet<Record<string, number>>(STORAGE_KEYS.SCORES, {})
  const stars = safeGet<Record<string, number>>(STORAGE_KEYS.STARS, {})

  return {
    unlocked: unlocked.includes(levelId),
    highScore: scores[String(levelId)] || 0,
    stars: stars[String(levelId)] || 0,
  }
}

export function unlockLevel(levelId: number): void {
  const unlocked = safeGet<number[]>(STORAGE_KEYS.UNLOCKED, [1])
  if (!unlocked.includes(levelId)) {
    unlocked.push(levelId)
    safeSet(STORAGE_KEYS.UNLOCKED, unlocked)
  }
}

export function saveLevelScore(levelId: number, score: number, stars: number): void {
  const scores = safeGet<Record<string, number>>(STORAGE_KEYS.SCORES, {})
  const starsMap = safeGet<Record<string, number>>(STORAGE_KEYS.STARS, {})

  if (score > (scores[String(levelId)] || 0)) {
    scores[String(levelId)] = score
    safeSet(STORAGE_KEYS.SCORES, scores)
  }
  if (stars > (starsMap[String(levelId)] || 0)) {
    starsMap[String(levelId)] = stars
    safeSet(STORAGE_KEYS.STARS, starsMap)
  }
}

export function getPlayerName(): string {
  return safeGet<string>(STORAGE_KEYS.PLAYER, '匿名玩家')
}

export function savePlayerName(name: string): void {
  safeSet(STORAGE_KEYS.PLAYER, name)
}

export function getCustomLevels(): CustomLevel[] {
  return safeGet<CustomLevel[]>(STORAGE_KEYS.CUSTOM, [])
}

export function saveCustomLevel(level: CustomLevel): void {
  const levels = getCustomLevels()
  const existing = levels.findIndex(l => l.id === level.id)
  if (existing >= 0) {
    levels[existing] = level
  } else {
    levels.push(level)
  }
  safeSet(STORAGE_KEYS.CUSTOM, levels)
}

export function deleteCustomLevel(id: string): void {
  const levels = getCustomLevels().filter(l => l.id !== id)
  safeSet(STORAGE_KEYS.CUSTOM, levels)
}

export function calculateStars(_score: number, lives: number, maxCombo: number): number {
  let stars = 1
  if (lives >= 2) stars = 2
  if (lives >= 3 && maxCombo >= 10) stars = 3
  return stars
}
