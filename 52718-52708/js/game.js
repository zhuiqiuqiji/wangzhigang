const CardType = {
    INVALID: 'invalid',
    SINGLE: 'single',
    PAIR: 'pair',
    TRIPLE: 'triple',
    TRIPLE_ONE: 'triple+one',
    TRIPLE_TWO: 'triple+two',
    STRAIGHT: 'straight',
    CONSECUTIVE_PAIRS: 'consecutivePairs',
    PLANE: 'plane',
    PLANE_SINGLE: 'plane+single',
    PLANE_PAIR: 'plane+pair',
    BOMB: 'bomb',
    ROCKET: 'rocket',
    FOUR_TWO: 'four+two'
};

const CardSuit = {
    SPADE: 'spade',
    HEART: 'heart',
    CLUB: 'club',
    DIAMOND: 'diamond',
    JOKER: 'joker'
};

const SuitSymbol = {
    spade: '♠',
    heart: '♥',
    club: '♣',
    diamond: '♦',
    joker: '👑'
};

const CardValue = {
    '3': { rank: 3, display: '3' },
    '4': { rank: 4, display: '4' },
    '5': { rank: 5, display: '5' },
    '6': { rank: 6, display: '6' },
    '7': { rank: 7, display: '7' },
    '8': { rank: 8, display: '8' },
    '9': { rank: 9, display: '9' },
    '10': { rank: 10, display: '10' },
    'J': { rank: 11, display: 'J' },
    'Q': { rank: 12, display: 'Q' },
    'K': { rank: 13, display: 'K' },
    'A': { rank: 14, display: 'A' },
    '2': { rank: 15, display: '2' },
    'smallJoker': { rank: 16, display: '小王' },
    'bigJoker': { rank: 17, display: '大王' }
};

let gameState = {
    phase: 'idle',
    players: [],
    deckCards: [],
    currentPlayer: 0,
    landlord: -1,
    lastPlayedCards: null,
    lastPlayedPlayer: -1,
    passCount: 0,
    selectedCards: [],
    callOrder: [0, 1, 2]
};

function createDeck() {
    const deck = [];
    let id = 0;
    const suits = [CardSuit.SPADE, CardSuit.HEART, CardSuit.CLUB, CardSuit.DIAMOND];
    const values = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];

    for (const suit of suits) {
        for (const value of values) {
            deck.push({
                id: id++,
                suit: suit,
                value: value,
                rank: CardValue[value].rank
            });
        }
    }

    deck.push({
        id: id++,
        suit: CardSuit.JOKER,
        value: 'smallJoker',
        rank: CardValue['smallJoker'].rank
    });
    deck.push({
        id: id++,
        suit: CardSuit.JOKER,
        value: 'bigJoker',
        rank: CardValue['bigJoker'].rank
    });

    return deck;
}

function shuffleDeck(deck) {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function sortCards(cards) {
    return cards.sort((a, b) => b.rank - a.rank || a.suit.localeCompare(b.suit));
}

function initGame() {
    gameState = {
        phase: 'calling',
        players: [
            { id: 0, name: '你', cards: [], isLandlord: false },
            { id: 1, name: '电脑左', cards: [], isLandlord: false },
            { id: 2, name: '电脑右', cards: [], isLandlord: false }
        ],
        deckCards: [],
        currentPlayer: 0,
        landlord: -1,
        lastPlayedCards: null,
        lastPlayedPlayer: -1,
        passCount: 0,
        selectedCards: [],
        callOrder: shuffleCallOrder()
    };

    const deck = createDeck();
    const shuffled = shuffleDeck(deck);

    gameState.players[0].cards = sortCards(shuffled.slice(0, 17));
    gameState.players[1].cards = sortCards(shuffled.slice(17, 34));
    gameState.players[2].cards = sortCards(shuffled.slice(34, 51));
    gameState.deckCards = shuffled.slice(51, 54);

    gameState.currentPlayer = gameState.callOrder[0];
}

function shuffleCallOrder() {
    const order = [0, 1, 2];
    for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
    }
    return order;
}

function getCardType(cards) {
    if (!cards || cards.length === 0) {
        return { type: CardType.INVALID, value: 0, cards: cards };
    }

    const sorted = sortCards([...cards]);
    const len = sorted.length;

    if (len === 2) {
        if (sorted[0].value === 'bigJoker' && sorted[1].value === 'smallJoker') {
            return { type: CardType.ROCKET, value: 100, cards: sorted };
        }
    }

    const valueCount = {};
    for (const card of sorted) {
        valueCount[card.rank] = (valueCount[card.rank] || 0) + 1;
    }

    const counts = Object.values(valueCount).sort((a, b) => b - a);
    const ranks = Object.keys(valueCount).map(Number).sort((a, b) => a - b);

    if (len === 1) {
        return { type: CardType.SINGLE, value: sorted[0].rank, cards: sorted };
    }

    if (len === 2 && counts[0] === 2) {
        return { type: CardType.PAIR, value: ranks[0], cards: sorted };
    }

    if (len === 3 && counts[0] === 3) {
        return { type: CardType.TRIPLE, value: ranks[0], cards: sorted };
    }

    if (len === 4 && counts[0] === 4) {
        return { type: CardType.BOMB, value: ranks[0], cards: sorted };
    }

    if (len === 4 && counts[0] === 3 && counts[1] === 1) {
        const tripleRank = ranks.find(r => valueCount[r] === 3);
        return { type: CardType.TRIPLE_ONE, value: tripleRank, cards: sorted };
    }

    if (len === 5 && counts[0] === 3 && counts[1] === 2) {
        const tripleRank = ranks.find(r => valueCount[r] === 3);
        return { type: CardType.TRIPLE_TWO, value: tripleRank, cards: sorted };
    }

    if (len >= 5 && counts.every(c => c === 1)) {
        const isConsecutive = ranks.every((r, i) => i === 0 || r === ranks[i - 1] + 1);
        if (isConsecutive && ranks[ranks.length - 1] < 15) {
            return { type: CardType.STRAIGHT, value: ranks[ranks.length - 1], length: len, cards: sorted };
        }
    }

    if (len >= 6 && len % 2 === 0 && counts.every(c => c === 2)) {
        const isConsecutive = ranks.every((r, i) => i === 0 || r === ranks[i - 1] + 1);
        if (isConsecutive && ranks[ranks.length - 1] < 15) {
            return { type: CardType.CONSECUTIVE_PAIRS, value: ranks[ranks.length - 1], length: len / 2, cards: sorted };
        }
    }

    if (len >= 6 && len % 3 === 0 && counts.every(c => c === 3)) {
        const isConsecutive = ranks.every((r, i) => i === 0 || r === ranks[i - 1] + 1);
        if (isConsecutive && ranks[ranks.length - 1] < 15) {
            return { type: CardType.PLANE, value: ranks[ranks.length - 1], length: len / 3, cards: sorted };
        }
    }

    if (len >= 8 && len % 4 === 0) {
        const tripleCount = len / 4;
        const result = findPlaneWithSingles(valueCount, ranks, tripleCount);
        if (result) {
            return { type: CardType.PLANE_SINGLE, value: result.value, length: tripleCount, cards: sorted };
        }
    }

    if (len >= 10 && len % 5 === 0) {
        const tripleCount = len / 5;
        const result = findPlaneWithPairs(valueCount, ranks, tripleCount);
        if (result) {
            return { type: CardType.PLANE_PAIR, value: result.value, length: tripleCount, cards: sorted };
        }
    }

    if (len === 6 && counts[0] === 4) {
        if (counts[1] === 2 || (counts[1] === 1 && counts[2] === 1)) {
            const fourRank = ranks.find(r => valueCount[r] === 4);
            return { type: CardType.FOUR_TWO, value: fourRank, cards: sorted };
        }
    }

    return { type: CardType.INVALID, value: 0, cards: sorted };
}

function findPlaneWithSingles(valueCount, ranks, tripleCount) {
    const availableTripleRanks = [];
    for (const rank of ranks) {
        if (valueCount[rank] >= 3 && rank < 15) {
            availableTripleRanks.push(rank);
        }
    }

    for (let start = 0; start <= availableTripleRanks.length - tripleCount; start++) {
        let isConsecutive = true;
        const selectedTripleRanks = [];
        for (let i = 0; i < tripleCount; i++) {
            if (availableTripleRanks[start + i] !== availableTripleRanks[start] + i) {
                isConsecutive = false;
                break;
            }
            selectedTripleRanks.push(availableTripleRanks[start + i]);
        }

        if (isConsecutive) {
            let singleCount = 0;
            for (const rank of ranks) {
                const count = valueCount[rank];
                if (selectedTripleRanks.includes(rank)) {
                    if (count >= 4) {
                        singleCount += count - 3;
                    }
                } else {
                    singleCount += count;
                }
            }

            if (singleCount >= tripleCount) {
                return { value: selectedTripleRanks[selectedTripleRanks.length - 1] };
            }
        }
    }
    return null;
}

function findPlaneWithPairs(valueCount, ranks, tripleCount) {
    const availableTripleRanks = [];
    for (const rank of ranks) {
        if (valueCount[rank] >= 3 && rank < 15) {
            availableTripleRanks.push(rank);
        }
    }

    for (let start = 0; start <= availableTripleRanks.length - tripleCount; start++) {
        let isConsecutive = true;
        const selectedTripleRanks = [];
        for (let i = 0; i < tripleCount; i++) {
            if (availableTripleRanks[start + i] !== availableTripleRanks[start] + i) {
                isConsecutive = false;
                break;
            }
            selectedTripleRanks.push(availableTripleRanks[start + i]);
        }

        if (isConsecutive) {
            let pairCount = 0;
            for (const rank of ranks) {
                const count = valueCount[rank];
                if (selectedTripleRanks.includes(rank)) {
                    if (count >= 5) {
                        pairCount += Math.floor((count - 3) / 2);
                    }
                } else {
                    pairCount += Math.floor(count / 2);
                }
            }

            if (pairCount >= tripleCount) {
                return { value: selectedTripleRanks[selectedTripleRanks.length - 1] };
            }
        }
    }
    return null;
}

function canBeat(newCards, lastCards) {
    if (!lastCards || lastCards.type === CardType.INVALID) {
        return newCards.type !== CardType.INVALID;
    }

    if (newCards.type === CardType.ROCKET) {
        return true;
    }

    if (newCards.type === CardType.BOMB && lastCards.type !== CardType.BOMB && lastCards.type !== CardType.ROCKET) {
        return true;
    }

    if (newCards.type === CardType.BOMB && lastCards.type === CardType.BOMB) {
        return newCards.value > lastCards.value;
    }

    if (newCards.type === lastCards.type) {
        if (newCards.length && newCards.length !== lastCards.length) {
            return false;
        }
        return newCards.value > lastCards.value;
    }

    return false;
}

function setLandlord(playerId) {
    gameState.landlord = playerId;
    gameState.players[playerId].isLandlord = true;
    gameState.players[playerId].cards = sortCards([...gameState.players[playerId].cards, ...gameState.deckCards]);
    gameState.phase = 'playing';
    gameState.currentPlayer = playerId;
    gameState.lastPlayedCards = null;
    gameState.lastPlayedPlayer = -1;
}

function doPlayCards(playerId, cards) {
    const cardType = getCardType(cards);
    if (cardType.type === CardType.INVALID) {
        return false;
    }

    if (gameState.lastPlayedCards && gameState.lastPlayedPlayer !== playerId) {
        if (!canBeat(cardType, gameState.lastPlayedCards)) {
            return false;
        }
    }

    const player = gameState.players[playerId];
    for (const card of cards) {
        const idx = player.cards.findIndex(c => c.id === card.id);
        if (idx !== -1) {
            player.cards.splice(idx, 1);
        }
    }

    gameState.lastPlayedCards = cardType;
    gameState.lastPlayedPlayer = playerId;
    gameState.passCount = 0;

    return true;
}

function doPass(playerId) {
    if (gameState.lastPlayedPlayer === playerId) {
        return false;
    }
    gameState.passCount++;
    return true;
}

function nextPlayer() {
    gameState.currentPlayer = (gameState.currentPlayer + 1) % 3;
}

function checkWin() {
    for (let i = 0; i < 3; i++) {
        if (gameState.players[i].cards.length === 0) {
            return {
                winner: i,
                isLandlordWin: gameState.players[i].isLandlord
            };
        }
    }
    return null;
}

function newRoundIfNeeded() {
    if (gameState.passCount >= 2) {
        gameState.lastPlayedCards = null;
        gameState.passCount = 0;
        return true;
    }
    return false;
}
