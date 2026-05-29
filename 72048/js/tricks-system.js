class TricksSystem {
    constructor() {
        this.currentTrick = null;
        this.trickScore = 0;
        this.combo = 0;
        this.lastKeyPress = null;
        this.keyPressTime = 0;
        this.holdingKey = null;
        this.holdStartTime = 0;
        
        this.tricks = {
            frontFlip: { name: '前空翻', score: 200, key: 'up', doubleTap: true },
            backFlip: { name: '后空翻', score: 200, key: 'down', doubleTap: true },
            rollLeft: { name: '左横滚', score: 150, key: 'left', doubleTap: true },
            rollRight: { name: '右横滚', score: 150, key: 'right', doubleTap: true },
            dive: { name: '俯冲', score: 50, key: 'down', hold: true, perSecond: true },
            glide: { name: '滑翔', score: 30, key: 'up', hold: true, perSecond: true }
        };
        
        this.animationProgress = 0;
        this.isAnimating = false;
        this.activeTrick = null;
        this.trickHistory = [];
    }

    findTrickByKey(key, type) {
        for (const [trickId, trick] of Object.entries(this.tricks)) {
            if (trick.key === key) {
                if (type === 'doubleTap' && trick.doubleTap) return { trickId, trick };
                if (type === 'hold' && trick.hold) return { trickId, trick };
                if (!type) return { trickId, trick };
            }
        }
        return null;
    }

    onKeyDown(key) {
        const now = Date.now();
        
        const doubleTapTrick = this.findTrickByKey(key, 'doubleTap');
        if (doubleTapTrick) {
            if (this.lastKeyPress === key && now - this.keyPressTime < 300) {
                this.triggerTrick(key);
                this.lastKeyPress = null;
            } else {
                this.lastKeyPress = key;
                this.keyPressTime = now;
            }
        }
        
        const holdTrick = this.findTrickByKey(key, 'hold');
        if (holdTrick) {
            this.holdingKey = key;
            this.holdStartTime = now;
        }
    }

    onKeyUp(key) {
        if (this.holdingKey === key) {
            const holdDuration = (Date.now() - this.holdStartTime) / 1000;
            const holdTrick = this.findTrickByKey(key, 'hold');
            if (holdTrick && holdTrick.trick.perSecond && holdDuration > 0.5) {
                const score = Math.floor(holdTrick.trick.score * holdDuration);
                this.addTrickScore(holdTrick.trick.name, score);
            }
            this.holdingKey = null;
        }
    }

    triggerTrick(key) {
        const trickMap = {
            up: 'frontFlip',
            down: 'backFlip',
            left: 'rollLeft',
            right: 'rollRight'
        };
        
        const trickKey = trickMap[key];
        if (trickKey && this.tricks[trickKey]) {
            const trick = this.tricks[trickKey];
            this.activeTrick = trickKey;
            this.isAnimating = true;
            this.animationProgress = 0;
            this.combo++;
            
            const comboMultiplier = 1 + (this.combo - 1) * 0.1;
            const finalScore = Math.floor(trick.score * comboMultiplier);
            
            this.addTrickScore(trick.name, finalScore);
            
            setTimeout(() => {
                this.isAnimating = false;
                this.activeTrick = null;
            }, 1000);
        }
    }

    addTrickScore(name, score) {
        this.trickScore += score;
        this.trickHistory.unshift({ name, score, time: Date.now() });
        if (this.trickHistory.length > 10) {
            this.trickHistory.pop();
        }
    }

    update(deltaTime, player) {
        if (this.isAnimating) {
            this.animationProgress += deltaTime * 2;
            
            switch (this.activeTrick) {
                case 'frontFlip':
                    player.rotation.x = Math.sin(this.animationProgress * Math.PI) * Math.PI;
                    break;
                case 'backFlip':
                    player.rotation.x = -Math.sin(this.animationProgress * Math.PI) * Math.PI;
                    break;
                case 'rollLeft':
                    player.rotation.z = Math.sin(this.animationProgress * Math.PI) * Math.PI;
                    break;
                case 'rollRight':
                    player.rotation.z = -Math.sin(this.animationProgress * Math.PI) * Math.PI;
                    break;
            }
        } else {
            player.rotation.x *= 0.95;
            player.rotation.z *= 0.95;
        }

        if (this.holdingKey) {
            const holdDuration = (Date.now() - this.holdStartTime) / 1000;
            if (holdDuration > 0.5) {
                const trick = this.tricks[this.holdingKey];
                if (trick?.perSecond) {
                    const score = Math.floor(trick.score * deltaTime);
                    this.trickScore += score;
                }
            }
        }
    }

    getTrickScore() {
        return this.trickScore;
    }

    getCombo() {
        return this.combo;
    }

    getRecentTricks() {
        const now = Date.now();
        return this.trickHistory.filter(t => now - t.time < 3000);
    }

    reset() {
        this.trickScore = 0;
        this.combo = 0;
        this.isAnimating = false;
        this.activeTrick = null;
        this.animationProgress = 0;
        this.trickHistory = [];
        this.holdingKey = null;
    }

    isPerformingTrick() {
        return this.isAnimating || this.holdingKey !== null;
    }

    getActiveTrickName() {
        if (this.isAnimating && this.activeTrick) {
            return this.tricks[this.activeTrick].name;
        }
        if (this.holdingKey && this.tricks[this.holdingKey]) {
            return this.tricks[this.holdingKey].name;
        }
        return null;
    }
}
