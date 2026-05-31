var GameUtils = (function () {
    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    }

    function degToRad(deg) {
        return deg * Math.PI / 180;
    }

    function radToDeg(rad) {
        return rad * 180 / Math.PI;
    }

    function calculateStar(completionTime) {
        if (completionTime <= 80) return 3;
        if (completionTime <= 120) return 2;
        return 1;
    }

    function formatTime(seconds) {
        return seconds.toFixed(1) + 's';
    }

    function saveBestRecord(time, stars) {
        try {
            var data = { time: time, stars: stars };
            localStorage.setItem('balanceBall_best', JSON.stringify(data));
        } catch (e) { }
    }

    function loadBestRecord() {
        try {
            var raw = localStorage.getItem('balanceBall_best');
            if (raw) return JSON.parse(raw);
        } catch (e) { }
        return null;
    }

    return {
        lerp: lerp,
        clamp: clamp,
        degToRad: degToRad,
        radToDeg: radToDeg,
        calculateStar: calculateStar,
        formatTime: formatTime,
        saveBestRecord: saveBestRecord,
        loadBestRecord: loadBestRecord
    };
})();
