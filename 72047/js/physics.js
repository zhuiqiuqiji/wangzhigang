(function () {
  'use strict';

  var BASE_W = 3.6;
  var BLOCK_H = 0.5;
  var TILT_DAMPING = 0.92;
  var TILT_RECOVERY = 0.05;
  var MAX_TILT = 0.15;

  function computeCenterOfMass(blocks) {
    if (blocks.length === 0) return { x: 0, y: 0 };

    var totalArea = 0;
    var weightedX = 0;
    var weightedY = 0;

    for (var i = 0; i < blocks.length; i++) {
      var b = blocks[i];
      var area = b.width * b.depth;
      var centerX = b.x;
      var centerY = b.y + BLOCK_H / 2;

      weightedX += centerX * area;
      weightedY += centerY * area;
      totalArea += area;
    }

    return {
      x: totalArea > 0 ? weightedX / totalArea : 0,
      y: totalArea > 0 ? weightedY / totalArea : 0
    };
  }

  function computeTilt(blocks, baseCenterX) {
    var com = computeCenterOfMass(blocks);
    var offsetX = com.x - baseCenterX;

    var tiltTarget = offsetX * 0.02;
    tiltTarget = Math.max(-MAX_TILT, Math.min(MAX_TILT, tiltTarget));

    return {
      tiltX: tiltTarget,
      tiltZ: 0,
      offsetX: offsetX,
      com: com
    };
  }

  function updateTilt(currentTilt, targetTiltX, dt) {
    var lerpFactor = 1 - Math.pow(1 - TILT_RECOVERY, dt * 60);
    var newTiltX = currentTilt.x + (targetTiltX - currentTilt.x) * lerpFactor;
    newTiltX *= TILT_DAMPING;

    var vibration = 0;
    var absTilt = Math.abs(newTiltX);
    if (absTilt > 0.01) {
      vibration = Math.sin(Date.now() * 0.008) * absTilt * 0.5;
    }

    return {
      x: newTiltX + vibration * 0.3,
      z: 0,
      targetX: targetTiltX
    };
  }

  function getStabilityRating(blocks, baseCenterX) {
    var com = computeCenterOfMass(blocks);
    var offset = Math.abs(com.x - baseCenterX);
    var baseHalfWidth = BASE_W / 2;

    if (offset < baseHalfWidth * 0.1) return { rating: 'excellent', color: 0x44ff44 };
    if (offset < baseHalfWidth * 0.3) return { rating: 'good', color: 0xaaff44 };
    if (offset < baseHalfWidth * 0.5) return { rating: 'fair', color: 0xffaa44 };
    return { rating: 'danger', color: 0xff4444 };
  }

  window.GamePhysics = {
    BASE_W: BASE_W,
    BLOCK_H: BLOCK_H,
    computeCenterOfMass: computeCenterOfMass,
    computeTilt: computeTilt,
    updateTilt: updateTilt,
    getStabilityRating: getStabilityRating
  };
})();
