const WeatherEngine = {
  calculateWeather(temperature, humidity, pressure) {
    const weather = this._determineType(temperature, humidity, pressure);
    const windSpeed = this._calculateWind(humidity, pressure, temperature);
    const visibility = this._calculateVisibility(weather, humidity);
    return { type: weather, windSpeed, visibility };
  },

  _determineType(temp, hum, pres) {
    if (hum > 85 && pres < 980 && temp > 15) return 'storm';
    if (temp <= 0 && hum > 60) return 'snow';
    if (temp > 5 && hum > 70 && pres < 1000) return 'rain';
    if (temp > 20 && hum >= 40 && hum <= 70) return 'cloudy';
    if (temp > 25 && hum < 40 && pres > 1010) return 'sunny';
    if (hum > 80 && pres < 1005) return 'rain';
    if (hum > 60 && temp <= 5) return 'snow';
    if (hum >= 50 && hum <= 80) return 'cloudy';
    return 'sunny';
  },

  _calculateWind(hum, pres, temp) {
    const pressureFactor = (1013 - pres) * 0.15;
    const tempFactor = Math.abs(temp - 20) * 0.05;
    const humFactor = (hum - 50) * 0.03;
    return Math.max(0, Math.min(100, pressureFactor + tempFactor + humFactor + 10));
  },

  _calculateVisibility(weather, hum) {
    const base = 100;
    const modifiers = {
      sunny: -10,
      cloudy: 0,
      rain: hum * 0.2,
      snow: 20 + hum * 0.15,
      storm: 30 + hum * 0.25
    };
    return Math.max(5, Math.min(100, base - (modifiers[weather] || 0)));
  },

  getWeatherLabel(type) {
    const labels = {
      sunny: '☀️ 晴天',
      cloudy: '⛅ 多云',
      rain: '🌧️ 雨天',
      snow: '❄️ 雪天',
      storm: '⛈️ 风暴'
    };
    return labels[type] || type;
  },

  getSkyColors(type, temp) {
    const palettes = {
      sunny: {
        top: temp > 35 ? '#ff6b35' : '#1e90ff',
        mid: temp > 35 ? '#ffa500' : '#87ceeb',
        bottom: temp > 35 ? '#ffe4b5' : '#fffacd'
      },
      cloudy: {
        top: '#546e7a',
        mid: '#78909c',
        bottom: '#b0bec5'
      },
      rain: {
        top: '#263238',
        mid: '#37474f',
        bottom: '#546e7a'
      },
      snow: {
        top: '#607d8b',
        mid: '#90a4ae',
        bottom: '#cfd8dc'
      },
      storm: {
        top: '#1a1a2e',
        mid: '#16213e',
        bottom: '#0f3460'
      }
    };
    return palettes[type] || palettes.sunny;
  }
};
