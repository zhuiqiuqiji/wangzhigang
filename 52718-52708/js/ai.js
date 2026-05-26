function aiCallLandlord(playerId) {
    const cards = gameState.players[playerId].cards;
    let score = 0;

    const valueCount = {};
    for (const card of cards) {
        valueCount[card.rank] = (valueCount[card.rank] || 0) + 1;
    }

    for (const rank in valueCount) {
        if (valueCount[rank] === 4) {
            score += 5;
        }
    }

    const hasBigJoker = cards.some(c => c.value === 'bigJoker');
    const hasSmallJoker = cards.some(c => c.value === 'smallJoker');
    if (hasBigJoker && hasSmallJoker) {
        score += 6;
    } else if (hasBigJoker) {
        score += 2;
    } else if (hasSmallJoker) {
        score += 1;
    }

    const twoCount = valueCount[15] || 0;
    score += twoCount * 2;

    const aceCount = valueCount[14] || 0;
    score += aceCount;

    const kingCount = valueCount[13] || 0;
    score += kingCount * 0.5;

    const straightCount = countStraights(cards);
    score += straightCount * 2;

    const pairCount = Object.values(valueCount).filter(c => c === 2).length;
    score += pairCount * 0.5;

    if (gameSettings.mode === 'noshuffle') {
        score += 2;
    }

    const randomFactor = Math.random() * 2 - 1;
    score += randomFactor;

    return score >= 5;
}

function countStraights(cards) {
    const valueCount = {};
    for (const card of cards) {
        if (card.rank < 15) {
            valueCount[card.rank] = (valueCount[card.rank] || 0) + 1;
        }
    }

    let maxStraight = 0;
    let current = 0;
    for (let i = 3; i <= 14; i++) {
        if (valueCount[i]) {
            current++;
            maxStraight = Math.max(maxStraight, current);
        } else {
            current = 0;
        }
    }

    return maxStraight >= 5 ? maxStraight - 4 : 0;
}

function aiPlayCards(playerId) {
    const player = gameState.players[playerId];
    const cards = player.cards;
    const lastPlayed = gameState.lastPlayedCards;
    const isLandlord = player.isLandlord;

    if (!lastPlayed || gameState.lastPlayedPlayer === playerId) {
        return aiPlayFirstHand(cards, isLandlord);
    }

    return aiPlayBeat(cards, lastPlayed, isLandlord);
}

function aiPlayFirstHand(cards, isLandlord) {
    const valueCount = {};
    for (const card of cards) {
        valueCount[card.rank] = (valueCount[card.rank] || 0) + 1;
    }

    const ranks = Object.keys(valueCount).map(Number).sort((a, b) => a - b);

    const straightResult = findBestStraight(cards, ranks, valueCount);
    if (straightResult) {
        return straightResult;
    }

    const planeResult = findBestPlane(cards, ranks, valueCount);
    if (planeResult) {
        return planeResult;
    }

    const tripleResult = findBestTriple(cards, ranks, valueCount);
    if (tripleResult) {
        return tripleResult;
    }

    const pairResult = findBestPair(cards, ranks, valueCount);
    if (pairResult) {
        return pairResult;
    }

    const singleResult = findBestSingle(cards, ranks, valueCount);
    if (singleResult) {
        return singleResult;
    }

    if (cards.length > 0) {
        return [cards[cards.length - 1]];
    }

    return null;
}

function findBestSingle(cards, ranks, valueCount) {
    for (const rank of ranks) {
        if (valueCount[rank] === 1 && rank < 15) {
            const card = cards.find(c => c.rank === rank);
            if (card) {
                return [card];
            }
        }
    }

    for (const rank of ranks) {
        if (valueCount[rank] === 1) {
            const card = cards.find(c => c.rank === rank);
            if (card) {
                return [card];
            }
        }
    }

    return null;
}

function findBestPair(cards, ranks, valueCount) {
    for (const rank of ranks) {
        if (valueCount[rank] === 2 && rank < 15) {
            const pairCards = cards.filter(c => c.rank === rank);
            if (pairCards.length >= 2) {
                return pairCards.slice(0, 2);
            }
        }
    }
    return null;
}

function findBestTriple(cards, ranks, valueCount) {
    for (const rank of ranks) {
        if (valueCount[rank] >= 3 && rank < 15) {
            const tripleCards = cards.filter(c => c.rank === rank).slice(0, 3);
            
            for (const otherRank of ranks) {
                if (otherRank !== rank && valueCount[otherRank] >= 2) {
                    const extraCards = cards.filter(c => c.rank === otherRank).slice(0, 2);
                    return [...tripleCards, ...extraCards];
                }
            }
            
            for (const otherRank of ranks) {
                if (otherRank !== rank && valueCount[otherRank] >= 1) {
                    const extraCard = cards.find(c => c.rank === otherRank);
                    if (extraCard) {
                        return [...tripleCards, extraCard];
                    }
                }
            }
            
            return tripleCards;
        }
    }
    return null;
}

function findBestStraight(cards, ranks, valueCount) {
    let maxLen = 0;
    let bestStart = -1;

    for (let start = 3; start <= 10; start++) {
        let len = 0;
        while (valueCount[start + len]) {
            len++;
        }
        if (len >= 5 && len > maxLen) {
            maxLen = len;
            bestStart = start;
        }
    }

    if (bestStart > 0) {
        const straightCards = [];
        for (let i = 0; i < maxLen; i++) {
            const card = cards.find(c => c.rank === bestStart + i);
            if (card) {
                straightCards.push(card);
            }
        }
        return straightCards;
    }

    return null;
}

function findBestPlane(cards, ranks, valueCount) {
    const tripleRanks = ranks.filter(r => valueCount[r] >= 3 && r < 15);
    
    if (tripleRanks.length >= 2) {
        tripleRanks.sort((a, b) => a - b);
        
        let currentStart = tripleRanks[0];
        let currentLen = 1;
        let bestLen = 1;
        let bestStart = tripleRanks[0];

        for (let i = 1; i < tripleRanks.length; i++) {
            if (tripleRanks[i] === tripleRanks[i - 1] + 1) {
                currentLen++;
                if (currentLen > bestLen) {
                    bestLen = currentLen;
                    bestStart = tripleRanks[i] - currentLen + 1;
                }
            } else {
                currentLen = 1;
                currentStart = tripleRanks[i];
            }
        }

        if (bestLen >= 2) {
            const planeCards = [];
            const extraRanks = [];
            
            for (let i = 0; i < bestLen; i++) {
                const rank = bestStart + i;
                planeCards.push(...cards.filter(c => c.rank === rank).slice(0, 3));
            }

            for (const rank of ranks) {
                if (rank < bestStart || rank >= bestStart + bestLen) {
                    for (let i = 0; i < valueCount[rank] && extraRanks.length < bestLen; i++) {
                        extraRanks.push(rank);
                    }
                }
            }

            if (extraRanks.length >= bestLen) {
                for (let i = 0; i < bestLen; i++) {
                    const card = cards.find(c => c.rank === extraRanks[i] && !planeCards.includes(c));
                    if (card) {
                        planeCards.push(card);
                    }
                }
                return planeCards;
            }

            return planeCards;
        }
    }

    return null;
}

function aiPlayBeat(cards, lastPlayed, isLandlord) {
    const results = findAllPlays(cards, lastPlayed);

    if (results.length === 0) {
        return null;
    }

    results.sort((a, b) => {
        const typeA = getCardType(a);
        const typeB = getCardType(b);

        if (typeA.type === CardType.BOMB && typeB.type !== CardType.BOMB) {
            return isLandlord ? -1 : 1;
        }
        if (typeB.type === CardType.BOMB && typeA.type !== CardType.BOMB) {
            return isLandlord ? 1 : -1;
        }

        return typeA.value - typeB.value;
    });

    return results[0];
}

function findAllPlays(cards, lastPlayed) {
    const results = [];
    const valueCount = {};
    for (const card of cards) {
        valueCount[card.rank] = (valueCount[card.rank] || 0) + 1;
    }

    const ranks = Object.keys(valueCount).map(Number).sort((a, b) => a - b);

    if (lastPlayed.type === CardType.SINGLE) {
        for (const rank of ranks) {
            if (rank > lastPlayed.value && valueCount[rank] >= 1) {
                const card = cards.find(c => c.rank === rank);
                if (card) {
                    results.push([card]);
                }
            }
        }
    }

    if (lastPlayed.type === CardType.PAIR) {
        for (const rank of ranks) {
            if (rank > lastPlayed.value && valueCount[rank] >= 2) {
                const pairCards = cards.filter(c => c.rank === rank).slice(0, 2);
                results.push(pairCards);
            }
        }
    }

    if (lastPlayed.type === CardType.TRIPLE) {
        for (const rank of ranks) {
            if (rank > lastPlayed.value && valueCount[rank] >= 3) {
                const tripleCards = cards.filter(c => c.rank === rank).slice(0, 3);
                results.push(tripleCards);
            }
        }
    }

    if (lastPlayed.type === CardType.TRIPLE_ONE) {
        for (const rank of ranks) {
            if (rank > lastPlayed.value && valueCount[rank] >= 3) {
                const tripleCards = cards.filter(c => c.rank === rank).slice(0, 3);
                for (const otherRank of ranks) {
                    if (valueCount[otherRank] >= 1) {
                        if (otherRank === rank && valueCount[otherRank] < 4) continue;
                        const extraCard = cards.find(c => c.rank === otherRank && !tripleCards.includes(c));
                        if (extraCard) {
                            results.push([...tripleCards, extraCard]);
                        }
                    }
                }
            }
        }
    }

    if (lastPlayed.type === CardType.TRIPLE_TWO) {
        for (const rank of ranks) {
            if (rank > lastPlayed.value && valueCount[rank] >= 3) {
                const tripleCards = cards.filter(c => c.rank === rank).slice(0, 3);
                for (const otherRank of ranks) {
                    if (valueCount[otherRank] >= 2) {
                        if (otherRank === rank && valueCount[otherRank] < 5) continue;
                        const extraCards = cards.filter(c => c.rank === otherRank && !tripleCards.includes(c)).slice(0, 2);
                        if (extraCards.length === 2) {
                            results.push([...tripleCards, ...extraCards]);
                        }
                    }
                }
            }
        }
    }

    if (lastPlayed.type === CardType.STRAIGHT) {
        const length = lastPlayed.length;
        for (let start = 3; start <= 14 - length + 1; start++) {
            let valid = true;
            const straightCards = [];
            for (let i = 0; i < length; i++) {
                if (!valueCount[start + i] || valueCount[start + i] < 1) {
                    valid = false;
                    break;
                }
                const card = cards.find(c => c.rank === start + i);
                if (card) {
                    straightCards.push(card);
                }
            }
            if (valid && start + length - 1 > lastPlayed.value) {
                results.push(straightCards);
            }
        }
    }

    if (lastPlayed.type === CardType.CONSECUTIVE_PAIRS) {
        const length = lastPlayed.length;
        for (let start = 3; start <= 14 - length + 1; start++) {
            let valid = true;
            const pairCards = [];
            for (let i = 0; i < length; i++) {
                if (!valueCount[start + i] || valueCount[start + i] < 2) {
                    valid = false;
                    break;
                }
                const cardsOfRank = cards.filter(c => c.rank === start + i).slice(0, 2);
                pairCards.push(...cardsOfRank);
            }
            if (valid && start + length - 1 > lastPlayed.value) {
                results.push(pairCards);
            }
        }
    }

    if (lastPlayed.type === CardType.PLANE) {
        const length = lastPlayed.length;
        for (let start = 3; start <= 14 - length + 1; start++) {
            let valid = true;
            const planeCards = [];
            for (let i = 0; i < length; i++) {
                const checkRank = start + i;
                if (!valueCount[checkRank] || valueCount[checkRank] < 3) {
                    valid = false;
                    break;
                }
                planeCards.push(...cards.filter(c => c.rank === checkRank).slice(0, 3));
            }
            if (valid && start + length - 1 > lastPlayed.value) {
                results.push(planeCards);
            }
        }
    }

    if (lastPlayed.type === CardType.PLANE_SINGLE) {
        const length = lastPlayed.length;
        const result = findPlaneWithSinglesForAI(cards, ranks, valueCount, length, lastPlayed.value);
        if (result) {
            results.push(result);
        }
    }

    if (lastPlayed.type === CardType.PLANE_PAIR) {
        const length = lastPlayed.length;
        const result = findPlaneWithPairsForAI(cards, ranks, valueCount, length, lastPlayed.value);
        if (result) {
            results.push(result);
        }
    }

    if (lastPlayed.type === CardType.FOUR_TWO) {
        for (const rank of ranks) {
            if (rank > lastPlayed.value && valueCount[rank] >= 4) {
                const fourCards = cards.filter(c => c.rank === rank).slice(0, 4);
                
                for (const otherRank1 of ranks) {
                    if (otherRank1 === rank) continue;
                    for (const otherRank2 of ranks) {
                        if (otherRank2 === rank || otherRank2 < otherRank1) continue;
                        
                        if (valueCount[otherRank1] >= 1 && valueCount[otherRank2] >= 1) {
                            const card1 = cards.find(c => c.rank === otherRank1);
                            const card2 = cards.find(c => c.rank === otherRank2);
                            if (card1 && card2) {
                                results.push([...fourCards, card1, card2]);
                            }
                        }
                        
                        if (valueCount[otherRank1] >= 2) {
                            const extraCards = cards.filter(c => c.rank === otherRank1).slice(0, 2);
                            if (extraCards.length === 2) {
                                results.push([...fourCards, ...extraCards]);
                            }
                        }
                    }
                }
            }
        }
    }

    if (lastPlayed.type === CardType.BOMB) {
        for (const rank of ranks) {
            if (rank > lastPlayed.value && valueCount[rank] === 4) {
                const bombCards = cards.filter(c => c.rank === rank);
                results.push(bombCards);
            }
        }
    }

    for (const rank of ranks) {
        if (valueCount[rank] === 4 && lastPlayed.type !== CardType.BOMB && lastPlayed.type !== CardType.ROCKET) {
            const bombCards = cards.filter(c => c.rank === rank);
            results.push(bombCards);
        }
    }

    const hasBigJoker = cards.some(c => c.value === 'bigJoker');
    const hasSmallJoker = cards.some(c => c.value === 'smallJoker');
    if (hasBigJoker && hasSmallJoker) {
        results.push(cards.filter(c => c.value === 'bigJoker' || c.value === 'smallJoker'));
    }

    return results;
}

function findPlaneWithSinglesForAI(cards, ranks, valueCount, tripleCount, minValue) {
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

        if (isConsecutive && selectedTripleRanks[selectedTripleRanks.length - 1] > minValue) {
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
                const resultCards = [];
                for (const rank of selectedTripleRanks) {
                    resultCards.push(...cards.filter(c => c.rank === rank).slice(0, 3));
                }
                
                let extrasAdded = 0;
                for (const rank of ranks) {
                    if (extrasAdded >= tripleCount) break;
                    const extraCards = cards.filter(c => c.rank === rank && !resultCards.includes(c));
                    for (const card of extraCards) {
                        if (extrasAdded >= tripleCount) break;
                        resultCards.push(card);
                        extrasAdded++;
                    }
                }
                
                return resultCards;
            }
        }
    }
    return null;
}

function findPlaneWithPairsForAI(cards, ranks, valueCount, tripleCount, minValue) {
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

        if (isConsecutive && selectedTripleRanks[selectedTripleRanks.length - 1] > minValue) {
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
                const resultCards = [];
                for (const rank of selectedTripleRanks) {
                    resultCards.push(...cards.filter(c => c.rank === rank).slice(0, 3));
                }
                
                let pairsAdded = 0;
                for (const rank of ranks) {
                    if (pairsAdded >= tripleCount) break;
                    const extraCards = cards.filter(c => c.rank === rank && !resultCards.includes(c));
                    if (extraCards.length >= 2) {
                        resultCards.push(...extraCards.slice(0, 2));
                        pairsAdded++;
                    }
                }
                
                return resultCards;
            }
        }
    }
    return null;
}

function aiShouldPass(playerId) {
    if (gameState.lastPlayedPlayer === playerId) {
        return false;
    }

    const cards = gameState.players[playerId].cards;
    const lastPlayed = gameState.lastPlayedCards;

    if (!lastPlayed) {
        return false;
    }

    const plays = findAllPlays(cards, lastPlayed);
    
    if (plays.length === 0) {
        return true;
    }

    const hasBomb = plays.some(p => {
        const type = getCardType(p);
        return type.type === CardType.BOMB || type.type === CardType.ROCKET;
    });

    if (hasBomb && !gameState.players[playerId].isLandlord) {
        const nonBombPlays = plays.filter(p => {
            const type = getCardType(p);
            return type.type !== CardType.BOMB && type.type !== CardType.ROCKET;
        });
        return nonBombPlays.length === 0 && cards.length > 10;
    }

    return false;
}

function findPairsForPlane(cards, count) {
    const results = [];
    const valueCount = {};
    for (const card of cards) {
        valueCount[card.rank] = (valueCount[card.rank] || 0) + 1;
    }

    const ranks = Object.keys(valueCount).map(Number).sort((a, b) => a - b);
    const availablePairs = [];

    for (const rank of ranks) {
        if (valueCount[rank] >= 2) {
            availablePairs.push(...cards.filter(c => c.rank === rank).slice(0, 2));
        }
    }

    if (availablePairs.length >= count * 2) {
        results.push(availablePairs.slice(0, count * 2));
    }

    return results;
}
