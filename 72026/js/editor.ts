import { saveCustomLevel, type CustomLevel } from './storage'

const GRID_COLS = 12
const GRID_ROWS = 10

let selectedType = 1
let isDrawing = false
const grid: number[][] = []

const brickGrid = document.getElementById('brickGrid') as HTMLDivElement
const clearBtn = document.getElementById('clearBtn') as HTMLButtonElement
const testBtn = document.getElementById('testBtn') as HTMLButtonElement
const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement
const levelNameInput = document.getElementById('level-name-input') as HTMLInputElement

const paletteItems = document.querySelectorAll('.palette-item')
paletteItems.forEach((item) => {
  item.addEventListener('click', () => {
    paletteItems.forEach((p) => p.classList.remove('selected'))
    item.classList.add('selected')
    selectedType = parseInt((item as HTMLElement).dataset.type || '1', 10)
  })
})

function initGrid(): void {
  grid.length = 0
  for (let r = 0; r < GRID_ROWS; r++) {
    grid[r] = []
    for (let c = 0; c < GRID_COLS; c++) {
      grid[r][c] = 0
    }
  }
  renderGrid()
}

function renderGrid(): void {
  if (!brickGrid) return
  brickGrid.innerHTML = ''
  brickGrid.style.gridTemplateColumns = `repeat(${GRID_COLS}, 56px)`

  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const cell = document.createElement('div')
      cell.className = `grid-cell${grid[r][c] > 0 ? ` brick-${grid[r][c]}` : ''}`
      cell.dataset.row = String(r)
      cell.dataset.col = String(c)

      if (grid[r][c] === 2) {
        const label = document.createElement('span')
        label.className = 'hp-label'
        label.textContent = '2'
        cell.appendChild(label)
      } else if (grid[r][c] === 3) {
        const label = document.createElement('span')
        label.className = 'hp-label'
        label.textContent = '3'
        cell.appendChild(label)
      } else if (grid[r][c] === 4) {
        const label = document.createElement('span')
        label.className = 'hp-label'
        label.textContent = '💥'
        cell.appendChild(label)
      } else if (grid[r][c] === 5) {
        const label = document.createElement('span')
        label.className = 'hp-label'
        label.textContent = '🔒'
        cell.appendChild(label)
      }

      cell.addEventListener('mousedown', (e) => {
        e.preventDefault()
        isDrawing = true
        setCell(r, c)
      })
      cell.addEventListener('mouseenter', () => {
        if (isDrawing) {
          setCell(r, c)
        }
      })

      brickGrid.appendChild(cell)
    }
  }
}

function setCell(row: number, col: number): void {
  grid[row][col] = selectedType
  renderGrid()
}

document.addEventListener('mouseup', () => {
  isDrawing = false
})

function clearGrid(): void {
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      grid[r][c] = 0
    }
  }
  renderGrid()
}

function testLevel(): void {
  const levelData = JSON.stringify(grid)
  localStorage.setItem('bb_test_level', levelData)
  localStorage.setItem('bb_test_name', levelNameInput.value || '测试关卡')
  window.location.href = './?test=1'
}

function saveLevel(): void {
  const name = levelNameInput.value.trim() || '未命名关卡'
  const newLevel: CustomLevel = {
    id: `custom_${Date.now()}`,
    name,
    author: '玩家',
    grid: JSON.parse(JSON.stringify(grid)),
    createdAt: Date.now(),
  }
  saveCustomLevel(newLevel)
  alert('关卡已保存！')
}

if (clearBtn) clearBtn.addEventListener('click', clearGrid)
if (testBtn) testBtn.addEventListener('click', testLevel)
if (saveBtn) saveBtn.addEventListener('click', saveLevel)

initGrid()
