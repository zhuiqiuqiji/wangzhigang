import { LEVEL_DEFS } from './levels'
import { getLevelProgress } from './storage'

const levelGrid = document.getElementById('levelGrid') as HTMLDivElement

function renderLevelGrid(): void {
  if (!levelGrid) return
  levelGrid.innerHTML = ''

  for (const levelDef of LEVEL_DEFS) {
    const progress = getLevelProgress(levelDef.id)
    const card = document.createElement('div')
    card.className = `level-card${progress.unlocked ? '' : ' locked'}${levelDef.hasBoss ? ' boss' : ''}`

    if (progress.unlocked) {
      card.onclick = () => {
        location.href = `./?level=${levelDef.id}`
      }
    }

    card.innerHTML = `
      ${progress.unlocked ? '' : '<div class="lock-icon">🔒</div>'}
      <div class="level-num">${String(levelDef.id).padStart(2, '0')}</div>
      <div class="level-name">${levelDef.name}${levelDef.hasBoss ? ' 👾' : ''}</div>
      ${progress.unlocked ? `
        <div class="stars">
          ${progress.stars >= 1 ? '⭐' : '<span class="empty">☆</span>'}
          ${progress.stars >= 2 ? '⭐' : '<span class="empty">☆</span>'}
          ${progress.stars >= 3 ? '⭐' : '<span class="empty">☆</span>'}
        </div>
        <div class="high-score">${progress.highScore > 0 ? `最高分: ${progress.highScore}` : ''}</div>
      ` : ''}
    `

    levelGrid.appendChild(card)
  }
}

renderLevelGrid()
