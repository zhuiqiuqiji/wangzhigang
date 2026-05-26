const defaultPuzzle = {
    gridSize: 10,
    mode: 'classic',
    words: [
        { word: 'JAVASCRIPT', clue: '一种流行的网页编程语言', direction: 'across', row: 0, col: 0, number: 1 },
        { word: 'PYTHON', clue: '以蛇命名的编程语言', direction: 'down', row: 0, col: 3, number: 2 },
        { word: 'HTML', clue: '网页标记语言', direction: 'across', row: 2, col: 2, number: 3 },
        { word: 'CSS', clue: '网页样式表语言', direction: 'down', row: 2, col: 5, number: 4 },
        { word: 'REACT', clue: 'Facebook的前端框架', direction: 'across', row: 4, col: 1, number: 5 },
        { word: 'NODE', clue: '服务端JavaScript运行环境', direction: 'down', row: 4, col: 4, number: 6 },
        { word: 'ANGULAR', clue: 'Google的前端框架', direction: 'across', row: 6, col: 0, number: 7 },
        { word: 'VUE', clue: '尤雨溪创建的前端框架', direction: 'down', row: 6, col: 6, number: 8 },
        { word: 'GIT', clue: '版本控制系统', direction: 'across', row: 8, col: 3, number: 9 },
        { word: 'RUBY', clue: '一种优雅的编程语言', direction: 'down', row: 1, col: 8, number: 10 }
    ]
};

let gameState = {
    currentPuzzle: null,
    grid: [],
    answers: [],
    userInput: [],
    currentWord: null,
    currentDirection: 'across',
    completedWords: new Set(),
    totalLetters: 0,
    correctLetters: 0,
    hintsUsed: 0,
    startTime: null,
    elapsedTime: 0,
    timerInterval: null,
    isPaused: false,
    puzzleMode: 'classic',
    revealedCells: new Set(),
    checkErrorsUsed: false
};

function initGame(puzzleData = null) {
    gameState.currentPuzzle = puzzleData || defaultPuzzle;
    gameState.puzzleMode = gameState.currentPuzzle.mode || 'classic';
    
    initializeGrid();
    placeWords();
    renderGrid();
    renderClues();
    updateProgress();
    addEventListeners();
    
    if (gameState.puzzleMode === 'codeword') {
        renderCodewordHints();
    }
    
    startTimer();
}

function initializeGrid() {
    const size = gameState.currentPuzzle.gridSize;
    gameState.grid = Array(size).fill(null).map(() => Array(size).fill(null));
    gameState.answers = Array(size).fill(null).map(() => Array(size).fill(null));
    gameState.userInput = Array(size).fill(null).map(() => Array(size).fill(''));
    gameState.completedWords = new Set();
    gameState.revealedCells = new Set();
    gameState.totalLetters = 0;
    gameState.correctLetters = 0;
    gameState.hintsUsed = 0;
    gameState.checkErrorsUsed = false;
    gameState.elapsedTime = 0;
    
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }
}

function placeWords() {
    gameState.currentPuzzle.words.forEach((wordData) => {
        const { word, direction, row, col } = wordData;
        
        for (let i = 0; i < word.length; i++) {
            const r = direction === 'across' ? row : row + i;
            const c = direction === 'across' ? col + i : col;
            
            if (!gameState.grid[r][c]) {
                gameState.grid[r][c] = { number: wordData.number, letter: null };
                gameState.totalLetters++;
            }
            
            gameState.answers[r][c] = word[i];
        }
    });
}

function renderGrid() {
    const gridElement = document.getElementById('crosswordGrid');
    const size = gameState.currentPuzzle.gridSize;
    
    gridElement.style.gridTemplateColumns = `repeat(${size}, 45px)`;
    gridElement.innerHTML = '';
    
    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            const cellWrapper = document.createElement('div');
            cellWrapper.style.position = 'relative';
            
            const cell = document.createElement('input');
            cell.type = 'text';
            cell.className = 'grid-cell';
            cell.maxLength = 1;
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            if (!gameState.grid[row][col]) {
                cell.disabled = true;
            } else {
                const cellData = gameState.grid[row][col];
                
                if (cellData.number) {
                    const numberSpan = document.createElement('span');
                    numberSpan.className = 'cell-number';
                    numberSpan.textContent = cellData.number;
                    cellWrapper.appendChild(numberSpan);
                }
                
                if (gameState.puzzleMode === 'codeword' && gameState.currentPuzzle.codeMap) {
                    const letter = gameState.answers[row][col];
                    const code = gameState.currentPuzzle.codeMap[letter];
                    const codeSpan = document.createElement('span');
                    codeSpan.className = 'cell-code';
                    codeSpan.textContent = code;
                    cellWrapper.appendChild(codeSpan);
                    
                    if (gameState.currentPuzzle.hints[letter]) {
                        cell.value = letter;
                        gameState.userInput[row][col] = letter;
                        cell.classList.add('correct');
                        cell.disabled = true;
                    }
                } else if (gameState.puzzleMode === 'arrow') {
                    if (cellData.number) {
                        const wordData = gameState.currentPuzzle.words.find(w => w.number === cellData.number && 
                            ((w.direction === 'across' && w.row === row && w.col === col) ||
                             (w.direction === 'down' && w.row === row && w.col === col)));
                        if (wordData) {
                            const arrowSpan = document.createElement('span');
                            arrowSpan.className = 'cell-arrow';
                            arrowSpan.textContent = wordData.direction === 'across' ? '→' : '↓';
                            cellWrapper.appendChild(arrowSpan);
                        }
                    }
                }
                
                cell.value = gameState.userInput[row][col];
            }
            
            cellWrapper.appendChild(cell);
            gridElement.appendChild(cellWrapper);
        }
    }
}

function renderCodewordHints() {
    const hintsContainer = document.getElementById('codewordHints');
    if (!hintsContainer) return;
    
    if (gameState.puzzleMode !== 'codeword') {
        hintsContainer.style.display = 'none';
        return;
    }
    
    hintsContainer.style.display = 'block';
    const codeMap = gameState.currentPuzzle.codeMap;
    const hints = gameState.currentPuzzle.hints;
    
    const sortedLetters = Object.keys(codeMap).sort((a, b) => codeMap[a] - codeMap[b]);
    
    hintsContainer.innerHTML = `
        <h3>🔢 密码提示</h3>
        <div class="codeword-legend">
            ${sortedLetters.map(letter => {
                const isHint = hints[letter];
                const code = codeMap[letter];
                return `
                    <div class="code-item ${isHint ? 'hint' : ''}">
                        <span class="code-number">${code}</span>
                        <span class="code-letter">${isHint ? letter : '?'}</span>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function renderClues() {
    const acrossClues = document.getElementById('acrossClues');
    const downClues = document.getElementById('downClues');
    
    acrossClues.innerHTML = '';
    downClues.innerHTML = '';
    
    gameState.currentPuzzle.words.forEach((wordData) => {
        const clueItem = document.createElement('div');
        clueItem.className = 'clue-item';
        clueItem.dataset.index = wordData.number;
        clueItem.dataset.direction = wordData.direction;
        
        if (gameState.completedWords.has(wordData.number)) {
            clueItem.classList.add('completed');
        }
        
        const arrow = gameState.puzzleMode === 'arrow' ? 
            `<span class="arrow-icon">${wordData.direction === 'across' ? '→' : '↓'}</span>` : '';
        
        clueItem.innerHTML = `
            <span class="clue-number">${wordData.number}.</span>
            ${arrow}
            <span class="clue-text">${wordData.clue}</span>
        `;
        
        const wordIndex = gameState.currentPuzzle.words.findIndex(w => w.number === wordData.number);
        clueItem.addEventListener('click', () => selectWord(wordIndex));
        
        if (wordData.direction === 'across') {
            acrossClues.appendChild(clueItem);
        } else {
            downClues.appendChild(clueItem);
        }
    });
}

function selectWord(wordIndex) {
    const wordData = gameState.currentPuzzle.words[wordIndex];
    gameState.currentWord = wordIndex;
    gameState.currentDirection = wordData.direction;
    
    document.querySelectorAll('.clue-item').forEach(item => {
        item.classList.remove('active');
        if (parseInt(item.dataset.index) === wordData.number) {
            item.classList.add('active');
        }
    });
    
    highlightWord(wordData);
    
    const firstCell = document.querySelector(
        `.grid-cell[data-row="${wordData.row}"][data-col="${wordData.col}"]:not(:disabled)`
    );
    if (firstCell) {
        firstCell.focus();
    }
}

function highlightWord(wordData) {
    document.querySelectorAll('.grid-cell').forEach(cell => {
        cell.classList.remove('highlighted');
    });
    
    const { word, direction, row, col } = wordData;
    
    for (let i = 0; i < word.length; i++) {
        const r = direction === 'across' ? row : row + i;
        const c = direction === 'across' ? col + i : col;
        
        const cell = document.querySelector(
            `.grid-cell[data-row="${r}"][data-col="${c}"]:not(:disabled)`
        );
        if (cell) {
            cell.classList.add('highlighted');
        }
    }
}

function handleInput(e) {
    const cell = e.target;
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    
    let value = e.target.value.toUpperCase();
    if (value.length > 1) {
        value = value.slice(-1);
    }
    
    cell.value = value;
    gameState.userInput[row][col] = value;
    
    validateCell(row, col, cell);
    
    if (value) {
        moveToNextCell(row, col);
    }
    
    checkWordCompletion();
    updateProgress();
    checkWin();
}

function validateCell(row, col, cell) {
    const correctLetter = gameState.answers[row][col];
    const userLetter = gameState.userInput[row][col];
    
    cell.classList.remove('correct', 'incorrect');
    
    if (userLetter) {
        if (userLetter === correctLetter) {
            cell.classList.add('correct');
        } else {
            cell.classList.add('incorrect');
        }
    }
}

function moveToNextCell(row, col) {
    if (gameState.currentWord === null) return;
    
    const wordData = gameState.currentPuzzle.words[gameState.currentWord];
    const { word, direction } = wordData;
    
    let currentPos;
    if (direction === 'across') {
        currentPos = col - wordData.col;
    } else {
        currentPos = row - wordData.row;
    }
    
    if (currentPos < word.length - 1) {
        const nextRow = direction === 'across' ? row : row + 1;
        const nextCol = direction === 'across' ? col + 1 : col;
        
        const nextCell = document.querySelector(
            `.grid-cell[data-row="${nextRow}"][data-col="${nextCol}"]:not(:disabled)`
        );
        if (nextCell) {
            nextCell.focus();
        }
    }
}

function handleKeydown(e) {
    const cell = e.target;
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    
    switch (e.key) {
        case 'Backspace':
            if (!cell.value && gameState.currentWord !== null) {
                e.preventDefault();
                moveToPrevCell(row, col);
            }
            break;
        case 'ArrowLeft':
            e.preventDefault();
            moveCell(row, col - 1);
            break;
        case 'ArrowRight':
            e.preventDefault();
            moveCell(row, col + 1);
            break;
        case 'ArrowUp':
            e.preventDefault();
            moveCell(row - 1, col);
            break;
        case 'ArrowDown':
            e.preventDefault();
            moveCell(row + 1, col);
            break;
        case 'Tab':
            e.preventDefault();
            toggleDirection();
            break;
    }
}

function moveToPrevCell(row, col) {
    if (gameState.currentWord === null) return;
    
    const wordData = gameState.currentPuzzle.words[gameState.currentWord];
    const direction = wordData.direction;
    
    const prevRow = direction === 'across' ? row : row - 1;
    const prevCol = direction === 'across' ? col - 1 : col;
    
    const prevCell = document.querySelector(
        `.grid-cell[data-row="${prevRow}"][data-col="${prevCol}"]:not(:disabled)`
    );
    if (prevCell) {
        prevCell.focus();
    }
}

function moveCell(row, col) {
    const cell = document.querySelector(
        `.grid-cell[data-row="${row}"][data-col="${col}"]:not(:disabled)`
    );
    if (cell) {
        cell.focus();
        
        const wordIndex = findWordAtPosition(row, col);
        if (wordIndex !== null) {
            selectWord(wordIndex);
        }
    }
}

function findWordAtPosition(row, col) {
    for (let i = 0; i < gameState.currentPuzzle.words.length; i++) {
        const wordData = gameState.currentPuzzle.words[i];
        const { word, direction } = wordData;
        
        for (let j = 0; j < word.length; j++) {
            const r = direction === 'across' ? wordData.row : wordData.row + j;
            const c = direction === 'across' ? wordData.col + j : wordData.col;
            
            if (r === row && c === col) {
                return i;
            }
        }
    }
    return null;
}

function toggleDirection() {
    if (gameState.currentWord === null) return;
    
    const wordData = gameState.currentPuzzle.words[gameState.currentWord];
    const newDirection = gameState.currentDirection === 'across' ? 'down' : 'across';
    
    for (let i = 0; i < gameState.currentPuzzle.words.length; i++) {
        const wd = gameState.currentPuzzle.words[i];
        if (wd.direction === newDirection) {
            for (let j = 0; j < wd.word.length; j++) {
                const r = newDirection === 'across' ? wd.row : wd.row + j;
                const c = newDirection === 'across' ? wd.col + j : wd.col;
                
                const cell = document.querySelector(
                    `.grid-cell[data-row="${r}"][data-col="${c}"]:not(:disabled)`
                );
                if (cell && cell === document.activeElement) {
                    selectWord(i);
                    return;
                }
            }
        }
    }
}

function checkWordCompletion() {
    gameState.currentPuzzle.words.forEach((wordData, index) => {
        const { word, direction, row, col } = wordData;
        let isComplete = true;
        
        for (let i = 0; i < word.length; i++) {
            const r = direction === 'across' ? row : row + i;
            const c = direction === 'across' ? col + i : col;
            
            if (gameState.userInput[r][c] !== word[i]) {
                isComplete = false;
                break;
            }
        }
        
        const clueItem = document.querySelector(
            `.clue-item[data-index="${wordData.number}"]`
        );
        
        if (isComplete) {
            if (!gameState.completedWords.has(wordData.number)) {
                gameState.completedWords.add(wordData.number);
                if (clueItem) {
                    clueItem.classList.add('completed');
                }
            }
        } else {
            if (gameState.completedWords.has(wordData.number)) {
                gameState.completedWords.delete(wordData.number);
                if (clueItem) {
                    clueItem.classList.remove('completed');
                }
            }
        }
    });
}

function updateProgress() {
    let correctCount = 0;
    
    for (let row = 0; row < gameState.currentPuzzle.gridSize; row++) {
        for (let col = 0; col < gameState.currentPuzzle.gridSize; col++) {
            if (gameState.answers[row][col] && 
                gameState.userInput[row][col] === gameState.answers[row][col]) {
                correctCount++;
            }
        }
    }
    
    gameState.correctLetters = correctCount;
    const percentage = Math.round((correctCount / gameState.totalLetters) * 100);
    
    document.getElementById('progressFill').style.width = `${percentage}%`;
    document.getElementById('progressText').textContent = `${percentage}%`;
    
    document.getElementById('hintsUsed').textContent = gameState.hintsUsed;
}

function startTimer() {
    gameState.startTime = Date.now();
    gameState.timerInterval = setInterval(() => {
        if (!gameState.isPaused) {
            gameState.elapsedTime = Math.floor((Date.now() - gameState.startTime) / 1000);
            updateTimerDisplay();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const mins = Math.floor(gameState.elapsedTime / 60);
    const secs = gameState.elapsedTime % 60;
    document.getElementById('timerDisplay').textContent = 
        `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function pauseTimer() {
    gameState.isPaused = true;
}

function resumeTimer() {
    gameState.isPaused = false;
    gameState.startTime = Date.now() - (gameState.elapsedTime * 1000);
}

function checkWin() {
    if (gameState.correctLetters === gameState.totalLetters) {
        clearInterval(gameState.timerInterval);
        setTimeout(() => {
            showWinModal();
        }, 500);
    }
}

function showWinModal() {
    const modal = document.getElementById('winModal');
    const timeStr = document.getElementById('timerDisplay').textContent;
    const isDaily = gameState.currentPuzzle.isDaily;
    
    modal.querySelector('.win-stats').innerHTML = `
        <p>⏱️ 用时: <strong>${timeStr}</strong></p>
        <p>💡 提示次数: <strong>${gameState.hintsUsed}</strong></p>
        <p>✅ 完成度: <strong>100%</strong></p>
    `;
    
    const nameInput = modal.querySelector('#playerName');
    const submitBtn = modal.querySelector('#submitScore');
    
    if (isDaily) {
        submitBtn.textContent = '提交每日成绩';
    } else {
        submitBtn.textContent = '提交成绩';
    }
    
    modal.classList.add('show');
    
    submitBtn.onclick = () => {
        const name = nameInput.value.trim() || '匿名玩家';
        let rank;
        
        if (isDaily) {
            rank = CommunityStorage.saveDailyRecord(gameState.elapsedTime, name);
        } else {
            rank = CommunityStorage.addToLeaderboard(
                name, 
                gameState.elapsedTime, 
                gameState.currentPuzzle.id || 'default',
                gameState.currentPuzzle.difficulty || 'normal'
            );
        }
        
        alert(`恭喜！你的排名是第 ${rank} 名！`);
        
        if (gameState.currentPuzzle.id && !isDaily) {
            showRatingModal(gameState.currentPuzzle.id, () => {
                modal.classList.remove('show');
            });
        } else {
            modal.classList.remove('show');
        }
    };
    
    document.getElementById('playAgainBtn').onclick = () => {
        modal.classList.remove('show');
        if (isDaily) {
            const dailyPuzzle = generateDailyPuzzle();
            initGame(dailyPuzzle);
        } else {
            initGame(gameState.currentPuzzle);
        }
    };
}

function revealLetter() {
    const emptyCells = [];
    
    for (let row = 0; row < gameState.currentPuzzle.gridSize; row++) {
        for (let col = 0; col < gameState.currentPuzzle.gridSize; col++) {
            const cellKey = `${row},${col}`;
            if (gameState.answers[row][col] && 
                gameState.userInput[row][col] !== gameState.answers[row][col] &&
                !gameState.revealedCells.has(cellKey)) {
                emptyCells.push({ row, col });
            }
        }
    }
    
    if (emptyCells.length === 0) {
        alert('没有需要提示的格子了！');
        return;
    }
    
    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const { row, col } = randomCell;
    const cellKey = `${row},${col}`;
    
    gameState.revealedCells.add(cellKey);
    gameState.userInput[row][col] = gameState.answers[row][col];
    gameState.hintsUsed++;
    
    const cell = document.querySelector(
        `.grid-cell[data-row="${row}"][data-col="${col}"]:not(:disabled)`
    );
    if (cell) {
        cell.value = gameState.answers[row][col];
        cell.classList.remove('correct', 'incorrect');
        cell.classList.add('correct');
    }
    
    checkWordCompletion();
    updateProgress();
    checkWin();
}

function revealWord() {
    if (gameState.currentWord === null) {
        alert('请先选择一个单词！');
        return;
    }
    
    const wordData = gameState.currentPuzzle.words[gameState.currentWord];
    const { word, direction, row, col } = wordData;
    
    for (let i = 0; i < word.length; i++) {
        const r = direction === 'across' ? row : row + i;
        const c = direction === 'across' ? col + i : col;
        const cellKey = `${r},${c}`;
        
        if (gameState.userInput[r][c] !== word[i]) {
            gameState.revealedCells.add(cellKey);
            gameState.userInput[r][c] = word[i];
            
            const cell = document.querySelector(
                `.grid-cell[data-row="${r}"][data-col="${c}"]:not(:disabled)`
            );
            if (cell) {
                cell.value = word[i];
                cell.classList.remove('correct', 'incorrect');
                cell.classList.add('correct');
            }
        }
    }
    
    gameState.hintsUsed += 2;
    checkWordCompletion();
    updateProgress();
    checkWin();
}

function checkErrors() {
    let errorCount = 0;
    
    for (let row = 0; row < gameState.currentPuzzle.gridSize; row++) {
        for (let col = 0; col < gameState.currentPuzzle.gridSize; col++) {
            const cell = document.querySelector(
                `.grid-cell[data-row="${row}"][data-col="${col}"]:not(:disabled)`
            );
            
            if (cell && gameState.userInput[row][col]) {
                if (gameState.userInput[row][col] !== gameState.answers[row][col]) {
                    errorCount++;
                    if (!gameState.checkErrorsUsed) {
                        cell.classList.add('incorrect');
                    }
                }
            }
        }
    }
    
    if (!gameState.checkErrorsUsed) {
        gameState.checkErrorsUsed = true;
        gameState.hintsUsed++;
    }
    
    if (errorCount === 0) {
        alert('太棒了！目前没有错误！');
    } else {
        alert(`发现 ${errorCount} 个错误，请检查红色格子！`);
    }
    
    updateProgress();
}

function printPuzzle() {
    const printWindow = window.open('', '_blank');
    const size = gameState.currentPuzzle.gridSize;
    const puzzleName = gameState.currentPuzzle.name || '拼字填词游戏';
    
    let gridHtml = '';
    for (let row = 0; row < size; row++) {
        gridHtml += '<tr>';
        for (let col = 0; col < size; col++) {
            const isActive = gameState.grid[row][col];
            const cellData = isActive ? gameState.grid[row][col] : null;
            const number = cellData?.number || '';
            
            if (isActive) {
                gridHtml += `
                    <td class="active">
                        ${number ? `<span class="pnum">${number}</span>` : ''}
                    </td>
                `;
            } else {
                gridHtml += '<td class="inactive"></td>';
            }
        }
        gridHtml += '</tr>';
    }
    
    let acrossClues = '';
    let downClues = '';
    
    gameState.currentPuzzle.words.forEach(w => {
        const clueHtml = `<div><strong>${w.number}.</strong> ${w.clue}</div>`;
        if (w.direction === 'across') {
            acrossClues += clueHtml;
        } else {
            downClues += clueHtml;
        }
    });
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${puzzleName}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { text-align: center; color: #333; }
                .puzzle-wrapper { display: flex; gap: 30px; margin-top: 20px; }
                table { border-collapse: collapse; }
                td { 
                    width: 35px; height: 35px; 
                    border: 1px solid #333; 
                    position: relative;
                    text-align: center;
                    vertical-align: middle;
                }
                td.inactive { background: #333; border: 1px solid #333; }
                td.active { background: white; }
                .pnum { 
                    position: absolute; 
                    top: 2px; left: 2px; 
                    font-size: 10px; 
                    color: #666;
                }
                .clues { flex: 1; }
                .clues h3 { margin-top: 0; color: #333; }
                .clues > div { margin-bottom: 8px; }
                @media print { body { padding: 0; } }
            </style>
        </head>
        <body>
            <h1>${puzzleName}</h1>
            <div class="puzzle-wrapper">
                <table>${gridHtml}</table>
                <div class="clues">
                    <h3>横向</h3>
                    ${acrossClues}
                    <h3 style="margin-top: 20px;">纵向</h3>
                    ${downClues}
                </div>
            </div>
            <script>window.print();</script>
        </body>
        </html>
    `);
    
    printWindow.document.close();
}

function exportPuzzle() {
    const puzzleData = {
        ...gameState.currentPuzzle,
        exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(puzzleData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `puzzle_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importCustomPuzzle() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const puzzle = JSON.parse(e.target.result);
                if (puzzle.words && puzzle.gridSize) {
                    initGame(puzzle);
                    alert('谜题导入成功！');
                } else {
                    alert('无效的谜题文件！');
                }
            } catch (err) {
                alert('解析文件失败！');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

function resetGame() {
    initGame(gameState.currentPuzzle);
}

function addEventListeners() {
    document.querySelectorAll('.grid-cell:not(:disabled)').forEach(cell => {
        cell.addEventListener('input', handleInput);
        cell.addEventListener('keydown', handleKeydown);
        cell.addEventListener('click', (e) => {
            const row = parseInt(e.target.dataset.row);
            const col = parseInt(e.target.dataset.col);
            const wordIndex = findWordAtPosition(row, col);
            if (wordIndex !== null) {
                selectWord(wordIndex);
            }
        });
    });
    
    if (!document.getElementById('resetBtn').hasAttribute('data-bound')) {
        document.getElementById('resetBtn').addEventListener('click', resetGame);
        document.getElementById('hintLetterBtn').addEventListener('click', revealLetter);
        document.getElementById('hintWordBtn').addEventListener('click', revealWord);
        document.getElementById('checkBtn').addEventListener('click', checkErrors);
        document.getElementById('printBtn').addEventListener('click', printPuzzle);
        document.getElementById('exportBtn').addEventListener('click', exportPuzzle);
        document.getElementById('importBtn').addEventListener('click', importCustomPuzzle);
        
        document.getElementById('resetBtn').setAttribute('data-bound', 'true');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initGame(defaultPuzzle);
});
