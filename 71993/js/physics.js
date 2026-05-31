class Physics {
  constructor(theme = 'desert', upgrades = null) {
    const themeConfig = TRACK_THEMES[theme] || TRACK_THEMES.desert;
    const themePhysics = themeConfig.physics || {};

    this.baseGravity = 1800;
    this.gravity = themePhysics.gravity || this.baseGravity;
    this.groundFriction = 0.97;
    this.airDensity = themePhysics.airDensity !== undefined ? themePhysics.airDensity : 0.999;
    this.gripMultiplier = themePhysics.gripMultiplier || 1.0;
    this.theme = theme;

    this.maxSpeed = 900;
    this.baseAcceleration = 600;
    this.acceleration = this.baseAcceleration;
    this.brakeForce = 400;
    this.airRotationSpeed = 4.5;
    this.leanSpeed = 2.0;
    this.crashAngleThreshold = 1.3;
    this.landingAngleThreshold = 0.75;

    this.suspensionSpring = 120;
    this.suspensionDamping = 8;
    this.suspensionRestLength = 18;

    this.wheelRadius = 12;
    this.wheelBase = 50;

    this.momentOfInertia = 300;
    this.angularDragAir = 0.98;
    this.angularDragGround = 0.85;

    this.coefficientOfFriction = 0.8;

    this.upgrades = upgrades || { engine: 1, tire: 1, suspension: 1 };
    this.applyUpgrades();
  }

  applyUpgrades() {
    const stats = getAppliedStats(this.upgrades);
    this.acceleration = stats.acceleration;
    this.maxSpeed = stats.maxSpeed;
    this.gripMultiplier *= stats.grip;
    this.suspensionTravel = stats.suspensionTravel;
    this.landingAngleThreshold = stats.landingAngleTolerance;
  }

  update(moto, terrain, dt, input) {
    const wasGrounded = moto.isGrounded;
    moto.justLanded = false;

    if (moto.isCrashed) return;

    const cosA = Math.cos(moto.angle);
    const sinA = Math.sin(moto.angle);

    const wheelFrontX = moto.x + cosA * this.wheelBase * 0.5;
    const wheelRearX = moto.x - cosA * this.wheelBase * 0.5;

    const frontGroundY = terrain.getHeight(wheelFrontX);
    const rearGroundY = terrain.getHeight(wheelRearX);

    moto.frontWheel.groundY = frontGroundY;
    moto.rearWheel.groundY = rearGroundY;

    this.updateSuspension(moto, frontGroundY, rearGroundY, dt);

    moto.isGrounded = moto.frontWheel.isGrounded || moto.rearWheel.isGrounded;

    this.updateDynamicCOG(moto, input);

    const contactPoints = this.getContactPoints(moto, frontGroundY, rearGroundY);

    if (moto.isGrounded) {
      this.updateGroundedPhysics(moto, input, dt, contactPoints, terrain, frontGroundY, rearGroundY);
      this.checkLaunch(moto, terrain);
    } else {
      this.updateAirbornePhysics(moto, input, dt);
    }

    this.updateKinematics(moto, dt);

    this.checkCollisions(moto, terrain, wasGrounded, frontGroundY, rearGroundY);

    this.clampValues(moto);
  }

  updateSuspension(moto, frontGroundY, rearGroundY, dt) {
    const cosA = Math.cos(moto.angle);
    const sinA = Math.sin(moto.angle);

    const wheelFrontY = moto.y + sinA * this.wheelBase * 0.5 + this.wheelRadius;
    const wheelRearY = moto.y - sinA * this.wheelBase * 0.5 + this.wheelRadius;

    const frontCompression = frontGroundY - wheelFrontY;
    const rearCompression = rearGroundY - wheelRearY;

    const maxCompression = this.suspensionTravel;

    moto.frontWheel.compression = Math.max(0, Math.min(maxCompression, frontCompression));
    moto.rearWheel.compression = Math.max(0, Math.min(maxCompression, rearCompression));

    moto.frontWheel.isGrounded = frontCompression > 0;
    moto.rearWheel.isGrounded = rearCompression > 0;

    const springForce = this.suspensionSpring;
    const dampingForce = this.suspensionDamping;

    if (moto.frontWheel.isGrounded) {
      const relativeVelocity = moto.velocityY * Math.sin(moto.angle) +
                               moto.angularVelocity * this.wheelBase * 0.5 * cosA;
      const force = moto.frontWheel.compression * springForce - relativeVelocity * dampingForce;
      moto.velocityY += force * dt * 0.5;

      if (moto.velocityY > 0) {
        moto.velocityY *= 0.9;
      }
    }

    if (moto.rearWheel.isGrounded) {
      const relativeVelocity = moto.velocityY * Math.sin(moto.angle) -
                               moto.angularVelocity * this.wheelBase * 0.5 * cosA;
      const force = moto.rearWheel.compression * springForce - relativeVelocity * dampingForce;
      moto.velocityY += force * dt * 0.5;

      if (moto.velocityY > 0) {
        moto.velocityY *= 0.9;
      }
    }
  }

  updateDynamicCOG(moto, input) {
    const baseCOGOffsetX = 0;
    const baseCOGOffsetY = -8;

    let cogShiftX = 0;
    let cogShiftY = 0;

    if (input.up) {
      cogShiftX += 3;
      cogShiftY += 2;
    }
    if (input.down) {
      cogShiftX -= 4;
      cogShiftY -= 2;
    }
    if (input.left) {
      cogShiftX -= 2;
    }
    if (input.right) {
      cogShiftX += 2;
    }

    if (moto.isGrounded && Math.abs(moto.velocityX) > 50) {
      const speedFactor = Math.min(1, Math.abs(moto.velocityX) / 400);
      cogShiftX *= speedFactor;
      cogShiftY *= speedFactor;
    }

    if (!moto.isGrounded) {
      cogShiftX *= 0.5;
      cogShiftY *= 0.3;
    }

    moto.cogOffsetX = baseCOGOffsetX + cogShiftX;
    moto.cogOffsetY = baseCOGOffsetY + cogShiftY;
  }

  getContactPoints(moto, frontGroundY, rearGroundY) {
    const points = [];

    if (moto.frontWheel.isGrounded) {
      points.push({
        x: moto.x + Math.cos(moto.angle) * this.wheelBase * 0.5,
        y: frontGroundY,
        normalX: 0,
        normalY: -1,
        isFront: true,
      });
    }

    if (moto.rearWheel.isGrounded) {
      points.push({
        x: moto.x - Math.cos(moto.angle) * this.wheelBase * 0.5,
        y: rearGroundY,
        normalX: 0,
        normalY: -1,
        isFront: false,
      });
    }

    return points;
  }

  updateGroundedPhysics(moto, input, dt, contactPoints, terrain, frontGroundY, rearGroundY) {
    const traction = this.gripMultiplier * this.coefficientOfFriction;

    if (input.up) {
      if (moto.rearWheel.isGrounded) {
        moto.velocityX += this.acceleration * dt * traction;
        moto.angularVelocity += this.acceleration * dt * 0.001;
      } else if (moto.frontWheel.isGrounded) {
        moto.velocityX += this.acceleration * dt * 0.5 * traction;
      }
    }

    if (input.down) {
      const brakeForce = this.brakeForce * dt * traction;
      if (moto.frontWheel.isGrounded) {
        moto.velocityX -= brakeForce * 0.6;
        moto.angularVelocity -= brakeForce * 0.0015;
      }
      if (moto.rearWheel.isGrounded) {
        moto.velocityX -= brakeForce * 0.4;
        moto.angularVelocity += brakeForce * 0.001;
      }
      if (moto.velocityX < -100) moto.velocityX = -100;
    }

    const slopeAngle = terrain.getAngle(moto.x);
    const slopeForce = Math.sin(slopeAngle) * this.gravity * 0.5;
    moto.velocityX += slopeForce * dt;

    if (moto.frontWheel.isGrounded && moto.rearWheel.isGrounded) {
      const targetAngle = Math.atan2(
        frontGroundY - rearGroundY,
        this.wheelBase
      );

      let angleDiff = targetAngle - moto.angle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      const alignmentTorque = angleDiff * 8;
      moto.angularVelocity += alignmentTorque * dt;
    }

    const leanTorque = 3.0;
    if (input.left) {
      moto.angularVelocity -= leanTorque * dt;
    }
    if (input.right) {
      moto.angularVelocity += leanTorque * dt;
    }

    const rollingResistance = 0.02 * traction;
    moto.velocityX *= (1 - rollingResistance * dt * 60);
    moto.velocityX *= this.groundFriction;

    moto.angularVelocity *= this.angularDragGround;

    const avgCompression = (moto.frontWheel.compression + moto.rearWheel.compression) / 2;
    const targetY = Math.min(frontGroundY, rearGroundY) - this.suspensionRestLength - avgCompression * 0.5;
    moto.y += (targetY - moto.y) * Math.min(1, dt * 15);
  }

  updateAirbornePhysics(moto, input, dt) {
    moto.velocityY += this.gravity * dt;

    moto.velocityX *= (0.995 + this.airDensity * 0.004);

    const airControl = 1.0;

    if (input.left) {
      const torque = -this.airRotationSpeed * airControl;
      moto.angularVelocity += torque * dt;
    }
    if (input.right) {
      const torque = this.airRotationSpeed * airControl;
      moto.angularVelocity += torque * dt;
    }

    if (input.up && moto.rearWheel.isGrounded === false) {
      moto.velocityX += this.acceleration * 0.15 * dt;
    }

    moto.angularVelocity *= this.angularDragAir;
    moto.angle += moto.angularVelocity * dt;
  }

  updateKinematics(moto, dt) {
    moto.x += moto.velocityX * dt;
    moto.y += moto.velocityY * dt;

    while (moto.angle > Math.PI) moto.angle -= Math.PI * 2;
    while (moto.angle < -Math.PI) moto.angle += Math.PI * 2;

    moto.angularVelocity = Math.max(-15, Math.min(15, moto.angularVelocity));
  }

  checkLaunch(moto, terrain) {
    if (!moto.isGrounded) return;

    const slopeAngle = terrain.getAngle(moto.x);
    const speed = Math.abs(moto.velocityX);

    if (slopeAngle < -0.15 && speed > 150) {
      const launchPower = Math.abs(slopeAngle) * speed * 0.7;
      if (launchPower > 80) {
        moto.velocityY = -launchPower * 0.6;
        moto.angularVelocity = slopeAngle * 1.5;
        moto.isGrounded = false;
        moto.frontWheel.isGrounded = false;
        moto.rearWheel.isGrounded = false;
        moto.y -= 10;
        return;
      }
    }

    const aheadAngle = terrain.getAngle(moto.x + 20);
    const curvature = aheadAngle - slopeAngle;
    if (curvature > 0.1 && speed > 300) {
      const neededForce = curvature * speed * speed / 20;
      if (neededForce > this.gravity * 0.4) {
        moto.velocityY = -neededForce * 0.3;
        moto.isGrounded = false;
        moto.frontWheel.isGrounded = false;
        moto.rearWheel.isGrounded = false;
        moto.y -= 10;
      }
    }
  }

  checkCollisions(moto, terrain, wasGrounded, frontGroundY, rearGroundY) {
    const frontWheelY = moto.y + Math.sin(moto.angle) * this.wheelBase * 0.5 + this.wheelRadius;
    const rearWheelY = moto.y - Math.sin(moto.angle) * this.wheelBase * 0.5 + this.wheelRadius;

    const frontContact = frontWheelY >= frontGroundY - 2;
    const rearContact = rearWheelY >= rearGroundY - 2;

    const preLandVelY = moto.velocityY;

    if (!wasGrounded && (frontContact || rearContact)) {
      const terrainAngle = terrain.getAngle(moto.x);
      let landingAngle = Math.abs(moto.angle - terrainAngle);
      while (landingAngle > Math.PI) landingAngle = Math.abs(landingAngle - Math.PI * 2);

      if (landingAngle > this.landingAngleThreshold) {
        this.crashMotorcycle(moto);
        return;
      }

      if (preLandVelY > 300) {
        this.crashMotorcycle(moto);
        return;
      }

      moto.justLanded = true;
      moto.landingImpact = Math.abs(preLandVelY) + Math.abs(moto.angularVelocity) * 30;

      const avgGroundY = (frontGroundY + rearGroundY) / 2;
      moto.y = avgGroundY - this.suspensionRestLength - this.wheelRadius;

      if (moto.velocityY > 0) {
        moto.velocityY *= -0.2;
      }
    }

    if (moto.x < 0) {
      moto.x = 0;
      moto.velocityX = Math.max(0, moto.velocityX);
    }
  }

  clampValues(moto) {
    moto.velocityX = Math.max(-300, Math.min(this.maxSpeed, moto.velocityX));
    moto.velocityY = Math.max(-800, Math.min(800, moto.velocityY));
    moto.y = Math.max(-200, Math.min(1000, moto.y));
  }

  crashMotorcycle(moto) {
    moto.isCrashed = true;
    moto.crashTime = Date.now();
    moto.angularVelocity = (Math.random() - 0.5) * 10;
    moto.velocityY = -300;
    moto.isGrounded = false;
    moto.frontWheel.isGrounded = false;
    moto.rearWheel.isGrounded = false;
  }

  getWheelBase() {
    return this.wheelBase;
  }

  getWheelRadius() {
    return this.wheelRadius;
  }

  getSuspensionRestLength() {
    return this.suspensionRestLength;
  }

  setTheme(theme) {
    this.theme = theme;
    const themeConfig = TRACK_THEMES[theme] || TRACK_THEMES.desert;
    const themePhysics = themeConfig.physics || {};
    this.gravity = themePhysics.gravity || this.baseGravity;
    this.airDensity = themePhysics.airDensity !== undefined ? themePhysics.airDensity : 0.999;
    this.gripMultiplier = themePhysics.gripMultiplier || 1.0;
    this.applyUpgrades();
  }

  setUpgrades(upgrades) {
    this.upgrades = { ...upgrades };
    this.applyUpgrades();
  }
}

window.Physics = Physics;
