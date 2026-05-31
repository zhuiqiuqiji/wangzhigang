const MathUtils = {
  clamp: function(value, min, max) {
    return Math.max(min, Math.min(max, value));
  },

  lerp: function(a, b, t) {
    return a + (b - a) * t;
  },

  normalizeAngle: function(angle) {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
  },

  angleDiff: function(a, b) {
    let diff = a - b;
    return this.normalizeAngle(diff);
  },

  mapRange: function(value, inMin, inMax, outMin, outMax) {
    return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
  },

  randomRange: function(min, max) {
    return Math.random() * (max - min) + min;
  },

  distance: function(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  },

  smoothStep: function(edge0, edge1, x) {
    const t = MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  },

  getShortestRotation: function(from, to) {
    let diff = to - from;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return diff;
  },

  springDamp: function(current, target, velocity, smoothTime, maxSpeed, dt) {
    smoothTime = Math.max(0.0001, smoothTime);
    const omega = 2 / smoothTime;
    const x = omega * dt;
    const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
    let change = current - target;
    const temp = (velocity + omega * change) * dt;
    velocity = (velocity - omega * temp) * exp;
    const output = target + (change + temp) * exp;
    if (Math.abs(output - target) > maxSpeed * dt) {
      return [target + Math.sign(output - target) * maxSpeed * dt, velocity];
    }
    return [output, velocity];
  },
};

window.MathUtils = MathUtils;
