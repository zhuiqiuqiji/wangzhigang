const GAME_DURATION = 30;
const MOLE_APPEAR_TIME = 1500;
const POINTS_PER_HIT = 10;
const TOTAL_HOLES = 9;

let gameState = {
    score: 0,
    hitCount: 0,
    totalMoles: 0,
    timeLeft: GAME_DURATION,
    isPlaying: false,
    activeMoles: new Set(),
    timerInterval: null,
    moleTimeouts: new Map()
};

const timerEl = document.getElementById('timer');
const scoreEl = document.getElementById('score');
const hitCountEl = document.getElementById('hit-count');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const resultModal = document.getElementById('result-modal');
const finalScoreEl = document.getElementById('final-score');
const finalHitsEl = document.getElementById('final-hits');
const accuracyEl = document.getElementById('accuracy');
const scorePopup = document.getElementById('score-popup');
const holes = document.querySelectorAll('.hole');

function updateDisplay() {
    timerEl.textContent = gameState.timeLeft;
    scoreEl.textContent = gameState.score;
    hitCountEl.textContent = gameState.hitCount;

    if (gameState.timeLeft <= 5) {
        timerEl.classList.add('warning');
    } else {
        timerEl.classList.remove('warning');
    }
}

function showScorePopup(x, y) {
    scorePopup.style.left = `${x}px`;
    scorePopup.style.top = `${y}px`;
    scorePopup.classList.remove('hidden');
    
    setTimeout(() => {
        scorePopup.classList.add('hidden');
    }, 800);
}

function getRandomHole() {
    const available = [];
    holes.forEach((hole, index) => {
        if (!gameState.activeMoles.has(index)) {
            available.push(index);
        }
    });
    
    if (available.length === 0) return -1;
    return available[Math.floor(Math.random() * available.length)];
}

function spawnMole() {
    if (!gameState.isPlaying) return;

    const holeIndex = getRandomHole();
    if (holeIndex === -1) return;

    const mole = holes[holeIndex].querySelector('.mole');
    
    gameState.activeMoles.add(holeIndex);
    gameState.totalMoles++;
    mole.classList.add('active');
    mole.classList.remove('hit');

    const timeout = setTimeout(() => {
        hideMole(holeIndex);
    }, MOLE_APPEAR_TIME);

    gameState.moleTimeouts.set(holeIndex, timeout);
}

function hideMole(index) {
    const mole = holes[index].querySelector('.mole');
    mole.classList.remove('active');
    gameState.activeMoles.delete(index);
    
    const timeout = gameState.moleTimeouts.get(index);
    if (timeout) {
        clearTimeout(timeout);
        gameState.moleTimeouts.delete(index);
    }
}

function handleHoleClick(e) {
    if (!gameState.isPlaying) return;

    const hole = e.currentTarget;
    const index = parseInt(hole.dataset.index);
    const mole = hole.querySelector('.mole');

    if (gameState.activeMoles.has(index) && !mole.classList.contains('hit')) {
        gameState.score += POINTS_PER_HIT;
        gameState.hitCount++;
        mole.classList.add('hit');
        
        const rect = hole.getBoundingClientRect();
        showScorePopup(rect.left + rect.width / 2, rect.top + rect.height / 2);

        setTimeout(() => {
            hideMole(index);
        }, 200);

        updateDisplay();
    }
}

function startGame() {
    gameState = {
        score: 0,
        hitCount: 0,
        totalMoles: 0,
        timeLeft: GAME_DURATION,
        isPlaying: true,
        activeMoles: new Set(),
        timerInterval: null,
        moleTimeouts: new Map()
    };

    holes.forEach((hole, index) => {
        const mole = hole.querySelector('.mole');
        mole.classList.remove('active', 'hit');
    });

    updateDisplay();
    startBtn.disabled = true;
    startBtn.textContent = '🎮 游戏中...';

    gameState.timerInterval = setInterval(() => {
        gameState.timeLeft--;
        updateDisplay();

        if (gameState.timeLeft <= 0) {
            endGame();
        }
    }, 1000);

    function scheduleMole() {
        if (!gameState.isPlaying) return;
        spawnMole();
        const nextDelay = 600 + Math.random() * 800;
        setTimeout(scheduleMole, nextDelay);
    }
    
    scheduleMole();
}

function endGame() {
    gameState.isPlaying = false;
    clearInterval(gameState.timerInterval);

    gameState.moleTimeouts.forEach((timeout) => {
        clearTimeout(timeout);
    });
    gameState.moleTimeouts.clear();

    gameState.activeMoles.forEach((index) => {
        const mole = holes[index].querySelector('.mole');
        mole.classList.remove('active');
    });
    gameState.activeMoles.clear();

    startBtn.disabled = false;
    startBtn.textContent = '🎮 开始游戏';

    showResult();
}

function showResult() {
    finalScoreEl.textContent = gameState.score;
    finalHitsEl.textContent = gameState.hitCount;
    
    const accuracy = gameState.totalMoles > 0 
        ? Math.round((gameState.hitCount / gameState.totalMoles) * 100) 
        : 0;
    accuracyEl.textContent = `${accuracy}%`;

    resultModal.classList.remove('hidden');
}

function hideResult() {
    resultModal.classList.add('hidden');
}

holes.forEach(hole => {
    hole.addEventListener('click', handleHoleClick);
});

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', () => {
    hideResult();
    startGame();
});

updateDisplay();
