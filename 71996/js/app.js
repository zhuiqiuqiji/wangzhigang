var App = (function () {
    var colorBlindMode = 'none';
    var playerName = '';
    var currentLbTab = 'classic';
    var toastTimer = null;
    var pickerCtx = null;
    var pickerImg = null;

    function el(id) { return document.getElementById(id); }

    function init() {
        playerName = localStorage.getItem('cm_player') || '';
        initNav();
        initColorBlind();
        initHistory();
        initLeaderboard();
        initDailyChallenge();
        initPicker();
        initColorWheel();
        updateDailyDisplay();
    }

    function initNav() {
        document.querySelectorAll('.nav-tab').forEach(function (tab) {
            tab.addEventListener('click', function () {
                document.querySelectorAll('.nav-tab').forEach(function (t) { t.classList.remove('active'); });
                tab.classList.add('active');
                var tabName = tab.dataset.tab;
                document.querySelectorAll('.tab-content').forEach(function (c) { c.classList.remove('active'); });
                el(tabName + 'Tab').classList.add('active');
            });
        });
        document.querySelectorAll('.challenge-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                document.querySelectorAll('.challenge-btn').forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
                document.querySelectorAll('.challenge-mode').forEach(function (m) { m.classList.remove('active'); });
                el(btn.dataset.mode + 'Mode').classList.add('active');
            });
        });
    }

    function initColorBlind() {
        el('colorBlindBtn').addEventListener('click', function () {
            var bar = el('colorBlindBar');
            bar.classList.toggle('hidden');
            el('colorBlindBtn').classList.toggle('active');
        });
        document.querySelectorAll('.cb-option').forEach(function (opt) {
            opt.addEventListener('click', function () {
                document.querySelectorAll('.cb-option').forEach(function (o) { o.classList.remove('active'); });
                opt.classList.add('active');
                colorBlindMode = opt.dataset.cb;
                Game.applyColorBlind();
            });
        });
    }

    function initHistory() {
        el('historyBtn').addEventListener('click', function () {
            el('historyPanel').classList.toggle('open');
            renderHistory();
        });
        el('closeHistoryBtn').addEventListener('click', function () { el('historyPanel').classList.remove('open'); });
        el('clearHistoryBtn').addEventListener('click', function () {
            localStorage.removeItem('cm_history');
            renderHistory();
            showToast('历史记录已清空');
        });
        el('exportHistoryBtn').addEventListener('click', exportHistory);
    }

    function addHistory(target, current, similarity) {
        var history = JSON.parse(localStorage.getItem('cm_history') || '[]');
        history.unshift({
            target: { r: target.r, g: target.g, b: target.b },
            current: { r: current.r, g: current.g, b: current.b },
            similarity: Math.round(similarity * 10) / 10,
            date: new Date().toLocaleString('zh-CN')
        });
        if (history.length > 50) history = history.slice(0, 50);
        localStorage.setItem('cm_history', JSON.stringify(history));
    }

    function renderHistory() {
        var history = JSON.parse(localStorage.getItem('cm_history') || '[]');
        var list = el('historyList');
        if (history.length === 0) { list.innerHTML = '<div class="history-empty">暂无调色记录</div>'; return; }
        list.innerHTML = '';
        history.forEach(function (item) {
            var div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML =
                '<div class="history-colors">' +
                '<div class="history-swatch" style="background:rgb(' + item.target.r + ',' + item.target.g + ',' + item.target.b + ')"></div>' +
                '<div class="history-swatch" style="background:rgb(' + item.current.r + ',' + item.current.g + ',' + item.current.b + ')"></div>' +
                '</div>' +
                '<div class="history-info">' +
                '<div class="history-match">' + item.similarity + '%</div>' +
                '<div class="history-date">' + item.date + '</div>' +
                '</div>';
            list.appendChild(div);
        });
    }

    function exportHistory() {
        var history = JSON.parse(localStorage.getItem('cm_history') || '[]');
        if (history.length === 0) { showToast('暂无记录可导出'); return; }
        var text = '色彩大师 - 调色历史记录\n' + '='.repeat(50) + '\n\n';
        history.forEach(function (item, i) {
            text += '第' + (i + 1) + '次: 匹配度 ' + item.similarity + '%\n';
            text += '  目标: RGB(' + item.target.r + ', ' + item.target.g + ', ' + item.target.b + ')\n';
            text += '  调配: RGB(' + item.current.r + ', ' + item.current.g + ', ' + item.current.b + ')\n';
            text += '  时间: ' + item.date + '\n\n';
        });
        var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url; a.download = '色彩大师_调色记录.txt'; a.click();
        URL.revokeObjectURL(url);
        showToast('导出成功！');
    }

    function initLeaderboard() {
        document.querySelectorAll('.lb-tab').forEach(function (tab) {
            tab.addEventListener('click', function () {
                document.querySelectorAll('.lb-tab').forEach(function (t) { t.classList.remove('active'); });
                tab.classList.add('active');
                currentLbTab = tab.dataset.lb;
                renderLeaderboard();
            });
        });
        renderLeaderboard();
    }

    function renderLeaderboard() {
        var data = JSON.parse(localStorage.getItem('cm_lb_' + currentLbTab) || '[]');
        var body = el('lbBody');
        var empty = el('lbEmpty');
        body.innerHTML = '';
        if (data.length === 0) { empty.classList.remove('hidden'); el('lbTable').style.display = 'none'; return; }
        empty.classList.add('hidden');
        el('lbTable').style.display = '';
        data.sort(function (a, b) { return b.score - a.score; });
        data.slice(0, 10).forEach(function (item, i) {
            var tr = document.createElement('tr');
            var rankClass = i < 3 ? ' rank-' + (i + 1) : '';
            tr.innerHTML =
                '<td class="rank-cell' + rankClass + '">' + (i + 1) + '</td>' +
                '<td>' + escapeHtml(item.name) + '</td>' +
                '<td>' + item.score + '</td>' +
                '<td>' + item.date + '</td>';
            body.appendChild(tr);
        });
    }

    function saveToLeaderboard(mode, score) {
        if (score <= 0) return;
        ensurePlayerName(function () {
            var data = JSON.parse(localStorage.getItem('cm_lb_' + mode) || '[]');
            data.push({ name: playerName, score: score, date: new Date().toLocaleDateString('zh-CN') });
            data.sort(function (a, b) { return b.score - a.score; });
            if (data.length > 20) data = data.slice(0, 20);
            localStorage.setItem('cm_lb_' + mode, JSON.stringify(data));
            if (mode === currentLbTab) renderLeaderboard();
        });
    }

    function ensurePlayerName(callback) {
        if (playerName) { callback(); return; }
        el('nameModal').classList.add('active');
        el('playerNameInput').value = '';
        el('playerNameInput').focus();
        el('confirmNameBtn').onclick = function () {
            var name = el('playerNameInput').value.trim();
            if (!name) { name = '玩家' + Math.floor(Math.random() * 1000); }
            playerName = name;
            localStorage.setItem('cm_player', playerName);
            el('nameModal').classList.remove('active');
            callback();
        };
    }

    function initDailyChallenge() {
        el('dailyPlayBtn').addEventListener('click', function () {
            var dc = ColorUtils.generateDailyColor();
            document.querySelectorAll('.nav-tab').forEach(function (t) { t.classList.remove('active'); });
            document.querySelector('.nav-tab[data-tab="classic"]').classList.add('active');
            document.querySelectorAll('.tab-content').forEach(function (c) { c.classList.remove('active'); });
            el('classicTab').classList.add('active');
            Game.startClassic(dc);
        });
    }

    function updateDailyDisplay() {
        var dc = ColorUtils.generateDailyColor();
        el('dailyColorBox').style.background = 'rgb(' + dc.r + ',' + dc.g + ',' + dc.b + ')';
        el('dailyColorRGB').textContent = 'RGB(' + dc.r + ', ' + dc.g + ', ' + dc.b + ')';
        var d = new Date();
        el('dailyDate').textContent = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
        var best = localStorage.getItem('cm_daily_best');
        if (best) el('dailyBest').textContent = '今日最佳：' + best + '%';
        else el('dailyBest').textContent = '今日最佳：暂无';
    }

    function saveDailyBest(similarity) {
        var key = 'cm_daily_best';
        var prev = parseFloat(localStorage.getItem(key) || '0');
        if (similarity > prev) {
            localStorage.setItem(key, similarity.toFixed(1));
            el('dailyBest').textContent = '今日最佳：' + similarity.toFixed(1) + '%';
        }
    }

    function initPicker() {
        el('uploadZone').addEventListener('click', function () { el('imageInput').click(); });
        el('uploadZone').addEventListener('dragover', function (e) { e.preventDefault(); el('uploadZone').style.borderColor = 'var(--accent-cyan)'; });
        el('uploadZone').addEventListener('dragleave', function () { el('uploadZone').style.borderColor = ''; });
        el('uploadZone').addEventListener('drop', function (e) {
            e.preventDefault();
            el('uploadZone').style.borderColor = '';
            if (e.dataTransfer.files.length > 0) loadImage(e.dataTransfer.files[0]);
        });
        el('imageInput').addEventListener('change', function () {
            if (el('imageInput').files.length > 0) loadImage(el('imageInput').files[0]);
        });
        el('pickerCanvas').addEventListener('mousemove', handlePickerMove);
        el('pickerCanvas').addEventListener('click', handlePickerClick);
        el('savePaletteBtn').addEventListener('click', savePalette);
        el('newImageBtn').addEventListener('click', function () {
            el('pickerWorkspace').classList.add('hidden');
            el('imageInput').value = '';
            el('uploadZone').parentElement.style.display = '';
        });
    }

    function loadImage(file) {
        var reader = new FileReader();
        reader.onload = function (e) {
            var img = new Image();
            img.onload = function () {
                pickerImg = img;
                var canvas = el('pickerCanvas');
                var maxW = 560;
                var scale = Math.min(maxW / img.width, 400 / img.height, 1);
                canvas.width = Math.round(img.width * scale);
                canvas.height = Math.round(img.height * scale);
                pickerCtx = canvas.getContext('2d');
                pickerCtx.drawImage(img, 0, 0, canvas.width, canvas.height);
                el('uploadZone').parentElement.style.display = 'none';
                el('pickerWorkspace').classList.remove('hidden');
                extractPalette();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    function handlePickerMove(e) {
        var rect = el('pickerCanvas').getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var cursor = el('pickerCursor');
        cursor.style.display = 'block';
        cursor.style.left = x + 'px';
        cursor.style.top = y + 'px';
        var scaleX = el('pickerCanvas').width / rect.width;
        var scaleY = el('pickerCanvas').height / rect.height;
        var px = Math.floor(x * scaleX);
        var py = Math.floor(y * scaleY);
        px = Math.max(0, Math.min(px, el('pickerCanvas').width - 1));
        py = Math.max(0, Math.min(py, el('pickerCanvas').height - 1));
        var pixel = pickerCtx.getImageData(px, py, 1, 1).data;
        cursor.style.borderColor = (pixel[0] + pixel[1] + pixel[2] > 380) ? '#000' : '#fff';
    }

    function handlePickerClick(e) {
        var rect = el('pickerCanvas').getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var scaleX = el('pickerCanvas').width / rect.width;
        var scaleY = el('pickerCanvas').height / rect.height;
        var px = Math.max(0, Math.min(Math.floor(x * scaleX), el('pickerCanvas').width - 1));
        var py = Math.max(0, Math.min(Math.floor(y * scaleY), el('pickerCanvas').height - 1));
        var pixel = pickerCtx.getImageData(px, py, 1, 1).data;
        var r = pixel[0], g = pixel[1], b = pixel[2];
        el('pickedColorBox').style.background = 'rgb(' + r + ',' + g + ',' + b + ')';
        var fmts = ColorUtils.getAllFormats(r, g, b);
        el('pickedColorValues').innerHTML =
            '<div>' + fmts.rgb.str + '</div>' +
            '<div>' + fmts.hsl.str + '</div>' +
            '<div>' + fmts.hex.str + '</div>' +
            '<div>' + fmts.cmyk.str + '</div>';
        updateHarmonyGrid(r, g, b);
    }

    function extractPalette() {
        var data = pickerCtx.getImageData(0, 0, el('pickerCanvas').width, el('pickerCanvas').height);
        var colors = ColorUtils.extractDominantColors(data, 8);
        var grid = el('paletteGrid');
        grid.innerHTML = '';
        colors.forEach(function (c) {
            var swatch = document.createElement('div');
            swatch.className = 'palette-swatch';
            swatch.style.background = 'rgb(' + c.r + ',' + c.g + ',' + c.b + ')';
            swatch.title = ColorUtils.rgbToHex(c.r, c.g, c.b);
            swatch.addEventListener('click', function () {
                copyToClipboard(ColorUtils.rgbToHex(c.r, c.g, c.b));
                showToast('已复制: ' + ColorUtils.rgbToHex(c.r, c.g, c.b));
            });
            grid.appendChild(swatch);
        });
        if (colors.length > 0) updateHarmonyGrid(colors[0].r, colors[0].g, colors[0].b);
    }

    function updateHarmonyGrid(r, g, b) {
        var comp = ColorUtils.getComplementary(r, g, b);
        var analog = ColorUtils.getAnalogous(r, g, b);
        var triad = ColorUtils.getTriadic(r, g, b);
        var allColors = [{ r: r, g: g, b: b }, comp].concat(analog, triad);
        var grid = el('harmonyGrid');
        grid.innerHTML = '';
        allColors.forEach(function (c) {
            var swatch = document.createElement('div');
            swatch.className = 'harmony-swatch';
            swatch.style.background = 'rgb(' + c.r + ',' + c.g + ',' + c.b + ')';
            swatch.title = ColorUtils.rgbToHex(c.r, c.g, c.b);
            grid.appendChild(swatch);
        });
    }

    function savePalette() {
        var swatches = el('paletteGrid').children;
        if (swatches.length === 0) { showToast('暂无配色方案可保存'); return; }
        var colors = [];
        for (var i = 0; i < swatches.length; i++) {
            colors.push(swatches[i].title);
        }
        var palettes = JSON.parse(localStorage.getItem('cm_palettes') || '[]');
        palettes.push({ colors: colors, date: new Date().toLocaleString('zh-CN') });
        localStorage.setItem('cm_palettes', JSON.stringify(palettes));
        showToast('配色方案已保存！');
    }

    function initColorWheel() {
        var canvas = el('colorWheelCanvas');
        var ctx = canvas.getContext('2d');
        var cx = canvas.width / 2;
        var cy = canvas.height / 2;
        var radius = Math.min(cx, cy) - 10;

        for (var angle = 0; angle < 360; angle += 1) {
            var startAngle = (angle - 1) * Math.PI / 180;
            var endAngle = (angle + 1) * Math.PI / 180;
            var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
            var rgb = ColorUtils.hslToRgb(angle, 100, 50);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.5, 'rgb(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ')');
            grad.addColorStop(1, 'rgb(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ')');
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = grad;
            ctx.fill();
        }

        canvas.addEventListener('click', function (e) {
            var rect = canvas.getBoundingClientRect();
            var x = e.clientX - rect.left;
            var y = e.clientY - rect.top;
            var scaleX = canvas.width / rect.width;
            var scaleY = canvas.height / rect.height;
            var px = Math.floor(x * scaleX);
            var py = Math.floor(y * scaleY);
            var pixel = ctx.getImageData(px, py, 1, 1).data;
            var r = pixel[0], g = pixel[1], b = pixel[2];

            var dot = el('wheelDot');
            dot.style.display = 'block';
            dot.style.left = x + 'px';
            dot.style.top = y + 'px';
            dot.style.background = 'rgb(' + r + ',' + g + ',' + b + ')';

            var harmony = el('wheelHarmony');
            harmony.innerHTML = '';
            var comp = ColorUtils.getComplementary(r, g, b);
            var analog = ColorUtils.getAnalogous(r, g, b);
            var triad = ColorUtils.getTriadic(r, g, b);
            var split = ColorUtils.getSplitComplementary(r, g, b);
            var groups = [
                { label: '原色', colors: [{ r: r, g: g, b: b }] },
                { label: '互补', colors: [comp] },
                { label: '类似', colors: analog },
                { label: '三角', colors: triad },
                { label: '分裂互补', colors: split }
            ];
            groups.forEach(function (group) {
                group.colors.forEach(function (c) {
                    var swatch = document.createElement('div');
                    swatch.className = 'wheel-swatch';
                    swatch.style.background = 'rgb(' + c.r + ',' + c.g + ',' + c.b + ')';
                    swatch.title = group.label + ': ' + ColorUtils.rgbToHex(c.r, c.g, c.b);
                    harmony.appendChild(swatch);
                });
            });
        });
    }

    function copyToClipboard(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).catch(function () { fallbackCopy(text); });
        } else {
            fallbackCopy(text);
        }
    }

    function fallbackCopy(text) {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (e) { /* ignore */ }
        document.body.removeChild(ta);
    }

    function showToast(msg) {
        var toast = el('toast');
        toast.textContent = msg;
        toast.classList.add('show');
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2500);
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    return {
        init: init,
        getColorBlindMode: function () { return colorBlindMode; },
        addHistory: addHistory,
        saveToLeaderboard: saveToLeaderboard,
        saveDailyBest: saveDailyBest,
        copyToClipboard: copyToClipboard,
        showToast: showToast
    };
})();

document.addEventListener('DOMContentLoaded', App.init);
