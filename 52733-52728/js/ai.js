class BilliardAI {
    constructor(difficulty = 'easy') {
        this.difficulty = difficulty;
        this.shotDelay = 1500;
    }

    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        this.shotDelay = difficulty === 'easy' ? 2000 : difficulty === 'medium' ? 1500 : 1000;
    }

    calculateShot(balls, table, playerType, allBalls) {
        const cueBall = balls.find(b => b.number === 0 && !b.potted);
        if (!cueBall) return null;

        const targetBalls = this.getTargetBalls(balls, playerType);
        if (targetBalls.length === 0) return null;

        const shots = this.evaluateShots(cueBall, targetBalls, table, allBalls);
        
        if (shots.length === 0) {
            return this.calculateSafetyShot(cueBall, balls, table);
        }

        let selectedShot;
        if (this.difficulty === 'easy') {
            selectedShot = shots[Math.floor(Math.random() * Math.min(3, shots.length))];
        } else if (this.difficulty === 'medium') {
            selectedShot = shots[Math.floor(Math.random() * Math.min(2, shots.length))];
        } else {
            selectedShot = shots[0];
        }

        return selectedShot;
    }

    getTargetBalls(balls, playerType) {
        return balls.filter(b => {
            if (b.potted || b.number === 0) return false;
            if (b.number === 8) return false;
            if (playerType === 'solid') return b.number >= 1 && b.number <= 7;
            if (playerType === 'striped') return b.number >= 9 && b.number <= 15;
            return true;
        });
    }

    evaluateShots(cueBall, targetBalls, table, allBalls) {
        const shots = [];
        const pockets = table.pockets;

        for (const target of targetBalls) {
            for (const pocket of pockets) {
                const shot = this.evaluateSingleShot(cueBall, target, pocket, table, allBalls);
                if (shot) {
                    shots.push(shot);
                }
            }
        }

        shots.sort((a, b) => b.score - a.score);
        return shots;
    }

    evaluateSingleShot(cueBall, target, pocket, table, allBalls) {
        const toPocket = pocket.subtract(target.position);
        const distToPocket = toPocket.length();
        if (distToPocket === 0) return null;

        const aimDir = toPocket.normalize();
        const ghostBallPos = target.position.subtract(aimDir.multiply(Ball.RADIUS * 2));

        const toGhost = ghostBallPos.subtract(cueBall.position);
        const distance = toGhost.length();
        if (distance === 0) return null;

        const angle = Math.atan2(toGhost.y, toGhost.x);

        if (!this.isPathClear(cueBall.position, ghostBallPos, target, table, allBalls)) {
            return null;
        }

        if (!this.isPathClear(target.position, pocket, target, table, allBalls, true)) {
            return null;
        }

        let score = 0;
        const angleDiff = Math.abs(this.normalizeAngle(angle - Math.atan2(toPocket.y, toPocket.x)));
        score += (1 - angleDiff / Math.PI) * 30;

        score += (1 - distance / 500) * 20;
        score += (1 - distToPocket / 600) * 20;

        const power = Math.min(12, 5 + distance * 0.02);

        if (this.difficulty === 'easy') {
            score *= (0.7 + Math.random() * 0.3);
        } else if (this.difficulty === 'medium') {
            score *= (0.85 + Math.random() * 0.15);
        }

        return {
            angle: angle,
            power: power,
            target: target.number,
            pocket: pocket,
            score: score,
            spin: { x: 0, y: 0 }
        };
    }

    isPathClear(start, end, target, table, allBalls, isTargetToPocket = false) {
        const steps = 30;
        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const pos = Vector2D.lerp(start, end, t);
            
            if (pos.x < table.left || pos.x > table.right ||
                pos.y < table.top || pos.y > table.bottom) {
                return false;
            }

            if (allBalls) {
                for (const ball of allBalls) {
                    if (ball.potted) continue;
                    if (isTargetToPocket && ball.number === target.number) continue;
                    if (!isTargetToPocket && ball.number === 0) continue;
                    if (!isTargetToPocket && ball.number === target.number) continue;

                    const dist = pos.distance(ball.position);
                    if (dist < Ball.RADIUS * 1.8) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    calculateSafetyShot(cueBall, balls, table) {
        const targetBalls = balls.filter(b => !b.potted && b.number !== 0);
        if (targetBalls.length === 0) return null;

        let bestShot = null;
        let bestScore = -Infinity;

        for (const target of targetBalls) {
            const toTarget = target.position.subtract(cueBall.position);
            const distance = toTarget.length();
            const angle = Math.atan2(toTarget.y, toTarget.x);

            const score = -distance;

            if (score > bestScore) {
                bestScore = score;
                bestShot = {
                    angle: angle,
                    power: 3 + Math.random() * 3,
                    spin: { x: 0, y: 0 },
                    isSafety: true
                };
            }
        }

        return bestShot;
    }

    normalizeAngle(angle) {
        while (angle > Math.PI) angle -= Math.PI * 2;
        while (angle < -Math.PI) angle += Math.PI * 2;
        return angle;
    }
}
