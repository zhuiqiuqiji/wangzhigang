(function () {
  'use strict';

  var THEMES = {
    fruit: {
      name: '水果',
      baseColor: 0x8B4513,
      baseEmissive: 0x2a1500,
      blockColors: [
        { color: 0xff4444, emissive: 0x220000, name: '西瓜' },
        { color: 0xff8844, emissive: 0x221100, name: '橙子' },
        { color: 0x44cc44, emissive: 0x002200, name: '苹果' },
        { color: 0xffaa00, emissive: 0x221100, name: '香蕉' },
        { color: 0xaa44ff, emissive: 0x110022, name: '葡萄' },
        { color: 0xff6688, emissive: 0x220011, name: '草莓' },
        { color: 0x44ddaa, emissive: 0x002211, name: '奇异果' },
        { color: 0xffff88, emissive: 0x222200, name: '柠檬' }
      ],
      fragmentColor: 0x88ffcc,
      perfectColor: 0xffd700
    },
    pizza: {
      name: '披萨',
      baseColor: 0x654321,
      baseEmissive: 0x1a0a00,
      blockColors: [
        { color: 0xffcc00, emissive: 0x221100, name: '芝士' },
        { color: 0xff3333, emissive: 0x220000, name: '番茄' },
        { color: 0x884422, emissive: 0x110000, name: '蘑菇' },
        { color: 0x44aa44, emissive: 0x002200, name: '青椒' },
        { color: 0xdd6644, emissive: 0x220000, name: '意式辣肠' },
        { color: 0xffaa00, emissive: 0x221100, name: '菠萝' },
        { color: 0x663322, emissive: 0x110000, name: '培根' },
        { color: 0xff9944, emissive: 0x221100, name: '烤虾' }
      ],
      fragmentColor: 0xffcc66,
      perfectColor: 0xffd700
    },
    book: {
      name: '书籍',
      baseColor: 0x5a3a2a,
      baseEmissive: 0x1a0a00,
      blockColors: [
        { color: 0x225577, emissive: 0x001122, name: '蓝皮书' },
        { color: 0x882222, emissive: 0x220000, name: '红皮书' },
        { color: 0x227733, emissive: 0x001100, name: '绿皮书' },
        { color: 0x552288, emissive: 0x110022, name: '紫皮书' },
        { color: 0xaa6622, emissive: 0x221100, name: '黄皮书' },
        { color: 0x222255, emissive: 0x000022, name: '靛蓝皮书' },
        { color: 0x444422, emissive: 0x111100, name: '橄榄皮书' },
        { color: 0x553322, emissive: 0x110000, name: '棕皮书' }
      ],
      fragmentColor: 0x888866,
      perfectColor: 0xffd700
    },
    container: {
      name: '集装箱',
      baseColor: 0x333333,
      baseEmissive: 0x0a0a0a,
      blockColors: [
        { color: 0xff3300, emissive: 0x220000, name: '红箱' },
        { color: 0x0066cc, emissive: 0x001122, name: '蓝箱' },
        { color: 0x00aa44, emissive: 0x002200, name: '绿箱' },
        { color: 0xffaa00, emissive: 0x221100, name: '黄箱' },
        { color: 0x888888, emissive: 0x111111, name: '灰箱' },
        { color: 0xcc0066, emissive: 0x220011, name: '粉箱' },
        { color: 0x00cccc, emissive: 0x002222, name: '青箱' },
        { color: 0x660066, emissive: 0x110011, name: '紫箱' }
      ],
      fragmentColor: 0x999999,
      perfectColor: 0xffd700
    }
  };

  window.GameThemes = THEMES;
})();
