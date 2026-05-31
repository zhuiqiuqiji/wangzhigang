const GRAVITY = 0.5;
const BOUNCE_VELOCITY = -12;
const MAX_FALL_SPEED = 20;
const DASH_SPEED = 25;
const DASH_COOLDOWN_TIME = 1;
const BOUNCE_DAMPING = 0.8;
const BALL_RADIUS = 18;
const FLY_GRAVITY = 0.15;
const FLY_MAX_FALL_SPEED = 5;
const POWER_UP_DURATION = 5;
const SLOW_MO_DURATION = 6;
const SLOW_MO_TIME_SCALE = 0.4;

function circleRectCollision(circle, rect) {
    const closestX = Math.max(rect.left, Math.min(circle.x, rect.right));
    const closestY = Math.max(rect.top, Math.min(circle.y, rect.bottom));
    const distanceX = circle.x - closestX;
    const distanceY = circle.y - closestY;
    return (distanceX * distanceX + distanceY * distanceY) < (circle.radius * circle.radius);
}

function circleCircleCollision(x1, y1, r1, x2, y2, r2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < r1 + r2;
}

function getCollisionSide(circle, rect) {
    const prevX = circle.x - circle.vx * 0.016;
    const prevY = circle.y - circle.vy * 0.016;

    const wasLeft = prevX < rect.left;
    const wasRight = prevX > rect.right;
    const wasTop = prevY < rect.top;
    const wasBottom = prevY > rect.bottom;

    if (wasTop && circle.y >= rect.top && circle.y <= rect.bottom) {
        return 'top';
    }
    if (wasBottom && circle.y <= rect.bottom && circle.y >= rect.top) {
        return 'bottom';
    }
    if (wasLeft && circle.x >= rect.left && circle.x <= rect.right) {
        return 'left';
    }
    if (wasRight && circle.x <= rect.right && circle.x >= rect.left) {
        return 'right';
    }

    const dx = circle.x - (rect.left + rect.width / 2);
    const dy = circle.y - (rect.top + rect.height / 2);
    const width = rect.width / 2 + circle.radius;
    const height = rect.height / 2 + circle.radius;
    const crossWidth = width * dy;
    const crossHeight = height * dx;

    if (Math.abs(crossWidth) > Math.abs(crossHeight)) {
        return crossWidth > 0 ? 'bottom' : 'top';
    } else {
        return crossHeight > 0 ? 'right' : 'left';
    }
}

function updatePhysics(ball, dt) {
    const gravity = ball.isFlying ? FLY_GRAVITY : GRAVITY;
    const maxFallSpeed = ball.isFlying ? FLY_MAX_FALL_SPEED : MAX_FALL_SPEED;
    const timeScale = ball.slowMotion ? 0.4 : 1;
    const actualDt = dt * timeScale;
    
    ball.vy += gravity * actualDt * 60;
    ball.vy = Math.min(ball.vy, maxFallSpeed);
    ball.vy = Math.max(ball.vy, -MAX_FALL_SPEED);

    if (ball.dashCooldown > 0) {
        ball.dashCooldown -= dt;
        if (ball.dashCooldown <= 0) {
            ball.isDashing = false;
        }
    }

    ball.x += ball.vx * actualDt * 60;
    ball.y += ball.vy * actualDt * 60;

    if (ball.x < ball.radius) {
        ball.x = ball.radius;
        ball.vx = Math.abs(ball.vx) * BOUNCE_DAMPING;
    }
    if (ball.x > CANVAS_WIDTH - ball.radius) {
        ball.x = CANVAS_WIDTH - ball.radius;
        ball.vx = -Math.abs(ball.vx) * BOUNCE_DAMPING;
    }

    ball.squash += (1 - ball.squash) * 0.2;
    ball.stretch += (1 - ball.stretch) * 0.2;

    ball.rotation += ball.vx * 0.02;

    if (Math.abs(ball.vy) > 5) {
        ball.updateTrail();
    }

    ball.updatePowerUps(dt);
}

function handlePlatformCollision(ball, platform) {
    if (!platform.active) {
        return { hit: false, deadly: false };
    }

    if (circleRectCollision(ball, platform)) {
        const side = getCollisionSide(ball, platform);

        if (side === 'top' && ball.vy > 0) {
            if (platform.hasSpike && platform.spikeSide === 'top') {
                if (ball.isInvincible) {
                    return { hit: true, deadly: false, bounce: false, invincibleHit: true };
                }
                if (checkSpikeTriangleCollision(ball, platform, 'top')) {
                    return { hit: true, deadly: true };
                }
            }
            
            platform.onTouch();
            
            let bounceVelocity = BOUNCE_VELOCITY;
            if (platform.type === PlatformType.BOUNCE_PAD) {
                bounceVelocity *= platform.bounceMultiplier;
                ball.squash = 0.5;
                ball.stretch = 1.5;
            } else {
                ball.squash = 0.7;
                ball.stretch = 1.3;
            }
            
            ball.y = platform.top - ball.radius;
            ball.vy = bounceVelocity;
            ball.isDashing = false;

            const hitPoint = (ball.x - platform.x) / (platform.width / 2);
            ball.vx = hitPoint * 5;

            if (platform.type === PlatformType.MOVING) {
                if (platform.moveAxis === 'x') {
                    const platformVx = Math.cos(performance.now() / 1000 * platform.moveSpeed + platform.movePhase) * platform.moveRange * platform.moveSpeed;
                    ball.vx += platformVx * 0.02;
                } else {
                    const platformVy = Math.cos(performance.now() / 1000 * platform.moveSpeed + platform.movePhase) * platform.moveRange * platform.moveSpeed;
                    if (platformVy < 0) {
                        ball.vy += platformVy * 0.1;
                    }
                }
            }

            return { hit: true, deadly: false, bounce: true, bounceVelocity };
        }
        else if (side === 'bottom' && ball.vy < 0) {
            if (platform.hasSpike && platform.spikeSide === 'bottom') {
                if (ball.isInvincible) {
                    return { hit: true, deadly: false, bounce: false, invincibleHit: true };
                }
                if (checkSpikeTriangleCollision(ball, platform, 'bottom')) {
                    return { hit: true, deadly: true };
                }
            }
            ball.y = platform.bottom + ball.radius;
            ball.vy = Math.abs(ball.vy) * BOUNCE_DAMPING;
            return { hit: true, deadly: false };
        }
        else if (side === 'left' && ball.vx > 0) {
            if (platform.hasSpike && platform.spikeSide === 'left') {
                if (ball.isInvincible) {
                    return { hit: true, deadly: false, bounce: false, invincibleHit: true };
                }
                if (checkSpikeTriangleCollision(ball, platform, 'left')) {
                    return { hit: true, deadly: true };
                }
            }
            ball.x = platform.left - ball.radius;
            ball.vx = -Math.abs(ball.vx) * BOUNCE_DAMPING;
            return { hit: true, deadly: false };
        }
        else if (side === 'right' && ball.vx < 0) {
            if (platform.hasSpike && platform.spikeSide === 'right') {
                if (ball.isInvincible) {
                    return { hit: true, deadly: false, bounce: false, invincibleHit: true };
                }
                if (checkSpikeTriangleCollision(ball, platform, 'right')) {
                    return { hit: true, deadly: true };
                }
            }
            ball.x = platform.right + ball.radius;
            ball.vx = Math.abs(ball.vx) * BOUNCE_DAMPING;
            return { hit: true, deadly: false };
        }
    }
    return { hit: false, deadly: false };
}

function checkSpikeTriangleCollision(ball, platform, side) {
    if (!platform.hasSpike) return false;

    const spikeHeight = 18;
    const spikeWidth = 22;

    for (let i = 0; i < platform.spikeCount; i++) {
        const spikeX = platform.left + (i + 0.5) * (platform.width / platform.spikeCount);
        
        let triangle;
        
        if (side === 'top') {
            triangle = {
                x1: spikeX - spikeWidth / 2, y1: platform.top,
                x2: spikeX, y2: platform.top - spikeHeight,
                x3: spikeX + spikeWidth / 2, y3: platform.top
            };
        } else if (side === 'bottom') {
            triangle = {
                x1: spikeX - spikeWidth / 2, y1: platform.bottom,
                x2: spikeX, y2: platform.bottom + spikeHeight,
                x3: spikeX + spikeWidth / 2, y3: platform.bottom
            };
        } else if (side === 'left') {
            const spikeY = platform.top + platform.height / 2;
            triangle = {
                x1: platform.left, y1: spikeY - spikeHeight / 2,
                x2: platform.left - spikeHeight, y2: spikeY,
                x3: platform.left, y3: spikeY + spikeHeight / 2
            };
        } else {
            const spikeY = platform.top + platform.height / 2;
            triangle = {
                x1: platform.right, y1: spikeY - spikeHeight / 2,
                x2: platform.right + spikeHeight, y2: spikeY,
                x3: platform.right, y3: spikeY + spikeHeight / 2
            };
        }

        if (circleTriangleCollision(ball.x, ball.y, ball.radius, triangle)) {
            return true;
        }
    }
    return false;
}

function checkSpinningSawCollision(ball, saw) {
    return circleCircleCollision(ball.x, ball.y, ball.radius, saw.x, saw.y, saw.radius);
}

function checkPowerUpCollision(ball, powerUp) {
    if (powerUp.collected) return false;
    return circleCircleCollision(ball.x, ball.y, ball.radius, powerUp.x, powerUp.y, powerUp.width / 2);
}

function circleTriangleCollision(cx, cy, radius, triangle) {
    const { x1, y1, x2, y2, x3, y3 } = triangle;

    const closest = getClosestPointOnTriangle(cx, cy, x1, y1, x2, y2, x3, y3);
    const dx = cx - closest.x;
    const dy = cy - closest.y;
    return (dx * dx + dy * dy) < (radius * radius);
}

function getClosestPointOnTriangle(px, py, x1, y1, x2, y2, x3, y3) {
    const ab = closestPointOnSegment(px, py, x1, y1, x2, y2);
    const bc = closestPointOnSegment(px, py, x2, y2, x3, y3);
    const ca = closestPointOnSegment(px, py, x3, y3, x1, y1);

    const dAb = (px - ab.x) * (px - ab.x) + (py - ab.y) * (py - ab.y);
    const dBc = (px - bc.x) * (px - bc.x) + (py - bc.y) * (py - bc.y);
    const dCa = (px - ca.x) * (px - ca.x) + (py - ca.y) * (py - ca.y);

    let best = ab;
    let minDist = dAb;
    if (dBc < minDist) { best = bc; minDist = dBc; }
    if (dCa < minDist) { best = ca; minDist = dCa; }

    if (pointInTriangle(px, py, x1, y1, x2, y2, x3, y3)) {
        return { x: px, y: py };
    }

    return best;
}

function closestPointOnSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    
    if (len2 === 0) return { x: x1, y: y1 };
    
    let t = ((px - x1) * dx + (py - y1) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    
    return {
        x: x1 + t * dx,
        y: y1 + t * dy
    };
}

function pointInTriangle(px, py, x1, y1, x2, y2, x3, y3) {
    const d1 = sign(px, py, x1, y1, x2, y2);
    const d2 = sign(px, py, x2, y2, x3, y3);
    const d3 = sign(px, py, x3, y3, x1, y1);

    const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
    const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);

    return !(hasNeg && hasPos);
}

function sign(px, py, x1, y1, x2, y2) {
    return (px - x2) * (y2 - y1) - (x2 - x1) * (py - y1);
}

function checkStarCollision(ball, star) {
    if (star.collected) return false;

    const dx = ball.x - star.x;
    const dy = ball.y - star.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < ball.radius + star.width / 2;
}

function checkGemCollision(ball, gem) {
    if (gem.collected) return false;

    const dx = ball.x - gem.x;
    const dy = ball.y - gem.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < ball.radius + gem.width / 2;
}

function checkGoalCollision(ball, goal) {
    return circleRectCollision(ball, goal);
}

function checkSpikeCollision(ball, platform) {
    if (!platform.hasSpike) return false;

    const spikeHeight = 15;
    const spikeWidth = 20;
    const spikeY = platform.spikeSide === 'top' ? platform.top - spikeHeight / 2 : 
                 platform.spikeSide === 'bottom' ? platform.bottom + spikeHeight / 2 :
                 platform.y;

    for (let i = 0; i < platform.spikeCount; i++) {
        const spikeX = platform.left + (i + 0.5) * (platform.width / platform.spikeCount);
        
        const dx = ball.x - spikeX;
        const dy = ball.y - spikeY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < ball.radius + spikeWidth / 2) {
            return true;
        }
    }
    return false;
}

function checkOutOfBounds(ball) {
    return ball.y > CANVAS_HEIGHT + 100 || ball.y < -100;
}

function dash(ball) {
    if (ball.dashCooldown <= 0) {
        ball.isDashing = true;
        ball.vy = DASH_SPEED;
        ball.dashCooldown = DASH_COOLDOWN_TIME;
        ball.squash = 1.3;
        ball.stretch = 0.7;
        return true;
    }
    return false;
}

function createParticles(x, y, count, color, speedRange = [200, 300], sizeRange = [3, 8], lifeRange = [0.5, 1]) {
    const particles = [];
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = speedRange[0] + Math.random() * (speedRange[1] - speedRange[0]);
        particles.push(new Particle(
            x, y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            color,
            sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]),
            lifeRange[0] + Math.random() * (lifeRange[1] - lifeRange[0])
        ));
    }
    return particles;
}

function createDashParticles(ball) {
    const particles = [];
    for (let i = 0; i < 15; i++) {
        const angle = Math.PI / 2 + (Math.random() - 0.5) * Math.PI / 2;
        const speed = 100 + Math.random() * 100;
        particles.push(new Particle(
            ball.x, ball.y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            ball.skin.color2,
            4 + Math.random() * 4,
            0.3 + Math.random() * 0.4
        ));
    }
    return particles;
}

function createCollectParticles(x, y, color) {
    return createParticles(x, y, 20, color, [150, 300], [4, 10], [0.5, 1]);
}

function createExplosionParticles(x, y) {
    const colors = ['#ef4444', '#f97316', '#fbbf24'];
    const particles = [];
    for (let i = 0; i < 30; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 150 + Math.random() * 200;
        particles.push(new Particle(
            x, y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            colors[Math.floor(Math.random() * colors.length)],
            5 + Math.random() * 8,
            0.5 + Math.random() * 0.5
        ));
    }
    return particles;
}

function createFireworkParticles(x, y) {
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];
    const particles = [];
    for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 100 + Math.random() * 150;
        particles.push(new Particle(
            x, y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed - 100,
            colors[Math.floor(Math.random() * colors.length)],
            4 + Math.random() * 6,
            1 + Math.random() * 0.5
        ));
    }
    return particles;
}

function createPowerUpParticles(x, y, color) {
    return createParticles(x, y, 30, color, [100, 250], [5, 12], [0.8, 1.5]);
}
