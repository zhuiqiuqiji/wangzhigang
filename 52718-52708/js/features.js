let playerData = {
    coins: 1000,
    score: 0,
    rank: '青铜III',
    checkinDays: 0,
    lastCheckin: null,
    gamesPlayed: 0,
    gamesWon: 0,
    bombsUsed: 0,
    consecutiveWins: 0
};

let gameSettings = {
    mode: 'classic',
    laiziCard: null,
    noShuffle: false,
    lastDeck: null
};

let cardCounter = {
    remaining: {},
    played: {},
    bombs: 0
};

let dailyTasks = [
    { id: 1, name: '完成3局游戏', progress: 0, target: 3, reward: 100, claimed: false },
    { id: 2, name: '赢得1局游戏', progress: 0, target: 1, reward: 150, claimed: false },
    { id: 3, name: '使用炸弹', progress: 0, target: 1, reward: 50, claimed: false },
    { id: 4, name: '连胜2局', progress: 0, target: 2, reward: 200, claimed: false }
];

let rankings = {
    local: [
        { name: '赌神', score: 5000, rank: '王者' },
        { name: '牌圣', score: 3500, rank: '钻石I' },
        { name: '牌王', score: 2800, rank: '钻石III' },
        { name: '老千', score: 2000, rank: '铂金I' },
        { name: '高手', score: 1500, rank: '铂金II' },
        { name: '玩家', score: 1000, rank: '黄金I' },
        { name: '新手', score: 500, rank: '白银II' },
        { name: '菜鸟', score: 200, rank: '青铜I' }
    ],
    season: [
        { name: '王者归来', score: 8000, rank: '王者' },
        { name: '不败神话', score: 6500, rank: '王者' },
        { name: '斗地主王', score: 5000, rank: '钻石I' },
        { name: '牌技高超', score: 4000, rank: '钻石II' },
        { name: '稳扎稳打', score: 3000, rank: '钻石III' }
    ]
};

const rankTitles = [
    { rank: '青铜III', minScore: 0, maxScore: 100 },
    { rank: '青铜II', minScore: 100, maxScore: 300 },
    { rank: '青铜I', minScore: 300, maxScore: 500 },
    { rank: '白银III', minScore: 500, maxScore: 800 },
    { rank: '白银II', minScore: 800, maxScore: 1200 },
    { rank: '白银I', minScore: 1200, maxScore: 1600 },
    { rank: '黄金III', minScore: 1600, maxScore: 2100 },
    { rank: '黄金II', minScore: 2100, maxScore: 2700 },
    { rank: '黄金I', minScore: 2700, maxScore: 3400 },
    { rank: '铂金III', minScore: 3400, maxScore: 4200 },
    { rank: '铂金II', minScore: 4200, maxScore: 5100 },
    { rank: '铂金I', minScore: 5100, maxScore: 6100 },
    { rank: '钻石III', minScore: 6100, maxScore: 7500 },
    { rank: '钻石II', minScore: 7500, maxScore: 9000 },
    { rank: '钻石I', minScore: 9000, maxScore: 11000 },
    { rank: '王者', minScore: 11000, maxScore: 99999 }
];

function initFeatures() {
    loadPlayerData();
    updateStatsDisplay();
    initCardCounter();
    renderTasks();
    renderRankings('local');
    checkCheckinStatus();
}

function loadPlayerData() {
    const saved = localStorage.getItem('doudizhu_playerData');
    if (saved) {
        playerData = JSON.parse(saved);
    }
    
    const savedTasks = localStorage.getItem('doudizhu_tasks');
    if (savedTasks) {
        dailyTasks = JSON.parse(savedTasks);
    }
    
    updateRankByScore();
}

function savePlayerData() {
    localStorage.setItem('doudizhu_playerData', JSON.stringify(playerData));
    localStorage.setItem('doudizhu_tasks', JSON.stringify(dailyTasks));
}

function updateStatsDisplay() {
    document.getElementById('coinDisplay').textContent = playerData.coins;
    document.getElementById('rankDisplay').textContent = playerData.rank;
    document.getElementById('scoreDisplay').textContent = playerData.score;
}

function updateRankByScore() {
    for (const rankInfo of rankTitles) {
        if (playerData.score >= rankInfo.minScore && playerData.score < rankInfo.maxScore) {
            playerData.rank = rankInfo.rank;
            break;
        }
    }
}

function selectGameMode(mode) {
    gameSettings.mode = mode;
    
    document.querySelectorAll('.mode-card').forEach(card => {
        card.classList.remove('active');
    });
    document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
}

function initCardCounter() {
    cardCounter.remaining = {};
    cardCounter.played = {};
    cardCounter.bombs = 0;
    
    for (let i = 3; i <= 15; i++) {
        cardCounter.remaining[i] = 4;
        cardCounter.played[i] = 0;
    }
    cardCounter.remaining[16] = 1;
    cardCounter.remaining[17] = 1;
    cardCounter.played[16] = 0;
    cardCounter.played[17] = 0;
}

function updateCardCounter(cards) {
    for (const card of cards) {
        if (cardCounter.remaining[card.rank] > 0) {
            cardCounter.remaining[card.rank]--;
            cardCounter.played[card.rank]++;
        }
    }
    renderCardCounter();
}

function renderCardCounter() {
    const remainingContainer = document.getElementById('remainingCards');
    const playedContainer = document.getElementById('playedCards');
    const bombContainer = document.getElementById('bombStats');
    
    remainingContainer.innerHTML = '';
    playedContainer.innerHTML = '';
    
    const cardLabels = {
        3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9',
        10: '10', 11: 'J', 12: 'Q', 13: 'K', 14: 'A', 15: '2',
        16: '小王', 17: '大王'
    };
    
    for (let i = 3; i <= 17; i++) {
        const remDiv = document.createElement('div');
        remDiv.className = `counter-item ${cardCounter.remaining[i] === 0 ? 'zero' : ''}`;
        remDiv.innerHTML = `${cardLabels[i]}<br><small>${cardCounter.remaining[i]}</small>`;
        remainingContainer.appendChild(remDiv);
        
        const playDiv = document.createElement('div');
        playDiv.className = `counter-item ${cardCounter.played[i] === 0 ? 'zero' : ''}`;
        playDiv.innerHTML = `${cardLabels[i]}<br><small>${cardCounter.played[i]}</small>`;
        playedContainer.appendChild(playDiv);
    }
    
    bombContainer.innerHTML = `<div class="bomb-item"><span>💣 本局炸弹</span><span>${cardCounter.bombs}个</span></div>`;
}

function toggleCardCounter() {
    const panel = document.getElementById('cardCounter');
    panel.classList.toggle('open');
    closeOtherPanels('cardCounter');
    if (panel.classList.contains('open')) {
        renderCardCounter();
    }
}

function toggleEmojiPanel() {
    const panel = document.getElementById('emojiPanel');
    panel.classList.toggle('open');
    closeOtherPanels('emojiPanel');
}

function toggleTasks() {
    const panel = document.getElementById('taskPanel');
    panel.classList.toggle('open');
    closeOtherPanels('taskPanel');
    if (panel.classList.contains('open')) {
        renderTasks();
    }
}

function toggleRanking() {
    const panel = document.getElementById('rankingPanel');
    panel.classList.toggle('open');
    closeOtherPanels('rankingPanel');
}

function closeOtherPanels(except) {
    const panels = ['cardCounter', 'emojiPanel', 'taskPanel', 'rankingPanel'];
    for (const panel of panels) {
        if (panel !== except) {
            document.getElementById(panel).classList.remove('open');
        }
    }
}

function sendEmoji(emoji) {
    const bubble = document.getElementById('player0Emoji');
    showEmojiBubble(bubble, emoji);
    
    setTimeout(() => {
        const aiPlayers = [];
        if (gameState.players && gameState.players[1]) {
            aiPlayers.push(1);
        }
        if (gameState.players && gameState.players[2]) {
            aiPlayers.push(2);
        }
        
        if (aiPlayers.length > 0) {
            const aiPlayer = aiPlayers[Math.floor(Math.random() * aiPlayers.length)];
            const aiEmojis = ['😀', '😭', '😎', '🤔', '👍', '💣', '🎉'];
            const randomEmoji = aiEmojis[Math.floor(Math.random() * aiEmojis.length)];
            const aiBubble = document.getElementById(`player${aiPlayer}Emoji`);
            showEmojiBubble(aiBubble, randomEmoji);
        }
    }, 1000);
    
    toggleEmojiPanel();
}

function showEmojiBubble(element, emoji) {
    if (!element) return;
    
    element.textContent = emoji;
    element.style.display = 'block';
    element.style.animation = 'none';
    element.offsetHeight;
    element.style.animation = 'bubbleFloat 2s ease-out forwards';
    
    setTimeout(() => {
        element.style.display = 'none';
    }, 2000);
}

function dailyCheckin() {
    const today = new Date().toDateString();
    if (playerData.lastCheckin === today) {
        setMessage('今天已经签到过了！');
        return;
    }
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (playerData.lastCheckin === yesterday.toDateString()) {
        playerData.checkinDays++;
    } else {
        playerData.checkinDays = 1;
    }
    
    playerData.lastCheckin = today;
    const bonus = Math.min(playerData.checkinDays * 20, 200);
    playerData.coins += bonus;
    
    updateStatsDisplay();
    savePlayerData();
    checkCheckinStatus();
    setMessage(`签到成功！获得 ${bonus} 金币，连续签到 ${playerData.checkinDays} 天`);
}

function checkCheckinStatus() {
    const today = new Date().toDateString();
    const btn = document.getElementById('checkinBtn');
    const days = document.getElementById('checkinDays');
    
    if (playerData.lastCheckin === today) {
        btn.disabled = true;
        btn.textContent = '✅ 已签到';
    } else {
        btn.disabled = false;
        btn.textContent = '📅 每日签到';
    }
    
    days.textContent = `已连续签到 ${playerData.checkinDays} 天`;
}

function renderTasks() {
    const container = document.getElementById('taskList');
    container.innerHTML = '';
    
    for (const task of dailyTasks) {
        const taskEl = document.createElement('div');
        taskEl.className = 'task-item';
        
        const progress = Math.min(task.progress / task.target * 100, 100);
        const completed = task.progress >= task.target;
        
        taskEl.innerHTML = `
            <div class="task-info">
                <div class="task-name">${task.name}</div>
                <div class="task-progress">
                    <div class="task-progress-bar" style="width: ${progress}%"></div>
                </div>
            </div>
            <span class="task-reward">💰 ${task.reward}</span>
            <button class="task-claim" ${!completed || task.claimed ? 'disabled' : ''} 
                onclick="claimTaskReward(${task.id})">
                ${task.claimed ? '已领取' : completed ? '领取' : `${task.progress}/${task.target}`}
            </button>
        `;
        
        container.appendChild(taskEl);
    }
}

function updateTaskProgress(taskId, amount = 1) {
    const task = dailyTasks.find(t => t.id === taskId);
    if (task && !task.claimed) {
        task.progress = Math.min(task.progress + amount, task.target);
        savePlayerData();
    }
}

function claimTaskReward(taskId) {
    const task = dailyTasks.find(t => t.id === taskId);
    if (task && task.progress >= task.target && !task.claimed) {
        task.claimed = true;
        playerData.coins += task.reward;
        updateStatsDisplay();
        savePlayerData();
        renderTasks();
        setMessage(`领取任务奖励：${task.reward} 金币`);
    }
}

function switchRankingTab(tab) {
    document.querySelectorAll('.ranking-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    renderRankings(tab);
}

function renderRankings(tab) {
    const container = document.getElementById('rankingList');
    const list = rankings[tab] || rankings.local;
    
    container.innerHTML = '';
    
    list.forEach((player, index) => {
        const item = document.createElement('div');
        item.className = 'ranking-item';
        
        item.innerHTML = `
            <div class="rank-number">${index + 1}</div>
            <div class="rank-name">${player.name}</div>
            <div class="rank-score">${player.score} (${player.rank})</div>
        `;
        
        container.appendChild(item);
    });
    
    const myRank = list.findIndex(p => p.score <= playerData.score) + 1 || list.length + 1;
    const myItem = document.createElement('div');
    myItem.className = 'ranking-item mine';
    myItem.innerHTML = `
        <div class="rank-number">${myRank}</div>
        <div class="rank-name">你</div>
        <div class="rank-score">${playerData.score} (${playerData.rank})</div>
    `;
    container.appendChild(myItem);
}

function calculateGameRewards(isWin, isLandlord) {
    const baseCoins = 50;
    const baseScore = 10;
    
    let multiplier = 1;
    if (cardCounter.bombs > 0) {
        multiplier *= Math.pow(2, cardCounter.bombs);
    }
    
    let coins = baseCoins * multiplier;
    let score = baseScore * multiplier;
    
    if (isLandlord && isWin) {
        coins *= 2;
        score *= 2;
    }
    
    if (!isWin) {
        coins = Math.floor(coins / 4);
        score = Math.floor(score / 4);
    }
    
    return { coins, score, multiplier, bombs: cardCounter.bombs };
}

function applyGameRewards(isWin, isLandlord) {
    const rewards = calculateGameRewards(isWin, isLandlord);
    
    if (isWin) {
        playerData.coins += rewards.coins;
        playerData.score += rewards.score;
        playerData.gamesWon++;
        playerData.consecutiveWins++;
        
        updateTaskProgress(2, 1);
        
        if (playerData.consecutiveWins >= 2) {
            updateTaskProgress(4, 1);
        }
    } else {
        playerData.coins = Math.max(0, playerData.coins - Math.floor(rewards.coins / 2));
        playerData.consecutiveWins = 0;
    }
    
    playerData.gamesPlayed++;
    updateTaskProgress(1, 1);
    
    if (cardCounter.bombs > 0) {
        updateTaskProgress(3, cardCounter.bombs);
        playerData.bombsUsed += cardCounter.bombs;
    }
    
    updateRankByScore();
    updateStatsDisplay();
    savePlayerData();
    
    return rewards;
}

function showGameRewards(isWin, rewards) {
    const container = document.getElementById('gameRewards');
    container.innerHTML = `
        <div class="reward-item"><span>基础奖励</span><span>💰 ${Math.floor(rewards.coins / rewards.multiplier)}</span></div>
        <div class="reward-item"><span>炸弹倍率 (${rewards.bombs}个炸弹)</span><span>× ${rewards.multiplier}</span></div>
        <div class="reward-item"><span>获得金币</span><span>💰 +${rewards.coins}</span></div>
        <div class="reward-item"><span>获得积分</span><span>⭐ +${rewards.score}</span></div>
    `;
}

function backToLobby() {
    document.getElementById('gameOverModal').classList.remove('show');
    document.getElementById('modeSelector').style.display = 'block';
    document.getElementById('startBtn').style.display = 'inline-block';
    
    hideAllButtons();
    clearPlayedCards();
}

document.addEventListener('DOMContentLoaded', () => {
    initFeatures();
});
