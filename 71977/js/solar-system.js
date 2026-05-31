class SolarSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.planets = createPlanets();
    this.renderer = new Renderer(canvas);
    this.timeController = new TimeController();
    this.interactionController = new InteractionController(
      canvas,
      this._onPlanetClick.bind(this),
      this._onViewChange.bind(this)
    );
    this.selectedPlanet = null;
    this.lastTime = 0;
    this.onPlanetSelected = null;
    this.onPlanetDeselected = null;

    window._currentPlanets = this.planets;
  }

  start() {
    this.lastTime = performance.now();
    this._loop();
  }

  _loop() {
    const now = performance.now();
    const dt = Math.min(now - this.lastTime, 100);
    this.lastTime = now;

    this.timeController.update(dt);

    const speed = this.timeController.getEffectiveSpeed();
    this.planets.forEach(planet => {
      planet.angle += planet.angularSpeed * speed * dt;
    });

    this.renderer.render(this.planets, this.interactionController.viewState, this.timeController, this.selectedPlanet);
    this._updateElapsedDisplay();

    requestAnimationFrame(() => this._loop());
  }

  _onPlanetClick(planet) {
    this.selectedPlanet = planet;
    if (this.onPlanetSelected) this.onPlanetSelected(planet);
  }

  _onViewChange(viewState) {
  }

  _updateElapsedDisplay() {
    const elapsedEl = document.getElementById('elapsed-time');
    if (elapsedEl) {
      const info = this.timeController.getElapsedInfo();
      elapsedEl.textContent = `${info.days} 天 (${info.years} 地球年)`;
    }
  }

  selectPlanet(planet) {
    this.selectedPlanet = planet;
  }

  deselectPlanet() {
    this.selectedPlanet = null;
    if (this.onPlanetDeselected) this.onPlanetDeselected();
  }
}
