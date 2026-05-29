class ScoringSystem {
    constructor() {
        this.frames = [];
        this.currentFrame = 0;
        this.currentRoll = 0;
        this.initFrames();
    }

    initFrames() {
        this.frames = [];
        for (let i = 0; i < 10; i++) {
            this.frames.push({
                firstRoll: null,
                secondRoll: null,
                thirdRoll: null,
                isStrike: false,
                isSpare: false,
                score: null
            });
        }
        this.currentFrame = 0;
        this.currentRoll = 0;
    }

    recordRoll(pinsKnocked) {
        const frame = this.frames[this.currentFrame];
        
        if (this.currentFrame < 9) {
            if (this.currentRoll === 0) {
                frame.firstRoll = pinsKnocked;
                if (pinsKnocked === 10) {
                    frame.isStrike = true;
                    this.currentFrame++;
                    this.currentRoll = 0;
                } else {
                    this.currentRoll = 1;
                }
            } else {
                frame.secondRoll = pinsKnocked;
                if (frame.firstRoll + pinsKnocked === 10) {
                    frame.isSpare = true;
                }
                this.currentFrame++;
                this.currentRoll = 0;
            }
        } else {
            if (this.currentRoll === 0) {
                frame.firstRoll = pinsKnocked;
                if (pinsKnocked === 10) {
                    frame.isStrike = true;
                }
                this.currentRoll = 1;
            } else if (this.currentRoll === 1) {
                frame.secondRoll = pinsKnocked;
                if (frame.firstRoll + pinsKnocked === 10 && !frame.isStrike) {
                    frame.isSpare = true;
                }
                if (frame.isStrike || frame.isSpare || (frame.firstRoll + pinsKnocked >= 10)) {
                    this.currentRoll = 2;
                } else {
                    this.currentFrame++;
                }
            } else {
                frame.thirdRoll = pinsKnocked;
                this.currentFrame++;
            }
        }
        
        this.calculateScores();
    }

    calculateScores() {
        let totalScore = 0;
        
        for (let i = 0; i < 10; i++) {
            const frame = this.frames[i];
            let frameScore = 0;
            
            if (frame.firstRoll === null) break;
            
            if (i < 9) {
                if (frame.isStrike) {
                    frameScore = 10 + this.getStrikeBonus(i);
                } else if (frame.isSpare) {
                    frameScore = 10 + this.getSpareBonus(i);
                } else {
                    frameScore = frame.firstRoll + (frame.secondRoll || 0);
                }
            } else {
                frameScore = frame.firstRoll + (frame.secondRoll || 0) + (frame.thirdRoll || 0);
            }
            
            if (this.isFrameComplete(i)) {
                totalScore += frameScore;
                frame.score = totalScore;
            }
        }
    }

    getStrikeBonus(frameIndex) {
        let bonus = 0;
        let rollsCounted = 0;
        
        for (let i = frameIndex + 1; i < 10 && rollsCounted < 2; i++) {
            const nextFrame = this.frames[i];
            
            if (nextFrame.firstRoll !== null) {
                bonus += nextFrame.firstRoll;
                rollsCounted++;
            }
            
            if (rollsCounted < 2 && nextFrame.secondRoll !== null) {
                bonus += nextFrame.secondRoll;
                rollsCounted++;
            } else if (rollsCounted < 2 && nextFrame.isStrike) {
                continue;
            }
        }
        
        return bonus;
    }

    getSpareBonus(frameIndex) {
        if (frameIndex + 1 < 10) {
            const nextFrame = this.frames[frameIndex + 1];
            return nextFrame.firstRoll !== null ? nextFrame.firstRoll : 0;
        }
        return 0;
    }

    isFrameComplete(frameIndex) {
        const frame = this.frames[frameIndex];
        
        if (frameIndex < 9) {
            if (frame.isStrike) {
                return this.getStrikeBonus(frameIndex) >= 0 && this.hasEnoughRollsForStrike(frameIndex);
            } else if (frame.isSpare) {
                return this.frames[frameIndex + 1]?.firstRoll !== null;
            } else {
                return frame.firstRoll !== null && frame.secondRoll !== null;
            }
        } else {
            if (frame.isStrike || frame.isSpare) {
                return frame.thirdRoll !== null;
            } else {
                return frame.firstRoll !== null && frame.secondRoll !== null;
            }
        }
    }

    hasEnoughRollsForStrike(frameIndex) {
        let rollsNeeded = 2;
        
        for (let i = frameIndex + 1; i < 10 && rollsNeeded > 0; i++) {
            const frame = this.frames[i];
            
            if (frame.firstRoll !== null) {
                rollsNeeded--;
            } else {
                return false;
            }
            
            if (!frame.isStrike || i === 9) {
                if (frame.secondRoll !== null) {
                    rollsNeeded--;
                } else if (rollsNeeded > 0) {
                    return false;
                }
            }
        }
        
        return rollsNeeded <= 0;
    }

    getTotalScore() {
        let total = 0;
        for (const frame of this.frames) {
            if (frame.score !== null) {
                total = frame.score;
            }
        }
        return total;
    }

    isGameComplete() {
        return this.currentFrame >= 10;
    }

    getRollDisplay(frameIndex, rollIndex) {
        const frame = this.frames[frameIndex];
        
        if (frameIndex < 9) {
            if (rollIndex === 0) {
                if (frame.isStrike) return 'X';
                return frame.firstRoll !== null ? frame.firstRoll : '';
            } else {
                if (frame.isSpare) return '/';
                if (frame.firstRoll === null) return '';
                return frame.secondRoll !== null ? frame.secondRoll : '';
            }
        } else {
            if (rollIndex === 0) {
                if (frame.firstRoll === 10) return 'X';
                return frame.firstRoll !== null ? frame.firstRoll : '';
            } else if (rollIndex === 1) {
                if (frame.firstRoll === null) return '';
                if (frame.secondRoll === 10) return 'X';
                if (frame.firstRoll + (frame.secondRoll || 0) === 10 && !frame.isStrike) return '/';
                return frame.secondRoll !== null ? frame.secondRoll : '';
            } else {
                if (frame.thirdRoll === 10) return 'X';
                if (frame.secondRoll !== null && frame.thirdRoll !== null && 
                    frame.secondRoll < 10 && frame.secondRoll + frame.thirdRoll === 10) return '/';
                return frame.thirdRoll !== null ? frame.thirdRoll : '';
            }
        }
    }

    updateScoreboard() {
        const rollsRow = document.getElementById('rollsRow');
        const scoreRow = document.getElementById('scoreRow');
        
        rollsRow.innerHTML = '';
        scoreRow.innerHTML = '';
        
        for (let i = 0; i < 10; i++) {
            const frame = this.frames[i];
            
            const rollCell = document.createElement('td');
            rollCell.colSpan = 3;
            rollCell.style.cssText = 'padding: 0; border: none;';
            
            const rollInnerTable = document.createElement('table');
            rollInnerTable.style.cssText = 'width: 100%; border-collapse: collapse;';
            
            const rollInnerRow = document.createElement('tr');
            
            if (i < 9) {
                for (let j = 0; j < 2; j++) {
                    const innerCell = document.createElement('td');
                    innerCell.style.cssText = 'width: 50%; padding: 4px; border: 1px solid rgba(255,255,255,0.1); font-size: 14px;';
                    innerCell.textContent = this.getRollDisplay(i, j);
                    rollInnerRow.appendChild(innerCell);
                }
            } else {
                for (let j = 0; j < 3; j++) {
                    const innerCell = document.createElement('td');
                    innerCell.style.cssText = 'width: 33%; padding: 4px; border: 1px solid rgba(255,255,255,0.1); font-size: 14px;';
                    innerCell.textContent = this.getRollDisplay(i, j);
                    rollInnerRow.appendChild(innerCell);
                }
            }
            
            rollInnerTable.appendChild(rollInnerRow);
            rollCell.appendChild(rollInnerTable);
            rollsRow.appendChild(rollCell);
            
            const scoreCell = document.createElement('td');
            scoreCell.colSpan = 3;
            scoreCell.textContent = frame.score !== null ? frame.score : '';
            scoreRow.appendChild(scoreCell);
        }
        
        document.getElementById('totalScore').textContent = this.getTotalScore();
    }
}
