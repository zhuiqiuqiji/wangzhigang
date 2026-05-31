const App = {
  state: {
    temperature: 25,
    humidity: 50,
    pressure: 1013,
    currentScene: 'grassland',
    currentWeather: 'sunny',
    windSpeed: 10,
    visibility: 100
  },

  elements: {},
  animationId: null,

  init() {
    this._cacheElements();
    this._initEngines();
    this._bindEvents();
    this._initMobileState();
    this._applyPreset('sunny');
    this._startLoop();
  },

  _cacheElements() {
    this.elements = {
      canvas: document.getElementById('scene-canvas'),
      tempSlider: document.getElementById('temperature-slider'),
      humSlider: document.getElementById('humidity-slider'),
      presSlider: document.getElementById('pressure-slider'),
      tempValue: document.getElementById('temperature-value'),
      humValue: document.getElementById('humidity-value'),
      presValue: document.getElementById('pressure-value'),
      weatherLabel: document.getElementById('weather-label'),
      windValue: document.getElementById('wind-value'),
      visValue: document.getElementById('visibility-value'),
      sceneButtons: document.querySelectorAll('.scene-btn'),
      presetButtons: document.querySelectorAll('.preset-btn'),
      controlPanel: document.getElementById('control-panel'),
      togglePanel: document.getElementById('toggle-panel'),
      panelHeader: document.getElementById('panel-header')
    };
  },

  _initEngines() {
    ParticleEngine.init(this.elements.canvas);
    SceneRenderer.init(this.elements.canvas);
    SceneElements.init(this.elements.canvas);
    this._handleResize();
    window.addEventListener('resize', () => this._handleResize());
  },

  _handleResize() {
    const canvas = this.elements.canvas;
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    ParticleEngine.resize();
    SceneElements.resize();
  },

  _bindEvents() {
    this.elements.tempSlider.addEventListener('input', (e) => {
      this.state.temperature = parseInt(e.target.value);
      this._onParameterChange();
    });
    this.elements.humSlider.addEventListener('input', (e) => {
      this.state.humidity = parseInt(e.target.value);
      this._onParameterChange();
    });
    this.elements.presSlider.addEventListener('input', (e) => {
      this.state.pressure = parseInt(e.target.value);
      this._onParameterChange();
    });

    this.elements.sceneButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.elements.sceneButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.state.currentScene = btn.dataset.scene;
        SceneRenderer.setScene(this.state.currentScene);
        SceneElements.setScene(this.state.currentScene);
      });
    });

    this.elements.presetButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this._applyPreset(btn.dataset.preset);
        this.elements.presetButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    this.elements.togglePanel.addEventListener('click', () => {
      this.elements.controlPanel.classList.toggle('collapsed');
    });

    this.elements.panelHeader.addEventListener('click', () => {
      this.elements.controlPanel.classList.toggle('collapsed');
    });
  },

  _initMobileState() {
    if (window.innerWidth <= 768) {
      this.elements.controlPanel.classList.add('collapsed');
    }
    window.addEventListener('resize', () => {
      if (window.innerWidth <= 768) {
        if (!this.elements.controlPanel.classList.contains('collapsed')) {
          this.elements.controlPanel.classList.add('collapsed');
        }
      }
    });
  },

  _applyPreset(presetKey) {
    const preset = Presets[presetKey];
    if (!preset) return;

    this.state.temperature = preset.temperature;
    this.state.humidity = preset.humidity;
    this.state.pressure = preset.pressure;

    this._animateSlider(this.elements.tempSlider, preset.temperature);
    this._animateSlider(this.elements.humSlider, preset.humidity);
    this._animateSlider(this.elements.presSlider, preset.pressure);

    this.elements.sceneButtons.forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.scene === preset.scene) {
        btn.classList.add('active');
      }
    });

    this.state.currentScene = preset.scene;
    SceneRenderer.setScene(preset.scene);
    SceneElements.setScene(preset.scene);

    this._onParameterChange();
  },

  _animateSlider(slider, targetValue) {
    const startValue = parseInt(slider.value);
    const diff = targetValue - startValue;
    const duration = 500;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      slider.value = Math.round(startValue + diff * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  },

  _onParameterChange() {
    const weather = WeatherEngine.calculateWeather(
      this.state.temperature,
      this.state.humidity,
      this.state.pressure
    );

    this.state.currentWeather = weather.type;
    this.state.windSpeed = weather.windSpeed;
    this.state.visibility = weather.visibility;

    this._updateDisplay();
    this._updateSliderStyles();
    this._updateSceneColors();
  },

  _updateDisplay() {
    this.elements.tempValue.textContent = `${this.state.temperature}°C`;
    this.elements.humValue.textContent = `${this.state.humidity}%`;
    this.elements.presValue.textContent = `${this.state.pressure} hPa`;
    this.elements.weatherLabel.textContent = WeatherEngine.getWeatherLabel(this.state.currentWeather);
    this.elements.windValue.innerHTML = `${Math.round(this.state.windSpeed)}<span class="stat-unit"> km/h</span>`;
    this.elements.visValue.innerHTML = `${Math.round(this.state.visibility)}<span class="stat-unit">%</span>`;

    const weatherIcons = {
      sunny: '☀️',
      cloudy: '⛅',
      rain: '🌧️',
      snow: '❄️',
      storm: '⛈️'
    };
    const iconEl = document.getElementById('weather-icon-display');
    if (iconEl) iconEl.textContent = weatherIcons[this.state.currentWeather] || '🌤️';

    const statTemp = document.getElementById('stat-temp');
    const statHum = document.getElementById('stat-hum');
    if (statTemp) statTemp.innerHTML = `${this.state.temperature}<span class="stat-unit">°C</span>`;
    if (statHum) statHum.innerHTML = `${this.state.humidity}<span class="stat-unit">%</span>`;

    const weatherColors = {
      sunny: '#f59e0b',
      cloudy: '#94a3b8',
      rain: '#38bdf8',
      snow: '#e2e8f0',
      storm: '#a855f7'
    };
    this.elements.weatherLabel.style.color = weatherColors[this.state.currentWeather] || '#fff';
  },

  _updateSliderStyles() {
    const colors = {
      sunny: { track: '#f59e0b', thumb: '#fbbf24' },
      cloudy: { track: '#94a3b8', thumb: '#cbd5e1' },
      rain: { track: '#38bdf8', thumb: '#7dd3fc' },
      snow: { track: '#e2e8f0', thumb: '#f1f5f9' },
      storm: { track: '#a855f7', thumb: '#c084fc' }
    };
    const c = colors[this.state.currentWeather] || colors.sunny;
    document.documentElement.style.setProperty('--slider-color', c.track);
    document.documentElement.style.setProperty('--slider-thumb', c.thumb);
  },

  _updateSceneColors() {
    ParticleEngine.setWeather(this.state.currentWeather, this.state.windSpeed);
    SceneRenderer.setWeather(
      this.state.currentWeather,
      this.state.temperature,
      this.state.humidity,
      this.state.pressure,
      this.state.windSpeed
    );
    SceneElements.setWeather(this.state.currentWeather, this.state.temperature, this.state.windSpeed);
  },

  _startLoop() {
    const loop = () => {
      this._update();
      this._render();
      this.animationId = requestAnimationFrame(loop);
    };
    loop();
  },

  _update() {
    ParticleEngine.update();
    SceneRenderer.update();
    SceneElements.update();
  },

  _render() {
    SceneRenderer.render();
    SceneElements.render();
    ParticleEngine.render();
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
