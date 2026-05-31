var PhysicsEngine = (function () {
    var GRAVITY = 9.81;
    var BASE_SPEED = 0.00003;
    var MAX_SPEED = 0.00035;
    var SPEED_ACCEL = 0.00000008;
    var TILT_SPEED = 1.5;
    var TILT_RETURN = 0.6;
    var MAX_TILT = 45;
    var AIR_RESISTANCE = 0.0001;
    var ROLLING_RESISTANCE = 0.00005;

    var state = {
        progress: 0,
        lateralOffset: 0,
        lateralVelocity: 0,
        forwardSpeed: BASE_SPEED,
        tiltAngle: 0,
        rollAngle: 0,
        isFalling: false,
        fallVelocity: 0,
        fallRotationSpeed: 0,
        fallDistance: 0,
        fallRotX: 0,
        fallRotZ: 0,
        angularVelocity: 0,
        momentum: 0,
        angularMomentum: 0,
        lateralAcceleration: 0,
        forwardAcceleration: 0,
        centrifugalForce: 0,
        normalForce: 0
    };

    function reset() {
        state.progress = 0;
        state.lateralOffset = 0;
        state.lateralVelocity = 0;
        state.forwardSpeed = BASE_SPEED;
        state.tiltAngle = 0;
        state.rollAngle = 0;
        state.isFalling = false;
        state.fallVelocity = 0;
        state.fallRotationSpeed = 0;
        state.fallDistance = 0;
        state.fallRotX = 0;
        state.fallRotZ = 0;
        state.angularVelocity = 0;
        state.momentum = 0;
        state.angularMomentum = 0;
        state.lateralAcceleration = 0;
        state.forwardAcceleration = 0;
        state.centrifugalForce = 0;
        state.normalForce = 0;
    }

    function update(dt, inputState, skin, trackData) {
        if (state.isFalling) {
            return updateFall(dt, skin);
        }

        var mass = skin ? skin.mass : 1.0;
        var friction = skin ? skin.friction : 0.5;
        var bounce = skin ? skin.bounce : 0.3;
        var inertiaFactor = mass * 1.5;
        var momentOfInertia = 0.4 * mass * 0.18 * 0.18;
        var trackWidth = trackData ? trackData.width : 1.2;
        var trackFriction = trackData ? trackData.friction : 1.0;

        var tiltInput = 0;
        if (inputState.left) tiltInput -= 1;
        if (inputState.right) tiltInput += 1;

        if (tiltInput !== 0) {
            var tiltTorque = TILT_SPEED * tiltInput;
            var angularAccel = tiltTorque / momentOfInertia;
            state.angularVelocity += angularAccel * dt;
        } else {
            var dampingFactor = Math.pow(0.01, dt / inertiaFactor);
            state.angularVelocity *= dampingFactor;
            if (Math.abs(state.angularVelocity) < 0.001) {
                state.angularVelocity = 0;
                var returnTorque = -state.tiltAngle * TILT_RETURN;
                state.tiltAngle += returnTorque * dt;
            }
        }

        state.angularMomentum = momentOfInertia * state.angularVelocity;
        state.tiltAngle += state.angularVelocity * dt;
        state.tiltAngle = GameUtils.clamp(state.tiltAngle, -MAX_TILT, MAX_TILT);

        if (Math.abs(state.tiltAngle) >= MAX_TILT) {
            state.angularVelocity *= -0.3;
            state.angularMomentum *= -0.3;
        }

        var tiltRad = GameUtils.degToRad(state.tiltAngle);

        var gravityComponent = GRAVITY * Math.sin(tiltRad);
        var gravityAccel = gravityComponent * 0.0004 / inertiaFactor;
        state.lateralAcceleration = gravityAccel;

        var trackCurvature = trackData ? getCurvatureAt(state.progress, trackData) : 0;
        var centripetalAccel = 0;
        if (Math.abs(trackCurvature) > 0.0001) {
            var speedMs = state.forwardSpeed * 1000;
            var curvatureRadius = 1 / Math.abs(trackCurvature);
            centripetalAccel = speedMs * speedMs / curvatureRadius * 0.00003;
            state.centrifugalForce = mass * centripetalAccel;
            state.lateralAcceleration += Math.sign(trackCurvature) * centripetalAccel * 0.5;
        }

        var prevLateralVel = state.lateralVelocity;
        state.lateralVelocity += state.lateralAcceleration * dt;

        state.momentum = mass * state.lateralVelocity;

        var slopeAngle = trackData ? getSlopeAngleAt(state.progress, trackData) : 0;
        state.normalForce = mass * GRAVITY * Math.cos(slopeAngle);

        var gravitySlope = GRAVITY * Math.sin(slopeAngle);
        var slopeAccel = gravitySlope * 0.000015 / inertiaFactor;
        state.forwardAcceleration = slopeAccel;

        if (slopeAngle < -0.05) {
            var downhillForce = mass * GRAVITY * Math.abs(Math.sin(slopeAngle));
            state.forwardAcceleration += downhillForce * 0.000008;
        }

        var effectiveFriction = friction * trackFriction;
        var staticFriction = effectiveFriction * 0.8;
        var kineticFriction = effectiveFriction * 0.5;

        if (Math.abs(state.lateralVelocity) < 0.0005) {
            var staticFrictionForce = -state.lateralVelocity * staticFriction * 10;
            state.lateralVelocity += staticFrictionForce * dt;
        } else {
            var frictionDecel = kineticFriction * dt * 0.08;
            state.lateralVelocity *= Math.max(0, 1.0 - frictionDecel);
        }

        var rollingFriction = ROLLING_RESISTANCE * effectiveFriction * dt;
        state.forwardSpeed *= Math.max(0, 1.0 - rollingFriction);

        var airDrag = AIR_RESISTANCE * state.forwardSpeed * state.forwardSpeed * dt;
        state.forwardSpeed = Math.max(0, state.forwardSpeed - airDrag);

        state.lateralOffset += state.lateralVelocity * dt;

        var speedAccelRate = SPEED_ACCEL / (inertiaFactor * 0.6);
        state.forwardSpeed = Math.min(state.forwardSpeed + speedAccelRate * dt, MAX_SPEED * (skin ? skin.speedMultiplier || 1 : 1));

        var minSpd = BASE_SPEED * 0.4;
        if (state.forwardSpeed < minSpd) {
            state.forwardSpeed = minSpd;
        }

        state.progress += state.forwardSpeed * dt;
        if (state.progress >= 1.0) state.progress = 1.0;

        var rollSpeed = state.forwardSpeed / 0.18;
        state.rollAngle += rollSpeed * dt;

        var halfTrack = trackWidth / 2;
        if (Math.abs(state.lateralOffset) > halfTrack) {
            var impactVelocity = Math.abs(state.lateralVelocity);
            var impactEnergy = 0.5 * mass * impactVelocity * impactVelocity;
            
            if (bounce > 0.1 && impactEnergy > 0.0001) {
                state.lateralOffset = Math.sign(state.lateralOffset) * (halfTrack - 0.02);
                state.lateralVelocity = -state.lateralVelocity * bounce;
                state.angularVelocity = -state.angularVelocity * bounce * 0.5;
                
                var energyLoss = impactEnergy * (1 - bounce * bounce);
                state.forwardSpeed *= Math.max(0.7, 1 - energyLoss * 10);
            } else {
                startFalling();
            }
        }

        return {
            progress: state.progress,
            lateralOffset: state.lateralOffset,
            tiltAngle: state.tiltAngle,
            rollAngle: state.rollAngle,
            speed: state.forwardSpeed,
            isFalling: state.isFalling,
            isFinished: state.progress >= 1.0 && !state.isFalling,
            lateralVelocity: state.lateralVelocity,
            angularVelocity: state.angularVelocity,
            momentum: state.momentum,
            centrifugalForce: state.centrifugalForce,
            normalForce: state.normalForce
        };
    }

    function getCurvatureAt(progress, trackData) {
        if (!trackData || !trackData.curve) return 0;
        var eps = 0.001;
        var t0 = GameUtils.clamp(progress - eps, 0, 1);
        var t1 = GameUtils.clamp(progress + eps, 0, 1);
        var p0 = trackData.curve.getPointAt(t0);
        var p1 = trackData.curve.getPointAt(progress);
        var p2 = trackData.curve.getPointAt(t1);
        var dx1 = p1.x - p0.x;
        var dz1 = p1.z - p0.z;
        var dx2 = p2.x - p1.x;
        var dz2 = p2.z - p1.z;
        var cross = dx1 * dz2 - dz1 * dx2;
        var len = Math.sqrt(dx1 * dx1 + dz1 * dz1) * Math.sqrt(dx2 * dx2 + dz2 * dz2);
        if (len < 0.0001) return 0;
        return cross / len;
    }

    function getSlopeAngleAt(progress, trackData) {
        if (!trackData || !trackData.curve) return 0;
        var eps = 0.001;
        var t0 = GameUtils.clamp(progress - eps, 0, 1);
        var t1 = GameUtils.clamp(progress + eps, 0, 1);
        var p0 = trackData.curve.getPointAt(t0);
        var p1 = trackData.curve.getPointAt(t1);
        var dy = p1.y - p0.y;
        var dist = Math.sqrt(
            (p1.x - p0.x) * (p1.x - p0.x) +
            (p1.y - p0.y) * (p1.y - p0.y) +
            (p1.z - p0.z) * (p1.z - p0.z)
        );
        if (dist < 0.0001) return 0;
        return Math.asin(GameUtils.clamp(dy / dist, -1, 1));
    }

    function startFalling() {
        state.isFalling = true;
        state.fallVelocity = 0;
        state.fallRotationSpeed = (Math.random() - 0.5) * 0.3;
        state.fallDistance = 0;
        state.fallRotX = 0;
        state.fallRotZ = 0;
    }

    function updateFall(dt, skin) {
        var mass = skin ? skin.mass : 1.0;
        var gravityAccel = GRAVITY * 0.002;
        
        state.fallVelocity += gravityAccel * mass * dt;
        
        var terminalVelocity = 0.8 * mass;
        if (state.fallVelocity > terminalVelocity) {
            state.fallVelocity = terminalVelocity;
        }

        state.fallDistance += state.fallVelocity * dt;

        state.angularVelocity *= Math.pow(0.995, dt);
        state.tiltAngle += state.angularVelocity * dt;

        state.lateralVelocity *= Math.pow(0.998, dt);
        state.lateralOffset += state.lateralVelocity * dt * 0.1;

        state.fallRotX += state.fallRotationSpeed * dt;
        state.fallRotZ += state.fallRotationSpeed * 0.7 * dt;

        if (state.fallVelocity > terminalVelocity * 0.8) {
            return {
                progress: state.progress,
                lateralOffset: state.lateralOffset,
                tiltAngle: state.tiltAngle,
                rollAngle: state.rollAngle,
                speed: 0,
                isFalling: true,
                isFinished: false,
                fallDone: true,
                fallVelocity: state.fallVelocity,
                fallDistance: state.fallDistance,
                fallRotX: state.fallRotX,
                fallRotZ: state.fallRotZ,
                lateralVelocity: state.lateralVelocity,
                angularVelocity: state.angularVelocity
            };
        }

        return {
            progress: state.progress,
            lateralOffset: state.lateralOffset,
            tiltAngle: state.tiltAngle,
            rollAngle: state.rollAngle,
            speed: 0,
            isFalling: true,
            isFinished: false,
            fallDone: false,
            fallVelocity: state.fallVelocity,
            fallDistance: state.fallDistance,
            fallRotX: state.fallRotX,
            fallRotZ: state.fallRotZ,
            lateralVelocity: state.lateralVelocity,
            angularVelocity: state.angularVelocity
        };
    }

    function getSpeedRatio() {
        var base = BASE_SPEED;
        var max = MAX_SPEED;
        return (state.forwardSpeed - base) / (max - base);
    }

    function getState() {
        return state;
    }

    return {
        reset: reset,
        update: update,
        getSpeedRatio: getSpeedRatio,
        getState: getState
    };
})();
