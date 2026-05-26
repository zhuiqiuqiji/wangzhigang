class Snake {
    constructor(startX, startY, initialLength = 5, isPlayer = false) {
        this.id = this.generateId();
        this.name = isPlayer ? '玩家' : this.generateName();
        this.body = [];
        for (let i = initialLength - 1; i >= 0; i--) {
            this.body.push({ x: startX + i, y: startY });
        }
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.baseSpeed = 8;
        this.currentSpeed = 8;
        this.moveAccumulator = 0;

        this.isPlayer = isPlayer;
        this.isAlive = true;
        this.kills = 0;
        this.score = 0;
        this.teamId = null;

        this.skin = null;

        this.isBoosting = false;
        this.boostCostAccumulator = 0;

        this.isInvisible = false;
        this.invisibleTimer = 0;

        this.isSlowed = false;
        this.slowTimer = 0;

        this.hasShield = false;
        this.shieldTimer = 0;

        this.hasMagnet = false;
        this.magnetTimer = 0;

        this.isTimeSlowed = false;
        this.timeSlowTimer = 0;

        this.growCount = 0;

        this.trailTimer = 0;
    }

    generateId() {
        return 'snake_' + Math.random().toString(36).substr(2, 9);
    }

    generateName() {
        const names = ['闪电', '疾风', '烈焰', '寒冰', '暗影', '雷霆', '狂风', '暴雨', '星光', '月影'];
        return names[Math.floor(Math.random() * names.length)] + Math.floor(Math.random() * 100);
    }

    setSkin(skinData) {
        this.skin = skinData;
    }

    setDirection(dx, dy) {
        if (this.nextDirection.x + dx === 0 && this.nextDirection.y + dy === 0) {
            return;
        }
        this.nextDirection = { x: dx, y: dy };
    }

    startBoost() {
        if (this.body.length > 5) {
            this.isBoosting = true;
        }
    }

    stopBoost() {
        this.isBoosting = false;
    }

    applySlowEffect(duration) {
        this.isSlowed = true;
        this.slowTimer = duration;
    }

    applyInvisibleEffect(duration) {
        this.isInvisible = true;
        this.invisibleTimer = duration;
    }

    applyShieldEffect(duration) {
        this.hasShield = true;
        this.shieldTimer = duration;
    }

    applyMagnetEffect(duration) {
        this.hasMagnet = true;
        this.magnetTimer = duration;
    }

    applyTimeSlowEffect(duration) {
        this.isTimeSlowed = true;
        this.timeSlowTimer = duration;
    }

    getEffectiveSpeed() {
        let speed = this.baseSpeed;
        if (this.isBoosting && this.body.length > 3) {
            speed = this.baseSpeed * 1.8;
        }
        if (this.isSlowed) {
            speed *= 0.5;
        }
        return speed;
    }

    update(deltaTime) {
        if (!this.isAlive) return;

        if (this.isBoosting) {
            this.boostCostAccumulator += deltaTime;
            if (this.boostCostAccumulator >= 2000) {
                this.boostCostAccumulator -= 2000;
                if (this.body.length > 3) {
                    this.body.pop();
                } else {
                    this.isBoosting = false;
                }
            }
        }

        if (this.isSlowed) {
            this.slowTimer -= deltaTime;
            if (this.slowTimer <= 0) {
                this.isSlowed = false;
            }
        }

        if (this.isInvisible) {
            this.invisibleTimer -= deltaTime;
            if (this.invisibleTimer <= 0) {
                this.isInvisible = false;
            }
        }

        if (this.hasShield) {
            this.shieldTimer -= deltaTime;
            if (this.shieldTimer <= 0) {
                this.hasShield = false;
            }
        }

        if (this.hasMagnet) {
            this.magnetTimer -= deltaTime;
            if (this.magnetTimer <= 0) {
                this.hasMagnet = false;
            }
        }

        if (this.isTimeSlowed) {
            this.timeSlowTimer -= deltaTime;
            if (this.timeSlowTimer <= 0) {
                this.isTimeSlowed = false;
            }
        }

        this.currentSpeed = this.getEffectiveSpeed();
        const tickInterval = 1000 / this.currentSpeed;
        this.moveAccumulator += deltaTime;

        let moved = false;
        while (this.moveAccumulator >= tickInterval) {
            this.moveAccumulator -= tickInterval;
            this.move();
            moved = true;
        }

        return moved;
    }

    move() {
        this.direction = { ...this.nextDirection };

        const head = this.body[0];
        const newHead = {
            x: head.x + this.direction.x,
            y: head.y + this.direction.y
        };

        this.body.unshift(newHead);

        if (this.growCount > 0) {
            this.growCount--;
        } else {
            this.body.pop();
        }
    }

    growSnake() {
        this.growCount++;
    }

    getHead() {
        return this.body[0];
    }

    getLength() {
        return this.body.length;
    }

    checkSelfCollision() {
        const head = this.getHead();
        for (let i = 2; i < this.body.length; i++) {
            if (this.body[i].x === head.x && this.body[i].y === head.y) {
                return true;
            }
        }
        return false;
    }

    checkWallCollision(mapWidth, mapHeight) {
        const head = this.getHead();
        return head.x < 0 || head.x >= mapWidth || head.y < 0 || head.y >= mapHeight;
    }

    checkSnakeCollision(otherSnake) {
        if (!otherSnake.isAlive || otherSnake.id === this.id) return false;

        const head = this.getHead();
        for (let i = 0; i < otherSnake.body.length; i++) {
            const segment = otherSnake.body[i];
            if (segment.x === head.x && segment.y === head.y) {
                return { collided: true, isHeadCollision: i === 0 };
            }
        }
        return { collided: false };
    }

    containsPosition(x, y) {
        return this.body.some(segment => segment.x === x && segment.y === y);
    }

    die(killer = null) {
        if (this.hasShield) {
            this.hasShield = false;
            this.shieldTimer = 0;
            return false;
        }
        this.isAlive = false;
        if (killer) {
            killer.kills++;
        }
        return true;
    }
}