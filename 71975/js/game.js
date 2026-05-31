class SoccerGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.powerFill = document.getElementById('powerFill');
        this.messageEl = document.getElementById('message');
        
        this.gameState = {
            shotsRemaining: 10,
            goalsScored: 0,
            totalScore: 0,
            isDragging: false,
            isShooting: false,
            gameOver: false
        };
        
        this.ball = {
            x: 400,
            y: 480,
            prevX: 400,
            prevY: 480,
            vx: 0,
            vy: 0,
            radius: 18,
            rotation: 0,
            startX: 400,
            startY: 480
        };
        
        this.dragStart = { x: 0, y: 0 };
        this.dragEnd = { x: 0, y: 0 };
        
        this.goalkeeper = {
            x: 400,
            y: 140,
            width: 50,
            height: 70,
            targetX: 400,
            speed: 4,
            isDiving: false,
            diveDirection: 0,
            diveProgress: 0
        };
        
        this.goal = {
            x: 250,
            y: 50,
            width: 300,
            height: 180
        };
        
        this.goalZones = [
            { name: '左上死角', points: 100, x1: 0, y1: 0, x2: 75, y2: 60 },
            { name: '右上死角', points: 100, x1: 225, y1: 0, x2: 300, y2: 60 },
            { name: '左侧', points: 50, x1: 0, y1: 60, x2: 75, y2: 180 },
            { name: '右侧', points: 50, x1: 225, y1: 60, x2: 300, y2: 180 },
            { name: '中心', points: 20, x1: 75, y1: 0, x2: 225, y2: 180 }
        ];
        
        this.particles = [];
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.gameLoop();
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handleMouseLeave(e));
        
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
    }
    
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }
    
    getTouchPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const touch = e.touches[0] || e.changedTouches[0];
        return {
            x: (touch.clientX - rect.left) * scaleX,
            y: (touch.clientY - rect.top) * scaleY
        };
    }
    
    handleMouseDown(e) {
        if (this.gameState.isShooting || this.gameState.gameOver) return;
        const pos = this.getMousePos(e);
        const dist = Math.hypot(pos.x - this.ball.x, pos.y - this.ball.y);
        if (dist < this.ball.radius + 20) {
            this.gameState.isDragging = true;
            this.dragStart = { x: this.ball.x, y: this.ball.y };
            this.dragEnd = { x: pos.x, y: pos.y };
        }
    }
    
    handleMouseMove(e) {
        if (!this.gameState.isDragging) return;
        this.dragEnd = this.getMousePos(e);
        this.updatePowerBar();
    }
    
    handleMouseUp(e) {
        if (!this.gameState.isDragging) return;
        this.gameState.isDragging = false;
        this.shoot();
    }
    
    handleMouseLeave(e) {
        if (!this.gameState.isDragging) return;
        this.gameState.isDragging = false;
        this.powerFill.style.height = '0%';
    }
    
    handleTouchStart(e) {
        e.preventDefault();
        this.handleMouseDown({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        this.handleMouseMove({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
        this.handleMouseUp({});
    }
    
    updatePowerBar() {
        const dx = this.dragStart.x - this.dragEnd.x;
        const dy = this.dragStart.y - this.dragEnd.y;
        const distance = Math.hypot(dx, dy);
        const maxDistance = 200;
        const power = Math.min(distance / maxDistance, 1) * 100;
        this.powerFill.style.height = power + '%';
    }
    
    shoot() {
        const dx = this.dragStart.x - this.dragEnd.x;
        const dy = this.dragStart.y - this.dragEnd.y;
        const distance = Math.hypot(dx, dy);
        
        if (distance < 20) {
            this.powerFill.style.height = '0%';
            return;
        }
        
        const maxDistance = 200;
        const power = Math.min(distance / maxDistance, 1);
        const maxSpeed = 20;
        const speed = power * maxSpeed + 5;
        
        const angle = Math.atan2(dy, dx);
        this.ball.vx = Math.cos(angle) * speed;
        this.ball.vy = Math.sin(angle) * speed;
        
        this.gameState.isShooting = true;
        this.powerFill.style.height = '0%';
        
        this.predictAndSave();
    }
    
    predictAndSave() {
        const gravity = 0.15;
        const targetY = this.goal.y + this.goal.height / 2;
        
        const vy0 = this.ball.vy;
        const y0 = this.ball.y;
        const dy = targetY - y0;
        
        let timeToGoal;
        if (Math.abs(gravity) < 0.001) {
            timeToGoal = dy / vy0;
        } else {
            const discriminant = vy0 * vy0 + 2 * gravity * dy;
            if (discriminant < 0) {
                timeToGoal = Math.abs(dy / vy0);
            } else {
                const t1 = (-vy0 + Math.sqrt(discriminant)) / gravity;
                const t2 = (-vy0 - Math.sqrt(discriminant)) / gravity;
                timeToGoal = Math.max(t1, t2);
                if (timeToGoal < 0) {
                    timeToGoal = Math.abs(dy / vy0);
                }
            }
        }
        
        const predictedX = this.ball.x + this.ball.vx * timeToGoal;
        
        const reactionDelay = Math.random() * 10 + 5;
        const accuracy = Math.random() * 0.7 + 0.3;
        
        setTimeout(() => {
            const offset = (Math.random() - 0.5) * 80 * (1 - accuracy);
            this.goalkeeper.targetX = Math.max(this.goal.x + 30, Math.min(this.goal.x + this.goal.width - 30, predictedX + offset));
            this.goalkeeper.isDiving = true;
            this.goalkeeper.diveDirection = predictedX > this.goalkeeper.x ? 1 : -1;
            this.goalkeeper.diveProgress = 0;
        }, reactionDelay * 16);
    }
    
    update() {
        if (this.gameState.isShooting) {
            this.ball.prevX = this.ball.x;
            this.ball.prevY = this.ball.y;
            
            this.ball.x += this.ball.vx;
            this.ball.y += this.ball.vy;
            this.ball.rotation += this.ball.vx * 0.05;
            this.ball.vy += 0.15;
            
            this.updateGoalkeeper();
            this.checkCollisions();
            this.updateParticles();
        } else {
            this.idleGoalkeeper();
        }
    }
    
    updateGoalkeeper() {
        const dx = this.goalkeeper.targetX - this.goalkeeper.x;
        this.goalkeeper.x += dx * 0.15;
        
        if (this.goalkeeper.isDiving) {
            this.goalkeeper.diveProgress += 0.05;
            if (this.goalkeeper.diveProgress >= 1) {
                this.goalkeeper.isDiving = false;
            }
        }
    }
    
    idleGoalkeeper() {
        if (Math.random() < 0.02) {
            this.goalkeeper.targetX = this.goal.x + 50 + Math.random() * (this.goal.width - 100);
        }
        const dx = this.goalkeeper.targetX - this.goalkeeper.x;
        this.goalkeeper.x += dx * 0.05;
    }
    
    lineIntersectsRect(x1, y1, x2, y2, rx, ry, rw, rh) {
        const left = this.lineIntersectsLine(x1, y1, x2, y2, rx, ry, rx, ry + rh);
        const right = this.lineIntersectsLine(x1, y1, x2, y2, rx + rw, ry, rx + rw, ry + rh);
        const top = this.lineIntersectsLine(x1, y1, x2, y2, rx, ry, rx + rw, ry);
        const bottom = this.lineIntersectsLine(x1, y1, x2, y2, rx, ry + rh, rx + rw, ry + rh);
        
        return left || right || top || bottom;
    }
    
    lineIntersectsLine(x1, y1, x2, y2, x3, y3, x4, y4) {
        const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
        if (Math.abs(denom) < 0.0001) return false;
        
        const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
        const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;
        
        return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
    }
    
    checkGoalkeeperCollision(ballX, ballY) {
        const gkLeft = this.goalkeeper.x - this.goalkeeper.width / 2;
        const gkRight = this.goalkeeper.x + this.goalkeeper.width / 2;
        const gkTop = this.goalkeeper.y - this.goalkeeper.height / 2;
        const gkBottom = this.goalkeeper.y + this.goalkeeper.height / 2;
        
        const diveOffset = this.goalkeeper.isDiving ? this.goalkeeper.diveDirection * this.goalkeeper.diveProgress * 40 : 0;
        
        return ballX >= gkLeft + diveOffset - 10 && 
               ballX <= gkRight + diveOffset + 10 &&
               ballY >= gkTop && 
               ballY <= gkBottom;
    }
    
    calculateScore(ballX, ballY) {
        const relativeX = ballX - this.goal.x;
        const relativeY = Math.max(0, Math.min(this.goal.height, ballY - this.goal.y));
        
        for (const zone of this.goalZones) {
            if (relativeX >= zone.x1 && relativeX <= zone.x2 &&
                relativeY >= zone.y1 && relativeY <= zone.y2) {
                return { points: zone.points, name: zone.name };
            }
        }
        return { points: 0, name: '' };
    }
    
    checkCollisions() {
        const ballPassedGoalLine = this.ball.y <= this.goal.y + this.goal.height;
        const prevBallBelowGoalLine = this.ball.prevY >= this.goal.y + this.goal.height;
        
        if (ballPassedGoalLine && prevBallBelowGoalLine) {
            const goalIntersectY = this.goal.y + this.goal.height;
            const t = (goalIntersectY - this.ball.prevY) / (this.ball.y - this.ball.prevY);
            const intersectX = this.ball.prevX + t * (this.ball.x - this.ball.prevX);
            
            if (intersectX >= this.goal.x && intersectX <= this.goal.x + this.goal.width) {
                if (this.checkGoalkeeperCollision(intersectX, goalIntersectY - 5)) {
                    this.showMessage('扑救成功!', '#FF6B35');
                    this.endShot(false, 0);
                    return;
                }
                
                const score = this.calculateScore(intersectX, goalIntersectY - 5);
                if (score.points > 0) {
                    this.createParticles(intersectX, this.goal.y + 50, '#FFD600');
                    this.showMessage(`${score.name}! +${score.points}`, '#4CAF50');
                    this.endShot(true, score.points);
                    return;
                }
            }
        }
        
        if (this.ball.y - this.ball.radius <= this.goal.y + this.goal.height &&
            this.ball.y + this.ball.radius >= this.goal.y) {
            
            if (this.ball.x >= this.goal.x && this.ball.x <= this.goal.x + this.goal.width) {
                if (this.checkGoalkeeperCollision(this.ball.x, this.ball.y)) {
                    this.showMessage('扑救成功!', '#FF6B35');
                    this.endShot(false, 0);
                    return;
                }
                
                const score = this.calculateScore(this.ball.x, this.ball.y);
                if (score.points > 0) {
                    this.createParticles(this.ball.x, this.ball.y, '#FFD600');
                    this.showMessage(`${score.name}! +${score.points}`, '#4CAF50');
                    this.endShot(true, score.points);
                    return;
                }
            }
        }
        
        if (this.ball.y > this.canvas.height + 50 ||
            this.ball.x < -50 || 
            this.ball.x > this.canvas.width + 50 ||
            this.ball.y < -50) {
            
            this.showMessage('偏出!', '#FF5252');
            this.endShot(false, 0);
        }
    }
    
    endShot(isGoal, points) {
        this.gameState.isShooting = false;
        this.gameState.shotsRemaining--;
        
        if (isGoal) {
            this.gameState.goalsScored++;
            this.gameState.totalScore += points;
        }
        
        this.updateStats();
        
        if (this.gameState.shotsRemaining <= 0) {
            setTimeout(() => this.endGame(), 1000);
        } else {
            setTimeout(() => this.resetBall(), 1500);
        }
    }
    
    resetBall() {
        this.ball.x = 400;
        this.ball.y = 480;
        this.ball.prevX = 400;
        this.ball.prevY = 480;
        this.ball.vx = 0;
        this.ball.vy = 0;
        this.ball.rotation = 0;
        
        this.goalkeeper.x = 400;
        this.goalkeeper.targetX = 400;
        this.goalkeeper.isDiving = false;
        this.goalkeeper.diveProgress = 0;
        
        this.particles = [];
        this.hideMessage();
    }
    
    endGame() {
        this.gameState.gameOver = true;
        document.getElementById('finalGoals').textContent = this.gameState.goalsScored;
        document.getElementById('finalScore').textContent = this.gameState.totalScore;
        document.getElementById('gameOverModal').classList.add('show');
    }
    
    restartGame() {
        this.gameState = {
            shotsRemaining: 10,
            goalsScored: 0,
            totalScore: 0,
            isDragging: false,
            isShooting: false,
            gameOver: false
        };
        
        this.resetBall();
        this.updateStats();
        document.getElementById('gameOverModal').classList.remove('show');
    }
    
    updateStats() {
        document.getElementById('shotsRemaining').textContent = this.gameState.shotsRemaining;
        document.getElementById('goalsScored').textContent = this.gameState.goalsScored;
        document.getElementById('totalScore').textContent = this.gameState.totalScore;
    }
    
    showMessage(text, color) {
        this.messageEl.textContent = text;
        this.messageEl.style.color = color;
        this.messageEl.classList.add('show');
    }
    
    hideMessage() {
        this.messageEl.classList.remove('show');
    }
    
    createParticles(x, y, color) {
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 1,
                color: color,
                size: Math.random() * 6 + 2
            });
        }
    }
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2;
            p.life -= 0.02;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawField();
        this.drawGoal();
        this.drawGoalZones();
        this.drawGoalkeeper();
        this.drawParticles();
        
        if (this.gameState.isDragging) {
            this.drawAimLine();
        }
        
        this.drawBall();
    }
    
    drawField() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#4CAF50');
        gradient.addColorStop(1, '#2E7D32');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < this.canvas.width; i += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, 0);
            this.ctx.lineTo(i, this.canvas.height);
            this.ctx.stroke();
        }
        
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 3;
        
        this.ctx.beginPath();
        this.ctx.moveTo(100, 400);
        this.ctx.lineTo(100, 250);
        this.ctx.quadraticCurveTo(100, 200, 150, 200);
        this.ctx.lineTo(650, 200);
        this.ctx.quadraticCurveTo(700, 200, 700, 250);
        this.ctx.lineTo(700, 400);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.arc(400, 400, 80, Math.PI, 0);
        this.ctx.stroke();
    }
    
    drawGoal() {
        const { x, y, width, height } = this.goal;
        
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 8;
        this.ctx.strokeRect(x, y, width, height);
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;
        
        const netSize = 15;
        for (let nx = x; nx <= x + width; nx += netSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(nx, y);
            this.ctx.lineTo(nx, y + height);
            this.ctx.stroke();
        }
        
        for (let ny = y; ny <= y + height; ny += netSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, ny);
            this.ctx.lineTo(x + width, ny);
            this.ctx.stroke();
        }
        
        this.ctx.fillStyle = '#FFD600';
        this.ctx.fillRect(x - 10, y - 10, 15, height + 20);
        this.ctx.fillRect(x + width - 5, y - 10, 15, height + 20);
        this.ctx.fillRect(x - 10, y - 10, width + 20, 15);
    }
    
    drawGoalZones() {
        if (!this.gameState.isDragging) return;
        
        const { x, y } = this.goal;
        
        for (const zone of this.goalZones) {
            let alpha = 0.1;
            if (zone.points === 100) alpha = 0.3;
            else if (zone.points === 50) alpha = 0.2;
            
            this.ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
            this.ctx.fillRect(
                x + zone.x1,
                y + zone.y1,
                zone.x2 - zone.x1,
                zone.y2 - zone.y1
            );
        }
    }
    
    drawGoalkeeper() {
        const { x, y, width, height, isDiving, diveDirection, diveProgress } = this.goalkeeper;
        
        this.ctx.save();
        this.ctx.translate(x, y);
        
        if (isDiving) {
            this.ctx.rotate(diveDirection * diveProgress * 0.8);
        }
        
        this.ctx.fillStyle = '#FF6B35';
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, width / 2, height / 2, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.arc(0, -height / 2 + 15, 18, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#333';
        this.ctx.beginPath();
        this.ctx.arc(-6, -height / 2 + 12, 3, 0, Math.PI * 2);
        this.ctx.arc(6, -height / 2 + 12, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#2196F3';
        this.ctx.fillRect(-width / 2 - 15, -10, 20, 8);
        this.ctx.fillRect(width / 2 - 5, -10, 20, 8);
        
        this.ctx.fillStyle = '#2196F3';
        this.ctx.fillRect(-15, height / 2 - 10, 12, 20);
        this.ctx.fillRect(3, height / 2 - 10, 12, 20);
        
        this.ctx.restore();
    }
    
    drawBall() {
        const { x, y, radius, rotation } = this.ball;
        
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(rotation);
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.beginPath();
        this.ctx.ellipse(3, 5, radius, radius * 0.4, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        const ballGradient = this.ctx.createRadialGradient(-5, -5, 0, 0, 0, radius);
        ballGradient.addColorStop(0, '#FFFFFF');
        ballGradient.addColorStop(1, '#CCCCCC');
        this.ctx.fillStyle = ballGradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1.5;
        
        const patternRadius = radius * 0.6;
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const px = Math.cos(angle) * patternRadius;
            const py = Math.sin(angle) * patternRadius;
            
            this.ctx.beginPath();
            this.ctx.arc(px, py, 8, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 10, 0, Math.PI * 2);
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    drawAimLine() {
        const { x: startX, y: startY } = this.ball;
        const { x: endX, y: endY } = this.dragEnd;
        
        const dx = startX - endX;
        const dy = startY - endY;
        const distance = Math.hypot(dx, dy);
        const maxDistance = 200;
        const power = Math.min(distance / maxDistance, 1);
        
        const lineLength = 100 + power * 150;
        const angle = Math.atan2(dy, dx);
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([10, 10]);
        
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(
            startX + Math.cos(angle) * lineLength,
            startY + Math.sin(angle) * lineLength
        );
        this.ctx.stroke();
        
        this.ctx.setLineDash([]);
        
        const arrowX = startX + Math.cos(angle) * lineLength;
        const arrowY = startY + Math.sin(angle) * lineLength;
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.beginPath();
        this.ctx.moveTo(arrowX, arrowY);
        this.ctx.lineTo(
            arrowX - Math.cos(angle - 0.4) * 15,
            arrowY - Math.sin(angle - 0.4) * 15
        );
        this.ctx.lineTo(
            arrowX - Math.cos(angle + 0.4) * 15,
            arrowY - Math.sin(angle + 0.4) * 15
        );
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    drawParticles() {
        for (const p of this.particles) {
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1;
    }
    
    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

window.addEventListener('load', () => {
    new SoccerGame();
});
