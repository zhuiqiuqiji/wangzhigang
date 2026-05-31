class Motorcycle {
  constructor(x, y, upgrades = { engine: 1, tire: 1, suspension: 1 }) {
    this.x = x;
    this.y = y;
    this.velocityX = 0;
    this.velocityY = 0;
    this.angle = 0;
    this.angularVelocity = 0;
    this.isGrounded = true;
    this.isCrashed = false;
    this.crashTime = 0;
    this.wheelAngle = 0;
    this.justLanded = false;
    this.landingImpact = 0;
    this.totalRotation = 0;
    this.lastAngle = 0;
    this.trickCount = 0;
    this.comboTimer = 0;
    this.currentTrickRotation = 0;
    this.isDoingTrick = false;
    this.exhaustParticles = [];
    this.suspensionOffset = 0;
    this.airTime = 0;
    this.ghostTrail = [];

    this.upgrades = upgrades;
    this.stats = getAppliedStats(upgrades);

    this.frontWheel = {
      x: 0,
      y: 0,
      isGrounded: true,
      compression: 0,
      slipAngle: 0,
      groundY: 0,
    };

    this.rearWheel = {
      x: 0,
      y: 0,
      isGrounded: true,
      compression: 0,
      slipAngle: 0,
      groundY: 0,
    };

    this.cogOffsetX = 0;
    this.cogOffsetY = -8;

    this.trickState = {
      active: false,
      type: null,
      startAngle: 0,
      rotationAccum: 0,
      duration: 0,
      maxSlip: 0,
      progress: 0,
      lastAngle: 0,
    };

    this.driftState = {
      isDrifting: false,
      driftAngle: 0,
      driftDuration: 0,
      maxDriftAngle: 0,
    };

    this.supermanState = {
      active: false,
      duration: 0,
      maxDuration: 0,
    };
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.velocityX = 0;
    this.velocityY = 0;
    this.angle = 0;
    this.angularVelocity = 0;
    this.isGrounded = true;
    this.isCrashed = false;
    this.crashTime = 0;
    this.wheelAngle = 0;
    this.justLanded = false;
    this.landingImpact = 0;
    this.totalRotation = 0;
    this.lastAngle = 0;
    this.trickCount = 0;
    this.comboTimer = 0;
    this.currentTrickRotation = 0;
    this.isDoingTrick = false;
    this.exhaustParticles = [];
    this.suspensionOffset = 0;
    this.airTime = 0;
    this.ghostTrail = [];

    this.frontWheel = {
      x: 0,
      y: 0,
      isGrounded: true,
      compression: 0,
      slipAngle: 0,
      groundY: 0,
    };

    this.rearWheel = {
      x: 0,
      y: 0,
      isGrounded: true,
      compression: 0,
      slipAngle: 0,
      groundY: 0,
    };

    this.cogOffsetX = 0;
    this.cogOffsetY = -8;

    this.trickState = {
      active: false,
      type: null,
      startAngle: 0,
      rotationAccum: 0,
      duration: 0,
      maxSlip: 0,
      progress: 0,
      lastAngle: 0,
    };

    this.driftState = {
      isDrifting: false,
      driftAngle: 0,
      driftDuration: 0,
      maxDriftAngle: 0,
    };

    this.supermanState = {
      active: false,
      duration: 0,
      maxDuration: 0,
    };

    this.recalculateStats();
  }

  recalculateStats() {
    this.stats = getAppliedStats(this.upgrades);
  }

  setUpgrades(upgrades) {
    this.upgrades = { ...upgrades };
    this.recalculateStats();
  }

  getUpgrade(type) {
    return this.upgrades[type] || 1;
  }

  update(dt, physics) {
    this.wheelAngle += (this.velocityX * dt) / 20;

    const wheelBase = physics ? physics.getWheelBase() : 50;
    const cosA = Math.cos(this.angle);
    const sinA = Math.sin(this.angle);

    this.frontWheel.x = this.x + cosA * wheelBase * 0.5;
    this.frontWheel.y = this.y + sinA * wheelBase * 0.5;
    this.rearWheel.x = this.x - cosA * wheelBase * 0.5;
    this.rearWheel.y = this.y - sinA * wheelBase * 0.5;

    if (this.isGrounded) {
      const avgCompression = (this.frontWheel.compression + this.rearWheel.compression) / 2;
      const targetSusp = this.velocityX > 10 ? -2 - avgCompression * 0.3 : -avgCompression * 0.2;
      this.suspensionOffset += (targetSusp - this.suspensionOffset) * 0.1;
      this.airTime = 0;
    } else {
      this.suspensionOffset *= 0.95;
      this.airTime += dt;
    }

    this.updateExhaust(dt);

    if (!this.isGrounded && !this.isCrashed) {
      const angleDiff = this.angle - this.lastAngle;
      let normalizedDiff = angleDiff;
      while (normalizedDiff > Math.PI) normalizedDiff -= Math.PI * 2;
      while (normalizedDiff < -Math.PI) normalizedDiff += Math.PI * 2;

      this.currentTrickRotation += normalizedDiff;
      this.totalRotation += Math.abs(normalizedDiff);
      this.isDoingTrick = true;

      if (this.airTime < 3 && Math.floor(this.airTime * 10) % 2 === 0) {
        this.ghostTrail.push({
          x: this.x,
          y: this.y,
          angle: this.angle,
          alpha: 0.3,
        });
      }

      for (let i = this.ghostTrail.length - 1; i >= 0; i--) {
        this.ghostTrail[i].alpha -= dt * 0.8;
        if (this.ghostTrail[i].alpha <= 0) {
          this.ghostTrail.splice(i, 1);
        }
      }
    } else {
      if (this.isDoingTrick && Math.abs(this.currentTrickRotation) > 0.3) {
        this.trickCount++;
      }
      this.currentTrickRotation = 0;
      this.isDoingTrick = false;
      this.ghostTrail = [];
    }

    this.lastAngle = this.angle;

    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
    }

    if (this.justLanded) {
      this.justLanded = false;
    }
  }

  updateExhaust(dt) {
    if (this.velocityX > 20 && !this.isCrashed) {
      const cosA = Math.cos(this.angle);
      const sinA = Math.sin(this.angle);
      const intensity = Math.min(1, this.velocityX / 500);
      this.exhaustParticles.push({
        x: this.x - cosA * 35,
        y: this.y - sinA * 35 + 5,
        vx: -this.velocityX * 0.3 + (Math.random() - 0.5) * 40,
        vy: (Math.random() - 0.5) * 30 - 20,
        life: 0.3 + Math.random() * 0.4 * intensity,
        maxLife: 0.7,
        size: 2 + Math.random() * 5 * intensity,
        intensity: intensity,
      });
    }

    for (let i = this.exhaustParticles.length - 1; i >= 0; i--) {
      const p = this.exhaustParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 50 * dt;
      p.life -= dt;
      p.size *= 0.97;
      if (p.life <= 0) {
        this.exhaustParticles.splice(i, 1);
      }
    }

    if (this.exhaustParticles.length > 80) {
      this.exhaustParticles.splice(0, this.exhaustParticles.length - 80);
    }
  }

  getSpeed() {
    return Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
  }

  getSpeedKmh() {
    return Math.abs(this.velocityX) * 3.6;
  }

  getFullRotations() {
    return Math.floor(Math.abs(this.totalRotation) / (Math.PI * 2));
  }

  getCurrentTrickRotations() {
    return Math.abs(this.currentTrickRotation) / (Math.PI * 2);
  }

  getTrickDirection() {
    return this.currentTrickRotation > 0 ? 'front' : 'back';
  }

  getTrickName() {
    const rotations = this.getCurrentTrickRotations();
    const direction = this.getTrickDirection();
    const prefix = direction === 'front' ? 'FRONT' : 'BACK';

    if (rotations >= 2.5) return 'TRIPLE ' + prefix + 'FLIP';
    if (rotations >= 2) return 'DOUBLE ' + prefix + 'FLIP';
    if (rotations >= 1.5) return '1.5 ' + prefix + 'FLIP';
    if (rotations >= 1) return prefix + 'FLIP';
    if (rotations >= 0.75) return 'CORK 720';
    if (rotations >= 0.5) return prefix + ' HALF';
    return '';
  }

  getWheelPositions(physics) {
    const wheelBase = physics ? physics.getWheelBase() : 50;
    const wheelRadius = physics ? physics.getWheelRadius() : 12;
    const cosA = Math.cos(this.angle);
    const sinA = Math.sin(this.angle);

    return {
      front: {
        x: this.x + cosA * wheelBase * 0.5,
        y: this.y + sinA * wheelBase * 0.5 + wheelRadius,
      },
      rear: {
        x: this.x - cosA * wheelBase * 0.5,
        y: this.y - sinA * wheelBase * 0.5 + wheelRadius,
      },
    };
  }

  getCOGPosition() {
    return {
      x: this.x + this.cogOffsetX,
      y: this.y + this.cogOffsetY,
    };
  }

  getSuspensionCompression() {
    return {
      front: this.frontWheel.compression,
      rear: this.rearWheel.compression,
      average: (this.frontWheel.compression + this.rearWheel.compression) / 2,
    };
  }

  isBothWheelsGrounded() {
    return this.frontWheel.isGrounded && this.rearWheel.isGrounded;
  }

  isOnlyFrontWheelGrounded() {
    return this.frontWheel.isGrounded && !this.rearWheel.isGrounded;
  }

  isOnlyRearWheelGrounded() {
    return !this.frontWheel.isGrounded && this.rearWheel.isGrounded;
  }

  getGroundContactCount() {
    return (this.frontWheel.isGrounded ? 1 : 0) + (this.rearWheel.isGrounded ? 1 : 0);
  }

  getStabilityScore() {
    if (this.isCrashed) return 0;
    if (!this.isGrounded) return 0.7;

    const contactScore = this.getGroundContactCount() * 0.4;
    const angleScore = 1 - Math.min(1, Math.abs(this.angle) / 1.0);
    const slipScore = 1 - Math.min(1, Math.abs(this.driftState.driftAngle) / 0.5);

    return Math.min(1, contactScore + angleScore * 0.4 + slipScore * 0.2);
  }

  activateSuperman() {
    if (!this.isGrounded && !this.supermanState.active) {
      this.supermanState.active = true;
      this.supermanState.duration = 0;
      return true;
    }
    return false;
  }

  deactivateSuperman() {
    if (this.supermanState.active) {
      this.supermanState.active = false;
      const duration = this.supermanState.duration;
      this.supermanState.duration = 0;
      return duration;
    }
    return 0;
  }

  getStats() {
    return { ...this.stats };
  }

  getMaxSpeed() {
    return this.stats.maxSpeed;
  }

  getAcceleration() {
    return this.stats.acceleration;
  }

  getGrip() {
    return this.stats.grip;
  }

  getSuspensionTravel() {
    return this.stats.suspensionTravel;
  }

  getLandingTolerance() {
    return this.stats.landingAngleTolerance;
  }

  getStateForRecording() {
    return {
      x: this.x,
      y: this.y,
      angle: this.angle,
      velocityX: this.velocityX,
      velocityY: this.velocityY,
      frontWheel: { ...this.frontWheel },
      rearWheel: { ...this.rearWheel },
      isGrounded: this.isGrounded,
      isCrashed: this.isCrashed,
    };
  }

  applyStateFromPlayback(state) {
    this.x = state.x;
    this.y = state.y;
    this.angle = state.angle;
    this.velocityX = state.velocityX;
    this.velocityY = state.velocityY;
    if (state.frontWheel) this.frontWheel = { ...state.frontWheel };
    if (state.rearWheel) this.rearWheel = { ...state.rearWheel };
    if (state.isGrounded !== undefined) this.isGrounded = state.isGrounded;
    if (state.isCrashed !== undefined) this.isCrashed = state.isCrashed;
  }
}

window.Motorcycle = Motorcycle;
