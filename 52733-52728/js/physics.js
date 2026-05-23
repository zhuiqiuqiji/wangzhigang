class Vector2D {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    add(v) {
        return new Vector2D(this.x + v.x, this.y + v.y);
    }

    subtract(v) {
        return new Vector2D(this.x - v.x, this.y - v.y);
    }

    multiply(scalar) {
        return new Vector2D(this.x * scalar, this.y * scalar);
    }

    divide(scalar) {
        return new Vector2D(this.x / scalar, this.y / scalar);
    }

    dot(v) {
        return this.x * v.x + this.y * v.y;
    }

    cross(v) {
        return this.x * v.y - this.y * v.x;
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize() {
        const len = this.length();
        if (len === 0) return new Vector2D(0, 0);
        return this.divide(len);
    }

    distance(v) {
        return this.subtract(v).length();
    }

    reflect(normal) {
        const dot = this.dot(normal);
        return this.subtract(normal.multiply(2 * dot));
    }

    perpendicular() {
        return new Vector2D(-this.y, this.x);
    }

    clone() {
        return new Vector2D(this.x, this.y);
    }

    static lerp(a, b, t) {
        return new Vector2D(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
    }
}

class Physics {
    static FRICTION = 0.992;
    static ROLLING_FRICTION = 0.995;
    static SPIN_FRICTION = 0.98;
    static MIN_VELOCITY = 0.02;
    static RESTITUTION = 0.92;
    static WALL_RESTITUTION = 0.85;
    static SPIN_TRANSFER = 0.3;
    static CUSHION_FRICTION = 0.7;

    static updateBall(ball) {
        if (ball.potted) return;

        if (ball.spin && (ball.spin.x !== 0 || ball.spin.y !== 0)) {
            const spinEffect = new Vector2D(ball.spin.x, ball.spin.y).multiply(0.02);
            ball.velocity = ball.velocity.add(spinEffect);
            ball.spin.x *= this.SPIN_FRICTION;
            ball.spin.y *= this.SPIN_FRICTION;
        }

        ball.position = ball.position.add(ball.velocity);

        const speed = ball.velocity.length();
        if (speed > 0) {
            const rollingDecay = Math.pow(this.ROLLING_FRICTION, speed * 0.1);
            ball.velocity = ball.velocity.multiply(rollingDecay);
        }

        ball.velocity = ball.velocity.multiply(this.FRICTION);

        if (ball.velocity.length() < this.MIN_VELOCITY) {
            ball.velocity = new Vector2D(0, 0);
            if (ball.spin) {
                ball.spin.x = 0;
                ball.spin.y = 0;
            }
        }
    }

    static checkBallCollision(ball1, ball2) {
        if (ball1.potted || ball2.potted) return false;

        const distance = ball1.position.distance(ball2.position);
        const minDistance = ball1.radius + ball2.radius;

        return distance < minDistance;
    }

    static resolveBallCollision(ball1, ball2) {
        const normal = ball2.position.subtract(ball1.position).normalize();
        const tangent = normal.perpendicular();
        const relativeVelocity = ball1.velocity.subtract(ball2.velocity);
        const velocityAlongNormal = relativeVelocity.dot(normal);

        if (velocityAlongNormal > 0) return;

        const impulse = -(1 + this.RESTITUTION) * velocityAlongNormal / 2;
        const impulseVector = normal.multiply(impulse);

        ball1.velocity = ball1.velocity.add(impulseVector);
        ball2.velocity = ball2.velocity.subtract(impulseVector);

        const velocityAlongTangent = relativeVelocity.dot(tangent);
        const frictionImpulse = -velocityAlongTangent * 0.1;
        const frictionVector = tangent.multiply(frictionImpulse);
        ball1.velocity = ball1.velocity.add(frictionVector);
        ball2.velocity = ball2.velocity.subtract(frictionVector);

        if (ball1.spin && ball2.spin) {
            ball2.spin.x += ball1.spin.x * this.SPIN_TRANSFER;
            ball2.spin.y += ball1.spin.y * this.SPIN_TRANSFER;
        }

        const overlap = (ball1.radius + ball2.radius) - ball1.position.distance(ball2.position);
        const separation = normal.multiply(overlap / 2 + 0.1);
        ball1.position = ball1.position.subtract(separation);
        ball2.position = ball2.position.add(separation);
    }

    static checkWallCollision(ball, table) {
        const result = { collided: false, normal: null };

        if (ball.position.x - ball.radius < table.left) {
            ball.position.x = table.left + ball.radius;
            ball.velocity.x = -ball.velocity.x * this.WALL_RESTITUTION;
            if (ball.spin) {
                ball.velocity.y += ball.spin.y * this.CUSHION_FRICTION * 0.5;
            }
            result.collided = true;
            result.normal = new Vector2D(1, 0);
        }
        if (ball.position.x + ball.radius > table.right) {
            ball.position.x = table.right - ball.radius;
            ball.velocity.x = -ball.velocity.x * this.WALL_RESTITUTION;
            if (ball.spin) {
                ball.velocity.y -= ball.spin.y * this.CUSHION_FRICTION * 0.5;
            }
            result.collided = true;
            result.normal = new Vector2D(-1, 0);
        }
        if (ball.position.y - ball.radius < table.top) {
            ball.position.y = table.top + ball.radius;
            ball.velocity.y = -ball.velocity.y * this.WALL_RESTITUTION;
            if (ball.spin) {
                ball.velocity.x += ball.spin.x * this.CUSHION_FRICTION * 0.5;
            }
            result.collided = true;
            result.normal = new Vector2D(0, 1);
        }
        if (ball.position.y + ball.radius > table.bottom) {
            ball.position.y = table.bottom - ball.radius;
            ball.velocity.y = -ball.velocity.y * this.WALL_RESTITUTION;
            if (ball.spin) {
                ball.velocity.x -= ball.spin.x * this.CUSHION_FRICTION * 0.5;
            }
            result.collided = true;
            result.normal = new Vector2D(0, -1);
        }

        return result;
    }

    static checkPocket(ball, pockets, pocketRadius) {
        for (const pocket of pockets) {
            const distance = ball.position.distance(pocket);
            if (distance < pocketRadius + ball.radius * 0.5) {
                return true;
            }
        }
        return false;
    }

    static areAllBallsStopped(balls) {
        for (const ball of balls) {
            if (ball.potted) continue;
            if (ball.velocity.length() > this.MIN_VELOCITY) {
                return false;
            }
        }
        return true;
    }

    static predictTrajectory(cueBall, balls, table, power, angle, maxSteps = 500) {
        const simBall = {
            position: cueBall.position.clone(),
            velocity: new Vector2D(Math.cos(angle) * power, Math.sin(angle) * power),
            radius: cueBall.radius,
            potted: false,
            spin: cueBall.spin ? { ...cueBall.spin } : { x: 0, y: 0 }
        };

        const simBalls = balls.map(b => ({
            position: b.position.clone(),
            velocity: new Vector2D(0, 0),
            radius: b.radius,
            potted: b.potted,
            number: b.number
        }));

        const trajectory = [{
            x: simBall.position.x,
            y: simBall.position.y,
            collision: null
        }];

        for (let step = 0; step < maxSteps; step++) {
            this.updateBall(simBall);

            for (const otherBall of simBalls) {
                if (otherBall.potted || otherBall.number === 0) continue;
                if (this.checkBallCollision(simBall, otherBall)) {
                    trajectory.push({
                        x: simBall.position.x,
                        y: simBall.position.y,
                        collision: otherBall.number
                    });
                    return trajectory;
                }
            }

            const wallResult = this.checkWallCollision(simBall, table);
            if (wallResult.collided) {
                trajectory.push({
                    x: simBall.position.x,
                    y: simBall.position.y,
                    collision: 'wall'
                });
                if (trajectory.length >= 5) {
                    return trajectory;
                }
            }

            if (step % 3 === 0) {
                trajectory.push({
                    x: simBall.position.x,
                    y: simBall.position.y,
                    collision: null
                });
            }

            if (simBall.velocity.length() < this.MIN_VELOCITY) {
                break;
            }
        }

        return trajectory;
    }
}
