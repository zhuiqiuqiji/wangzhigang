class GameModeSystem {
    constructor() {
        this.gameModes = [
            {
                id: 'standard',
                name: '标准10瓶',
                pinCount: 10,
                pinArrangement: 'triangle',
                pinType: 'standard',
                frames: 10,
                rollsPerFrame: 2,
                maxRollsInFinalFrame: 3,
                scoringType: 'standard',
                description: '经典保龄球规则，10个球瓶三角形排列',
                ballRadius: 20,
                pinRadius: 12,
                pinHeight: 40
            },
            {
                id: 'candle',
                name: '蜡烛瓶',
                pinCount: 10,
                pinArrangement: 'diamond',
                pinType: 'candle',
                frames: 10,
                rollsPerFrame: 3,
                maxRollsInFinalFrame: 3,
                scoringType: 'candle',
                description: '细长球瓶，菱形排列，每轮3次投球机会',
                ballRadius: 15,
                pinRadius: 8,
                pinHeight: 50,
                keepKnockedPins: true
            },
            {
                id: 'duck',
                name: '鸭子瓶',
                pinCount: 10,
                pinArrangement: 'triangle',
                pinType: 'duck',
                frames: 10,
                rollsPerFrame: 3,
                maxRollsInFinalFrame: 3,
                scoringType: 'duck',
                description: '短粗球瓶，三角形排列，小球更难击倒',
                ballRadius: 15,
                pinRadius: 15,
                pinHeight: 30
            }
        ];

        this.currentMode = 'standard';
    }

    getGameModes() {
        return this.gameModes;
    }

    getCurrentMode() {
        return this.gameModes.find(m => m.id === this.currentMode) || this.gameModes[0];
    }

    setGameMode(modeId) {
        const mode = this.gameModes.find(m => m.id === modeId);
        if (mode) {
            this.currentMode = modeId;
            return true;
        }
        return false;
    }

    getPinArrangement(modeId) {
        const mode = this.gameModes.find(m => m.id === modeId) || this.getCurrentMode();
        
        if (mode.pinArrangement === 'triangle') {
            return this.getTriangleArrangement(mode);
        } else if (mode.pinArrangement === 'diamond') {
            return this.getDiamondArrangement(mode);
        }
        
        return this.getTriangleArrangement(mode);
    }

    getTriangleArrangement(mode) {
        const positions = [];
        const rows = [1, 2, 3, 4];
        const pinSpacing = mode.pinRadius * 3;
        
        let pinIndex = 0;
        for (let row = 0; row < rows.length; row++) {
            const pinsInRow = rows[row];
            const rowWidth = (pinsInRow - 1) * pinSpacing;
            
            for (let col = 0; col < pinsInRow; col++) {
                positions.push({
                    index: pinIndex++,
                    row: row,
                    col: col,
                    rowOffsetX: -rowWidth / 2 + col * pinSpacing,
                    rowOffsetY: row * pinSpacing * 0.866
                });
            }
        }
        
        return positions;
    }

    getDiamondArrangement(mode) {
        const positions = [];
        const rows = [1, 2, 3, 2, 1, 1];
        const pinSpacing = mode.pinRadius * 3;
        
        let pinIndex = 0;
        for (let row = 0; row < rows.length; row++) {
            const pinsInRow = rows[row];
            const rowWidth = (pinsInRow - 1) * pinSpacing;
            
            for (let col = 0; col < pinsInRow; col++) {
                positions.push({
                    index: pinIndex++,
                    row: row,
                    col: col,
                    rowOffsetX: -rowWidth / 2 + col * pinSpacing,
                    rowOffsetY: row * pinSpacing * 0.866
                });
            }
        }
        
        return positions;
    }

    calculateScore(frames) {
        const mode = this.getCurrentMode();
        
        if (mode.scoringType === 'standard') {
            return this.calculateStandardScore(frames);
        } else if (mode.scoringType === 'candle') {
            return this.calculateCandleScore(frames);
        } else if (mode.scoringType === 'duck') {
            return this.calculateDuckScore(frames);
        }
        
        return this.calculateStandardScore(frames);
    }

    calculateStandardScore(frames) {
        let totalScore = 0;
        
        for (let i = 0; i < 10; i++) {
            const frame = frames[i];
            if (!frame || frame.firstRoll === null) break;
            
            let frameScore = frame.firstRoll;
            
            if (i < 9) {
                if (frame.isStrike) {
                    frameScore = 10;
                    const next1 = this.getNextRoll(frames, i, 1);
                    const next2 = this.getNextRoll(frames, i, 2);
                    if (next1 !== null) frameScore += next1;
                    if (next2 !== null) frameScore += next2;
                } else if (frame.isSpare) {
                    frameScore = 10;
                    const next1 = this.getNextRoll(frames, i, 1);
                    if (next1 !== null) frameScore += next1;
                } else {
                    frameScore += (frame.secondRoll || 0);
                }
            } else {
                frameScore += (frame.secondRoll || 0);
                if (frame.thirdRoll !== null) {
                    frameScore += frame.thirdRoll;
                }
            }
            
            if (this.isFrameComplete(frames, i)) {
                totalScore += frameScore;
                frame.score = totalScore;
            }
        }
        
        return totalScore;
    }

    calculateCandleScore(frames) {
        let totalScore = 0;
        
        for (let i = 0; i < 10; i++) {
            const frame = frames[i];
            if (!frame || frame.firstRoll === null) break;
            
            let frameScore = frame.firstRoll;
            frameScore += (frame.secondRoll || 0);
            if (frame.thirdRoll !== null) {
                frameScore += frame.thirdRoll;
            }
            
            totalScore += frameScore;
            frame.score = totalScore;
        }
        
        return totalScore;
    }

    calculateDuckScore(frames) {
        return this.calculateCandleScore(frames);
    }

    getNextRoll(frames, currentFrame, rollOffset) {
        let rollsCounted = 0;
        
        for (let i = currentFrame + 1; i < 10 && rollsCounted < rollOffset; i++) {
            const frame = frames[i];
            
            if (frame.firstRoll !== null) {
                rollsCounted++;
                if (rollsCounted === rollOffset) return frame.firstRoll;
            }
            
            if (frame.secondRoll !== null) {
                rollsCounted++;
                if (rollsCounted === rollOffset) return frame.secondRoll;
            }
            
            if (frame.thirdRoll !== null) {
                rollsCounted++;
                if (rollsCounted === rollOffset) return frame.thirdRoll;
            }
        }
        
        return null;
    }

    isFrameComplete(frames, frameIndex) {
        const frame = frames[frameIndex];
        if (!frame) return false;
        
        const mode = this.getCurrentMode();
        
        if (frameIndex < 9) {
            if (frame.isStrike) {
                return this.getNextRoll(frames, frameIndex, 2) !== null;
            } else if (frame.isSpare) {
                return this.getNextRoll(frames, frameIndex, 1) !== null;
            } else {
                return frame.secondRoll !== null;
            }
        } else {
            const totalPins = (frame.firstRoll || 0) + (frame.secondRoll || 0);
            
            if (frame.firstRoll === 10 || (frame.firstRoll + (frame.secondRoll || 0) >= 10)) {
                return frame.thirdRoll !== null;
            } else {
                return frame.secondRoll !== null;
            }
        }
    }

    isStrike(frame, rollNumber) {
        if (rollNumber === 0) {
            return frame.firstRoll === 10;
        }
        return false;
    }

    isSpare(frame) {
        if (frame.firstRoll !== null && frame.secondRoll !== null) {
            return frame.firstRoll < 10 && frame.firstRoll + frame.secondRoll === 10;
        }
        return false;
    }

    needsThirdRoll(frame) {
        const mode = this.getCurrentMode();
        if (mode.id === 'standard') {
            return frame.isStrike || frame.isSpare;
        }
        return true;
    }

    renderModeSelector() {
        const cards = document.querySelectorAll('.mode-card');
        cards.forEach(card => {
            const modeId = card.dataset.mode;
            card.classList.toggle('active', modeId === this.currentMode);
            
            card.addEventListener('click', () => {
                this.setGameMode(modeId);
                cards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');
            });
        });
    }
}

const gameModes = new GameModeSystem();
