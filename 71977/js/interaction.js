class InteractionController {
  constructor(canvas, onPlanetClick, onViewChange) {
    this.canvas = canvas;
    this.onPlanetClick = onPlanetClick;
    this.onViewChange = onViewChange;

    this.viewState = {
      offsetX: 0,
      offsetY: 0,
      zoom: 1,
      rotation: 0
    };

    this.isDragging = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.dragDistance = 0;
    this._wasPinching = false;

    this._bindEvents();
  }

  _bindEvents() {
    this.canvas.addEventListener('wheel', this._onWheel.bind(this), { passive: false });
    this.canvas.addEventListener('mousedown', this._onMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this._onMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this._onMouseUp.bind(this));
    this.canvas.addEventListener('dblclick', this._onDblClick.bind(this));

    this.canvas.addEventListener('touchstart', this._onTouchStart.bind(this), { passive: false });
    this.canvas.addEventListener('touchmove', this._onTouchMove.bind(this), { passive: false });
    this.canvas.addEventListener('touchend', this._onTouchEnd.bind(this));
  }

  _onWheel(e) {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.92 : 1.08;
    const newZoom = Math.max(0.15, Math.min(5, this.viewState.zoom * zoomFactor));

    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const ratio = newZoom / this.viewState.zoom;

    this.viewState.offsetX = mx - ratio * (mx - this.viewState.offsetX - this.canvas.width / 2) - this.canvas.width / 2;
    this.viewState.offsetY = my - ratio * (my - this.viewState.offsetY - this.canvas.height / 2) - this.canvas.height / 2;

    this.viewState.zoom = newZoom;
    if (this.onViewChange) this.onViewChange(this.viewState);
  }

  _onMouseDown(e) {
    this.isDragging = true;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
    this.dragDistance = 0;
    this.canvas.style.cursor = 'grabbing';
  }

  _onMouseMove(e) {
    if (!this.isDragging) return;
    const dx = e.clientX - this.lastMouseX;
    const dy = e.clientY - this.lastMouseY;
    this.dragDistance += Math.abs(dx) + Math.abs(dy);
    this.viewState.offsetX += dx;
    this.viewState.offsetY += dy;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
    if (this.onViewChange) this.onViewChange(this.viewState);
  }

  _onMouseUp(e) {
    this.isDragging = false;
    this.canvas.style.cursor = 'default';

    if (this.dragDistance < 8) {
      this._handleClick(e.clientX, e.clientY);
    }
  }

  _onDblClick(e) {
    const planet = this._findPlanetAt(e.clientX, e.clientY);
    if (planet) {
      this._focusPlanet(planet);
    }
  }

  _handleClick(clientX, clientY) {
    const planet = this._findPlanetAt(clientX, clientY);
    if (planet && this.onPlanetClick) {
      this.onPlanetClick(planet);
    }
  }

  _findPlanetAt(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const mx = clientX - rect.left;
    const my = clientY - rect.top;
    const cx = this.canvas.width / 2 + this.viewState.offsetX;
    const cy = this.canvas.height / 2 + this.viewState.offsetY;

    if (!window._currentPlanets) return null;

    for (let i = window._currentPlanets.length - 1; i >= 0; i--) {
      const planet = window._currentPlanets[i];
      const px = cx + planet.x * this.viewState.zoom;
      const py = cy + planet.y * this.viewState.zoom;
      const dist = Math.sqrt((mx - px) ** 2 + (my - py) ** 2);
      const hitRadius = Math.max(planet.displayRadius * this.viewState.zoom, 12);
      if (dist <= hitRadius) {
        return planet;
      }
    }
    return null;
  }

  _focusPlanet(planet) {
    const targetX = -planet.x * this.viewState.zoom;
    const targetY = -planet.y * this.viewState.zoom;
    const startX = this.viewState.offsetX;
    const startY = this.viewState.offsetY;
    const duration = 500;
    const startTime = performance.now();

    const animate = (now) => {
      const t = Math.min(1, (now - startTime) / duration);
      const ease = 1 - Math.pow(1 - t, 3);
      this.viewState.offsetX = startX + (targetX - startX) * ease;
      this.viewState.offsetY = startY + (targetY - startY) * ease;
      if (this.onViewChange) this.onViewChange(this.viewState);
      if (t < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  _onTouchStart(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
      this.isDragging = true;
      this.lastMouseX = e.touches[0].clientX;
      this.lastMouseY = e.touches[0].clientY;
      this.dragDistance = 0;
    } else if (e.touches.length === 2) {
      this.isDragging = false;
      this._wasPinching = true;
      this._pinchStartDist = this._getPinchDist(e.touches);
      this._pinchStartZoom = this.viewState.zoom;
      this._pinchStartCenter = this._getPinchCenter(e.touches);
      this._pinchStartOffsetX = this.viewState.offsetX;
      this._pinchStartOffsetY = this.viewState.offsetY;
    }
  }

  _onTouchMove(e) {
    e.preventDefault();
    if (e.touches.length === 1 && this.isDragging) {
      const dx = e.touches[0].clientX - this.lastMouseX;
      const dy = e.touches[0].clientY - this.lastMouseY;
      this.dragDistance += Math.abs(dx) + Math.abs(dy);
      this.viewState.offsetX += dx;
      this.viewState.offsetY += dy;
      this.lastMouseX = e.touches[0].clientX;
      this.lastMouseY = e.touches[0].clientY;
      if (this.onViewChange) this.onViewChange(this.viewState);
    } else if (e.touches.length === 2) {
      const dist = this._getPinchDist(e.touches);
      const newCenter = this._getPinchCenter(e.touches);
      const ratio = dist / this._pinchStartDist;
      const newZoom = Math.max(0.15, Math.min(5, this._pinchStartZoom * ratio));

      const cx = this.canvas.width / 2;
      const cy = this.canvas.height / 2;

      const startX = this._pinchStartCenter.clientX;
      const startY = this._pinchStartCenter.clientY;

      const oldX = cx + this._pinchStartOffsetX;
      const oldY = cy + this._pinchStartOffsetY;

      const ratioActual = newZoom / this._pinchStartZoom;
      const newOffsetX = startX - ratioActual * (startX - oldX) - cx;
      const newOffsetY = startY - ratioActual * (startY - oldY) - cy;

      const moveX = newCenter.clientX - startX;
      const moveY = newCenter.clientY - startY;

      this.viewState.offsetX = newOffsetX + moveX;
      this.viewState.offsetY = newOffsetY + moveY;
      this.viewState.zoom = newZoom;

      if (this.onViewChange) this.onViewChange(this.viewState);
    }
  }

  _onTouchEnd(e) {
    if (e.touches.length === 0) {
      this.isDragging = false;
      if (!this._wasPinching && this.dragDistance < 15) {
        this._handleClick(this.lastMouseX, this.lastMouseY);
      }
      this._wasPinching = false;
    } else if (e.touches.length === 1) {
      this.lastMouseX = e.touches[0].clientX;
      this.lastMouseY = e.touches[0].clientY;
      this.dragDistance = 0;
    }
  }

  _getPinchDist(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  _getPinchCenter(touches) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      clientX: (touches[0].clientX + touches[1].clientX) / 2 - rect.left,
      clientY: (touches[0].clientY + touches[1].clientY) / 2 - rect.top
    };
  }

  resetView() {
    this.viewState = { offsetX: 0, offsetY: 0, zoom: 1, rotation: 0 };
    if (this.onViewChange) this.onViewChange(this.viewState);
  }
}
