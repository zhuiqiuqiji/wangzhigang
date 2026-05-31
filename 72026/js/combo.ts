export interface ComboSystem {
  multiplier: number
  comboCount: number
  maxCombo: number
  lastHitTime: number
  comboTimeout: number
  displayX: number
  displayY: number
  displayScale: number
  displayAlpha: number
  displayComboNum: number
}

export function createComboSystem(canvasWidth: number, canvasHeight: number): ComboSystem {
  return {
    multiplier: 1,
    comboCount: 0,
    maxCombo: 0,
    lastHitTime: 0,
    comboTimeout: 90,
    displayX: canvasWidth / 2,
    displayY: canvasHeight * 0.35,
    displayScale: 1,
    displayAlpha: 0,
    displayComboNum: 0,
  }
}

export function addCombo(combo: ComboSystem, currentFrame: number): void {
  combo.comboCount++
  combo.lastHitTime = currentFrame

  if (combo.comboCount >= combo.maxCombo) {
    combo.maxCombo = combo.comboCount
  }

  if (combo.comboCount >= 3) {
    combo.multiplier = 1 + Math.floor((combo.comboCount - 2) / 3) * 0.5
  } else {
    combo.multiplier = 1
  }

  combo.displayComboNum = combo.comboCount
  combo.displayScale = 1.5
  combo.displayAlpha = 1
}

export function updateCombo(combo: ComboSystem, currentFrame: number): void {
  if (currentFrame - combo.lastHitTime > combo.comboTimeout && combo.comboCount > 0) {
    combo.comboCount = 0
    combo.multiplier = 1
  }

  if (combo.displayScale > 1) {
    combo.displayScale = 1 + (combo.displayScale - 1) * 0.9
  }
  if (combo.displayAlpha > 0 && combo.comboCount === 0) {
    combo.displayAlpha *= 0.95
    if (combo.displayAlpha < 0.01) combo.displayAlpha = 0
  }
}

export function getComboColor(comboCount: number): string {
  if (comboCount >= 30) return '#ffd700'
  if (comboCount >= 20) return '#ff4444'
  if (comboCount >= 15) return '#ff8800'
  if (comboCount >= 10) return '#00ff88'
  if (comboCount >= 5) return '#00d4ff'
  return '#888888'
}

export function getComboGlowColor(comboCount: number): string {
  if (comboCount >= 30) return 'rgba(255,215,0,0.6)'
  if (comboCount >= 20) return 'rgba(255,68,68,0.5)'
  if (comboCount >= 15) return 'rgba(255,136,0,0.5)'
  if (comboCount >= 10) return 'rgba(0,255,136,0.5)'
  if (comboCount >= 5) return 'rgba(0,212,255,0.4)'
  return 'rgba(136,136,136,0.3)'
}
