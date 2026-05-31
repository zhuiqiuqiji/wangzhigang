var ColorUtils = (function () {
    function rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h, s, l = (max + min) / 2;
        if (max === min) {
            h = s = 0;
        } else {
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }
        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    }

    function hslToRgb(h, s, l) {
        h /= 360; s /= 100; l /= 100;
        var r, g, b;
        if (s === 0) {
            r = g = b = l;
        } else {
            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }
        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }

    function hue2rgb(p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    }

    function rgbToCmyk(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        var k = 1 - Math.max(r, g, b);
        if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
        return {
            c: Math.round((1 - r - k) / (1 - k) * 100),
            m: Math.round((1 - g - k) / (1 - k) * 100),
            y: Math.round((1 - b - k) / (1 - k) * 100),
            k: Math.round(k * 100)
        };
    }

    function cmykToRgb(c, m, y, k) {
        c /= 100; m /= 100; y /= 100; k /= 100;
        return {
            r: Math.round(255 * (1 - c) * (1 - k)),
            g: Math.round(255 * (1 - m) * (1 - k)),
            b: Math.round(255 * (1 - y) * (1 - k))
        };
    }

    function rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(function (x) {
            var hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('').toUpperCase();
    }

    function hexToRgb(hex) {
        hex = hex.replace('#', '');
        if (hex.length === 3) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        return {
            r: parseInt(hex.substring(0, 2), 16),
            g: parseInt(hex.substring(2, 4), 16),
            b: parseInt(hex.substring(4, 6), 16)
        };
    }

    function getComplementary(r, g, b) {
        var hsl = rgbToHsl(r, g, b);
        return hslToRgb((hsl.h + 180) % 360, hsl.s, hsl.l);
    }

    function getAnalogous(r, g, b) {
        var hsl = rgbToHsl(r, g, b);
        return [
            hslToRgb((hsl.h + 30) % 360, hsl.s, hsl.l),
            hslToRgb((hsl.h - 30 + 360) % 360, hsl.s, hsl.l)
        ];
    }

    function getTriadic(r, g, b) {
        var hsl = rgbToHsl(r, g, b);
        return [
            hslToRgb((hsl.h + 120) % 360, hsl.s, hsl.l),
            hslToRgb((hsl.h + 240) % 360, hsl.s, hsl.l)
        ];
    }

    function getSplitComplementary(r, g, b) {
        var hsl = rgbToHsl(r, g, b);
        return [
            hslToRgb((hsl.h + 150) % 360, hsl.s, hsl.l),
            hslToRgb((hsl.h + 210) % 360, hsl.s, hsl.l)
        ];
    }

    function simulateColorBlind(r, g, b, type) {
        var m;
        switch (type) {
            case 'protanopia':
                m = [[0.567, 0.433, 0], [0.558, 0.442, 0], [0, 0.242, 0.758]]; break;
            case 'deuteranopia':
                m = [[0.625, 0.375, 0], [0.7, 0.3, 0], [0, 0.3, 0.7]]; break;
            case 'tritanopia':
                m = [[0.95, 0.05, 0], [0, 0.433, 0.567], [0, 0.475, 0.525]]; break;
            default: return { r: r, g: g, b: b };
        }
        return {
            r: Math.min(255, Math.round(r * m[0][0] + g * m[0][1] + b * m[0][2])),
            g: Math.min(255, Math.round(r * m[1][0] + g * m[1][1] + b * m[1][2])),
            b: Math.min(255, Math.round(r * m[2][0] + g * m[2][1] + b * m[2][2]))
        };
    }

    function getColorTemperature(r, g, b) {
        var hsl = rgbToHsl(r, g, b);
        var h = hsl.h;
        if (h >= 0 && h < 70) return 'warm';
        if (h >= 70 && h < 170) return 'neutral';
        if (h >= 170 && h < 280) return 'cool';
        return 'warm';
    }

    function getRelativeLuminance(r, g, b) {
        var rs = r / 255, gs = g / 255, bs = b / 255;
        rs = rs <= 0.03928 ? rs / 12.92 : Math.pow((rs + 0.055) / 1.055, 2.4);
        gs = gs <= 0.03928 ? gs / 12.92 : Math.pow((gs + 0.055) / 1.055, 2.4);
        bs = bs <= 0.03928 ? bs / 12.92 : Math.pow((bs + 0.055) / 1.055, 2.4);
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }

    function getContrastRatio(c1, c2) {
        var l1 = getRelativeLuminance(c1.r, c1.g, c1.b);
        var l2 = getRelativeLuminance(c2.r, c2.g, c2.b);
        var lighter = Math.max(l1, l2);
        var darker = Math.min(l1, l2);
        return (lighter + 0.05) / (darker + 0.05);
    }

    function getHarmonyName(r, g, b) {
        var hsl = rgbToHsl(r, g, b);
        var h = hsl.h;
        if (hsl.s < 10) return '无彩色';
        if (h >= 0 && h < 15) return '红色系';
        if (h >= 15 && h < 45) return '橙色系';
        if (h >= 45 && h < 70) return '黄色系';
        if (h >= 70 && h < 160) return '绿色系';
        if (h >= 160 && h < 200) return '青色系';
        if (h >= 200 && h < 260) return '蓝色系';
        if (h >= 260 && h < 300) return '紫色系';
        return '品红色系';
    }

    function getAllFormats(r, g, b) {
        var hsl = rgbToHsl(r, g, b);
        var cmyk = rgbToCmyk(r, g, b);
        var hex = rgbToHex(r, g, b);
        return {
            rgb: { r: r, g: g, b: b, str: 'RGB(' + r + ', ' + g + ', ' + b + ')' },
            hsl: { h: hsl.h, s: hsl.s, l: hsl.l, str: 'HSL(' + hsl.h + ', ' + hsl.s + '%, ' + hsl.l + '%)' },
            cmyk: { c: cmyk.c, m: cmyk.m, y: cmyk.y, k: cmyk.k, str: 'CMYK(' + cmyk.c + '%, ' + cmyk.m + '%, ' + cmyk.y + '%, ' + cmyk.k + '%)' },
            hex: { value: hex, str: hex }
        };
    }

    function seededRandom(seed) {
        var x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }

    function getDailySeed() {
        var d = new Date();
        return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    }

    function generateDailyColor() {
        var seed = getDailySeed();
        return {
            r: Math.floor(seededRandom(seed) * 256),
            g: Math.floor(seededRandom(seed + 1) * 256),
            b: Math.floor(seededRandom(seed + 2) * 256)
        };
    }

    function extractDominantColors(imageData, count) {
        var pixels = imageData.data;
        var buckets = {};
        var step = Math.max(1, Math.floor(pixels.length / 4 / 5000));
        for (var i = 0; i < pixels.length; i += step * 4) {
            var r = Math.min(255, Math.round(pixels[i] / 32) * 32);
            var g = Math.min(255, Math.round(pixels[i + 1] / 32) * 32);
            var b = Math.min(255, Math.round(pixels[i + 2] / 32) * 32);
            var a = pixels[i + 3];
            if (a < 128) continue;
            var key = r + ',' + g + ',' + b;
            buckets[key] = (buckets[key] || 0) + 1;
        }
        var sorted = Object.keys(buckets).sort(function (a, b) {
            return buckets[b] - buckets[a];
        });
        var results = [];
        for (var j = 0; j < Math.min(count || 8, sorted.length); j++) {
            var parts = sorted[j].split(',').map(Number);
            results.push({ r: parts[0], g: parts[1], b: parts[2], count: buckets[sorted[j]] });
        }
        return results;
    }

    return {
        rgbToHsl: rgbToHsl,
        hslToRgb: hslToRgb,
        rgbToCmyk: rgbToCmyk,
        cmykToRgb: cmykToRgb,
        rgbToHex: rgbToHex,
        hexToRgb: hexToRgb,
        getComplementary: getComplementary,
        getAnalogous: getAnalogous,
        getTriadic: getTriadic,
        getSplitComplementary: getSplitComplementary,
        simulateColorBlind: simulateColorBlind,
        getColorTemperature: getColorTemperature,
        getContrastRatio: getContrastRatio,
        getHarmonyName: getHarmonyName,
        getAllFormats: getAllFormats,
        seededRandom: seededRandom,
        getDailySeed: getDailySeed,
        generateDailyColor: generateDailyColor,
        extractDominantColors: extractDominantColors
    };
})();
