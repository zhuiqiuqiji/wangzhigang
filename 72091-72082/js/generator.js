class CrosswordGenerator {
    constructor(gridSize = 12) {
        this.gridSize = gridSize;
        this.grid = [];
        this.placedWords = [];
    }

    initializeGrid() {
        this.grid = Array(this.gridSize).fill(null)
            .map(() => Array(this.gridSize).fill(null));
        this.placedWords = [];
    }

    canPlaceWord(word, row, col, direction) {
        const wordPositions = new Set();
        for (let i = 0; i < word.length; i++) {
            const r = direction === 'across' ? row : row + i;
            const c = direction === 'across' ? col + i : col;
            wordPositions.add(`${r},${c}`);
        }
        
        for (let i = 0; i < word.length; i++) {
            const r = direction === 'across' ? row : row + i;
            const c = direction === 'across' ? col + i : col;
            
            if (r < 0 || r >= this.gridSize || c < 0 || c >= this.gridSize) {
                return false;
            }
            
            if (this.grid[r][c] !== null && this.grid[r][c] !== word[i]) {
                return false;
            }
            
            if (this.grid[r][c] === null) {
                const directions = [
                    [-1, 0], [1, 0], [0, -1], [0, 1]
                ];
                
                for (const [dr, dc] of directions) {
                    const nr = r + dr;
                    const nc = c + dc;
                    
                    if (nr >= 0 && nr < this.gridSize && nc >= 0 && nc < this.gridSize) {
                        if (this.grid[nr][nc] !== null && !wordPositions.has(`${nr},${nc}`)) {
                            return false;
                        }
                    }
                }
            }
        }
        
        if (direction === 'across') {
            if (col > 0 && this.grid[row][col - 1] !== null) return false;
            if (col + word.length < this.gridSize && this.grid[row][col + word.length] !== null) return false;
        } else {
            if (row > 0 && this.grid[row - 1][col] !== null) return false;
            if (row + word.length < this.gridSize && this.grid[row + word.length][col] !== null) return false;
        }
        
        return true;
    }

    getIntersections(word) {
        const intersections = [];
        
        for (const placed of this.placedWords) {
            for (let i = 0; i < word.length; i++) {
                for (let j = 0; j < placed.word.length; j++) {
                    if (word[i] === placed.word[j]) {
                        intersections.push({
                            wordIndex: i,
                            placedIndex: j,
                            placedWord: placed,
                            letter: word[i]
                        });
                    }
                }
            }
        }
        
        return intersections;
    }

    tryPlaceWord(wordData) {
        const { word, clue } = wordData;
        
        if (this.placedWords.length === 0) {
            const startRow = Math.floor(this.gridSize / 2);
            const startCol = Math.floor((this.gridSize - word.length) / 2);
            
            if (this.canPlaceWord(word, startRow, startCol, 'across')) {
                this.placeWord(word, clue, startRow, startCol, 'across');
                return true;
            }
            return false;
        }
        
        const intersections = this.getIntersections(word);
        
        for (const intersection of intersections) {
            const { wordIndex, placedWord, placedIndex } = intersection;
            
            let newDirection, newRow, newCol;
            
            if (placedWord.direction === 'across') {
                newDirection = 'down';
                newRow = placedWord.row - wordIndex;
                newCol = placedWord.col + placedIndex;
            } else {
                newDirection = 'across';
                newRow = placedWord.row + placedIndex;
                newCol = placedWord.col - wordIndex;
            }
            
            if (this.canPlaceWord(word, newRow, newCol, newDirection)) {
                this.placeWord(word, clue, newRow, newCol, newDirection);
                return true;
            }
            
            if (placedWord.direction === 'across') {
                newDirection = 'down';
                newRow = placedWord.row + (word.length - 1 - wordIndex);
                newCol = placedWord.col + placedIndex;
            } else {
                newDirection = 'across';
                newRow = placedWord.row + placedIndex;
                newCol = placedWord.col + (word.length - 1 - wordIndex);
            }
            
            if (this.canPlaceWord(word, newRow, newCol, newDirection)) {
                this.placeWord(word, clue, newRow, newCol, newDirection);
                return true;
            }
        }
        
        return false;
    }

    placeWord(word, clue, row, col, direction) {
        for (let i = 0; i < word.length; i++) {
            const r = direction === 'across' ? row : row + i;
            const c = direction === 'across' ? col + i : col;
            this.grid[r][c] = word[i];
        }
        
        this.placedWords.push({
            word,
            clue,
            direction,
            row,
            col
        });
    }

    generate(words, maxAttempts = 100) {
        if (!words || words.length === 0) {
            this.initializeGrid();
            const defaultWords = [
                { word: 'HELLO', clue: 'Greeting' },
                { word: 'WORLD', clue: 'Earth' },
                { word: 'GAME', clue: 'Play activity' },
                { word: 'PUZZLE', clue: 'Problem to solve' },
                { word: 'FUN', clue: 'Enjoyment' }
            ];
            return this.generate(defaultWords, maxAttempts);
        }
        
        this.initializeGrid();
        
        const sortedWords = [...words].sort((a, b) => b.word.length - a.word.length);
        let placedCount = 0;
        
        for (const wordData of sortedWords) {
            if (this.tryPlaceWord(wordData)) {
                placedCount++;
            }
        }
        
        const minWords = Math.min(3, words.length);
        if (placedCount < minWords) {
            if (maxAttempts > 0) {
                return this.generate(shuffleArray(words), maxAttempts - 1);
            }
        }
        
        if (this.placedWords.length === 0 && words.length > 0) {
            this.placeWord(words[0].word, words[0].clue, 
                Math.floor(this.gridSize / 2), 
                Math.floor((this.gridSize - words[0].word.length) / 2), 
                'across');
        }
        
        return this.getResult();
    }

    getResult() {
        const minRow = Math.min(...this.placedWords.map(w => w.row));
        const maxRow = Math.max(...this.placedWords.map(w => 
            w.direction === 'down' ? w.row + w.word.length - 1 : w.row
        ));
        const minCol = Math.min(...this.placedWords.map(w => w.col));
        const maxCol = Math.max(...this.placedWords.map(w => 
            w.direction === 'across' ? w.col + w.word.length - 1 : w.col
        ));
        
        const newSize = Math.max(maxRow - minRow + 1, maxCol - minCol + 1) + 2;
        const offsetRow = 1 - minRow;
        const offsetCol = 1 - minCol;
        
        const adjustedWords = this.placedWords.map(w => ({
            ...w,
            row: w.row + offsetRow,
            col: w.col + offsetCol
        }));
        
        let number = 1;
        const numberedWords = [];
        const numberMap = new Map();
        
        for (const wordData of adjustedWords) {
            const key = `${wordData.row},${wordData.col}`;
            if (!numberMap.has(key)) {
                numberMap.set(key, number++);
            }
            numberedWords.push({
                ...wordData,
                number: numberMap.get(key)
            });
        }
        
        return {
            gridSize: newSize,
            words: numberedWords,
            placedCount: this.placedWords.length
        };
    }
}

function generateCrossword(words, gridSize = 12) {
    const generator = new CrosswordGenerator(gridSize);
    return generator.generate(words);
}

function generateArrowPuzzle(words) {
    const result = generateCrossword(words);
    result.mode = 'arrow';
    result.words.forEach(w => {
        w.arrowDirection = w.direction === 'across' ? '→' : '↓';
    });
    return result;
}

function generateCodewordPuzzle(words) {
    const result = generateCrossword(words);
    result.mode = 'codeword';
    
    const letters = new Set();
    result.words.forEach(w => {
        for (const letter of w.word) {
            letters.add(letter);
        }
    });
    
    const letterArray = Array.from(letters);
    const shuffled = shuffleArray([...letterArray]);
    const codeMap = {};
    
    shuffled.forEach((letter, index) => {
        codeMap[letter] = index + 1;
    });
    
    result.codeMap = codeMap;
    result.hints = {};
    
    const hintLetters = shuffled.slice(0, 3);
    hintLetters.forEach(letter => {
        result.hints[letter] = codeMap[letter];
    });
    
    return result;
}

function getDailyPuzzleSeed() {
    const today = new Date();
    return today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
}

function seededRandom(seed) {
    return function() {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
    };
}

function generateDailyPuzzle() {
    const seed = getDailyPuzzleSeed();
    const random = seededRandom(seed);
    
    const allWords = getAllWords();
    const selectedWords = [];
    const usedIndices = new Set();
    
    while (selectedWords.length < 12 && usedIndices.size < allWords.length) {
        const index = Math.floor(random() * allWords.length);
        if (!usedIndices.has(index)) {
            usedIndices.add(index);
            selectedWords.push(allWords[index]);
        }
    }
    
    const puzzle = generateCrossword(selectedWords);
    puzzle.isDaily = true;
    puzzle.date = new Date().toISOString().split('T')[0];
    return puzzle;
}
