class AIOpponent {
    constructor() {
        this.opponents = [
            {
                id: 'none',
                name: '单人模式',
                avatar: '👤',
                skill: 0,
                accuracy: 0,
                power: 0,
                spinStyle: 'none',
                isPlayer: true
            },
            {
                id: 'easy',
                name: '新手AI',
                avatar: '🤖',
                skill: 30,
                accuracy: 0.4,
                power: 0.5,
                spinStyle: 'straight',
                description: '初级对手，适合新手练习'
            },
            {
                id: 'medium',
                name: '职业AI',
                avatar: '🤖',
                skill: 70,
                accuracy: 0.75,
                power: 0.8,
                spinStyle: 'hook',
                description: '中级对手，有一定的技术水平'
            },
            {
                id: 'hard',
                name: '大师AI',
                avatar: '🤖',
                skill: 95,
                accuracy: 0.95,
                power: 1.0,
                spinStyle: 'curve',
                description: '高级对手，技术精湛'
            }
        ];
        
        this.currentOpponent = 'none';
        this.isAITurn = false;
        this.aiThinkingTimer = null;
    }

    getOpponents() {
        return this.opponents;
    }

    getCurrentOpponent() {
        return this.opponents.find(o => o.id === this.currentOpponent) || this.opponents[0];
    }

    setOpponent(opponentId) {
        const opponent = this.opponents.find(o => o.id === opponentId);
        if (opponent) {
            this.currentOpponent = opponentId;
            return true;
        }
        return false;
    }

    isMultiplayer() {
        return this.currentOpponent !== 'none';
    }

    calculateAIMove(laneBounds, pins, gameMode) {
        const opponent = this.getCurrentOpponent();
        if (opponent.isPlayer) return null;
        
        const standingPins = pins.filter(p => !p.knocked);
        
        let targetX = laneBounds.centerX;
        let targetY = laneBounds.top + 60;
        
        if (standingPins.length > 0) {
            const avgX = standingPins.reduce((sum, p) => sum + p.x, 0) / standingPins.length;
            const avgY = standingPins.reduce((sum, p) => sum + p.y, 0) / standingPins.length;
            
            const accuracyOffset = (1 - opponent.accuracy) * 50;
            const randomOffsetX = (Math.random() - 0.5) * accuracyOffset;
            const randomOffsetY = (Math.random() - 0.5) * accuracyOffset * 0.5;
            
            targetX = avgX + randomOffsetX;
            targetY = avgY + randomOffsetY;
        }
        
        const ballStartX = laneBounds.centerX;
        const ballStartY = laneBounds.bottom - 80;
        
        const dx = targetX - ballStartX;
        const dy = targetY - ballStartY;
        const angle = Math.atan2(dy, dx);
        
        const basePower = 0.5 + opponent.power * 0.5;
        const powerVariation = (Math.random() - 0.5) * 0.2;
        const power = Math.max(0.3, Math.min(1, basePower + powerVariation));
        
        let spin = 0;
        if (opponent.spinStyle === 'hook') {
            spin = -0.4 - Math.random() * 0.3;
        } else if (opponent.spinStyle === 'curve') {
            spin = -0.6 - Math.random() * 0.4;
        } else if (opponent.spinStyle === 'frisbee') {
            spin = 0.8 + Math.random() * 0.2;
        }
        
        return {
            targetX,
            targetY,
            angle,
            power,
            spin,
            ballStartX,
            ballStartY
        };
    }

    executeAIThrow(physics, laneBounds, pins, gameMode, onThrowComplete) {
        this.isAITurn = true;
        
        const move = this.calculateAIMove(laneBounds, pins, gameMode);
        if (!move) {
            this.isAITurn = false;
            return;
        }
        
        const thinkTime = 1000 + Math.random() * 1500;
        
        setTimeout(() => {
            const speed = move.power * 15 + 5;
            const throwAngle = move.angle;
            
            physics.ball.vx = Math.cos(throwAngle - Math.PI / 2) * speed * 0.5;
            physics.ball.vy = -Math.sin(throwAngle - Math.PI / 2) * speed * 0.5;
            
            physics.ball.spin = move.spin;
            physics.ball.hook = Math.abs(move.spin) * 1.5;
            physics.ball.hookVelocity = move.spin * speed * 0.002;
            physics.ball.rotationSpeed = move.spin * 0.5;
            
            this.isAITurn = false;
            
            if (onThrowComplete) {
                onThrowComplete(move);
            }
        }, thinkTime);
        
        return move;
    }

    getAimPointForDisplay(laneBounds, pins) {
        const standingPins = pins.filter(p => !p.knocked);
        if (standingPins.length === 0) {
            return { x: laneBounds.centerX, y: laneBounds.top + 60 };
        }
        
        const avgX = standingPins.reduce((sum, p) => sum + p.x, 0) / standingPins.length;
        const avgY = standingPins.reduce((sum, p) => sum + p.y, 0) / standingPins.length;
        
        return { x: avgX, y: avgY };
    }

    reset() {
        this.isAITurn = false;
        if (this.aiThinkingTimer) {
            clearTimeout(this.aiThinkingTimer);
            this.aiThinkingTimer = null;
        }
    }

    renderOpponentSelector() {
        const cards = document.querySelectorAll('.opponent-card');
        cards.forEach(card => {
            const opponentId = card.dataset.opponent;
            card.classList.toggle('active', opponentId === this.currentOpponent);
            
            card.addEventListener('click', () => {
                this.setOpponent(opponentId);
                cards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                
                const player2Card = document.getElementById('player2Card');
                if (player2Card) {
                    if (opponentId !== 'none') {
                        player2Card.style.display = 'flex';
                        const opponent = this.getCurrentOpponent();
                        player2Card.querySelector('.player-name').textContent = opponent.name;
                    } else {
                        player2Card.style.display = 'none';
                    }
                }
            });
        });
    }
}

const aiOpponent = new AIOpponent();
