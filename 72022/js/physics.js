class Point {
  constructor(x, y, pinned = false, mass = 1) {
    this.x = x;
    this.y = y;
    this.oldX = x;
    this.oldY = y;
    this.pinned = pinned;
    this.mass = mass;
    this.radius = 8;
  }

  update(gravity, damping, dt, externalForce = null) {
    if (this.pinned) return;

    const vx = (this.x - this.oldX) * damping;
    const vy = (this.y - this.oldY) * damping;

    this.oldX = this.x;
    this.oldY = this.y;

    this.x += vx;
    this.y += vy + gravity * this.mass * dt * dt;

    if (externalForce) {
      this.x += externalForce.x * dt * dt;
      this.y += externalForce.y * dt * dt;
    }
  }

  applyForce(fx, fy, dt) {
    if (this.pinned) return;
    this.x += fx * dt * dt;
    this.y += fy * dt * dt;
  }
}

class Constraint {
  constructor(p1, p2, length, stiffness = 0.8, elastic = false, maxStretch = 1.5) {
    this.p1 = p1;
    this.p2 = p2;
    this.length = length;
    this.stiffness = stiffness;
    this.cut = false;
    this.elastic = elastic;
    this.maxStretch = maxStretch;
    this.baseLength = length;
  }

  solve() {
    if (this.cut) return;

    const dx = this.p2.x - this.p1.x;
    const dy = this.p2.y - this.p1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist === 0) return;

    let targetLength = this.length;

    if (this.elastic && dist > this.length * this.maxStretch) {
      targetLength = this.length * this.maxStretch;
    }

    const diff = (dist - targetLength) / dist;
    const stiffness = this.elastic ? this.stiffness * (1 + (dist - this.length) / this.length * 0.5) : this.stiffness;
    const offsetX = dx * diff * stiffness * 0.5;
    const offsetY = dy * diff * stiffness * 0.5;

    if (!this.p1.pinned) {
      this.p1.x += offsetX;
      this.p1.y += offsetY;
    }

    if (!this.p2.pinned) {
      this.p2.x -= offsetX;
      this.p2.y -= offsetY;
    }
  }
}

class Rope {
  constructor(startX, startY, endX, endY, segments, options = {}) {
    this.points = [];
    this.constraints = [];
    this.color = options.color || '#8B4513';
    this.elastic = options.elastic || false;
    this.stiffness = options.stiffness || 0.8;
    this.maxStretch = options.maxStretch || 1.5;
    this.type = options.type || 'normal';

    const segmentLength = Math.sqrt(
      (endX - startX) ** 2 + (endY - startY) ** 2
    ) / segments;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = startX + (endX - startX) * t;
      const y = startY + (endY - startY) * t;
      const pinned = i === 0;
      const mass = i === segments ? 3 : 1;
      this.points.push(new Point(x, y, pinned, mass));
    }

    for (let i = 0; i < segments; i++) {
      this.constraints.push(
        new Constraint(
          this.points[i],
          this.points[i + 1],
          segmentLength,
          this.stiffness,
          this.elastic,
          this.maxStretch
        )
      );
    }
  }

  getEndPoint() {
    return this.points[this.points.length - 1];
  }

  update(gravity, damping, dt, externalForce = null) {
    for (const point of this.points) {
      point.update(gravity, damping, dt, externalForce);
    }

    for (let i = 0; i < 5; i++) {
      for (const constraint of this.constraints) {
        constraint.solve();
      }
    }
  }

  isFullyCut() {
    for (const c of this.constraints) {
      if (!c.cut) return false;
    }
    return true;
  }

  setEndPointPosition(x, y) {
    const endPoint = this.getEndPoint();
    const dx = x - endPoint.x;
    const dy = y - endPoint.y;
    endPoint.x += dx * 0.5;
    endPoint.y += dy * 0.5;
    endPoint.oldX += dx * 0.5;
    endPoint.oldY += dy * 0.5;
  }

  cutSegment(index) {
    if (index >= 0 && index < this.constraints.length) {
      this.constraints[index].cut = true;
      return true;
    }
    return false;
  }

  findCutSegment(x1, y1, x2, y2, threshold = 8) {
    for (let i = 0; i < this.constraints.length; i++) {
      const c = this.constraints[i];
      if (c.cut) continue;

      if (lineSegmentIntersect(
        c.p1.x, c.p1.y, c.p2.x, c.p2.y,
        x1, y1, x2, y2, threshold
      )) {
        return i;
      }
    }
    return -1;
  }

  getState() {
    return {
      points: this.points.map(p => ({ x: p.x, y: p.y }))
    };
  }

  setState(state) {
    if (!state || !state.points) return;
    for (let i = 0; i < this.points.length && i < state.points.length; i++) {
      this.points[i].x = state.points[i].x;
      this.points[i].y = state.points[i].y;
      this.points[i].oldX = state.points[i].x;
      this.points[i].oldY = state.points[i].y;
    }
  }
}

class PhysicsObject {
  constructor(x, y, type, options = {}) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.active = true;
    this.width = options.width || 50;
    this.height = options.height || 50;
    this.radius = options.radius || 25;
    this.rotation = options.rotation || 0;
  }

  update(dt, game) {}

  applyEffect(point, dt) {}

  checkCollision(point) {
    const dx = point.x - this.x;
    const dy = point.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < this.radius + (point.radius || 5);
  }

  getState() {
    return {
      x: this.x,
      y: this.y,
      active: this.active,
      rotation: this.rotation
    };
  }

  setState(state) {
    if (!state) return;
    this.x = state.x;
    this.y = state.y;
    this.active = state.active;
    this.rotation = state.rotation || 0;
  }
}

class Balloon extends PhysicsObject {
  constructor(x, y, options = {}) {
    super(x, y, 'balloon', options);
    this.liftForce = options.liftForce || -800;
    this.radius = options.radius || 30;
    this.attachedPoint = null;
    this.maxHeight = options.maxHeight || 0.1;
  }

  update(dt, game) {
    if (!this.active) return;

    if (this.attachedPoint && !this.attachedPoint.pinned) {
      const minY = game.height * this.maxHeight;
      if (this.attachedPoint.y > minY) {
        this.attachedPoint.applyForce(0, this.liftForce, dt);
      }
    }

    this.y = this.attachedPoint ? this.attachedPoint.y - this.radius : this.y;
    this.x = this.attachedPoint ? this.attachedPoint.x : this.x;
  }

  attach(point) {
    this.attachedPoint = point;
  }

  checkCollision(point) {
    if (!this.active) return false;
    return super.checkCollision(point);
  }
}

class Fan extends PhysicsObject {
  constructor(x, y, options = {}) {
    super(x, y, 'fan', options);
    this.force = options.force || 600;
    this.direction = options.direction || 0;
    this.range = options.range || 200;
    this.angle = options.angle || Math.PI / 4;
    this.width = options.width || 60;
    this.height = options.height || 30;
  }

  update(dt, game) {
    this.rotation += dt * 3;
  }

  applyEffect(point, dt) {
    if (!this.active) return;

    const dx = point.x - this.x;
    const dy = point.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > this.range) return;

    const pointAngle = Math.atan2(dy, dx);
    let angleDiff = pointAngle - this.direction;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    if (Math.abs(angleDiff) > this.angle / 2) return;

    const forceFactor = 1 - (dist / this.range);
    const fx = Math.cos(this.direction) * this.force * forceFactor;
    const fy = Math.sin(this.direction) * this.force * forceFactor;

    point.applyForce(fx, fy, dt);
  }

  checkCollision(point) {
    return false;
  }
}

class Rocket extends PhysicsObject {
  constructor(x, y, options = {}) {
    super(x, y, 'rocket', options);
    this.thrust = options.thrust || 1200;
    this.direction = options.direction || -Math.PI / 2;
    this.fuel = options.fuel || 3;
    this.maxFuel = options.fuel || 3;
    this.active = false;
    this.attachedPoint = null;
    this.radius = options.radius || 20;
  }

  update(dt, game) {
    if (!this.active || this.fuel <= 0) {
      this.active = false;
      return;
    }

    this.fuel -= dt;

    if (this.attachedPoint && !this.attachedPoint.pinned) {
      const fx = Math.cos(this.direction) * this.thrust;
      const fy = Math.sin(this.direction) * this.thrust;
      this.attachedPoint.applyForce(fx, fy, dt);
    }

    if (this.attachedPoint) {
      this.x = this.attachedPoint.x;
      this.y = this.attachedPoint.y - this.radius;
    }
  }

  attach(point) {
    this.attachedPoint = point;
  }

  ignite() {
    this.active = true;
  }

  checkCollision(point) {
    return false;
  }

  getState() {
    const state = super.getState();
    state.fuel = this.fuel;
    state.active = this.active;
    return state;
  }

  setState(state) {
    super.setState(state);
    if (state) {
      this.fuel = state.fuel;
      this.active = state.active;
    }
  }
}

class Portal extends PhysicsObject {
  constructor(x, y, targetX, targetY, options = {}) {
    super(x, y, 'portal', options);
    this.targetX = targetX;
    this.targetY = targetY;
    this.radius = options.radius || 35;
    this.cooldown = 0;
    this.linkedPortal = options.linkedPortal || null;
    this.color = options.color || '#9B59B6';
  }

  update(dt, game) {
    if (this.cooldown > 0) {
      this.cooldown -= dt;
    }
    this.rotation += dt * 2;
  }

  checkCollision(point) {
    if (!this.active || this.cooldown > 0) return false;
    return super.checkCollision(point);
  }

  teleport(point) {
    if (this.linkedPortal) {
      point.x = this.linkedPortal.x;
      point.y = this.linkedPortal.y;
      point.oldX = this.linkedPortal.x;
      point.oldY = this.linkedPortal.y;
      this.linkedPortal.cooldown = 0.5;
    } else {
      point.x = this.targetX;
      point.y = this.targetY;
      point.oldX = this.targetX;
      point.oldY = this.targetY;
    }
    this.cooldown = 0.5;
  }
}

class Pulley extends PhysicsObject {
  constructor(x, y, options = {}) {
    super(x, y, 'pulley', options);
    this.radius = options.radius || 25;
    this.ropes = [];
    this.mechanicalAdvantage = options.mechanicalAdvantage || 1;
  }

  update(dt, game) {
    this.rotation += dt * 1;
  }

  addRope(rope) {
    this.ropes.push(rope);
  }

  checkCollision(point) {
    const dx = point.x - this.x;
    const dy = point.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < this.radius + (point.radius || 5)) {
      const nx = dx / dist;
      const ny = dy / dist;
      const overlap = this.radius + (point.radius || 5) - dist;
      point.x += nx * overlap;
      point.y += ny * overlap;
      return true;
    }
    return false;
  }
}

class Star extends PhysicsObject {
  constructor(x, y, options = {}) {
    super(x, y, 'star', options);
    this.radius = options.radius || 15;
    this.collected = false;
    this.value = options.value || 1;
    this.bobOffset = Math.random() * Math.PI * 2;
  }

  update(dt, game) {
    this.rotation += dt * 2;
    this.bobOffset += dt * 3;
  }

  checkCollision(point) {
    if (this.collected || !this.active) return false;

    const dx = point.x - this.x;
    const dy = point.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < this.radius + (point.radius || 5)) {
      this.collected = true;
      this.active = false;
      return true;
    }
    return false;
  }

  getDisplayY() {
    return this.y + Math.sin(this.bobOffset) * 5;
  }

  getState() {
    const state = super.getState();
    state.collected = this.collected;
    return state;
  }

  setState(state) {
    super.setState(state);
    if (state) {
      this.collected = state.collected;
    }
  }
}

class Obstacle extends PhysicsObject {
  constructor(x, y, options = {}) {
    super(x, y, 'obstacle', options);
    this.width = options.width || 80;
    this.height = options.height || 20;
    this.isDeadly = options.isDeadly || false;
    this.isBouncy = options.isBouncy || false;
    this.bounciness = options.bounciness || 0.8;
  }

  update(dt, game) {}

  checkCollision(point) {
    if (!this.active) return false;

    const closestX = Math.max(this.x - this.width / 2, Math.min(point.x, this.x + this.width / 2));
    const closestY = Math.max(this.y - this.height / 2, Math.min(point.y, this.y + this.height / 2));

    const dx = point.x - closestX;
    const dy = point.y - closestY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < (point.radius || 5)) {
      if (this.isBouncy) {
        const nx = dx / (dist || 1);
        const ny = dy / (dist || 1);
        const vx = point.x - point.oldX;
        const vy = point.y - point.oldY;
        const dot = vx * nx + vy * ny;

        point.x = closestX + nx * ((point.radius || 5) + 1);
        point.y = closestY + ny * ((point.radius || 5) + 1);
        point.oldX = point.x + vx * this.bounciness - 2 * dot * nx * this.bounciness;
        point.oldY = point.y + vy * this.bounciness - 2 * dot * ny * this.bounciness;
      }
      return true;
    }
    return false;
  }
}

class PhysicsWorld {
  constructor() {
    this.objects = [];
    this.gravity = 1500;
    this.damping = 0.995;
  }

  addObject(obj) {
    this.objects.push(obj);
    return obj;
  }

  removeObject(obj) {
    const index = this.objects.indexOf(obj);
    if (index > -1) {
      this.objects.splice(index, 1);
    }
  }

  update(dt, ropeEndPoints, candyPoint, game) {
    for (const obj of this.objects) {
      obj.update(dt, game);
    }

    for (const obj of this.objects) {
      if (obj.type === 'fan') {
        for (const point of ropeEndPoints) {
          obj.applyEffect(point, dt);
        }
        if (candyPoint) {
          obj.applyEffect(candyPoint, dt);
        }
      }
    }

    for (const obj of this.objects) {
      if (obj.type === 'portal') {
        for (const point of ropeEndPoints) {
          if (obj.checkCollision(point)) {
            obj.teleport(point);
          }
        }
        if (candyPoint && obj.checkCollision(candyPoint)) {
          obj.teleport(candyPoint);
        }
      }
    }

    for (const obj of this.objects) {
      if (obj.type === 'pulley' || obj.type === 'obstacle') {
        for (const point of ropeEndPoints) {
          obj.checkCollision(point);
        }
        if (candyPoint) {
          obj.checkCollision(candyPoint);
        }
      }
    }

    const collectedStars = [];
    for (const obj of this.objects) {
      if (obj.type === 'star' && !obj.collected) {
        for (const point of ropeEndPoints) {
          if (obj.checkCollision(point)) {
            collectedStars.push(obj);
            break;
          }
        }
        if (!obj.collected && candyPoint && obj.checkCollision(candyPoint)) {
          collectedStars.push(obj);
        }
      }
    }

    return collectedStars;
  }

  getObjectsByType(type) {
    return this.objects.filter(obj => obj.type === type);
  }

  getState() {
    return this.objects.map(obj => ({
      type: obj.type,
      state: obj.getState()
    }));
  }

  setState(states) {
    if (!states) return;
    for (let i = 0; i < this.objects.length && i < states.length; i++) {
      this.objects[i].setState(states[i].state);
    }
  }

  reset() {
    for (const obj of this.objects) {
      if (obj.type === 'star') {
        obj.collected = false;
        obj.active = true;
      }
      if (obj.type === 'rocket') {
        obj.active = false;
        obj.fuel = obj.maxFuel;
      }
      if (obj.type === 'portal') {
        obj.cooldown = 0;
      }
    }
  }
}

function lineSegmentIntersect(x1, y1, x2, y2, x3, y3, x4, y4, threshold = 0) {
  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);

  if (Math.abs(denom) < 0.0001) {
    return distToSegment((x1 + x2) / 2, (y1 + y2) / 2, x3, y3, x4, y4) < threshold + 10;
  }

  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    return true;
  }

  return distToSegment(x1, y1, x3, y3, x4, y4) < threshold ||
         distToSegment(x2, y2, x3, y3, x4, y4) < threshold;
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
  }

  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const closestX = x1 + t * dx;
  const closestY = y1 + t * dy;

  return Math.sqrt((px - closestX) ** 2 + (py - closestY) ** 2);
}

function checkCircleCollision(x1, y1, r1, x2, y2, r2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return dist < r1 + r2;
}

function rectCircleCollision(rx, ry, rw, rh, cx, cy, cr) {
  const closestX = Math.max(rx - rw / 2, Math.min(cx, rx + rw / 2));
  const closestY = Math.max(ry - rh / 2, Math.min(cy, ry + rh / 2));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return (dx * dx + dy * dy) < (cr * cr);
}
