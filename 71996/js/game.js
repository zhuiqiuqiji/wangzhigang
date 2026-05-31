var Game = (function () {
    var classic = {
        currentRound: 1,
        totalScore: 0,
        totalMatches: [],
        targetColor: { r: 0, g: 0, b: 0 },
        currentColor: { r: 128, g: 128, b: 128 },
        timeLeft: 30,
        isPlaying: false,
        timer: null,
        ROUND_TIME: 30,
        MAX_DIST: Math.sqrt(255 * 255 * 3),
        hintsUsed: 0,
        isDaily: false,
        onRecord: null
    };

    function el(id) { return document.getElementById(id); }

    function initClassic() {
        el('redSlider').addEventListener('input', classicSliderChange);
        el('greenSlider').addEventListener('input', classicSliderChange);
        el('blueSlider').addEventListener('input', classicSliderChange);
        el('startBtn').addEventListener('click', startClassic);
        el('submitBtn').addEventListener('click', submitClassic);
        el('hintBtn').addEventListener('click', showHint);
        el('resetBtn').addEventListener('click', resetClassic);
        el('nextRoundBtn').addEventListener('click', nextClassicRound);
        el('finishBtn').addEventListener('click', showClassicFinal);
        updateClassicPreview();
    }

    function classicSliderChange() {
        classic.currentColor.r = parseInt(el('redSlider').value);
        classic.currentColor.g = parseInt(el('greenSlider').value);
        classic.currentColor.b = parseInt(el('blueSlider').value);
        el('redValue').textContent = classic.currentColor.r;
        el('greenValue').textContent = classic.currentColor.g;
        el('blueValue').textContent = classic.currentColor.b;
        updateClassicPreview();
    }

    function updateClassicPreview() {
        var c = classic.currentColor;
        var sim = classic.isPlaying ? ColorUtils.simulateColorBlind(c.r, c.g, c.b, App.getColorBlindMode()) : c;
        el('previewColorBox').style.background = 'rgb(' + sim.r + ',' + sim.g + ',' + sim.b + ')';
        el('previewColorRGB').textContent = 'RGB(' + c.r + ', ' + c.g + ', ' + c.b + ')';
        updateFormatTags('previewFormats', c);
    }

    function updateFormatTags(containerId, color) {
        var formats = ColorUtils.getAllFormats(color.r, color.g, color.b);
        var container = el(containerId);
        container.innerHTML = '';
        var items = [
            { label: 'HSL', value: formats.hsl.str },
            { label: 'CMYK', value: formats.cmyk.str },
            { label: 'HEX', value: formats.hex.str }
        ];
        items.forEach(function (item) {
            var tag = document.createElement('span');
            tag.className = 'format-tag';
            tag.textContent = item.label + ': ' + item.value;
            tag.title = '点击复制';
            tag.addEventListener('click', function () {
                App.copyToClipboard(item.value);
                App.showToast('已复制: ' + item.value);
            });
            container.appendChild(tag);
        });
    }

    function generateTargetColor(colorOverride) {
        if (colorOverride) {
            classic.targetColor = { r: colorOverride.r, g: colorOverride.g, b: colorOverride.b };
        } else {
            classic.targetColor.r = Math.floor(Math.random() * 256);
            classic.targetColor.g = Math.floor(Math.random() * 256);
            classic.targetColor.b = Math.floor(Math.random() * 256);
        }
        var t = classic.targetColor;
        var sim = ColorUtils.simulateColorBlind(t.r, t.g, t.b, App.getColorBlindMode());
        el('targetColorBox').style.background = 'rgb(' + sim.r + ',' + sim.g + ',' + sim.b + ')';
        el('targetColorRGB').textContent = 'RGB(' + t.r + ', ' + t.g + ', ' + t.b + ')';
        updateFormatTags('targetFormats', t);
    }

    function resetSliders() {
        var v = 128;
        el('redSlider').value = v; el('greenSlider').value = v; el('blueSlider').value = v;
        el('redValue').textContent = v; el('greenValue').textContent = v; el('blueValue').textContent = v;
        classic.currentColor = { r: v, g: v, b: v };
        updateClassicPreview();
    }

    function startClassic(dailyColor) {
        classic.currentRound = 1;
        classic.totalScore = 0;
        classic.totalMatches = [];
        classic.isPlaying = true;
        classic.isDaily = !!dailyColor;
        classic.hintsUsed = 0;
        updateClassicStats();
        generateTargetColor(dailyColor || null);
        resetSliders();
        startClassicTimer();
        el('startBtn').disabled = true;
        el('submitBtn').disabled = false;
        el('hintBtn').disabled = false;
        el('hintSection').classList.add('hidden');
    }

    function startClassicTimer() {
        classic.timeLeft = classic.ROUND_TIME;
        updateClassicTimerDisplay();
        if (classic.timer) clearInterval(classic.timer);
        classic.timer = setInterval(function () {
            classic.timeLeft -= 0.1;
            updateClassicTimerDisplay();
            if (classic.timeLeft <= 0) { clearInterval(classic.timer); submitClassic(); }
        }, 100);
    }

    function updateClassicTimerDisplay() {
        var p = Math.max(0, (classic.timeLeft / classic.ROUND_TIME) * 100);
        el('timerProgress').style.width = p + '%';
        el('timerValue').textContent = Math.max(0, Math.ceil(classic.timeLeft));
        el('timerProgress').classList.remove('warning', 'danger');
        if (classic.timeLeft <= 5) el('timerProgress').classList.add('danger');
        else if (classic.timeLeft <= 10) el('timerProgress').classList.add('warning');
    }

    function calcSimilarity() {
        var t = classic.targetColor, c = classic.currentColor;
        var d = Math.sqrt(Math.pow(t.r - c.r, 2) + Math.pow(t.g - c.g, 2) + Math.pow(t.b - c.b, 2));
        return Math.max(0, Math.min(100, 100 - (d / classic.MAX_DIST) * 100));
    }

    function submitClassic() {
        if (!classic.isPlaying) return;
        clearInterval(classic.timer);
        classic.isPlaying = false;
        var sim = calcSimilarity();
        var score = Math.round(sim * 100) / 100;
        classic.totalScore += score;
        classic.totalMatches.push(sim);
        showClassicRoundResult(sim, score);
        el('submitBtn').disabled = true;
        el('hintBtn').disabled = true;
        if (classic.onRecord) classic.onRecord(sim, score);
        App.addHistory(classic.targetColor, classic.currentColor, sim);
    }

    function showClassicRoundResult(sim, score) {
        var circ = 2 * Math.PI * 40;
        el('matchRing').style.strokeDashoffset = circ - (sim / 100) * circ;
        var icon = '💪', title = '继续努力！';
        if (sim >= 90) { icon = '🏆'; title = '完美匹配！'; }
        else if (sim >= 70) { icon = '🌟'; title = '非常棒！'; }
        else if (sim >= 50) { icon = '👍'; title = '还不错！'; }
        el('modalIcon').textContent = icon;
        el('modalTitle').textContent = title;
        animateNum(el('matchPercent'), sim.toFixed(1) + '%', 800);
        animateNum(el('roundScore'), score, 800);
        var t = classic.targetColor, c = classic.currentColor;
        el('resultTargetColor').style.background = 'rgb(' + t.r + ',' + t.g + ',' + t.b + ')';
        el('resultYourColor').style.background = 'rgb(' + c.r + ',' + c.g + ',' + c.b + ')';
        el('roundResult').classList.remove('hidden');
        el('finalResult').classList.add('hidden');
        el('nextRoundBtn').style.display = 'inline-flex';
        el('finishBtn').innerHTML = '<span class="btn-icon">🏁</span><span>结束游戏</span>';
        el('finishBtn').onclick = showClassicFinal;
        el('resultModal').classList.add('active');
        updateClassicStats();
    }

    function animateNum(element, target, duration) {
        var isPct = typeof target === 'string' && target.includes('%');
        var num = isPct ? parseFloat(target) : target;
        var start = performance.now();
        function tick(now) {
            var p = Math.min((now - start) / duration, 1);
            var e = 1 - Math.pow(1 - p, 3);
            var v = num * e;
            element.textContent = isPct ? v.toFixed(1) + '%' : Math.round(v);
            if (p < 1) requestAnimationFrame(tick);
            else element.textContent = isPct ? num.toFixed(1) + '%' : Math.round(num);
        }
        requestAnimationFrame(tick);
    }

    function nextClassicRound() {
        el('resultModal').classList.remove('active');
        classic.currentRound++;
        classic.isPlaying = true;
        generateTargetColor();
        resetSliders();
        startClassicTimer();
        el('submitBtn').disabled = false;
        el('hintBtn').disabled = false;
        el('hintSection').classList.add('hidden');
        updateClassicStats();
    }

    function showClassicFinal() {
        var avg = classic.totalMatches.length > 0 ? classic.totalMatches.reduce(function (a, b) { return a + b; }, 0) / classic.totalMatches.length : 0;
        var rank = '色彩新手', ri = '🎨';
        if (avg >= 90) { rank = '色彩大师'; ri = '👑'; }
        else if (avg >= 75) { rank = '色彩专家'; ri = '🏆'; }
        else if (avg >= 60) { rank = '调色高手'; ri = '🌟'; }
        else if (avg >= 40) { rank = '调色学徒'; ri = '📚'; }
        el('modalIcon').textContent = ri;
        el('modalTitle').textContent = '游戏结束！';
        el('finalRounds').textContent = classic.currentRound;
        el('finalScore').textContent = Math.round(classic.totalScore);
        el('finalAvgMatch').textContent = avg.toFixed(1) + '%';
        el('rankIcon').textContent = ri;
        el('rankText').textContent = rank;
        el('roundResult').classList.add('hidden');
        el('finalResult').classList.remove('hidden');
        el('nextRoundBtn').style.display = 'none';
        el('finishBtn').innerHTML = '<span class="btn-icon">🔄</span><span>再来一局</span>';
        el('finishBtn').onclick = function () { el('resultModal').classList.remove('active'); resetClassic(); };
        el('resultModal').classList.add('active');
        if (classic.isDaily) {
            App.saveDailyBest(avg);
        } else {
            App.saveToLeaderboard('classic', Math.round(classic.totalScore));
        }
    }

    function updateClassicStats() {
        el('currentRound').textContent = classic.currentRound;
        el('totalScore').textContent = Math.round(classic.totalScore);
        var avg = classic.totalMatches.length > 0 ? (classic.totalMatches.reduce(function (a, b) { return a + b; }, 0) / classic.totalMatches.length).toFixed(1) : '0.0';
        el('avgMatch').textContent = avg + '%';
    }

    function showHint() {
        if (!classic.isPlaying) return;
        classic.hintsUsed++;
        var t = classic.targetColor, c = classic.currentColor;
        var hints = [];
        var diff = t.r - c.r;
        if (Math.abs(diff) > 5) hints.push('<span class="hint-arrow ' + (diff > 0 ? 'up-r' : 'down-r') + '">' + (diff > 0 ? '↑' : '↓') + '</span> R需' + (diff > 0 ? '增大' : '减小') + ' (差' + Math.abs(diff) + ')');
        diff = t.g - c.g;
        if (Math.abs(diff) > 5) hints.push('<span class="hint-arrow ' + (diff > 0 ? 'up-g' : 'down-g') + '">' + (diff > 0 ? '↑' : '↓') + '</span> G需' + (diff > 0 ? '增大' : '减小') + ' (差' + Math.abs(diff) + ')');
        diff = t.b - c.b;
        if (Math.abs(diff) > 5) hints.push('<span class="hint-arrow ' + (diff > 0 ? 'up-b' : 'down-b') + '">' + (diff > 0 ? '↑' : '↓') + '</span> B需' + (diff > 0 ? '增大' : '减小') + ' (差' + Math.abs(diff) + ')');
        var temp = ColorUtils.getColorTemperature(t.r, t.g, t.b);
        var tempHint = temp === 'warm' ? '目标色偏暖色系' : temp === 'cool' ? '目标色偏冷色系' : '目标色偏中性色系';
        var harmony = ColorUtils.getHarmonyName(t.r, t.g, t.b);
        el('hintContent').innerHTML = hints.join(' &nbsp;|&nbsp; ') + '<br><span style="color:var(--text-secondary);font-size:0.8rem">' + tempHint + ' · ' + harmony + '</span>';
        el('hintSection').classList.remove('hidden');
    }

    function resetClassic() {
        clearInterval(classic.timer);
        classic.currentRound = 1;
        classic.totalScore = 0;
        classic.totalMatches = [];
        classic.isPlaying = false;
        classic.timeLeft = classic.ROUND_TIME;
        classic.isDaily = false;
        el('resultModal').classList.remove('active');
        el('timerProgress').style.width = '100%';
        el('timerProgress').classList.remove('warning', 'danger');
        el('timerValue').textContent = classic.ROUND_TIME;
        el('targetColorBox').style.background = '#333';
        el('targetColorRGB').textContent = 'RGB(?, ?, ?)';
        el('targetFormats').innerHTML = '';
        el('hintSection').classList.add('hidden');
        resetSliders();
        updateClassicStats();
        el('startBtn').disabled = false;
        el('submitBtn').disabled = true;
        el('hintBtn').disabled = true;
    }

    function applyColorBlind() {
        if (classic.isPlaying) {
            generateTargetColor(classic.targetColor);
            updateClassicPreview();
        }
    }

    // --- Timed Mode ---
    var timed = { score: 0, matched: 0, timeLeft: 60, isPlaying: false, timer: null, targetColor: { r: 0, g: 0, b: 0 }, currentColor: { r: 128, g: 128, b: 128 }, TIME: 60 };

    function initTimed() {
        el('timedRedSlider').addEventListener('input', timedSliderChange);
        el('timedGreenSlider').addEventListener('input', timedSliderChange);
        el('timedBlueSlider').addEventListener('input', timedSliderChange);
        el('timedStartBtn').addEventListener('click', startTimed);
        el('timedSubmitBtn').addEventListener('click', submitTimed);
    }

    function timedSliderChange() {
        timed.currentColor.r = parseInt(el('timedRedSlider').value);
        timed.currentColor.g = parseInt(el('timedGreenSlider').value);
        timed.currentColor.b = parseInt(el('timedBlueSlider').value);
        el('timedRedValue').textContent = timed.currentColor.r;
        el('timedGreenValue').textContent = timed.currentColor.g;
        el('timedBlueValue').textContent = timed.currentColor.b;
        el('timedPreviewBox').style.background = 'rgb(' + timed.currentColor.r + ',' + timed.currentColor.g + ',' + timed.currentColor.b + ')';
        el('timedPreviewRGB').textContent = 'RGB(' + timed.currentColor.r + ', ' + timed.currentColor.g + ', ' + timed.currentColor.b + ')';
    }

    function startTimed() {
        timed.score = 0; timed.matched = 0; timed.isPlaying = true; timed.timeLeft = timed.TIME;
        el('timedScore').textContent = 0; el('timedMatched').textContent = 0; el('timedTimeLeft').textContent = timed.TIME;
        resetTimedSliders();
        generateTimedTarget();
        if (timed.timer) clearInterval(timed.timer);
        timed.timer = setInterval(function () {
            timed.timeLeft -= 0.1;
            el('timedTimeLeft').textContent = Math.max(0, Math.ceil(timed.timeLeft));
            if (timed.timeLeft <= 0) { clearInterval(timed.timer); timed.isPlaying = false; el('timedSubmitBtn').disabled = true; App.saveToLeaderboard('timed', timed.score); App.showToast('挑战结束！得分: ' + timed.score); }
        }, 100);
        el('timedSubmitBtn').disabled = false;
        el('timedStartBtn').disabled = true;
    }

    function generateTimedTarget() {
        timed.targetColor = { r: Math.floor(Math.random() * 256), g: Math.floor(Math.random() * 256), b: Math.floor(Math.random() * 256) };
        var t = timed.targetColor;
        el('timedTargetBox').style.background = 'rgb(' + t.r + ',' + t.g + ',' + t.b + ')';
        el('timedTargetRGB').textContent = 'RGB(' + t.r + ', ' + t.g + ', ' + t.b + ')';
    }

    function resetTimedSliders() {
        el('timedRedSlider').value = 128; el('timedGreenSlider').value = 128; el('timedBlueSlider').value = 128;
        el('timedRedValue').textContent = 128; el('timedGreenValue').textContent = 128; el('timedBlueValue').textContent = 128;
        timed.currentColor = { r: 128, g: 128, b: 128 };
        el('timedPreviewBox').style.background = 'rgb(128,128,128)';
        el('timedPreviewRGB').textContent = 'RGB(128, 128, 128)';
    }

    function submitTimed() {
        if (!timed.isPlaying) return;
        var t = timed.targetColor, c = timed.currentColor;
        var d = Math.sqrt(Math.pow(t.r - c.r, 2) + Math.pow(t.g - c.g, 2) + Math.pow(t.b - c.b, 2));
        var sim = Math.max(0, Math.min(100, 100 - (d / Math.sqrt(255 * 255 * 3)) * 100));
        var pts = Math.round(sim);
        if (sim >= 80) { timed.matched++; timed.score += pts; App.showToast('+' + pts + '分！匹配度 ' + sim.toFixed(1) + '%'); }
        else { App.showToast('匹配度仅 ' + sim.toFixed(1) + '%，需80%以上才算匹配'); }
        el('timedScore').textContent = timed.score;
        el('timedMatched').textContent = timed.matched;
        resetTimedSliders();
        generateTimedTarget();
    }

    // --- Sort Mode ---
    var sort = { colors: [], correctOrder: [], selectedIdx: -1 };

    function initSort() {
        el('sortStartBtn').addEventListener('click', startSort);
        el('sortCheckBtn').addEventListener('click', checkSort);
    }

    function startSort() {
        sort.colors = [];
        for (var i = 0; i < 7; i++) {
            sort.colors.push({ r: Math.floor(Math.random() * 256), g: Math.floor(Math.random() * 256), b: Math.floor(Math.random() * 256) });
        }
        sort.correctOrder = sort.colors.slice().sort(function (a, b) {
            return ColorUtils.rgbToHsl(a.r, a.g, a.b).h - ColorUtils.rgbToHsl(b.r, b.g, b.b).h;
        });
        shuffle(sort.colors);
        sort.selectedIdx = -1;
        renderSortBlocks();
        el('sortCheckBtn').disabled = false;
        el('sortResult').classList.add('hidden');
    }

    function shuffle(arr) { for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp; } }

    function renderSortBlocks() {
        var area = el('sortArea');
        area.innerHTML = '';
        sort.colors.forEach(function (c, i) {
            var div = document.createElement('div');
            div.className = 'sort-block';
            div.style.background = 'rgb(' + c.r + ',' + c.g + ',' + c.b + ')';
            div.dataset.index = i;
            if (i === sort.selectedIdx) div.classList.add('selected');
            div.addEventListener('click', function () { handleSortClick(i); });
            area.appendChild(div);
        });
    }

    function handleSortClick(idx) {
        if (sort.selectedIdx === -1) { sort.selectedIdx = idx; }
        else {
            var tmp = sort.colors[sort.selectedIdx];
            sort.colors[sort.selectedIdx] = sort.colors[idx];
            sort.colors[idx] = tmp;
            sort.selectedIdx = -1;
        }
        renderSortBlocks();
    }

    function checkSort() {
        var correct = 0;
        var blocks = el('sortArea').children;
        for (var i = 0; i < sort.colors.length; i++) {
            if (sort.colors[i] === sort.correctOrder[i]) { blocks[i].classList.add('correct'); correct++; }
            else { blocks[i].classList.add('wrong'); }
        }
        var result = el('sortResult');
        result.classList.remove('hidden', 'perfect', 'partial');
        if (correct === sort.colors.length) { result.classList.add('perfect'); result.textContent = '🎉 完美排序！全部正确！'; }
        else { result.classList.add('partial'); result.textContent = '正确 ' + correct + '/' + sort.colors.length + '，继续练习！'; }
        el('sortCheckBtn').disabled = true;
        var score = Math.round((correct / sort.colors.length) * 100);
        App.saveToLeaderboard('sort', score);
    }

    // --- Complement Mode ---
    var comp = { round: 0, total: 10, correct: 0, score: 0, targetColor: null, correctIdx: -1, answered: false };

    function initComplement() {
        el('compStartBtn').addEventListener('click', startComplement);
    }

    function startComplement() {
        comp.round = 0; comp.correct = 0; comp.score = 0; comp.answered = false;
        nextCompRound();
        el('compStartBtn').disabled = true;
    }

    function nextCompRound() {
        if (comp.round >= comp.total) {
            el('compRound').textContent = comp.total + '/' + comp.total;
            App.saveToLeaderboard('complement', comp.score);
            App.showToast('补色配对完成！正确: ' + comp.correct + '/' + comp.total + ' 得分: ' + comp.score);
            el('compStartBtn').disabled = false;
            return;
        }
        comp.round++;
        comp.answered = false;
        comp.targetColor = { r: Math.floor(Math.random() * 256), g: Math.floor(Math.random() * 256), b: Math.floor(Math.random() * 256) };
        el('complementTarget').style.background = 'rgb(' + comp.targetColor.r + ',' + comp.targetColor.g + ',' + comp.targetColor.b + ')';
        el('compRound').textContent = comp.round + '/' + comp.total;
        generateCompOptions();
    }

    function generateCompOptions() {
        var comp_color = ColorUtils.getComplementary(comp.targetColor.r, comp.targetColor.g, comp.targetColor.b);
        var options = [{ r: comp_color.r, g: comp_color.g, b: comp_color.b, isCorrect: true }];
        while (options.length < 4) {
            var fake = { r: Math.floor(Math.random() * 256), g: Math.floor(Math.random() * 256), b: Math.floor(Math.random() * 256), isCorrect: false };
            var d = Math.sqrt(Math.pow(fake.r - comp_color.r, 2) + Math.pow(fake.g - comp_color.g, 2) + Math.pow(fake.b - comp_color.b, 2));
            if (d > 100) options.push(fake);
        }
        shuffle(options);
        comp.correctIdx = -1;
        for (var i = 0; i < options.length; i++) { if (options[i].isCorrect) { comp.correctIdx = i; break; } }
        var container = el('complementOptions');
        container.innerHTML = '';
        options.forEach(function (opt, i) {
            var div = document.createElement('div');
            div.className = 'comp-option';
            div.style.background = 'rgb(' + opt.r + ',' + opt.g + ',' + opt.b + ')';
            div.addEventListener('click', function () { handleCompAnswer(i, div); });
            container.appendChild(div);
        });
    }

    function handleCompAnswer(idx, div) {
        if (comp.answered) return;
        comp.answered = true;
        var options = el('complementOptions').children;
        if (idx === comp.correctIdx) {
            div.classList.add('correct');
            comp.correct++;
            comp.score += 10;
        } else {
            div.classList.add('wrong');
            options[comp.correctIdx].classList.add('correct');
        }
        el('compCorrect').textContent = comp.correct;
        el('compScore').textContent = comp.score;
        setTimeout(nextCompRound, 1000);
    }

    function init() {
        initClassic();
        initTimed();
        initSort();
        initComplement();
    }

    return {
        init: init,
        startClassic: startClassic,
        resetClassic: resetClassic,
        applyColorBlind: applyColorBlind,
        getClassicState: function () { return classic; }
    };
})();

document.addEventListener('DOMContentLoaded', Game.init);
