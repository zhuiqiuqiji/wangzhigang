const TILE = {
  EMPTY: 0,
  WALL: 1,
  TARGET: 2,
  BOX: 3,
  PLAYER: 4,
  BOX_ON_TARGET: 5,
  PLAYER_ON_TARGET: 6
};

const THEMES = {
  DEFAULT: 'default',
  FOREST: 'forest',
  WAREHOUSE: 'warehouse',
  SPACE: 'space'
};

const gameState = {
  currentLevel: 0,
  moves: 0,
  map: [],
  playerPos: { x: 0, y: 0 },
  history: [],
  redoStack: [],
  moveHistory: [],
  isComplete: false,
  isPlaying: false,
  currentTheme: THEMES.DEFAULT,
  editorMode: false,
  editorMap: [],
  editorSelectedTool: TILE.WALL,
  editorDragging: false,
  isCustomLevel: false,
  customLevelData: null
};

const solverState = {
  isSolving: false,
  solution: [],
  solvingProgress: 0
};

function deepCopy(arr) {
  return arr.map(row => [...row]);
}

function stateToKey(map, playerPos) {
  let key = playerPos.x + ',' + playerPos.y + '|';
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) {
      const tile = map[y][x];
      if (tile === TILE.BOX || tile === TILE.BOX_ON_TARGET) {
        key += x + ',' + y + ';';
      }
    }
  }
  return key;
}

function isWinState(map) {
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) {
      if (map[y][x] === TILE.BOX) {
        return false;
      }
    }
  }
  return true;
}

function getPlayerPosition(map) {
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) {
      if (map[y][x] === TILE.PLAYER || map[y][x] === TILE.PLAYER_ON_TARGET) {
        return { x, y };
      }
    }
  }
  return null;
}

function solveBFS(initialMap, maxIterations = 100000) {
  const map = deepCopy(initialMap);
  const playerPos = getPlayerPosition(map);
  if (!playerPos) return { success: false, moves: [] };

  const directions = [
    { dx: 0, dy: -1, move: 'U' },
    { dx: 0, dy: 1, move: 'D' },
    { dx: -1, dy: 0, move: 'L' },
    { dx: 1, dy: 0, move: 'R' }
  ];

  const queue = [{
    map: map,
    playerPos: { ...playerPos },
    moves: []
  }];

  const visited = new Set();
  visited.add(stateToKey(map, playerPos));

  let iterations = 0;

  while (queue.length > 0 && iterations < maxIterations) {
    iterations++;
    
    if (iterations % 1000 === 0) {
      solverState.solvingProgress = Math.min(100, Math.floor((iterations / maxIterations) * 100));
    }

    const current = queue.shift();

    if (isWinState(current.map)) {
      return { success: true, moves: current.moves };
    }

    for (const dir of directions) {
      const newMap = deepCopy(current.map);
      const { x, y } = current.playerPos;
      const newX = x + dir.dx;
      const newY = y + dir.dy;

      if (newY < 0 || newY >= newMap.length || newX < 0 || newX >= newMap[0].length) {
        continue;
      }

      const targetTile = newMap[newY][newX];

      if (targetTile === TILE.WALL) {
        continue;
      }

      let canMove = true;

      if (targetTile === TILE.BOX || targetTile === TILE.BOX_ON_TARGET) {
        const boxNewX = newX + dir.dx;
        const boxNewY = newY + dir.dy;

        if (boxNewY < 0 || boxNewY >= newMap.length || boxNewX < 0 || boxNewX >= newMap[0].length) {
          canMove = false;
        } else {
          const boxTargetTile = newMap[boxNewY][boxNewX];
          if (boxTargetTile === TILE.WALL || boxTargetTile === TILE.BOX || boxTargetTile === TILE.BOX_ON_TARGET) {
            canMove = false;
          } else {
            if (boxTargetTile === TILE.TARGET) {
              newMap[boxNewY][boxNewX] = TILE.BOX_ON_TARGET;
            } else {
              newMap[boxNewY][boxNewX] = TILE.BOX;
            }

            if (targetTile === TILE.BOX_ON_TARGET) {
              newMap[newY][newX] = TILE.PLAYER_ON_TARGET;
            } else {
              newMap[newY][newX] = TILE.PLAYER;
            }
          }
        }
      } else {
        if (targetTile === TILE.TARGET) {
          newMap[newY][newX] = TILE.PLAYER_ON_TARGET;
        } else {
          newMap[newY][newX] = TILE.PLAYER;
        }
      }

      if (!canMove) continue;

      const currentTile = newMap[y][x];
      if (currentTile === TILE.PLAYER_ON_TARGET) {
        newMap[y][x] = TILE.TARGET;
      } else {
        newMap[y][x] = TILE.EMPTY;
      }

      const newPlayerPos = { x: newX, y: newY };
      const stateKey = stateToKey(newMap, newPlayerPos);

      if (!visited.has(stateKey)) {
        visited.add(stateKey);
        queue.push({
          map: newMap,
          playerPos: newPlayerPos,
          moves: [...current.moves, dir.move]
        });
      }
    }
  }

  return { success: false, moves: [] };
}

function solveDFS(initialMap, maxDepth = 50) {
  const map = deepCopy(initialMap);
  const playerPos = getPlayerPosition(map);
  if (!playerPos) return { success: false, moves: [] };

  const directions = [
    { dx: 0, dy: -1, move: 'U' },
    { dx: 0, dy: 1, move: 'D' },
    { dx: -1, dy: 0, move: 'L' },
    { dx: 1, dy: 0, move: 'R' }
  ];

  const visited = new Set();
  let solution = null;
  let nodesExplored = 0;

  function dfs(currentMap, currentPlayerPos, moves, depth) {
    nodesExplored++;
    
    if (nodesExplored % 1000 === 0) {
      solverState.solvingProgress = Math.min(100, Math.floor((nodesExplored / 50000) * 100));
    }

    if (depth > maxDepth || solution !== null) return;
    if (isWinState(currentMap)) {
      solution = [...moves];
      return;
    }

    const stateKey = stateToKey(currentMap, currentPlayerPos) + '|' + depth;
    if (visited.has(stateKey)) return;
    visited.add(stateKey);

    for (const dir of directions) {
      const newMap = deepCopy(currentMap);
      const { x, y } = currentPlayerPos;
      const newX = x + dir.dx;
      const newY = y + dir.dy;

      if (newY < 0 || newY >= newMap.length || newX < 0 || newX >= newMap[0].length) {
        continue;
      }

      const targetTile = newMap[newY][newX];

      if (targetTile === TILE.WALL) {
        continue;
      }

      let canMove = true;

      if (targetTile === TILE.BOX || targetTile === TILE.BOX_ON_TARGET) {
        const boxNewX = newX + dir.dx;
        const boxNewY = newY + dir.dy;

        if (boxNewY < 0 || boxNewY >= newMap.length || boxNewX < 0 || boxNewX >= newMap[0].length) {
          canMove = false;
        } else {
          const boxTargetTile = newMap[boxNewY][boxNewX];
          if (boxTargetTile === TILE.WALL || boxTargetTile === TILE.BOX || boxTargetTile === TILE.BOX_ON_TARGET) {
            canMove = false;
          } else {
            if (boxTargetTile === TILE.TARGET) {
              newMap[boxNewY][boxNewX] = TILE.BOX_ON_TARGET;
            } else {
              newMap[boxNewY][boxNewX] = TILE.BOX;
            }

            if (targetTile === TILE.BOX_ON_TARGET) {
              newMap[newY][newX] = TILE.PLAYER_ON_TARGET;
            } else {
              newMap[newY][newX] = TILE.PLAYER;
            }
          }
        }
      } else {
        if (targetTile === TILE.TARGET) {
          newMap[newY][newX] = TILE.PLAYER_ON_TARGET;
        } else {
          newMap[newY][newX] = TILE.PLAYER;
        }
      }

      if (!canMove) continue;

      const currentTile = newMap[y][x];
      if (currentTile === TILE.PLAYER_ON_TARGET) {
        newMap[y][x] = TILE.TARGET;
      } else {
        newMap[y][x] = TILE.EMPTY;
      }

      const newPlayerPos = { x: newX, y: newY };
      dfs(newMap, newPlayerPos, [...moves, dir.move], depth + 1);
      
      if (solution !== null) return;
    }
  }

  dfs(map, playerPos, [], 0);

  return { success: solution !== null, moves: solution || [] };
}

async function solveLevel(algorithm = 'BFS') {
  if (solverState.isSolving) return;
  
  solverState.isSolving = true;
  solverState.solvingProgress = 0;
  solverState.solution = [];
  
  showToast('正在求解中...');
  
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const level = LEVELS[gameState.currentLevel];
  let result;
  
  if (algorithm === 'BFS') {
    result = solveBFS(level.map);
  } else {
    result = solveDFS(level.map, 60);
  }
  
  solverState.isSolving = false;
  solverState.solvingProgress = 100;
  
  if (result.success) {
    solverState.solution = result.moves;
    showToast(`找到最优解！共 ${result.moves.length} 步`);
    return result.moves;
  } else {
    showToast('未找到解法，请尝试其他算法或简化关卡');
    return [];
  }
}

async function playSolution(moves, speed = 300) {
  if (gameState.isPlaying || moves.length === 0) return;
  
  gameState.isPlaying = true;
  resetLevel();
  gameState.isPlaying = true;
  
  const moveMap = {
    'U': { dx: 0, dy: -1 },
    'D': { dx: 0, dy: 1 },
    'L': { dx: -1, dy: 0 },
    'R': { dx: 1, dy: 0 }
  };
  
  for (let i = 0; i < moves.length; i++) {
    if (!gameState.isPlaying) break;
    
    const move = moves[i];
    const { dx, dy } = moveMap[move];
    movePlayer(dx, dy, true);
    
    await new Promise(resolve => setTimeout(resolve, speed));
  }
  
  gameState.isPlaying = false;
}

function stopPlayback() {
  gameState.isPlaying = false;
}

async function replayMoves(speed = 300) {
  if (gameState.isPlaying || gameState.moveHistory.length === 0) return;
  
  gameState.isPlaying = true;
  const moves = [...gameState.moveHistory];
  resetLevel();
  gameState.isPlaying = true;
  
  const moveMap = {
    'U': { dx: 0, dy: -1 },
    'D': { dx: 0, dy: 1 },
    'L': { dx: -1, dy: 0 },
    'R': { dx: 1, dy: 0 }
  };
  
  for (let i = 0; i < moves.length; i++) {
    if (!gameState.isPlaying) break;
    
    const move = moves[i];
    const { dx, dy } = moveMap[move];
    movePlayer(dx, dy, true);
    
    await new Promise(resolve => setTimeout(resolve, speed));
  }
  
  gameState.isPlaying = false;
}

function initGame(levelIndex = 0, useCustomMap = null) {
  if (useCustomMap) {
    gameState.isCustomLevel = true;
    gameState.customLevelData = useCustomMap;
    gameState.currentLevel = levelIndex;
    gameState.moves = 0;
    gameState.map = deepCopy(useCustomMap.map);
    gameState.history = [];
    gameState.redoStack = [];
    gameState.moveHistory = [];
    gameState.isComplete = false;
    gameState.isPlaying = false;
    solverState.solution = [];
    
    let playerFound = false;
    for (let y = 0; y < gameState.map.length && !playerFound; y++) {
      for (let x = 0; x < gameState.map[y].length; x++) {
        if (gameState.map[y][x] === TILE.PLAYER || gameState.map[y][x] === TILE.PLAYER_ON_TARGET) {
          gameState.playerPos = { x, y };
          playerFound = true;
          break;
        }
      }
    }
    
    renderGame();
    updateStatus();
    return;
  }
  
  gameState.isCustomLevel = false;
  gameState.customLevelData = null;
  
  if (levelIndex >= LEVELS.length) {
    levelIndex = 0;
  }
  
  const level = LEVELS[levelIndex];
  gameState.currentLevel = levelIndex;
  gameState.moves = 0;
  gameState.map = deepCopy(level.map);
  gameState.history = [];
  gameState.redoStack = [];
  gameState.moveHistory = [];
  gameState.isComplete = false;
  gameState.isPlaying = false;
  solverState.solution = [];
  
  let playerFound = false;
  for (let y = 0; y < gameState.map.length && !playerFound; y++) {
    for (let x = 0; x < gameState.map[y].length; x++) {
      if (gameState.map[y][x] === TILE.PLAYER || gameState.map[y][x] === TILE.PLAYER_ON_TARGET) {
        gameState.playerPos = { x, y };
        playerFound = true;
        break;
      }
    }
  }
  
  renderGame();
  updateStatus();
}

function saveState() {
  gameState.history.push({
    map: deepCopy(gameState.map),
    playerPos: { ...gameState.playerPos },
    moves: gameState.moves
  });
  gameState.redoStack = [];
}

function undo() {
  if (gameState.isPlaying) {
    stopPlayback();
    return;
  }
  
  if (gameState.isComplete) {
    showToast('通关后无法撤销，请重置关卡或进入下一关');
    return;
  }
  
  if (gameState.history.length === 0) {
    showToast('没有可撤销的步骤');
    return;
  }
  
  const prevState = gameState.history.pop();
  gameState.redoStack.push({
    map: deepCopy(gameState.map),
    playerPos: { ...gameState.playerPos },
    moves: gameState.moves
  });
  
  gameState.map = prevState.map;
  gameState.playerPos = prevState.playerPos;
  gameState.moves = prevState.moves;
  
  if (gameState.moveHistory.length > 0) {
    gameState.moveHistory.pop();
  }
  
  renderGame();
  updateStatus();
}

function redo() {
  if (gameState.isPlaying) {
    stopPlayback();
    return;
  }
  
  if (gameState.isComplete) {
    showToast('通关后无法重做');
    return;
  }
  
  if (gameState.redoStack.length === 0) {
    showToast('没有可重做的步骤');
    return;
  }
  
  const nextState = gameState.redoStack.pop();
  gameState.history.push({
    map: deepCopy(gameState.map),
    playerPos: { ...gameState.playerPos },
    moves: gameState.moves
  });
  
  gameState.map = nextState.map;
  gameState.playerPos = nextState.playerPos;
  gameState.moves = nextState.moves;
  
  renderGame();
  updateStatus();
}

function movePlayer(dx, dy, silent = false) {
  if (gameState.isComplete) return;
  if (gameState.isPlaying && !silent) return;
  
  const { x, y } = gameState.playerPos;
  const newX = x + dx;
  const newY = y + dy;
  
  if (newY < 0 || newY >= gameState.map.length || newX < 0 || newX >= gameState.map[0].length) {
    return;
  }
  
  const targetTile = gameState.map[newY][newX];
  
  if (targetTile === TILE.WALL) {
    return;
  }
  
  let moveChar = '';
  if (dx === 0 && dy === -1) moveChar = 'U';
  else if (dx === 0 && dy === 1) moveChar = 'D';
  else if (dx === -1 && dy === 0) moveChar = 'L';
  else if (dx === 1 && dy === 0) moveChar = 'R';
  
  if (targetTile === TILE.BOX || targetTile === TILE.BOX_ON_TARGET) {
    const boxNewX = newX + dx;
    const boxNewY = newY + dy;
    
    if (boxNewY < 0 || boxNewY >= gameState.map.length || boxNewX < 0 || boxNewX >= gameState.map[0].length) {
      return;
    }
    
    const boxTargetTile = gameState.map[boxNewY][boxNewX];
    if (boxTargetTile === TILE.WALL || boxTargetTile === TILE.BOX || boxTargetTile === TILE.BOX_ON_TARGET) {
      return;
    }
    
    saveState();
    
    if (boxTargetTile === TILE.TARGET) {
      gameState.map[boxNewY][boxNewX] = TILE.BOX_ON_TARGET;
    } else {
      gameState.map[boxNewY][boxNewX] = TILE.BOX;
    }
    
    if (targetTile === TILE.BOX_ON_TARGET) {
      gameState.map[newY][newX] = TILE.PLAYER_ON_TARGET;
    } else {
      gameState.map[newY][newX] = TILE.PLAYER;
    }
  } else {
    saveState();
    
    if (targetTile === TILE.TARGET) {
      gameState.map[newY][newX] = TILE.PLAYER_ON_TARGET;
    } else {
      gameState.map[newY][newX] = TILE.PLAYER;
    }
  }
  
  const currentTile = gameState.map[y][x];
  if (currentTile === TILE.PLAYER_ON_TARGET) {
    gameState.map[y][x] = TILE.TARGET;
  } else {
    gameState.map[y][x] = TILE.EMPTY;
  }
  
  gameState.playerPos = { x: newX, y: newY };
  gameState.moves++;
  
  if (!silent) {
    gameState.moveHistory.push(moveChar);
  }
  
  renderGame();
  updateStatus();
  checkWin();
}

function checkWin() {
  for (let y = 0; y < gameState.map.length; y++) {
    for (let x = 0; x < gameState.map[y].length; x++) {
      if (gameState.map[y][x] === TILE.BOX) {
        return;
      }
    }
  }
  
  gameState.isComplete = true;
  showWinModal();
}

function showWinModal() {
  const modal = document.getElementById('win-modal');
  const nextBtn = document.getElementById('next-level-btn');
  const modalNextBtn = document.getElementById('modal-next-btn');
  const finalMoves = document.getElementById('final-moves');
  
  nextBtn.disabled = gameState.currentLevel >= LEVELS.length - 1;
  modalNextBtn.disabled = gameState.currentLevel >= LEVELS.length - 1;
  finalMoves.textContent = gameState.moves;
  
  modal.classList.add('show');
}

function hideWinModal() {
  const modal = document.getElementById('win-modal');
  modal.classList.remove('show');
}

function nextLevel() {
  hideWinModal();
  if (gameState.currentLevel < LEVELS.length - 1) {
    initGame(gameState.currentLevel + 1);
  }
}

function prevLevel() {
  hideWinModal();
  if (gameState.currentLevel > 0) {
    initGame(gameState.currentLevel - 1);
  }
}

function resetLevel() {
  hideWinModal();
  stopPlayback();
  if (gameState.isCustomLevel && gameState.customLevelData) {
    initGame(gameState.currentLevel, gameState.customLevelData);
  } else {
    initGame(gameState.currentLevel);
  }
}

function goToLevel(index) {
  if (index >= 0 && index < LEVELS.length) {
    hideWinModal();
    stopPlayback();
    initGame(index);
  }
}

function getCellClass(tile) {
  switch (tile) {
    case TILE.EMPTY:
      return 'cell-empty';
    case TILE.WALL:
      return 'cell-wall';
    case TILE.TARGET:
      return 'cell-target';
    case TILE.BOX:
      return 'cell-box';
    case TILE.PLAYER:
      return 'cell-player';
    case TILE.BOX_ON_TARGET:
      return 'cell-box-on-target';
    case TILE.PLAYER_ON_TARGET:
      return 'cell-player-on-target';
    default:
      return 'cell-empty';
  }
}

function getCellSize() {
  const isMobile = window.innerWidth <= 600;
  return isMobile ? 40 : 50;
}

function getCellContent(tile, cellSize = 50) {
  if (tile === TILE.PLAYER || tile === TILE.PLAYER_ON_TARGET) {
    const playerSize = cellSize * 0.72;
    const fontSize = cellSize * 0.4;
    return `<div class="player" style="width: ${playerSize}px; height: ${playerSize}px; font-size: ${fontSize}px;"></div>`;
  }
  return '';
}

function renderGame() {
  const board = document.getElementById('game-board');
  if (!board) return;
  
  const map = gameState.editorMode ? gameState.editorMap : gameState.map;
  const rows = map.length;
  const cols = map[0].length;
  const cellSize = getCellSize();
  
  board.style.gridTemplateColumns = `repeat(${cols}, ${cellSize}px)`;
  board.style.gridAutoRows = `${cellSize}px`;
  board.innerHTML = '';
  
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const cell = document.createElement('div');
      const tile = map[y][x];
      cell.className = `cell ${getCellClass(tile)}`;
      cell.innerHTML = getCellContent(tile, cellSize);
      cell.dataset.x = x;
      cell.dataset.y = y;
      
      if (gameState.editorMode) {
        cell.addEventListener('click', () => handleEditorCellClick(x, y));
        cell.addEventListener('mousedown', (e) => {
          e.preventDefault();
          gameState.editorDragging = true;
          handleEditorCellClick(x, y);
        });
      }
      
      board.appendChild(cell);
    }
  }
}

function updateStatus() {
  document.getElementById('level-num').textContent = gameState.currentLevel + 1;
  document.getElementById('move-count').textContent = gameState.moves;
  
  if (gameState.isCustomLevel && gameState.customLevelData) {
    document.getElementById('level-name').textContent = gameState.customLevelData.name;
    document.getElementById('level-difficulty').textContent = gameState.customLevelData.difficulty;
  } else {
    document.getElementById('level-name').textContent = LEVELS[gameState.currentLevel].name;
    document.getElementById('level-difficulty').textContent = LEVELS[gameState.currentLevel].difficulty;
  }
  
  const undoBtn = document.getElementById('undo-btn');
  const redoBtn = document.getElementById('redo-btn');
  if (undoBtn) undoBtn.disabled = gameState.history.length === 0 || gameState.isComplete;
  if (redoBtn) redoBtn.disabled = gameState.redoStack.length === 0 || gameState.isComplete;
}

function handleKeydown(e) {
  if (gameState.editorMode) return;
  
  switch (e.key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      e.preventDefault();
      movePlayer(0, -1);
      break;
    case 'ArrowDown':
    case 's':
    case 'S':
      e.preventDefault();
      movePlayer(0, 1);
      break;
    case 'ArrowLeft':
    case 'a':
    case 'A':
      e.preventDefault();
      movePlayer(-1, 0);
      break;
    case 'ArrowRight':
    case 'd':
    case 'D':
      e.preventDefault();
      movePlayer(1, 0);
      break;
    case 'z':
    case 'Z':
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
      break;
    case 'y':
    case 'Y':
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        redo();
      }
      break;
    case 'r':
    case 'R':
      e.preventDefault();
      if (!e.ctrlKey && !e.metaKey) {
        resetLevel();
      }
      break;
  }
}

function showToast(message) {
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }
  
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 10);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

function setTheme(theme) {
  const body = document.body;
  body.className = body.className.replace(/theme-\w+/g, '');
  body.classList.add(`theme-${theme}`);
  gameState.currentTheme = theme;
  localStorage.setItem('sokoban-theme', theme);
  showToast(`已切换到${getThemeName(theme)}主题`);
}

function getThemeName(theme) {
  const names = {
    [THEMES.DEFAULT]: '默认',
    [THEMES.FOREST]: '森林',
    [THEMES.WAREHOUSE]: '仓库',
    [THEMES.SPACE]: '太空'
  };
  return names[theme] || '默认';
}

function initEditor() {
  const level = LEVELS[gameState.currentLevel];
  gameState.editorMap = deepCopy(level.map);
  gameState.editorMode = true;
  gameState.editorDragging = false;
  
  document.getElementById('game-view').classList.add('hidden');
  document.getElementById('editor-view').classList.remove('hidden');
  document.getElementById('editor-btn').textContent = '🎮 返回游戏';
  
  renderGame();
  renderEditorToolbar();
}

function exitEditor() {
  gameState.editorMode = false;
  document.getElementById('game-view').classList.remove('hidden');
  document.getElementById('editor-view').classList.add('hidden');
  document.getElementById('editor-btn').textContent = '🛠️ 关卡编辑器';
  
  renderGame();
  updateStatus();
}

function toggleEditor() {
  stopPlayback();
  if (gameState.editorMode) {
    exitEditor();
  } else {
    initEditor();
  }
}

function handleEditorCellClick(x, y) {
  const currentTile = gameState.editorMap[y][x];
  let newTile = gameState.editorSelectedTool;
  
  if (currentTile === gameState.editorSelectedTool) {
    newTile = TILE.EMPTY;
  }
  
  gameState.editorMap[y][x] = newTile;
  renderGame();
}

function setEditorTool(tool) {
  gameState.editorSelectedTool = tool;
  renderEditorToolbar();
}

function renderEditorToolbar() {
  const tools = [
    { tile: TILE.WALL, icon: '🧱', name: '墙壁' },
    { tile: TILE.TARGET, icon: '🎯', name: '目标点' },
    { tile: TILE.BOX, icon: '📦', name: '箱子' },
    { tile: TILE.PLAYER, icon: '👤', name: '玩家' },
    { tile: TILE.EMPTY, icon: '🧹', name: '清除' }
  ];
  
  const toolbar = document.getElementById('editor-tools');
  if (!toolbar) return;
  
  toolbar.innerHTML = '';
  tools.forEach(tool => {
    const btn = document.createElement('button');
    btn.className = `editor-tool-btn ${gameState.editorSelectedTool === tool.tile ? 'active' : ''}`;
    btn.innerHTML = `${tool.icon} ${tool.name}`;
    btn.onclick = () => setEditorTool(tool.tile);
    toolbar.appendChild(btn);
  });
}

function resizeEditorMap(deltaRows, deltaCols) {
  const currentRows = gameState.editorMap.length;
  const currentCols = gameState.editorMap[0].length;
  const newRows = Math.max(5, Math.min(20, currentRows + deltaRows));
  const newCols = Math.max(5, Math.min(20, currentCols + deltaCols));
  
  const newMap = [];
  for (let y = 0; y < newRows; y++) {
    const row = [];
    for (let x = 0; x < newCols; x++) {
      if (y < currentRows && x < currentCols) {
        row.push(gameState.editorMap[y][x]);
      } else {
        row.push(TILE.EMPTY);
      }
    }
    newMap.push(row);
  }
  
  gameState.editorMap = newMap;
  renderGame();
}

function clearEditorMap() {
  if (!confirm('确定要清空地图吗？')) return;
  
  const rows = gameState.editorMap.length;
  const cols = gameState.editorMap[0].length;
  gameState.editorMap = Array(rows).fill(null).map(() => Array(cols).fill(TILE.EMPTY));
  renderGame();
}

function validateEditorMap() {
  let playerCount = 0;
  let boxCount = 0;
  let targetCount = 0;
  
  for (let y = 0; y < gameState.editorMap.length; y++) {
    for (let x = 0; x < gameState.editorMap[y].length; x++) {
      const tile = gameState.editorMap[y][x];
      if (tile === TILE.PLAYER || tile === TILE.PLAYER_ON_TARGET) {
        playerCount++;
      }
      if (tile === TILE.BOX || tile === TILE.BOX_ON_TARGET) {
        boxCount++;
      }
      if (tile === TILE.TARGET || tile === TILE.PLAYER_ON_TARGET || tile === TILE.BOX_ON_TARGET) {
        targetCount++;
      }
    }
  }
  
  const errors = [];
  if (playerCount === 0) errors.push('需要放置一个玩家');
  if (playerCount > 1) errors.push('只能有一个玩家');
  if (boxCount === 0) errors.push('至少需要一个箱子');
  if (targetCount === 0) errors.push('至少需要一个目标点');
  if (boxCount !== targetCount) errors.push(`箱子数量(${boxCount})必须等于目标点数量(${targetCount})`);
  
  return errors;
}

function testEditorLevel() {
  const errors = validateEditorMap();
  if (errors.length > 0) {
    showToast('错误: ' + errors.join('; '));
    return;
  }
  
  const testLevel = {
    name: '自定义关卡',
    difficulty: '自定义',
    map: deepCopy(gameState.editorMap)
  };
  
  exitEditor();
  initGame(gameState.currentLevel, testLevel);
  showToast('开始测试自定义关卡！');
}

function exportLevel() {
  const errors = validateEditorMap();
  if (errors.length > 0) {
    showToast('错误: ' + errors.join('; '));
    return;
  }
  
  const levelData = {
    name: '我的关卡',
    difficulty: '自定义',
    map: gameState.editorMap
  };
  
  const jsonStr = JSON.stringify(levelData, null, 2);
  
  if (navigator.clipboard) {
    navigator.clipboard.writeText(jsonStr).then(() => {
      showToast('关卡数据已复制到剪贴板！');
    }).catch(() => {
      downloadLevel(jsonStr);
    });
  } else {
    downloadLevel(jsonStr);
  }
}

function downloadLevel(jsonStr) {
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'my-sokoban-level.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('关卡已导出为文件！');
}

function importLevel() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const levelData = JSON.parse(e.target.result);
        if (!levelData.map || !Array.isArray(levelData.map)) {
          throw new Error('无效的关卡格式');
        }
        
        gameState.editorMap = deepCopy(levelData.map);
        renderGame();
        showToast('关卡导入成功！');
      } catch (err) {
        showToast('导入失败: ' + err.message);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function showLevelSelect() {
  const modal = document.getElementById('level-select-modal');
  const grid = document.getElementById('level-grid');
  
  grid.innerHTML = '';
  
  const difficulties = Object.values(DIFFICULTY);
  const grouped = {};
  difficulties.forEach(d => grouped[d] = []);
  
  LEVELS.forEach((level, index) => {
    if (!grouped[level.difficulty]) {
      grouped[level.difficulty] = [];
    }
    grouped[level.difficulty].push({ level, index });
  });
  
  difficulties.forEach(diff => {
    if (grouped[diff].length === 0) return;
    
    const section = document.createElement('div');
    section.className = 'level-section';
    section.innerHTML = `<h3 class="level-section-title">${diff}</h3>`;
    
    const levelBtns = document.createElement('div');
    levelBtns.className = 'level-buttons';
    
    grouped[diff].forEach(({ level, index }) => {
      const btn = document.createElement('button');
      btn.className = `level-btn ${index === gameState.currentLevel ? 'current' : ''}`;
      btn.innerHTML = `<span class="level-num">${index + 1}</span><span class="level-name-small">${level.name}</span>`;
      btn.onclick = () => {
        hideLevelSelect();
        goToLevel(index);
      };
      levelBtns.appendChild(btn);
    });
    
    section.appendChild(levelBtns);
    grid.appendChild(section);
  });
  
  modal.classList.add('show');
}

function hideLevelSelect() {
  document.getElementById('level-select-modal').classList.remove('show');
}

function showThemeSelect() {
  document.getElementById('theme-modal').classList.add('show');
}

function hideThemeSelect() {
  document.getElementById('theme-modal').classList.remove('show');
}

function selectTheme(theme) {
  setTheme(theme);
  hideThemeSelect();
}

window.addEventListener('resize', () => {
  renderGame();
});

document.addEventListener('keydown', handleKeydown);

document.addEventListener('mouseup', () => {
  gameState.editorDragging = false;
});

document.addEventListener('mousemove', (e) => {
  if (!gameState.editorMode || !gameState.editorDragging) return;
  
  const target = e.target;
  if (target && target.classList.contains('cell')) {
    const x = parseInt(target.dataset.x);
    const y = parseInt(target.dataset.y);
    if (!isNaN(x) && !isNaN(y)) {
      const currentTile = gameState.editorMap[y][x];
      if (currentTile !== gameState.editorSelectedTool) {
        gameState.editorMap[y][x] = gameState.editorSelectedTool;
        renderGame();
      }
    }
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('sokoban-theme') || THEMES.DEFAULT;
  setTheme(savedTheme);
  
  initGame(0);
  
  const modalNextBtn = document.getElementById('modal-next-btn');
  if (modalNextBtn) {
    modalNextBtn.onclick = () => {
      if (gameState.currentLevel < LEVELS.length - 1) {
        hideWinModal();
        initGame(gameState.currentLevel + 1);
      }
    };
  }
});
