let callStep = 0;
let someoneCalled = false;

function startGame() {
    initGame();
    
    if (typeof initCardCounter === 'function') {
        initCardCounter();
    }
    
    callStep = 0;
    someoneCalled = false;
    
    document.getElementById('modeSelector').style.display = 'none';
    renderGame();
    hideAllButtons();
    
    document.getElementById('gameOverModal').classList.remove('show');
    
    setMessage('游戏开始，请叫地主...');
    
    setTimeout(() => {
        processCallLandlord();
    }, 1000);
}

function initGame() {
    const playerCount = gameSettings.mode === 'two' ? 2 : 3;
    
    gameState = {
        phase: 'calling',
        players: [],
        deckCards: [],
        currentPlayer: 0,
        landlord: -1,
        lastPlayedCards: null,
        lastPlayedPlayer: -1,
        passCount: 0,
        selectedCards: [],
        callOrder: [],
        playerCount: playerCount
    };
    
    const names = gameSettings.mode === 'two' ? 
        ['你', '电脑'] : 
        ['你', '电脑左', '电脑右'];
    
    for (let i = 0; i < playerCount; i++) {
        gameState.players.push({
            id: i,
            name: names[i],
            cards: [],
            isLandlord: false
        });
    }
    
    gameState.callOrder = [];
    for (let i = 0; i < playerCount; i++) {
        gameState.callOrder.push(i);
    }
    gameState.callOrder = shuffleArray(gameState.callOrder);
    
    let deck;
    if (gameSettings.mode === 'noshuffle' && gameSettings.lastDeck) {
        deck = [...gameSettings.lastDeck];
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    } else {
        deck = createDeck();
        deck = shuffleDeck(deck);
    }
    
    if (gameSettings.mode === 'laizi') {
        const randomCard = deck[Math.floor(Math.random() * 52)];
        gameSettings.laiziCard = randomCard.rank;
        document.getElementById('laiziDisplay').style.display = 'block';
        document.getElementById('laiziCard').textContent = CardValue[randomCard.value].display;
    } else {
        gameSettings.laiziCard = null;
        document.getElementById('laiziDisplay').style.display = 'none';
    }
    
    const cardsPerPlayer = gameSettings.mode === 'two' ? 25 : 17;
    const deckCardCount = gameSettings.mode === 'two' ? 4 : 3;
    
    gameState.players[0].cards = sortCards(deck.slice(0, cardsPerPlayer));
    gameState.players[1].cards = sortCards(deck.slice(cardsPerPlayer, cardsPerPlayer * 2));
    if (playerCount === 3) {
        gameState.players[2].cards = sortCards(deck.slice(cardsPerPlayer * 2, cardsPerPlayer * 3));
    }
    gameState.deckCards = deck.slice(cardsPerPlayer * playerCount, cardsPerPlayer * playerCount + deckCardCount);
    
    gameSettings.lastDeck = [...deck];
    
    gameState.currentPlayer = gameState.callOrder[0];
    
    updatePlayerNames();
}

function shuffleArray(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

function updatePlayerNames() {
    document.getElementById('player1Name').textContent = gameState.players[1]?.name || '电脑左';
    if (gameState.players[2]) {
        document.getElementById('player2Name').textContent = gameState.players[2].name;
        document.getElementById('player2Area').style.display = 'block';
    } else {
        document.getElementById('player2Area').style.display = 'none';
    }
}

function renderGame() {
    renderPlayerCards(0);
    renderAICards(1);
    if (gameState.playerCount === 3) {
        renderAICards(2);
    }
    renderDeckCards();
    updateCardCounts();
    updateLandlordBadges();
    clearPlayedCards();
}

function createCardElement(card, isSmall = false) {
    const div = document.createElement('div');
    div.className = 'card';
    
    if (isSmall) {
        div.classList.add('card-small');
    }
    
    if (gameSettings.laiziCard && card.rank === gameSettings.laiziCard && card.suit !== 'joker') {
        div.style.boxShadow = '0 0 10px #ff6b6b';
        div.style.borderColor = '#ff6b6b';
    }
    
    if (card.suit === 'joker') {
        div.classList.add('joker');
        if (card.value === 'bigJoker') {
            div.classList.add('big');
        } else {
            div.classList.add('small');
        }
    } else if (card.suit === 'heart' || card.suit === 'diamond') {
        div.classList.add('red');
    } else {
        div.classList.add('black');
    }
    
    div.dataset.cardId = card.id;
    
    const displayValue = CardValue[card.value].display;
    const suitSymbol = SuitSymbol[card.suit];
    
    div.innerHTML = `
        <div class="card-value">${displayValue}</div>
        <div class="card-suit">${suitSymbol}</div>
        <div class="card-suit-bottom">${displayValue}</div>
    `;
    
    return div;
}

function createCardBackElement() {
    const div = document.createElement('div');
    div.className = 'card-back';
    return div;
}

function renderPlayerCards(playerId) {
    const container = document.getElementById(`player${playerId}Cards`);
    container.innerHTML = '';
    
    const player = gameState.players[playerId];
    if (!player) return;
    
    for (const card of player.cards) {
        const cardEl = createCardElement(card);
        cardEl.onclick = () => toggleCardSelection(playerId, card);
        
        const isSelected = gameState.selectedCards.some(c => c.id === card.id);
        if (isSelected) {
            cardEl.classList.add('selected');
        }
        
        container.appendChild(cardEl);
    }
}

function renderAICards(playerId) {
    const container = document.getElementById(`player${playerId}Cards`);
    container.innerHTML = '';
    
    const player = gameState.players[playerId];
    if (!player) return;
    
    for (let i = 0; i < player.cards.length; i++) {
        const cardBack = createCardBackElement();
        container.appendChild(cardBack);
    }
}

function renderDeckCards() {
    const container = document.getElementById('deckContainer');
    container.innerHTML = '';
    
    if (gameState.phase === 'playing') {
        for (const card of gameState.deckCards) {
            const cardEl = createCardElement(card, true);
            container.appendChild(cardEl);
        }
    } else {
        const count = gameSettings.mode === 'two' ? 4 : 3;
        for (let i = 0; i < count; i++) {
            const cardBack = createCardBackElement();
            container.appendChild(cardBack);
        }
    }
}

function toggleCardSelection(playerId, card) {
    if (gameState.phase !== 'playing' || gameState.currentPlayer !== 0) {
        return;
    }
    
    const idx = gameState.selectedCards.findIndex(c => c.id === card.id);
    if (idx !== -1) {
        gameState.selectedCards.splice(idx, 1);
    } else {
        gameState.selectedCards.push(card);
    }
    
    renderPlayerCards(0);
}

function updateCardCounts() {
    for (let i = 0; i < gameState.playerCount; i++) {
        const countEl = document.getElementById(`player${i}Count`);
        if (countEl && gameState.players[i]) {
            countEl.textContent = `${gameState.players[i].cards.length}张`;
        }
    }
}

function updateLandlordBadges() {
    for (let i = 0; i < 3; i++) {
        const badge = document.getElementById(`player${i}Landlord`);
        if (badge && gameState.players[i]) {
            badge.style.display = gameState.players[i].isLandlord ? 'inline' : 'none';
        }
    }
}

function clearPlayedCards() {
    for (let i = 0; i < 3; i++) {
        const el = document.getElementById(`player${i}Played`);
        if (el) el.innerHTML = '';
    }
    document.getElementById('playInfo').innerHTML = '';
}

function showPlayedCards(playerId, cards) {
    const container = document.getElementById(`player${playerId}Played`);
    if (!container) return;
    container.innerHTML = '';
    
    for (const card of cards) {
        const cardEl = createCardElement(card, true);
        cardEl.classList.add('playing');
        container.appendChild(cardEl);
    }
    
    if (typeof updateCardCounter === 'function' && cards.length > 0) {
        updateCardCounter(cards);
    }
}

function hideAllButtons() {
    document.getElementById('startBtn').style.display = 'none';
    document.getElementById('callBtn').style.display = 'none';
    document.getElementById('noCallBtn').style.display = 'none';
    document.getElementById('playBtn').style.display = 'none';
    document.getElementById('passBtn').style.display = 'none';
    document.getElementById('hintBtn').style.display = 'none';
}

function showCallButtons() {
    hideAllButtons();
    document.getElementById('callBtn').style.display = 'inline-block';
    document.getElementById('noCallBtn').style.display = 'inline-block';
}

function showPlayButtons() {
    hideAllButtons();
    document.getElementById('playBtn').style.display = 'inline-block';
    document.getElementById('passBtn').style.display = 'inline-block';
    document.getElementById('hintBtn').style.display = 'inline-block';
    
    if (gameState.lastPlayedPlayer === 0) {
        document.getElementById('passBtn').style.display = 'none';
    }
}

function setMessage(msg) {
    document.getElementById('gameMessage').textContent = msg;
}

function setGameInfo(info) {
    document.getElementById('gameInfo').textContent = info;
}

function processCallLandlord() {
    const currentCaller = gameState.callOrder[callStep];
    
    setGameInfo(`叫地主阶段 - 第${callStep + 1}轮`);
    
    if (currentCaller === 0) {
        setMessage('轮到你叫地主了！');
        showCallButtons();
    } else {
        setMessage(`${gameState.players[currentCaller].name}正在考虑...`);
        hideAllButtons();
        
        setTimeout(() => {
            const willCall = aiCallLandlord(currentCaller);
            if (willCall) {
                setMessage(`${gameState.players[currentCaller].name}叫地主！`);
                someoneCalled = true;
                setLandlord(currentCaller);
                renderGame();
                
                setTimeout(() => {
                    startPlayingPhase();
                }, 1500);
            } else {
                setMessage(`${gameState.players[currentCaller].name}不叫`);
                callStep++;
                
                if (callStep >= gameState.playerCount) {
                    if (!someoneCalled) {
                        setMessage('都不叫，重新发牌...');
                        setTimeout(() => {
                            startGame();
                        }, 1500);
                    }
                } else {
                    setTimeout(() => {
                        processCallLandlord();
                    }, 1000);
                }
            }
        }, 1000);
    }
}

function callLandlord(call) {
    if (call) {
        setMessage('你叫地主！');
        someoneCalled = true;
        setLandlord(0);
        renderGame();
        
        setTimeout(() => {
            startPlayingPhase();
        }, 1000);
    } else {
        setMessage('你不叫');
        callStep++;
        
        if (callStep >= gameState.playerCount) {
            if (!someoneCalled) {
                setMessage('都不叫，重新发牌...');
                setTimeout(() => {
                    startGame();
                }, 1500);
            }
        } else {
            setTimeout(() => {
                processCallLandlord();
            }, 500);
        }
    }
}

function startPlayingPhase() {
    gameState.selectedCards = [];
    setGameInfo('出牌阶段');
    clearPlayedCards();
    processPlayerTurn();
}

function processPlayerTurn() {
    const winResult = checkWin();
    if (winResult) {
        endGame(winResult);
        return;
    }
    
    const current = gameState.currentPlayer;
    const player = gameState.players[current];
    
    setMessage(`轮到${player.name}出牌`);
    
    if (current === 0) {
        showPlayButtons();
        renderPlayerCards(0);
    } else {
        hideAllButtons();
        
        setTimeout(() => {
            aiTurn(current);
        }, 1000);
    }
}

function aiTurn(playerId) {
    const shouldPass = aiShouldPass(playerId);
    
    if (shouldPass && gameState.lastPlayedPlayer !== playerId && gameState.lastPlayedCards) {
        setMessage(`${gameState.players[playerId].name}不出`);
        showPlayedCards(playerId, []);
        doPass(playerId);
        
        const isNewRound = newRoundIfNeeded();
        if (isNewRound) {
            setTimeout(() => {
                clearPlayedCards();
            }, 500);
        }
        
        nextPlayer();
        
        setTimeout(() => {
            processPlayerTurn();
        }, 1000);
    } else {
        const cards = aiPlayCards(playerId);
        if (cards && cards.length > 0) {
            const cardType = getCardType(cards);
            const typeName = getCardTypeName(cardType.type);
            
            if (cardType.type === CardType.BOMB || cardType.type === CardType.ROCKET) {
                if (typeof cardCounter !== 'undefined') {
                    cardCounter.bombs++;
                }
            }
            
            doPlayCards(playerId, cards);
            
            setMessage(`${gameState.players[playerId].name}出了 ${typeName}`);
            showPlayedCards(playerId, cards);
            
            if (playerId === 1) {
                renderAICards(1);
            } else {
                renderAICards(2);
            }
            updateCardCounts();
            
            nextPlayer();
            
            setTimeout(() => {
                processPlayerTurn();
            }, 1500);
        } else {
            setMessage(`${gameState.players[playerId].name}不出`);
            showPlayedCards(playerId, []);
            doPass(playerId);
            
            const isNewRound = newRoundIfNeeded();
            if (isNewRound) {
                setTimeout(() => {
                    clearPlayedCards();
                }, 500);
            }
            
            nextPlayer();
            
            setTimeout(() => {
                processPlayerTurn();
            }, 1000);
        }
    }
}

function playCards() {
    if (gameState.selectedCards.length === 0) {
        setMessage('请先选择要出的牌！');
        return;
    }
    
    let cardsToCheck = [...gameState.selectedCards];
    let cardType = getCardType(cardsToCheck);
    
    if (gameSettings.laiziCard && cardType.type === CardType.INVALID) {
        cardType = getCardTypeWithLaizi(cardsToCheck);
    }
    
    if (cardType.type === CardType.INVALID) {
        setMessage('无效的牌型！');
        return;
    }
    
    if (gameState.lastPlayedCards && gameState.lastPlayedPlayer !== 0) {
        if (!canBeat(cardType, gameState.lastPlayedCards)) {
            setMessage('牌型不够大！');
            return;
        }
    }
    
    if (cardType.type === CardType.BOMB || cardType.type === CardType.ROCKET) {
        if (typeof cardCounter !== 'undefined') {
            cardCounter.bombs++;
        }
    }
    
    const success = doPlayCards(0, gameState.selectedCards);
    if (success) {
        const typeName = getCardTypeName(cardType.type);
        setMessage(`你出了 ${typeName}`);
        showPlayedCards(0, gameState.selectedCards);
        
        gameState.selectedCards = [];
        renderPlayerCards(0);
        updateCardCounts();
        
        nextPlayer();
        
        setTimeout(() => {
            processPlayerTurn();
        }, 1000);
    }
}

function getCardTypeWithLaizi(cards) {
    const laiziCards = cards.filter(c => c.rank === gameSettings.laiziCard);
    const normalCards = cards.filter(c => c.rank !== gameSettings.laiziCard);
    
    for (let testRank = 3; testRank <= 15; testRank++) {
        const testCards = [...normalCards];
        for (let i = 0; i < laiziCards.length; i++) {
            testCards.push({ ...laiziCards[i], rank: testRank });
        }
        const result = getCardType(testCards);
        if (result.type !== CardType.INVALID) {
            return result;
        }
    }
    
    return { type: CardType.INVALID, value: 0, cards: cards };
}

function playerPass() {
    if (gameState.lastPlayedPlayer === 0) {
        setMessage('你是新一轮的出牌者，不能不出！');
        return;
    }
    
    if (!gameState.lastPlayedCards) {
        setMessage('新一轮出牌，你必须出牌！');
        return;
    }
    
    doPass(0);
    setMessage('你不出');
    showPlayedCards(0, []);
    
    const isNewRound = newRoundIfNeeded();
    if (isNewRound) {
        setTimeout(() => {
            clearPlayedCards();
        }, 500);
    }
    
    nextPlayer();
    
    setTimeout(() => {
        processPlayerTurn();
    }, 1000);
}

function showHint() {
    const cards = gameState.players[0].cards;
    const lastPlayed = gameState.lastPlayedCards;
    
    let hintCards = null;
    
    if (!lastPlayed || gameState.lastPlayedPlayer === 0) {
        hintCards = aiPlayFirstHand(cards);
    } else {
        const plays = findAllPlays(cards, lastPlayed);
        if (plays.length > 0) {
            hintCards = plays[0];
        }
    }
    
    if (hintCards && hintCards.length > 0) {
        gameState.selectedCards = [...hintCards];
        renderPlayerCards(0);
        setMessage('已为你选择提示的牌');
    } else {
        setMessage('没有可以出的牌，请选择不出');
    }
}

function getCardTypeName(type) {
    const names = {
        [CardType.SINGLE]: '单张',
        [CardType.PAIR]: '对子',
        [CardType.TRIPLE]: '三张',
        [CardType.TRIPLE_ONE]: '三带一',
        [CardType.TRIPLE_TWO]: '三带二',
        [CardType.STRAIGHT]: '顺子',
        [CardType.CONSECUTIVE_PAIRS]: '连对',
        [CardType.PLANE]: '飞机',
        [CardType.PLANE_SINGLE]: '飞机带单',
        [CardType.PLANE_PAIR]: '飞机带双',
        [CardType.BOMB]: '炸弹！',
        [CardType.ROCKET]: '王炸！',
        [CardType.FOUR_TWO]: '四带二'
    };
    return names[type] || '未知牌型';
}

function endGame(winResult) {
    gameState.phase = 'ended';
    hideAllButtons();
    document.getElementById('startBtn').style.display = 'inline-block';
    document.getElementById('startBtn').textContent = '再来一局';
    
    const modal = document.getElementById('gameOverModal');
    const title = document.getElementById('gameOverTitle');
    const message = document.getElementById('gameOverMessage');
    
    const isPlayerWin = winResult.winner === 0 || 
        (!winResult.isLandlordWin && !gameState.players[0].isLandlord) ||
        (winResult.isLandlordWin && gameState.players[0].isLandlord);
    
    if (typeof applyGameRewards === 'function') {
        const rewards = applyGameRewards(isPlayerWin, gameState.players[0].isLandlord);
        showGameRewards(isPlayerWin, rewards);
    }
    
    if (isPlayerWin) {
        title.textContent = '🎉 恭喜获胜！';
        message.textContent = gameState.players[0].isLandlord ? 
            '你是地主，成功出完了所有牌！' : 
            '合作成功，击败了地主！';
    } else {
        title.textContent = '😔 游戏结束';
        message.textContent = gameState.players[winResult.winner].isLandlord ?
            '地主获胜，农民失败了...' :
            '农民获胜，地主失败了...';
    }
    
    modal.classList.add('show');
}

function nextPlayer() {
    gameState.currentPlayer = (gameState.currentPlayer + 1) % gameState.playerCount;
}

document.addEventListener('DOMContentLoaded', () => {
    setGameInfo('选择模式后点击"开始游戏"');
});
