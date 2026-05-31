const TRICKS = {
  backflip: {
    id: 'backflip',
    name: '后空翻',
    baseScore: 500,
    difficulty: 2,
    icon: '↩',
    description: '向后完整旋转360度',
    detect: function(moto, dt, trickState) {
      if (moto.isGrounded) return false;
      if (moto.angularVelocity < -2.5) {
        if (!trickState.active) {
          trickState.active = true;
          trickState.startAngle = moto.angle;
          trickState.rotationAccum = 0;
          trickState.type = 'backflip';
          trickState.progress = 0;
        }
        return true;
      }
      return trickState.active && trickState.type === 'backflip';
    },
    update: function(moto, dt, trickState) {
      const angleDiff = moto.angle - trickState.lastAngle;
      let normalizedDiff = angleDiff;
      while (normalizedDiff > Math.PI) normalizedDiff -= Math.PI * 2;
      while (normalizedDiff < -Math.PI) normalizedDiff += Math.PI * 2;
      trickState.rotationAccum += Math.abs(normalizedDiff);
      trickState.progress = Math.min(1, trickState.rotationAccum / (Math.PI * 2));
      trickState.lastAngle = moto.angle;
    },
    complete: function(moto, trickState) {
      if (!moto.isGrounded) return null;
      if (trickState.rotationAccum >= Math.PI * 2 - 0.3) {
        const rotations = Math.floor(trickState.rotationAccum / (Math.PI * 2));
        const quality = trickState.progress >= 0.95 ? 'perfect' :
                       trickState.progress >= 0.8 ? 'good' : 'ok';
        return {
          id: 'backflip',
          name: rotations >= 2 ? '双后空翻' : '后空翻',
          baseScore: 500 * rotations,
          difficulty: rotations >= 2 ? 4 : 2,
          quality: quality,
          rotations: rotations,
        };
      }
      return null;
    }
  },
  frontflip: {
    id: 'frontflip',
    name: '前空翻',
    baseScore: 600,
    difficulty: 3,
    icon: '↪',
    description: '向前完整旋转360度',
    detect: function(moto, dt, trickState) {
      if (moto.isGrounded) return false;
      if (moto.angularVelocity > 2.5) {
        if (!trickState.active) {
          trickState.active = true;
          trickState.startAngle = moto.angle;
          trickState.rotationAccum = 0;
          trickState.type = 'frontflip';
          trickState.progress = 0;
        }
        return true;
      }
      return trickState.active && trickState.type === 'frontflip';
    },
    update: function(moto, dt, trickState) {
      const angleDiff = moto.angle - trickState.lastAngle;
      let normalizedDiff = angleDiff;
      while (normalizedDiff > Math.PI) normalizedDiff -= Math.PI * 2;
      while (normalizedDiff < -Math.PI) normalizedDiff += Math.PI * 2;
      trickState.rotationAccum += Math.abs(normalizedDiff);
      trickState.progress = Math.min(1, trickState.rotationAccum / (Math.PI * 2));
      trickState.lastAngle = moto.angle;
    },
    complete: function(moto, trickState) {
      if (!moto.isGrounded) return null;
      if (trickState.rotationAccum >= Math.PI * 2 - 0.3) {
        const rotations = Math.floor(trickState.rotationAccum / (Math.PI * 2));
        const quality = trickState.progress >= 0.95 ? 'perfect' :
                       trickState.progress >= 0.8 ? 'good' : 'ok';
        return {
          id: 'frontflip',
          name: rotations >= 2 ? '双前空翻' : '前空翻',
          baseScore: 600 * rotations,
          difficulty: rotations >= 2 ? 5 : 3,
          quality: quality,
          rotations: rotations,
        };
      }
      return null;
    }
  },
  superman: {
    id: 'superman',
    name: '超人飞行',
    baseScore: 800,
    difficulty: 4,
    icon: '🦸',
    description: '空中保持特定姿态2秒以上',
    detect: function(moto, dt, trickState) {
      if (moto.isGrounded) return false;
      if (trickState.active && trickState.type === 'superman') return true;

      const angleFromHorizontal = Math.abs(moto.angle);
      const isLevel = angleFromHorizontal < 0.3;
      const isMovingForward = moto.velocityX > 100;
      const isAscending = moto.velocityY < 50;

      if (isLevel && isMovingForward && isAscending) {
        if (!trickState.active) {
          trickState.active = true;
          trickState.type = 'superman';
          trickState.duration = 0;
          trickState.progress = 0;
        }
        return true;
      }
      return false;
    },
    update: function(moto, dt, trickState) {
      const angleFromHorizontal = Math.abs(moto.angle);
      const isLevel = angleFromHorizontal < 0.3;
      if (isLevel) {
        trickState.duration += dt;
      }
      trickState.progress = Math.min(1, trickState.duration / 2.0);
    },
    complete: function(moto, trickState) {
      if (!moto.isGrounded) return null;
      if (trickState.duration >= 2.0) {
        const multiplier = Math.min(2, 1 + (trickState.duration - 2) / 2);
        const quality = trickState.duration >= 3.5 ? 'perfect' :
                       trickState.duration >= 2.5 ? 'good' : 'ok';
        return {
          id: 'superman',
          name: '超人飞行',
          baseScore: Math.floor(800 * multiplier),
          difficulty: 4,
          quality: quality,
          duration: trickState.duration,
        };
      }
      return null;
    }
  },
  drift: {
    id: 'drift',
    name: '甩尾',
    baseScore: 300,
    difficulty: 2,
    icon: '💨',
    description: '着地时侧滑角度超过30度',
    detect: function(moto, dt, trickState) {
      if (!moto.isGrounded) return false;
      if (moto.velocityX < 100) return false;

      if (trickState.active && trickState.type === 'drift') {
        const movementAngle = Math.atan2(moto.velocityY, moto.velocityX);
        const slipAngle = Math.abs(movementAngle - moto.angle);
        if (slipAngle > 0.3) {
          return true;
        }
        return false;
      }

      const movementAngle = Math.atan2(moto.velocityY, moto.velocityX);
      const slipAngle = Math.abs(movementAngle - moto.angle);
      const isBraking = moto.velocityX < moto.getSpeed() * 0.9;

      if (slipAngle > 0.5 && isBraking) {
        trickState.active = true;
        trickState.type = 'drift';
        trickState.duration = 0;
        trickState.maxSlip = slipAngle;
        trickState.progress = 0;
        return true;
      }
      return false;
    },
    update: function(moto, dt, trickState) {
      const movementAngle = Math.atan2(moto.velocityY, moto.velocityX);
      const slipAngle = Math.abs(movementAngle - moto.angle);
      trickState.maxSlip = Math.max(trickState.maxSlip, slipAngle);
      trickState.duration += dt;
      trickState.progress = Math.min(1, trickState.duration / 0.5);
    },
    complete: function(moto, trickState) {
      if (trickState.type !== 'drift') return null;

      if (trickState.duration >= 0.3 && trickState.maxSlip >= 0.5) {
        const quality = trickState.maxSlip > 1.0 ? 'perfect' :
                       trickState.maxSlip > 0.75 ? 'good' : 'ok';
        const scoreMultiplier = 1 + (trickState.maxSlip - 0.5) / 0.5;
        return {
          id: 'drift',
          name: '甩尾',
          baseScore: Math.floor(300 * scoreMultiplier),
          difficulty: 2,
          quality: quality,
          maxSlip: trickState.maxSlip,
        };
      }
      return null;
    }
  },
  perfect_landing: {
    id: 'perfect_landing',
    name: '完美着陆',
    baseScore: 200,
    difficulty: 1,
    icon: '✨',
    description: '着陆角度与地形角度差小于5度',
    detect: function(moto, dt, trickState) {
      return false;
    },
    update: function(moto, dt, trickState) {},
    complete: function(moto, trickState, terrain) {
      if (!moto.isGrounded || !moto.justLanded) return null;

      let landingAngle = Math.abs(moto.angle - terrain.getAngle(moto.x));
      while (landingAngle > Math.PI) landingAngle = Math.abs(landingAngle - Math.PI * 2);

      if (landingAngle < 0.087) {
        return {
          id: 'perfect_landing',
          name: '完美着陆',
          baseScore: 200,
          difficulty: 1,
          quality: 'perfect',
          angleDiff: landingAngle,
        };
      }
      return null;
    }
  }
};

const TRICK_QUALITY_MULTIPLIER = {
  perfect: 1.5,
  good: 1.2,
  ok: 1.0,
};

function calculateTrickScore(trickResult, comboMultiplier) {
  const qualityMult = TRICK_QUALITY_MULTIPLIER[trickResult.quality] || 1.0;
  const difficultyMult = 1 + (trickResult.difficulty - 1) * 0.2;
  return Math.floor(trickResult.baseScore * qualityMult * difficultyMult * comboMultiplier);
}

window.TRICKS = TRICKS;
window.calculateTrickScore = calculateTrickScore;
