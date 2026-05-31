class InputHandler {
  constructor(canvas, game) {
    this.canvas = canvas;
    this.game = game;
    this.isDragging = false;
    this.lastX = 0;
    this.lastY = 0;
    this.trail = [];

    this.bindEvents();
  }

  bindEvents() {
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
    this.canvas.addEventListener('mouseleave', (e) => this.onMouseUp(e));

    this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e));
    this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e));
    this.canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));
  }

  getCanvasPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  onMouseDown(e) {
    const pos = this.getCanvasPos(e);
    this.startDrag(pos.x, pos.y);
  }

  onMouseMove(e) {
    const pos = this.getCanvasPos(e);
    this.drag(pos.x, pos.y);
  }

  onMouseUp(e) {
    this.endDrag();
  }

  onTouchStart(e) {
    e.preventDefault();
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      const pos = this.getCanvasPos(touch);
      this.startDrag(pos.x, pos.y);
    }
  }

  onTouchMove(e) {
    e.preventDefault();
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      const pos = this.getCanvasPos(touch);
      this.drag(pos.x, pos.y);
    }
  }

  onTouchEnd(e) {
    e.preventDefault();
    this.endDrag();
  }

  startDrag(x, y) {
    this.isDragging = true;
    this.lastX = x;
    this.lastY = y;
    this.trail = [{ x, y }];
  }

  drag(x, y) {
    if (!this.isDragging) return;

    this.trail.push({ x, y });
    if (this.trail.length > 20) {
      this.trail.shift();
    }

    this.game.checkRopeCut(this.lastX, this.lastY, x, y);

    this.lastX = x;
    this.lastY = y;
  }

  endDrag() {
    this.isDragging = false;
    setTimeout(() => {
      this.trail = [];
    }, 300);
  }

  getTrail() {
    return this.trail;
  }
}
