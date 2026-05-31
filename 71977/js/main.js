let solarSystem = null;

function init() {
  const canvas = document.getElementById('solar-canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  solarSystem = new SolarSystem(canvas);

  solarSystem.onPlanetSelected = (planet) => {
    showPlanetInfo(planet);
  };

  solarSystem.onPlanetDeselected = () => {
    hidePlanetInfo();
  };

  setupTimeControls();
  setupPlanetInfoPanel();
  setupPlanetQuickList();

  solarSystem.start();

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    solarSystem.renderer.resize(canvas.width, canvas.height);
  });
}

function setupTimeControls() {
  const pauseBtn = document.getElementById('btn-pause');
  const slowerBtn = document.getElementById('btn-slower');
  const fasterBtn = document.getElementById('btn-faster');
  const resetBtn = document.getElementById('btn-reset');
  const resetViewBtn = document.getElementById('btn-reset-view');
  const speedDisplay = document.getElementById('speed-display');

  function updateUI() {
    const tc = solarSystem.timeController;
    speedDisplay.textContent = tc.getSpeedLabel();
    pauseBtn.innerHTML = tc.isPaused
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>'
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="3" width="4" height="18"/><rect x="15" y="3" width="4" height="18"/></svg>';
    pauseBtn.classList.toggle('active', tc.isPaused);
  }

  solarSystem.timeController.onSpeedChange = () => updateUI();

  pauseBtn.addEventListener('click', () => {
    solarSystem.timeController.togglePause();
    updateUI();
  });

  slowerBtn.addEventListener('click', () => {
    solarSystem.timeController.slower();
    updateUI();
  });

  fasterBtn.addEventListener('click', () => {
    solarSystem.timeController.faster();
    updateUI();
  });

  resetBtn.addEventListener('click', () => {
    solarSystem.timeController.reset();
    solarSystem.planets = createPlanets();
    window._currentPlanets = solarSystem.planets;
    updateUI();
  });

  resetViewBtn.addEventListener('click', () => {
    solarSystem.interactionController.resetView();
  });

  updateUI();
}

function showPlanetInfo(planet) {
  const panel = document.getElementById('planet-info-panel');
  const details = document.getElementById('planet-details');

  details.innerHTML = `
    <div class="planet-header">
      <div class="planet-icon" style="background: radial-gradient(circle at 35% 35%, ${lighten(planet.color, 60)}, ${planet.color}, ${darken(planet.color, 40)}); width:56px; height:56px; border-radius:50%; flex-shrink:0; box-shadow: 0 0 20px ${planet.glowColor};"></div>
      <div>
        <h2 class="planet-name">${planet.name}</h2>
        <span class="planet-name-en">${planet.nameEn}</span>
      </div>
    </div>
    <div class="planet-type-badge">${planet.type}</div>
    <div class="planet-stats">
      <div class="stat-item">
        <span class="stat-label">直径</span>
        <span class="stat-value">${planet.diameter}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">表面温度</span>
        <span class="stat-value">${planet.temperature}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">距日距离</span>
        <span class="stat-value">${planet.distanceFromSun}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">公转周期</span>
        <span class="stat-value">${planet.period} 地球年</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">表面重力</span>
        <span class="stat-value">${planet.gravity}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">卫星数量</span>
        <span class="stat-value">${planet.moons}</span>
      </div>
    </div>
    <div class="planet-desc">${planet.description}</div>
  `;

  panel.classList.add('open');
}

function hidePlanetInfo() {
  const panel = document.getElementById('planet-info-panel');
  panel.classList.remove('open');
}

function setupPlanetInfoPanel() {
  const closeBtn = document.getElementById('panel-close');
  closeBtn.addEventListener('click', () => {
    solarSystem.deselectPlanet();
    hidePlanetInfo();
  });
}

function setupPlanetQuickList() {
  const list = document.getElementById('planet-quick-list');
  PLANETS_DATA.forEach(data => {
    const dot = document.createElement('button');
    dot.className = 'planet-dot';
    const size = Math.max(8, Math.min(16, data.displayRadius * 1.5));
    dot.innerHTML = `
      <div class="dot-inner" style="width:${size}px;height:${size}px;background:${data.color};box-shadow:0 0 6px ${data.glowColor};"></div>
      <span class="dot-tooltip">${data.name}</span>
    `;
    dot.addEventListener('click', () => {
      const planet = solarSystem.planets.find(p => p.nameEn === data.nameEn);
      if (planet) {
        solarSystem._onPlanetClick(planet);
        solarSystem.interactionController._focusPlanet(planet);
      }
    });
    list.appendChild(dot);
  });
}

function lighten(hex, amount) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0xFF) + amount);
  const b = Math.min(255, (num & 0xFF) + amount);
  return `rgb(${r},${g},${b})`;
}

function darken(hex, amount) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0xFF) - amount);
  const b = Math.max(0, (num & 0xFF) - amount);
  return `rgb(${r},${g},${b})`;
}

document.addEventListener('DOMContentLoaded', init);
