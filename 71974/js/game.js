(function() {
    'use strict';

    const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
    const SUIT_SYMBOLS = {
        hearts: '♥',
        diamonds: '♦',
        clubs: '♣',
        spades: '♠'
    };
    const RANK_NAMES = {
        1: 'A',
        11: 'J',
        12: 'Q',
        13: 'K'
    };

    let gameState = {
        columns: [[], [], [], [], [], [], []],
        foundations: [[], [], [], []],
        stock: [],
        waste: [],
        moves: 0,
        startTime: 0,
        elapsedTime: 0,
        timerInterval: null,
        isWon: false
    };

    let dragState = {
        isDragging: false,
        draggedCards: [],
        sourceType: null,
        sourceIndex: -1,
        cardIndex: -1,
        startX: 0,
        startY: 0,
        offsetX: 0,
        offsetY: 0,
        dragClones: [],
        currentDropTarget: null
    };

    const elements = {};

    function init() {
        cacheElements();
        bindEvents();
        startNewGame();
    }

    function cacheElements() {
        elements.timer = document.getElementById('timer');
        elements.moves = document.getElementById('moves');
        elements.restartBtn = document.getElementById('restartBtn');
        elements.stockPile = document.getElementById('stockPile');
        elements.wastePile = document.getElementById('wastePile');
        elements.foundations = document.getElementById('foundations');
        elements.columns = document.getElementById('columns');
        elements.dragLayer = document.getElementById('dragLayer');
        elements.winModal = document.getElementById('winModal');
        elements.finalTime = document.getElementById('finalTime');
        elements.finalMoves = document.getElementById('finalMoves');
        elements.playAgainBtn = document.getElementById('playAgainBtn');
        elements.confettiContainer = document.getElementById('confettiContainer');
        elements.columnEls = document.querySelectorAll('.column');
        elements.foundationEls = document.querySelectorAll('.foundation-pile');
    }

    function bindEvents() {
        elements.restartBtn.addEventListener('click', startNewGame);
        elements.playAgainBtn.addEventListener('click', function() {
            hideWinModal();
            startNewGame();
        });
        elements.stockPile.addEventListener('click', handleStockClick);

        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('touchstart', handleTouchStart, { passive: false });
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd);
    }

    function startNewGame() {
        stopTimer();
        gameState = {
            columns: [[], [], [], [], [], [], []],
            foundations: [[], [], [], []],
            stock: [],
            waste: [],
            moves: 0,
            startTime: Date.now(),
            elapsedTime: 0,
            timerInterval: null,
            isWon: false
        };
        updateStatsDisplay();
        clearGameBoard();
        
        const deck = createDeck();
        shuffleDeck(deck);
        dealCards(deck);
        
        startTimer();
    }

    function createDeck() {
        const deck = [];
        for (let suit of SUITS) {
            for (let rank = 1; rank <= 13; rank++) {
                deck.push({
                    suit: suit,
                    rank: rank,
                    faceUp: false,
                    color: (suit === 'hearts' || suit === 'diamonds') ? 'red' : 'black',
                    element: null
                });
            }
        }
        return deck;
    }

    function shuffleDeck(deck) {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    }

    function dealCards(deck) {
        let cardIndex = 0;
        
        for (let col = 0; col < 7; col++) {
            for (let row = 0; row <= col; row++) {
                const card = deck[cardIndex++];
                card.faceUp = (row === col);
                gameState.columns[col].push(card);
            }
        }
        
        gameState.stock = deck.slice(cardIndex);
        
        renderAllCards();
        animateDeal();
    }

    function animateDeal() {
        let delay = 0;
        const columns = elements.columns.querySelectorAll('.card');
        columns.forEach((card, index) => {
            card.style.opacity = '0';
            setTimeout(() => {
                card.classList.add('deal-anim');
                card.style.opacity = '1';
            }, delay);
            delay += 50;
        });
    }

    function clearGameBoard() {
        elements.wastePile.innerHTML = '';
        elements.stockPile.querySelectorAll('.card').forEach(c => c.remove());
        elements.columnEls.forEach(col => {
            col.querySelectorAll('.card').forEach(c => c.remove());
        });
        elements.foundationEls.forEach(found => {
            found.querySelectorAll('.card').forEach(c => c.remove());
        });
    }

    function renderAllCards() {
        renderStock();
        renderWaste();
        renderColumns();
        renderFoundations();
    }

    function renderStock() {
        elements.stockPile.querySelectorAll('.stock-card').forEach(c => c.remove());
        
        const placeholder = elements.stockPile.querySelector('.pile-placeholder');
        if (placeholder) placeholder.style.display = 'none';
        
        const displayCount = Math.min(gameState.stock.length, 4);
        for (let i = 0; i < displayCount; i++) {
            const cardEl = createCardElement(gameState.stock[gameState.stock.length - 1 - i], false);
            cardEl.classList.add('stock-card');
            cardEl.style.zIndex = displayCount - 1 - i;
            elements.stockPile.appendChild(cardEl);
        }
        
        if (gameState.stock.length === 0 && placeholder) {
            placeholder.style.display = 'flex';
        }
    }

    function renderWaste() {
        elements.wastePile.innerHTML = '';
        
        const placeholder = elements.wastePile.querySelector('.pile-placeholder');
        if (gameState.waste.length === 0) {
            if (placeholder) placeholder.style.display = 'flex';
            return;
        }
        if (placeholder) placeholder.style.display = 'none';
        
        const topCard = gameState.waste[gameState.waste.length - 1];
        const cardEl = createCardElement(topCard, true);
        cardEl.dataset.sourceType = 'waste';
        cardEl.dataset.sourceIndex = '-1';
        cardEl.dataset.cardIndex = gameState.waste.length - 1;
        cardEl.classList.add('draggable');
        elements.wastePile.appendChild(cardEl);
        topCard.element = cardEl;
    }

    function renderColumns() {
        gameState.columns.forEach((column, colIndex) => {
            const columnEl = elements.columnEls[colIndex];
            columnEl.querySelectorAll('.card').forEach(c => c.remove());
            
            column.forEach((card, cardIndex) => {
                const cardEl = createCardElement(card, card.faceUp);
                cardEl.style.top = (cardIndex * getColumnOffset()) + 'px';
                cardEl.style.zIndex = cardIndex;
                cardEl.dataset.sourceType = 'column';
                cardEl.dataset.sourceIndex = colIndex;
                cardEl.dataset.cardIndex = cardIndex;
                
                if (card.faceUp) {
                    cardEl.classList.add('draggable');
                }
                
                columnEl.appendChild(cardEl);
                card.element = cardEl;
            });
        });
    }

    function renderFoundations() {
        gameState.foundations.forEach((foundation, foundIndex) => {
            const foundEl = elements.foundationEls[foundIndex];
            foundEl.querySelectorAll('.card').forEach(c => c.remove());
            
            const placeholder = foundEl.querySelector('.pile-placeholder');
            if (foundation.length === 0) {
                if (placeholder) placeholder.style.display = 'flex';
                return;
            }
            if (placeholder) placeholder.style.display = 'none';
            
            const topCard = foundation[foundation.length - 1];
            const cardEl = createCardElement(topCard, true);
            cardEl.dataset.sourceType = 'foundation';
            cardEl.dataset.sourceIndex = foundIndex;
            cardEl.dataset.cardIndex = foundation.length - 1;
            cardEl.classList.add('draggable');
            foundEl.appendChild(cardEl);
            topCard.element = cardEl;
        });
    }

    function createCardElement(card, faceUp) {
        const cardEl = document.createElement('div');
        cardEl.className = `card ${card.color} ${faceUp ? 'face-up' : ''}`;
        cardEl.dataset.suit = card.suit;
        cardEl.dataset.rank = card.rank;
        
        const rankDisplay = RANK_NAMES[card.rank] || card.rank;
        const suitSymbol = SUIT_SYMBOLS[card.suit];
        
        cardEl.innerHTML = `
            <div class="card-inner">
                <div class="card-back">
                    <div class="card-back-pattern"></div>
                </div>
                <div class="card-front">
                    <div class="card-corner top">
                        <span class="card-rank">${rankDisplay}</span>
                        <span class="card-suit-small">${suitSymbol}</span>
                    </div>
                    <div class="card-center">
                        <span class="card-suit-large">${suitSymbol}</span>
                    </div>
                    <div class="card-corner bottom">
                        <span class="card-rank">${rankDisplay}</span>
                        <span class="card-suit-small">${suitSymbol}</span>
                    </div>
                </div>
            </div>
        `;
        
        return cardEl;
    }

    function getColumnOffset() {
        const style = getComputedStyle(document.documentElement);
        const offsetValue = style.getPropertyValue('--column-offset').trim();
        return parseInt(offsetValue) || 30;
    }

    function handleStockClick(e) {
        if (gameState.isWon || dragState.isDragging) return;
        
        if (gameState.stock.length > 0) {
            const card = gameState.stock.pop();
            card.faceUp = true;
            gameState.waste.push(card);
            incrementMoves();
        } else {
            while (gameState.waste.length > 0) {
                const card = gameState.waste.pop();
                card.faceUp = false;
                gameState.stock.push(card);
            }
        }
        
        renderStock();
        renderWaste();
        checkAutoCollect();
    }

    function handleMouseDown(e) {
        if (gameState.isWon) return;
        
        const cardEl = e.target.closest('.card.draggable');
        if (!cardEl) return;
        
        e.preventDefault();
        startDrag(cardEl, e.clientX, e.clientY);
    }

    function handleTouchStart(e) {
        if (gameState.isWon) return;
        
        const touch = e.touches[0];
        const cardEl = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('.card.draggable');
        if (!cardEl) return;
        
        e.preventDefault();
        startDrag(cardEl, touch.clientX, touch.clientY);
    }

    function startDrag(cardEl, clientX, clientY) {
        const sourceType = cardEl.dataset.sourceType;
        const sourceIndex = parseInt(cardEl.dataset.sourceIndex);
        const cardIndex = parseInt(cardEl.dataset.cardIndex);
        
        let sourceArray;
        if (sourceType === 'column') {
            sourceArray = gameState.columns[sourceIndex];
        } else if (sourceType === 'waste') {
            sourceArray = gameState.waste;
        } else if (sourceType === 'foundation') {
            sourceArray = gameState.foundations[sourceIndex];
        } else {
            return;
        }
        
        if (sourceType === 'foundation' && sourceArray.length > 0) {
            dragState.draggedCards = [sourceArray[cardIndex]];
        } else if (sourceType === 'waste') {
            dragState.draggedCards = [sourceArray[cardIndex]];
        } else {
            dragState.draggedCards = sourceArray.slice(cardIndex);
        }
        
        dragState.isDragging = true;
        dragState.sourceType = sourceType;
        dragState.sourceIndex = sourceIndex;
        dragState.cardIndex = cardIndex;
        dragState.startX = clientX;
        dragState.startY = clientY;
        
        const rect = cardEl.getBoundingClientRect();
        dragState.offsetX = clientX - rect.left;
        dragState.offsetY = clientY - rect.top;
        
        createDragClones(clientX, clientY);
        
        dragState.draggedCards.forEach(card => {
            if (card.element) {
                card.element.style.opacity = '0.5';
            }
        });
    }

    function createDragClones(clientX, clientY) {
        dragState.dragClones = [];
        
        dragState.draggedCards.forEach((card, index) => {
            const clone = card.element.cloneNode(true);
            clone.classList.add('drag-clone');
            clone.classList.add('dragging');
            clone.style.width = card.element.offsetWidth + 'px';
            clone.style.height = card.element.offsetHeight + 'px';
            clone.style.left = (clientX - dragState.offsetX) + 'px';
            clone.style.top = (clientY - dragState.offsetY + index * getColumnOffset()) + 'px';
            clone.style.zIndex = 10000 + index;
            elements.dragLayer.appendChild(clone);
            dragState.dragClones.push(clone);
        });
    }

    function handleMouseMove(e) {
        if (!dragState.isDragging) return;
        e.preventDefault();
        updateDragPosition(e.clientX, e.clientY);
    }

    function handleTouchMove(e) {
        if (!dragState.isDragging) return;
        e.preventDefault();
        const touch = e.touches[0];
        updateDragPosition(touch.clientX, touch.clientY);
    }

    function updateDragPosition(clientX, clientY) {
        dragState.dragClones.forEach((clone, index) => {
            clone.style.left = (clientX - dragState.offsetX) + 'px';
            clone.style.top = (clientY - dragState.offsetY + index * getColumnOffset()) + 'px';
        });
        
        checkDropTarget(clientX, clientY);
    }

    function checkDropTarget(clientX, clientY) {
        clearDropHighlight();
        
        const el = document.elementFromPoint(clientX, clientY);
        if (!el) return;
        
        const columnEl = el.closest('.column');
        const foundationEl = el.closest('.foundation-pile');
        
        if (columnEl) {
            const colIndex = parseInt(columnEl.dataset.column);
            const targetColumn = gameState.columns[colIndex];
            const topCard = targetColumn.length > 0 ? targetColumn[targetColumn.length - 1] : null;
            const movingCard = dragState.draggedCards[0];
            
            if (isValidColumnMove(movingCard, topCard)) {
                columnEl.classList.add('drag-over');
                dragState.currentDropTarget = { type: 'column', index: colIndex };
                return;
            }
        }
        
        if (foundationEl && dragState.draggedCards.length === 1) {
            const foundIndex = parseInt(foundationEl.dataset.foundation);
            const movingCard = dragState.draggedCards[0];
            
            if (isValidFoundationMove(movingCard, foundIndex)) {
                foundationEl.classList.add('drag-over');
                dragState.currentDropTarget = { type: 'foundation', index: foundIndex };
                return;
            }
        }
        
        dragState.currentDropTarget = null;
    }

    function clearDropHighlight() {
        document.querySelectorAll('.column.drag-over').forEach(el => {
            el.classList.remove('drag-over');
        });
        document.querySelectorAll('.foundation-pile.drag-over').forEach(el => {
            el.classList.remove('drag-over');
        });
    }

    function handleMouseUp(e) {
        if (!dragState.isDragging) return;
        endDrag();
    }

    function handleTouchEnd(e) {
        if (!dragState.isDragging) return;
        endDrag();
    }

    function endDrag() {
        const dropTarget = dragState.currentDropTarget;
        
        if (dropTarget) {
            executeMove(dropTarget);
        } else {
            dragState.draggedCards.forEach(card => {
                if (card.element) {
                    card.element.style.opacity = '1';
                }
            });
        }
        
        removeDragClones();
        clearDropHighlight();
        
        dragState.isDragging = false;
        dragState.draggedCards = [];
        dragState.currentDropTarget = null;
    }

    function removeDragClones() {
        dragState.dragClones.forEach(clone => {
            clone.remove();
        });
        dragState.dragClones = [];
    }

    function executeMove(dropTarget) {
        const cards = [...dragState.draggedCards];
        const sourceType = dragState.sourceType;
        const sourceIndex = dragState.sourceIndex;
        const cardIndex = dragState.cardIndex;
        
        let sourceArray;
        if (sourceType === 'column') {
            sourceArray = gameState.columns[sourceIndex];
        } else if (sourceType === 'waste') {
            sourceArray = gameState.waste;
        } else if (sourceType === 'foundation') {
            sourceArray = gameState.foundations[sourceIndex];
        }
        
        const removeCount = sourceArray.length - cardIndex;
        for (let i = 0; i < removeCount; i++) {
            sourceArray.pop();
        }
        
        if (dropTarget.type === 'column') {
            gameState.columns[dropTarget.index].push(...cards);
        } else if (dropTarget.type === 'foundation') {
            gameState.foundations[dropTarget.index].push(...cards);
        }
        
        let needFlipColumn = -1;
        if (sourceType === 'column' && sourceArray.length > 0) {
            const lastCard = sourceArray[sourceArray.length - 1];
            if (!lastCard.faceUp) {
                lastCard.faceUp = true;
                needFlipColumn = sourceIndex;
            }
        }
        
        incrementMoves();
        renderAllCards();
        
        if (needFlipColumn >= 0) {
            const columnEl = elements.columnEls[needFlipColumn];
            const lastCardEl = columnEl.querySelector('.card:last-child');
            if (lastCardEl) {
                lastCardEl.classList.add('flipping');
                setTimeout(() => {
                    lastCardEl.classList.remove('flipping');
                }, 500);
            }
        }
        
        checkAutoCollect();
        checkWin();
    }

    function isValidColumnMove(movingCard, targetCard) {
        if (!targetCard) {
            return movingCard.rank === 13;
        }
        
        if (movingCard.color === targetCard.color) {
            return false;
        }
        
        return movingCard.rank === targetCard.rank - 1;
    }

    function isValidFoundationMove(card, foundationIndex) {
        const foundation = gameState.foundations[foundationIndex];
        
        if (foundation.length === 0) {
            return card.rank === 1;
        }
        
        const topCard = foundation[foundation.length - 1];
        return card.suit === topCard.suit && card.rank === topCard.rank + 1;
    }

    function checkAutoCollect() {
        let collected = true;
        while (collected) {
            collected = false;
            let flipColumnIndex = -1;
            
            for (let colIndex = 0; colIndex < 7; colIndex++) {
                const column = gameState.columns[colIndex];
                if (column.length === 0) continue;
                
                const card = column[column.length - 1];
                if (!card.faceUp) continue;
                
                const foundationIndex = SUITS.indexOf(card.suit);
                if (isValidFoundationMove(card, foundationIndex)) {
                    column.pop();
                    gameState.foundations[foundationIndex].push(card);
                    
                    if (column.length > 0) {
                        const lastCard = column[column.length - 1];
                        if (!lastCard.faceUp) {
                            lastCard.faceUp = true;
                            flipColumnIndex = colIndex;
                        }
                    }
                    
                    collected = true;
                    renderAllCards();
                    
                    if (flipColumnIndex >= 0) {
                        const columnEl = elements.columnEls[flipColumnIndex];
                        const lastCardEl = columnEl.querySelector('.card:last-child');
                        if (lastCardEl) {
                            lastCardEl.classList.add('flipping');
                            setTimeout(() => {
                                lastCardEl.classList.remove('flipping');
                            }, 500);
                        }
                    }
                    break;
                }
            }
            
            if (!collected && gameState.waste.length > 0) {
                const card = gameState.waste[gameState.waste.length - 1];
                const foundationIndex = SUITS.indexOf(card.suit);
                if (isValidFoundationMove(card, foundationIndex)) {
                    gameState.waste.pop();
                    gameState.foundations[foundationIndex].push(card);
                    collected = true;
                    renderAllCards();
                }
            }
        }
        
        checkWin();
    }

    function checkWin() {
        const totalInFoundations = gameState.foundations.reduce((sum, f) => sum + f.length, 0);
        if (totalInFoundations === 52 && !gameState.isWon) {
            gameState.isWon = true;
            stopTimer();
            setTimeout(showWinModal, 500);
        }
    }

    function showWinModal() {
        elements.finalTime.textContent = formatTime(gameState.elapsedTime);
        elements.finalMoves.textContent = gameState.moves;
        elements.winModal.classList.add('visible');
        createConfetti();
    }

    function hideWinModal() {
        elements.winModal.classList.remove('visible');
        elements.confettiContainer.innerHTML = '';
    }

    function createConfetti() {
        const colors = ['#D4AF37', '#C41E3A', '#1A1A1A', '#0B4619', '#F4D03F', '#FFFFF0'];
        const container = elements.confettiContainer;
        
        for (let i = 0; i < 100; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = (Math.random() * 2) + 's';
            confetti.style.animationDuration = (2 + Math.random() * 2) + 's';
            
            if (Math.random() > 0.5) {
                confetti.style.borderRadius = '50%';
            } else {
                confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
            }
            
            container.appendChild(confetti);
        }
    }

    function incrementMoves() {
        gameState.moves++;
        updateStatsDisplay();
    }

    function startTimer() {
        gameState.startTime = Date.now();
        gameState.timerInterval = setInterval(() => {
            gameState.elapsedTime = Math.floor((Date.now() - gameState.startTime) / 1000);
            updateStatsDisplay();
        }, 1000);
    }

    function stopTimer() {
        if (gameState.timerInterval) {
            clearInterval(gameState.timerInterval);
            gameState.timerInterval = null;
        }
    }

    function updateStatsDisplay() {
        elements.timer.textContent = formatTime(gameState.elapsedTime);
        elements.moves.textContent = gameState.moves;
    }

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    document.addEventListener('DOMContentLoaded', init);
})();
