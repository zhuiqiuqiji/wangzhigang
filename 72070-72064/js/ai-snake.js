class AISnake extends Snake {
    constructor(startX, startY, initialLength = 5, aiType = 'patrol', teamId = null) {
        super(startX, startY, initialLength, false);

        this.aiType = aiType;
        this.teamId = teamId;
        this.target = null;
        this.targetFood = null;
        this.patrolPoint = { x: startX, y: startY };
        this.decisionTimer = 0;
        this.decisionInterval = this.getDecisionInterval();
        this.riskThreshold = this.getRiskThreshold();

        this.memory = {
            lastFoodTarget: null,
            lastEnemyTarget: null,
            lastDecisionTime: 0
        };

        this.path = [];
        this.pathIndex = 0;

        this.setupSkin();
    }

    getDecisionInterval() {
        switch (this.aiType) {
            case 'aggressive': return 80;
            case 'evasive': return 120;
            case 'patrol': return 180;
            case 'hunter': return 100;
            case 'scout': return 150;
            default: return 180;
        }
    }

    getRiskThreshold() {
        switch (this.aiType) {
            case 'aggressive': return 2;
            case 'evasive': return 8;
            case 'patrol': return 5;
            case 'hunter': return 4;
            case 'scout': return 6;
            default: return 5;
        }
    }

    setupSkin() {
        const teamColors = {
            null: [
                { head: '#ff6b6b', body: '#ef4444' },
                { head: '#f97316', body: '#ea580c' },
                { head: '#eab308', body: '#ca8a04' },
                { head: '#22c55e', body: '#16a34a' },
                { head: '#06b6d4', body: '#0891b2' },
                { head: '#8b5cf6', body: '#7c3aed' }
            ],
            'red': [
                { head: '#ff6b6b', body: '#ef4444' },
                { head: '#f97316', body: '#ea580c' },
                { head: '#dc2626', body: '#b91c1c' }
            ],
            'blue': [
                { head: '#3b82f6', body: '#2563eb' },
                { head: '#06b6d4', body: '#0891b2' },
                { head: '#8b5cf6', body: '#7c3aed' }
            ],
            'green': [
                { head: '#22c55e', body: '#16a34a' },
                { head: '#84cc16', body: '#65a30d' },
                { head: '#10b981', body: '#059669' }
            ],
            'yellow': [
                { head: '#eab308', body: '#ca8a04' },
                { head: '#f59e0b', body: '#d97706' },
                { head: '#fbbf24', body: '#f59e0b' }
            ]
        };

        const colors = teamColors[this.teamId] || teamColors[null];
        const color = colors[Math.floor(Math.random() * colors.length)];
        this.customHeadColor = color.head;
        this.customBodyColor = color.body;
    }

    update(deltaTime, allSnakes, foodSystem, mapWidth, mapHeight) {
        if (!this.isAlive) return false;

        this.decisionTimer += deltaTime;
        if (this.decisionTimer >= this.decisionInterval) {
            this.decisionTimer = 0;
            this.makeDecision(allSnakes, foodSystem, mapWidth, mapHeight);
        }

        if (this.hasMagnet) {
            this.attractNearbyFood(foodSystem, mapWidth, mapHeight);
        }

        return super.update(deltaTime);
    }

    attractNearbyFood(foodSystem, mapWidth, mapHeight) {
        const head = this.getHead();
        const magnetRadius = 8;

        for (const food of foodSystem.foods) {
            const dist = Math.abs(food.x - head.x) + Math.abs(food.y - head.y);
            if (dist <= magnetRadius && dist > 0) {
                const dx = head.x - food.x;
                const dy = head.y - food.y;
                const moveX = Math.abs(dx) > 0 ? (dx > 0 ? 1 : -1) : 0;
                const moveY = Math.abs(dy) > 0 && Math.abs(dy) > Math.abs(dx) ? (dy > 0 ? 1 : -1) : 0;

                const newX = Math.max(0, Math.min(mapWidth - 1, food.x + moveX));
                const newY = Math.max(0, Math.min(mapHeight - 1, food.y + moveY));

                if (!foodSystem.isPositionOccupiedByFood(newX, newY, food)) {
                    food.x = newX;
                    food.y = newY;
                }
            }
        }
    }

    makeDecision(allSnakes, foodSystem, mapWidth, mapHeight) {
        const head = this.getHead();

        const nearbySnakes = this.findNearbySnakes(allSnakes, 20);
        const teammates = nearbySnakes.filter(s => s.teamId === this.teamId && s.teamId !== null);
        const enemies = nearbySnakes.filter(s => s.teamId !== this.teamId || this.teamId === null);
        const danger = this.assessDanger(head, enemies, mapWidth, mapHeight);

        if (this.hasShield) {
            this.riskThreshold = Math.max(0, this.riskThreshold - 5);
        } else {
            this.riskThreshold = this.getRiskThreshold();
        }

        if (danger > this.riskThreshold && !this.hasShield) {
            this.evadeDanger(head, enemies, mapWidth, mapHeight);
            return;
        }

        if (this.aiType === 'aggressive') {
            const targetAvailable = this.findHuntTarget(head, enemies);
            if (targetAvailable) {
                this.huntBehavior(head, targetAvailable, enemies, mapWidth, mapHeight);
                return;
            }
            this.aggressiveBehavior(head, allSnakes, foodSystem, mapWidth, mapHeight);
            return;
        }

        if (this.aiType === 'evasive') {
            this.avoidanceBehavior(head, enemies, foodSystem, mapWidth, mapHeight);
            return;
        }

        if (this.aiType === 'hunter') {
            const huntTarget = this.findHuntTarget(head, enemies);
            if (huntTarget) {
                this.huntBehavior(head, huntTarget, enemies, mapWidth, mapHeight);
            } else {
                this.hunterBehavior(head, allSnakes, foodSystem, mapWidth, mapHeight);
            }
            return;
        }

        if (this.aiType === 'scout') {
            this.scoutBehavior(head, allSnakes, foodSystem, mapWidth, mapHeight);
            return;
        }

        this.patrolBehavior(head, foodSystem, mapWidth, mapHeight);
    }

    findHuntTarget(head, enemies) {
        let bestTarget = null;
        let bestScore = -Infinity;

        for (const snake of enemies) {
            if (!snake.isAlive || snake.id === this.id) continue;

            const otherHead = snake.getHead();
            const dist = Math.abs(otherHead.x - head.x) + Math.abs(otherHead.y - head.y);

            if (dist > 25) continue;

            const myLength = this.getLength();
            const targetLength = snake.getLength();

            let score = 0;
            score += (100 - dist) * 0.5;
            if (targetLength < myLength) score += 40;
            else if (targetLength < myLength * 1.2) score += 10;
            else score -= 20;

            if (snake.isPlayer) score += 30;
            if (snake.hasShield) score -= 25;
            if (snake.isBoosting) score -= 15;

            if (score > bestScore && score > 20) {
                bestScore = score;
                bestTarget = snake;
            }
        }

        return bestTarget;
    }

    huntBehavior(head, target, enemies, mapWidth, mapHeight) {
        const targetHead = target.getHead();
        const dist = Math.abs(targetHead.x - head.x) + Math.abs(targetHead.y - head.y);

        const predictedPos = this.predictTargetPosition(target, 3);

        const interceptX = predictedPos.x;
        const interceptY = predictedPos.y;

        if (dist <= 2 && this.getLength() > target.getLength() * 1.1) {
            this.startBoost();
        } else if (this.getLength() < 6) {
            this.stopBoost();
        }

        this.moveTowards(head, { x: interceptX, y: interceptY });
    }

    predictTargetPosition(target, stepsAhead) {
        const targetHead = target.getHead();
        const targetDir = target.direction;

        return {
            x: targetHead.x + targetDir.x * stepsAhead,
            y: targetHead.y + targetDir.y * stepsAhead
        };
    }

    findNearbySnakes(allSnakes, radius) {
        const head = this.getHead();
        return allSnakes.filter(snake => {
            if (!snake.isAlive || snake.id === this.id) return false;
            const otherHead = snake.getHead();
            const dist = Math.abs(otherHead.x - head.x) + Math.abs(otherHead.y - head.y);
            return dist <= radius;
        });
    }

    assessDanger(head, nearbySnakes, mapWidth, mapHeight) {
        let danger = 0;

        const wallDist = Math.min(head.x, head.y, mapWidth - 1 - head.x, mapHeight - 1 - head.y);
        if (wallDist < 2) danger += 10 - wallDist * 2;
        else if (wallDist < 4) danger += 4 - wallDist;

        const occupiedCells = this.getOccupiedCells(nearbySnakes);

        for (const snake of nearbySnakes) {
            if (!snake.isAlive || snake.id === this.id) continue;
            if (snake.teamId === this.teamId && this.teamId !== null) continue;

            const otherHead = snake.getHead();
            const dist = Math.abs(otherHead.x - head.x) + Math.abs(otherHead.y - head.y);

            if (dist < 3) danger += 15 - dist * 3;
            else if (dist < 6) danger += 6 - dist;

            if (snake.getLength() > this.getLength() * 1.2 && dist < 8) {
                danger += 10;
            }

            if (snake.isBoosting && dist < 5) {
                danger += 8;
            }
        }

        return danger;
    }

    getOccupiedCells(nearbySnakes) {
        const cells = new Set();
        for (const snake of nearbySnakes) {
            if (!snake.isAlive) continue;
            for (const segment of snake.body) {
                cells.add(`${segment.x},${segment.y}`);
            }
        }
        return cells;
    }

    evadeDanger(head, nearbySnakes, mapWidth, mapHeight) {
        const directions = [
            { x: 1, y: 0 },
            { x: -1, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: -1 }
        ];

        const occupiedCells = this.getOccupiedCells(nearbySnakes);
        let bestDir = null;
        let bestScore = -Infinity;

        for (const dir of directions) {
            if (this.direction.x + dir.x === 0 && this.direction.y + dir.y === 0) continue;

            const newHead = { x: head.x + dir.x * 3, y: head.y + dir.y * 3 };
            let score = 0;

            const wallDist = Math.min(newHead.x, newHead.y, mapWidth - 1 - newHead.x, mapHeight - 1 - newHead.y);
            score += wallDist * 2;

            for (const snake of nearbySnakes) {
                if (!snake.isAlive) continue;
                if (snake.teamId === this.teamId && this.teamId !== null) continue;

                const otherHead = snake.getHead();
                const dist = Math.abs(otherHead.x - newHead.x) + Math.abs(otherHead.y - newHead.y);

                score += dist * 1.5;

                if (snake.getLength() > this.getLength()) {
                    score += dist;
                }
            }

            if (occupiedCells.has(`${newHead.x},${newHead.y}`)) {
                score -= 20;
            }

            if (score > bestScore) {
                bestScore = score;
                bestDir = dir;
            }
        }

        if (bestDir) {
            this.setDirection(bestDir.x, bestDir.y);
        }
    }

    aggressiveBehavior(head, allSnakes, foodSystem, mapWidth, mapHeight) {
        let bestTarget = null;
        let bestScore = -Infinity;

        for (const snake of allSnakes) {
            if (!snake.isAlive || snake.id === this.id) continue;
            if (snake.teamId === this.teamId && this.teamId !== null) continue;

            const otherHead = snake.getHead();
            const dist = Math.abs(otherHead.x - head.x) + Math.abs(otherHead.y - head.y);

            let score = 100 - dist;
            if (snake.getLength() < this.getLength()) score += 30;
            if (snake.isPlayer) score += 50;
            if (snake.hasShield) score -= 30;

            if (score > bestScore && dist < 20) {
                bestScore = score;
                bestTarget = snake;
            }
        }

        if (bestTarget) {
            const targetHead = bestTarget.getHead();
            this.moveTowards(head, targetHead);
            if (this.getLength() > 8 && Math.abs(targetHead.x - head.x) + Math.abs(targetHead.y - head.y) < 5) {
                this.startBoost();
            }
        } else {
            this.findFood(head, foodSystem);
        }
    }

    evasiveBehavior(head, allSnakes, foodSystem, mapWidth, mapHeight) {
        const nearbyEnemies = this.findNearbySnakes(allSnakes, 12);

        if (nearbyEnemies.length > 0) {
            this.evadeDanger(head, nearbyEnemies, mapWidth, mapHeight);
            this.stopBoost();
        } else {
            this.findFood(head, foodSystem);
        }
    }

    avoidanceBehavior(head, enemies, foodSystem, mapWidth, mapHeight) {
        const nearbyThreats = enemies.filter(s => {
            if (!s.isAlive) return false;
            const otherHead = s.getHead();
            const dist = Math.abs(otherHead.x - head.x) + Math.abs(otherHead.y - head.y);
            return dist < 10;
        });

        if (nearbyThreats.length > 0) {
            this.evadeDanger(head, nearbyThreats, mapWidth, mapHeight);
            this.stopBoost();
        } else {
            this.findFood(head, foodSystem);
        }
    }

    hunterBehavior(head, allSnakes, foodSystem, mapWidth, mapHeight) {
        const huntTarget = this.findHuntTarget(head, allSnakes);
        if (huntTarget) {
            this.huntBehavior(head, huntTarget, allSnakes, mapWidth, mapHeight);
        } else {
            this.findStrategicFood(head, foodSystem);
        }
    }

    scoutBehavior(head, allSnakes, foodSystem, mapWidth, mapHeight) {
        const nearbyThreats = allSnakes.filter(s => {
            if (!s.isAlive || s.id === this.id) return false;
            if (s.teamId === this.teamId && this.teamId !== null) return false;
            const otherHead = s.getHead();
            const dist = Math.abs(otherHead.x - head.x) + Math.abs(otherHead.y - head.y);
            return dist < 8 && s.getLength() > this.getLength() * 0.9;
        });

        if (nearbyThreats.length > 0) {
            this.evadeDanger(head, nearbyThreats, mapWidth, mapHeight);
            this.stopBoost();
            return;
        }

        const foodTarget = this.findPowerUpFood(head, foodSystem);
        if (foodTarget) {
            this.moveTowards(head, foodTarget);
        } else if (Math.random() < 0.3) {
            this.findFood(head, foodSystem);
        } else {
            this.patrolBehavior(head, foodSystem, mapWidth, mapHeight);
        }
    }

    patrolBehavior(head, foodSystem, mapWidth, mapHeight) {
        const distToPatrol = Math.abs(this.patrolPoint.x - head.x) + Math.abs(this.patrolPoint.y - head.y);

        if (distToPatrol < 5 || Math.random() < 0.005) {
            this.patrolPoint = {
                x: 20 + Math.floor(Math.random() * (mapWidth - 40)),
                y: 20 + Math.floor(Math.random() * (mapHeight - 40))
            };
        }

        if (Math.random() < 0.35) {
            this.findFood(head, foodSystem);
        } else {
            this.moveTowards(head, this.patrolPoint);
        }
    }

    findFood(head, foodSystem) {
        let nearestFood = null;
        let nearestDist = Infinity;

        for (const food of foodSystem.foods) {
            if (food.type === 'poison') continue;

            const dist = Math.abs(food.x - head.x) + Math.abs(food.y - head.y);
            let priority = dist;
            if (food.type === 'large') priority -= 8;
            if (food.type === 'shield') priority -= 12;
            if (food.type === 'speed') priority -= 5;
            if (food.type === 'magnet') priority -= 6;
            if (food.type === 'invisible') priority -= 4;
            if (food.type === 'timeslow') priority -= 3;

            if (priority < nearestDist) {
                nearestDist = priority;
                nearestFood = food;
            }
        }

        if (nearestFood) {
            this.moveTowards(head, nearestFood);
        }
    }

    findPowerUpFood(head, foodSystem) {
        let nearestFood = null;
        let nearestDist = Infinity;

        for (const food of foodSystem.foods) {
            if (!['shield', 'speed', 'magnet', 'large'].includes(food.type)) continue;

            const dist = Math.abs(food.x - head.x) + Math.abs(food.y - head.y);
            let priority = dist;
            if (food.type === 'shield') priority -= 15;
            if (food.type === 'speed') priority -= 10;
            if (food.type === 'magnet') priority -= 8;
            if (food.type === 'large') priority -= 5;

            if (priority < nearestDist && dist < 15) {
                nearestDist = priority;
                nearestFood = food;
            }
        }

        return nearestFood;
    }

    findStrategicFood(head, foodSystem) {
        let nearestFood = null;
        let nearestDist = Infinity;

        for (const food of foodSystem.foods) {
            if (food.type === 'poison') continue;

            const dist = Math.abs(food.x - head.x) + Math.abs(food.y - head.y);
            let priority = dist;

            if (this.getLength() < 10) {
                if (food.type === 'large') priority -= 10;
                if (food.type === 'remains') priority -= 5;
            } else {
                if (food.type === 'shield') priority -= 15;
                if (food.type === 'speed') priority -= 10;
                if (food.type === 'magnet') priority -= 8;
                if (food.type === 'large') priority -= 5;
            }

            if (priority < nearestDist) {
                nearestDist = priority;
                nearestFood = food;
            }
        }

        if (nearestFood) {
            this.moveTowards(head, nearestFood);
        }
    }

    moveTowards(head, target) {
        const dx = target.x - head.x;
        const dy = target.y - head.y;

        let newDir = null;

        if (Math.abs(dx) > Math.abs(dy)) {
            newDir = { x: dx > 0 ? 1 : -1, y: 0 };
        } else {
            newDir = { x: 0, y: dy > 0 ? 1 : -1 };
        }

        if (this.direction.x + newDir.x !== 0 || this.direction.y + newDir.y !== 0) {
            this.setDirection(newDir.x, newDir.y);
        }
    }
}

class TeamManager {
    constructor() {
        this.teams = new Map();
    }

    registerSnake(snake, teamId) {
        if (!this.teams.has(teamId)) {
            this.teams.set(teamId, []);
        }
        this.teams.get(teamId).push(snake);
    }

    unregisterSnake(snake, teamId) {
        if (this.teams.has(teamId)) {
            const team = this.teams.get(teamId);
            const index = team.indexOf(snake);
            if (index > -1) {
                team.splice(index, 1);
            }
        }
    }

    getTeamMembers(teamId) {
        return this.teams.get(teamId) || [];
    }

    getAliveTeamMembers(teamId) {
        return this.getTeamMembers(teamId).filter(s => s.isAlive);
    }

    getTeamScore(teamId) {
        return this.getAliveTeamMembers(teamId).reduce((sum, s) => sum + s.score, 0);
    }

    getLeadingTeam() {
        let leadingTeam = null;
        let maxScore = -Infinity;

        for (const [teamId, members] of this.teams) {
            const score = this.getTeamScore(teamId);
            if (score > maxScore) {
                maxScore = score;
                leadingTeam = teamId;
            }
        }

        return leadingTeam;
    }
}