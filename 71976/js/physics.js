class PendulumPhysics {
    constructor() {
        this.g = 9.8;
        this.length = 1.5;
        this.mass = 1.0;
        this.damping = 0.05;
        this.theta = 0;
        this.omega = 0;
        this.dt = 1 / 60;
        this.isRunning = false;
        this.time = 0;
        this.lastCrossTime = null;
        this.measuredPeriod = 0;
        this.prevTheta = 0;
        this.trail = [];
        this.maxTrailLength = 60;
    }

    reset(theta = 0) {
        this.theta = theta;
        this.omega = 0;
        this.time = 0;
        this.lastCrossTime = null;
        this.measuredPeriod = 0;
        this.prevTheta = this.theta;
        this.isRunning = false;
        this.trail = [];
    }

    start() {
        if (Math.abs(this.theta) > 0.001) {
            this.isRunning = true;
        }
    }

    acceleration(theta, omega) {
        return -(this.g / this.length) * Math.sin(theta) - this.damping * omega;
    }

    step() {
        if (!this.isRunning) return;

        const dt = this.dt;
        const theta = this.theta;
        const omega = this.omega;

        const k1_theta = omega;
        const k1_omega = this.acceleration(theta, omega);

        const k2_theta = omega + 0.5 * dt * k1_omega;
        const k2_omega = this.acceleration(theta + 0.5 * dt * k1_theta, omega + 0.5 * dt * k1_omega);

        const k3_theta = omega + 0.5 * dt * k2_omega;
        const k3_omega = this.acceleration(theta + 0.5 * dt * k2_theta, omega + 0.5 * dt * k2_omega);

        const k4_theta = omega + dt * k3_omega;
        const k4_omega = this.acceleration(theta + dt * k3_theta, omega + dt * k3_omega);

        this.prevTheta = this.theta;
        this.theta += (dt / 6) * (k1_theta + 2 * k2_theta + 2 * k3_theta + k4_theta);
        this.omega += (dt / 6) * (k1_omega + 2 * k2_omega + 2 * k3_omega + k4_omega);
        this.time += dt;

        const crossedPositive = this.prevTheta < 0 && this.theta >= 0;
        const crossedNegative = this.prevTheta > 0 && this.theta <= 0;
        if (crossedPositive || crossedNegative) {
            if (this.lastCrossTime !== null) {
                this.measuredPeriod = (this.time - this.lastCrossTime) * 2;
            }
            this.lastCrossTime = this.time;
        }

        if (Math.abs(this.theta) < 0.0005 && Math.abs(this.omega) < 0.0005) {
            this.isRunning = false;
            this.theta = 0;
            this.omega = 0;
            this.trail = [];
        }
    }

    getAngle() {
        return this.theta;
    }

    getAngleDegrees() {
        return this.theta * (180 / Math.PI);
    }

    getAngularVelocity() {
        return this.omega;
    }

    getLinearVelocity() {
        return this.length * this.omega;
    }

    getAngularAcceleration() {
        return this.acceleration(this.theta, this.omega);
    }

    getKineticEnergy() {
        const v = this.getLinearVelocity();
        return 0.5 * this.mass * v * v;
    }

    getPotentialEnergy() {
        return this.mass * this.g * this.length * (1 - Math.cos(this.theta));
    }

    getTotalEnergy() {
        return this.getKineticEnergy() + this.getPotentialEnergy();
    }

    getTheoreticalPeriod() {
        return 2 * Math.PI * Math.sqrt(this.length / this.g);
    }

    getMeasuredPeriod() {
        return this.measuredPeriod;
    }

    getBobPosition(pivotX, pivotY, scale) {
        const x = pivotX + this.length * scale * Math.sin(this.theta);
        const y = pivotY + this.length * scale * Math.cos(this.theta);
        return { x, y };
    }

    addTrailPoint(pivotX, pivotY, scale) {
        const pos = this.getBobPosition(pivotX, pivotY, scale);
        this.trail.push({ x: pos.x, y: pos.y, age: 0 });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
        this.ageTrail();
    }

    ageTrail() {
        for (let i = 0; i < this.trail.length; i++) {
            this.trail[i].age++;
        }
        this.trail = this.trail.filter(p => p.age < this.maxTrailLength);
    }

    getState() {
        return {
            angle: this.getAngleDegrees(),
            angleRad: this.theta,
            angularVelocity: this.omega,
            linearVelocity: this.getLinearVelocity(),
            angularAcceleration: this.getAngularAcceleration(),
            kineticEnergy: this.getKineticEnergy(),
            potentialEnergy: this.getPotentialEnergy(),
            totalEnergy: this.getTotalEnergy(),
            theoreticalPeriod: this.getTheoreticalPeriod(),
            measuredPeriod: this.measuredPeriod,
            time: this.time,
            isRunning: this.isRunning,
        };
    }
}

window.PendulumPhysics = PendulumPhysics;
