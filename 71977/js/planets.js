const PLANETS_DATA = [
  {
    name: '水星',
    nameEn: 'Mercury',
    color: '#b5b5b5',
    glowColor: 'rgba(181,181,181,0.4)',
    radius: 2439.7,
    displayRadius: 3,
    orbitRadius: 0.387,
    displayOrbitRadius: 58,
    period: 0.241,
    temperature: '-180°C ~ 430°C',
    distanceFromSun: '5790万公里',
    diameter: '4,879 公里',
    description: '太阳系中最小、最靠近太阳的行星，没有大气层保护，昼夜温差极大。',
    angle: Math.random() * Math.PI * 2,
    moons: 0,
    gravity: '3.7 m/s²',
    type: '岩石行星'
  },
  {
    name: '金星',
    nameEn: 'Venus',
    color: '#e8cda0',
    glowColor: 'rgba(232,205,160,0.4)',
    radius: 6051.8,
    displayRadius: 5,
    orbitRadius: 0.723,
    displayOrbitRadius: 90,
    period: 0.615,
    temperature: '约 465°C',
    distanceFromSun: '1.082亿公里',
    diameter: '12,104 公里',
    description: '太阳系中最热的行星，浓密的二氧化碳大气层产生极强温室效应，自转方向与其他行星相反。',
    angle: Math.random() * Math.PI * 2,
    moons: 0,
    gravity: '8.87 m/s²',
    type: '岩石行星'
  },
  {
    name: '地球',
    nameEn: 'Earth',
    color: '#4da6ff',
    glowColor: 'rgba(77,166,255,0.5)',
    radius: 6371,
    displayRadius: 5.5,
    orbitRadius: 1.0,
    displayOrbitRadius: 125,
    period: 1.0,
    temperature: '约 15°C',
    distanceFromSun: '1.496亿公里',
    diameter: '12,742 公里',
    description: '我们的家园，太阳系中唯一已知存在生命的行星，拥有液态水和适宜的大气层。',
    angle: Math.random() * Math.PI * 2,
    moons: 1,
    gravity: '9.8 m/s²',
    type: '岩石行星'
  },
  {
    name: '火星',
    nameEn: 'Mars',
    color: '#e07040',
    glowColor: 'rgba(224,112,64,0.4)',
    radius: 3389.5,
    displayRadius: 4,
    orbitRadius: 1.524,
    displayOrbitRadius: 165,
    period: 1.881,
    temperature: '约 -63°C',
    distanceFromSun: '2.279亿公里',
    diameter: '6,779 公里',
    description: '红色星球，因表面氧化铁而呈红色，拥有太阳系最高的火山——奥林匹斯山。',
    angle: Math.random() * Math.PI * 2,
    moons: 2,
    gravity: '3.72 m/s²',
    type: '岩石行星'
  },
  {
    name: '木星',
    nameEn: 'Jupiter',
    color: '#d4a574',
    glowColor: 'rgba(212,165,116,0.4)',
    radius: 69911,
    displayRadius: 12,
    orbitRadius: 5.203,
    displayOrbitRadius: 230,
    period: 11.86,
    temperature: '约 -110°C',
    distanceFromSun: '7.785亿公里',
    diameter: '139,822 公里',
    description: '太阳系最大的行星，质量是其他所有行星总和的2.5倍，标志性的大红斑风暴已持续数百年。',
    angle: Math.random() * Math.PI * 2,
    moons: 95,
    gravity: '24.79 m/s²',
    type: '气态巨行星'
  },
  {
    name: '土星',
    nameEn: 'Saturn',
    color: '#f0d890',
    glowColor: 'rgba(240,216,144,0.4)',
    radius: 58232,
    displayRadius: 10,
    orbitRadius: 9.537,
    displayOrbitRadius: 300,
    period: 29.46,
    temperature: '约 -140°C',
    distanceFromSun: '14.27亿公里',
    diameter: '116,464 公里',
    description: '以壮观的环系统著称，环主要由冰粒和岩石碎片构成，密度比水还低。',
    angle: Math.random() * Math.PI * 2,
    moons: 146,
    gravity: '10.44 m/s²',
    type: '气态巨行星',
    hasRing: true
  },
  {
    name: '天王星',
    nameEn: 'Uranus',
    color: '#7de8e8',
    glowColor: 'rgba(125,232,232,0.4)',
    radius: 25362,
    displayRadius: 7,
    orbitRadius: 19.19,
    displayOrbitRadius: 370,
    period: 84.01,
    temperature: '约 -195°C',
    distanceFromSun: '28.71亿公里',
    diameter: '50,724 公里',
    description: '冰巨星，自转轴几乎平躺在轨道面上，像"滚着"绕太阳公转，呈现独特的蓝绿色。',
    angle: Math.random() * Math.PI * 2,
    moons: 28,
    gravity: '8.87 m/s²',
    type: '冰巨星'
  },
  {
    name: '海王星',
    nameEn: 'Neptune',
    color: '#4466ff',
    glowColor: 'rgba(68,102,255,0.5)',
    radius: 24622,
    displayRadius: 6.5,
    orbitRadius: 30.07,
    displayOrbitRadius: 430,
    period: 164.8,
    temperature: '约 -200°C',
    distanceFromSun: '45.04亿公里',
    diameter: '49,244 公里',
    description: '太阳系最远的行星，风速可达每小时2100公里，是太阳系中风速最快的行星。',
    angle: Math.random() * Math.PI * 2,
    moons: 16,
    gravity: '11.15 m/s²',
    type: '冰巨星'
  }
];

function createPlanets() {
  const DAYS_PER_SECOND = 10;
  const DAYS_PER_YEAR = 365.25;
  const MS_PER_SECOND = 1000;

  return PLANETS_DATA.map(data => {
    const periodDays = data.period * DAYS_PER_YEAR;
    const periodSeconds = periodDays / DAYS_PER_SECOND;
    const periodMs = periodSeconds * MS_PER_SECOND;
    const radiansPerMs = (2 * Math.PI) / periodMs;
    return {
      ...data,
      angularSpeed: radiansPerMs,
      x: 0,
      y: 0
    };
  });
}
