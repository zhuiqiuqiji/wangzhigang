var TrackEditor = (function () {
    var isActive = false;
    var controlPoints = [];
    var selectedPointIndex = -1;
    var editorScene = null;
    var editorCamera = null;
    var editorRenderer = null;
    var pointMeshes = [];
    var lineMesh = null;
    var previewTrack = null;
    var curveMesh = null;
    var isDragging = false;
    var dragPlane = new THREE.Plane();
    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2();
    var editorCanvas = null;
    var onCloseCallback = null;
    var onSaveCallback = null;

    function init(canvas, scene, camera, renderer) {
        editorCanvas = canvas;
        editorScene = scene;
        editorCamera = camera;
        editorRenderer = renderer;
    }

    function open(initialPoints, closeCallback, saveCallback) {
        if (initialPoints && initialPoints.length > 0) {
            controlPoints = initialPoints.map(function (p) {
                return p.clone();
            });
        } else {
            controlPoints = [
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, 0, -20),
                new THREE.Vector3(0, 0, -40),
                new THREE.Vector3(5, 0, -60),
                new THREE.Vector3(0, 0, -80)
            ];
        }

        onCloseCallback = closeCallback;
        onSaveCallback = saveCallback;
        isActive = true;
        selectedPointIndex = -1;

        createEditorUI();
        createPointMeshes();
        updateCurvePreview();
        setupEditorEvents();
    }

    function createEditorUI() {
        var existingUI = document.getElementById('track-editor-ui');
        if (existingUI) existingUI.remove();

        var uiContainer = document.createElement('div');
        uiContainer.id = 'track-editor-ui';
        uiContainer.className = 'track-editor-ui';
        uiContainer.innerHTML = '\
            <div class="editor-panel">\
                <h3>轨道编辑器</h3>\
                <div class="editor-tools">\
                    <button id="btn-add-point" class="editor-btn">+ 添加控制点</button>\
                    <button id="btn-delete-point" class="editor-btn danger">- 删除选中</button>\
                    <button id="btn-reset-curve" class="editor-btn">重置曲线</button>\
                </div>\
                <div class="editor-info">\
                    <p>控制点数量: <span id="point-count">' + controlPoints.length + '</span></p>\
                    <p>选中点: <span id="selected-point">无</span></p>\
                </div>\
                <div class="point-coords" id="point-coords" style="display:none;">\
                    <label>X: <input type="number" id="coord-x" step="0.1"></label>\
                    <label>Y: <input type="number" id="coord-y" step="0.1"></label>\
                    <label>Z: <input type="number" id="coord-z" step="0.1"></label>\
                </div>\
                <div class="editor-actions">\
                    <button id="btn-preview-track" class="editor-btn primary">预览轨道</button>\
                    <button id="btn-save-track" class="editor-btn success">保存轨道</button>\
                    <button id="btn-close-editor" class="editor-btn secondary">关闭编辑器</button>\
                </div>\
            </div>\
            <div class="editor-help">\
                <p>💡 提示: 点击选中控制点，拖拽移动位置</p>\
            </div>\
        ';

        document.body.appendChild(uiContainer);

        document.getElementById('btn-add-point').addEventListener('click', addPoint);
        document.getElementById('btn-delete-point').addEventListener('click', deleteSelectedPoint);
        document.getElementById('btn-reset-curve').addEventListener('click', resetCurve);
        document.getElementById('btn-preview-track').addEventListener('click', previewTrack);
        document.getElementById('btn-save-track').addEventListener('click', saveTrack);
        document.getElementById('btn-close-editor').addEventListener('click', close);

        document.getElementById('coord-x').addEventListener('change', updatePointCoords);
        document.getElementById('coord-y').addEventListener('change', updatePointCoords);
        document.getElementById('coord-z').addEventListener('change', updatePointCoords);
    }

    function createPointMeshes() {
        clearEditorMeshes();

        var pointGeo = new THREE.SphereGeometry(0.3, 16, 16);
        var selectedMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        var normalMat = new THREE.MeshBasicMaterial({ color: 0xff6600 });
        var handleGeo = new THREE.SphereGeometry(0.15, 8, 8);
        var handleMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });

        for (var i = 0; i < controlPoints.length; i++) {
            var mesh = new THREE.Mesh(pointGeo, i === selectedPointIndex ? selectedMat : normalMat);
            mesh.position.copy(controlPoints[i]);
            mesh.userData.pointIndex = i;
            editorScene.add(mesh);
            pointMeshes.push(mesh);
        }

        if (controlPoints.length > 1) {
            var lineGeo = new THREE.BufferGeometry().setFromPoints(controlPoints);
            var lineMat = new THREE.LineBasicMaterial({ color: 0x00ffff, linewidth: 2 });
            lineMesh = new THREE.Line(lineGeo, lineMat);
            editorScene.add(lineMesh);
        }
    }

    function updateCurvePreview() {
        if (curveMesh && editorScene) {
            editorScene.remove(curveMesh);
        }

        if (controlPoints.length < 2) return;

        var curve = new THREE.CatmullRomCurve3(controlPoints);
        var tubeGeo = new THREE.TubeGeometry(curve, 100, 0.1, 8, false);
        var tubeMat = new THREE.MeshBasicMaterial({
            color: 0x00f5d4,
            transparent: true,
            opacity: 0.6
        });
        curveMesh = new THREE.Mesh(tubeGeo, tubeMat);
        editorScene.add(curveMesh);
    }

    function clearEditorMeshes() {
        for (var i = 0; i < pointMeshes.length; i++) {
            if (editorScene) editorScene.remove(pointMeshes[i]);
        }
        pointMeshes = [];

        if (lineMesh && editorScene) editorScene.remove(lineMesh);
        lineMesh = null;
        if (curveMesh && editorScene) editorScene.remove(curveMesh);
        curveMesh = null;
    }

    function setupEditorEvents() {
        editorCanvas.addEventListener('mousedown', onMouseDown);
        editorCanvas.addEventListener('mousemove', onMouseMove);
        editorCanvas.addEventListener('mouseup', onMouseUp);
        editorCanvas.addEventListener('wheel', onMouseWheel);
    }

    function onMouseDown(e) {
        if (!isActive) return;

        var rect = editorCanvas.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, editorCamera);
        var intersects = raycaster.intersectObjects(pointMeshes);

        if (intersects.length > 0) {
            selectedPointIndex = intersects[0].object.userData.pointIndex;
            isDragging = true;

            var point = controlPoints[selectedPointIndex];
            dragPlane.setFromNormalAndCoplanarPoint(
                new THREE.Vector3(0, 1, 0),
                point
            );

            updatePointMeshes();
            updatePointInfo();
        }
    }

    function onMouseMove(e) {
        if (!isActive || !isDragging || selectedPointIndex === -1) return;

        var rect = editorCanvas.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, editorCamera);
        var intersectPoint = new THREE.Vector3();
        raycaster.ray.intersectPlane(dragPlane, intersectPoint);

        if (intersectPoint) {
            controlPoints[selectedPointIndex].copy(intersectPoint);
            pointMeshes[selectedPointIndex].position.copy(intersectPoint);
            
            if (lineMesh) {
                var positions = [];
                for (var i = 0; i < controlPoints.length; i++) {
                    positions.push(controlPoints[i].x, controlPoints[i].y, controlPoints[i].z);
                }
                lineMesh.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
                lineMesh.geometry.attributes.position.needsUpdate = true;
            }

            updateCurvePreview();
            updatePointInfo();
        }
    }

    function onMouseUp() {
        isDragging = false;
    }

    function onMouseWheel(e) {
        if (!isActive) return;
        e.preventDefault();
        var delta = e.deltaY * 0.05;
        editorCamera.position.z += delta;
    }

    function addPoint() {
        if (controlPoints.length === 0) {
            controlPoints.push(new THREE.Vector3(0, 0, 0));
        } else {
            var last = controlPoints[controlPoints.length - 1];
            controlPoints.push(new THREE.Vector3(
                last.x + (Math.random() - 0.5) * 10,
                last.y + (Math.random() - 0.5) * 5,
                last.z - 20
            ));
        }
        createPointMeshes();
        updateCurvePreview();
        updatePointCount();
    }

    function deleteSelectedPoint() {
        if (selectedPointIndex === -1 || controlPoints.length <= 2) return;
        controlPoints.splice(selectedPointIndex, 1);
        selectedPointIndex = -1;
        createPointMeshes();
        updateCurvePreview();
        updatePointInfo();
        updatePointCount();
    }

    function resetCurve() {
        controlPoints = [
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, -20),
            new THREE.Vector3(0, 0, -40),
            new THREE.Vector3(5, 0, -60),
            new THREE.Vector3(0, 0, -80)
        ];
        selectedPointIndex = -1;
        createPointMeshes();
        updateCurvePreview();
        updatePointInfo();
        updatePointCount();
    }

    function updatePointCoords() {
        if (selectedPointIndex === -1) return;
        var x = parseFloat(document.getElementById('coord-x').value) || 0;
        var y = parseFloat(document.getElementById('coord-y').value) || 0;
        var z = parseFloat(document.getElementById('coord-z').value) || 0;
        controlPoints[selectedPointIndex].set(x, y, z);
        pointMeshes[selectedPointIndex].position.set(x, y, z);
        if (lineMesh) {
            var positions = [];
            for (var i = 0; i < controlPoints.length; i++) {
                positions.push(controlPoints[i].x, controlPoints[i].y, controlPoints[i].z);
            }
            lineMesh.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            lineMesh.geometry.attributes.position.needsUpdate = true;
        }
        updateCurvePreview();
    }

    function updatePointInfo() {
        var selectedEl = document.getElementById('selected-point');
        var coordsEl = document.getElementById('point-coords');
        var xInput = document.getElementById('coord-x');
        var yInput = document.getElementById('coord-y');
        var zInput = document.getElementById('coord-z');

        if (selectedPointIndex >= 0) {
            selectedEl.textContent = '#' + (selectedPointIndex + 1);
            coordsEl.style.display = 'block';
            var point = controlPoints[selectedPointIndex];
            xInput.value = point.x.toFixed(1);
            yInput.value = point.y.toFixed(1);
            zInput.value = point.z.toFixed(1);
        } else {
            selectedEl.textContent = '无';
            coordsEl.style.display = 'none';
        }
    }

    function updatePointCount() {
        var countEl = document.getElementById('point-count');
        if (countEl) countEl.textContent = controlPoints.length;
    }

    function updatePointMeshes() {
        for (var i = 0; i < pointMeshes.length; i++) {
            if (i === selectedPointIndex) {
                pointMeshes[i].material.color.setHex(0x00ff00);
            } else {
                pointMeshes[i].material.color.setHex(0xff6600);
            }
        }
    }

    function previewTrack() {
        if (controlPoints.length < 2) {
            alert('至少需要2个控制点');
            return;
        }
        TrackGenerator.createCurveFromPoints(controlPoints.map(function (p) {
            return p.clone();
        }));
        TrackGenerator.buildTrack(editorScene, {
            id: 'custom',
            name: '自定义轨道',
            trackColor: 0x00f5d4,
            trackEmissive: 0x002222,
            width: 1.2,
            friction: 1.0,
            bgColor: 0x0a0e27,
            fogColor: 0x0a0e27,
            fogDensity: 0.003
        });
    }

    function saveTrack() {
        if (controlPoints.length < 2) {
            alert('至少需要2个控制点');
            return;
        }

        var pointsData = controlPoints.map(function (p) {
            return [p.x.toFixed(2), p.y.toFixed(2), p.z.toFixed(2)];
        });

        var customLevel = {
            id: 'custom_' + Date.now(),
            name: '自定义轨道',
            description: '用户自定义轨道',
            difficulty: 2,
            unlocked: true,
            accentColor: '#00f5d4',
            trackColor: 0x00f5d4,
            trackEmissive: 0x002222,
            width: 1.2,
            friction: 1.0,
            starThresholds: [0, 180, 120],
            bgColor: 0x0a0e27,
            fogColor: 0x0a0e27,
            fogDensity: 0.003,
            ambientColor: 0x223344,
            ambientIntensity: 0.6,
            dirLightColor: 0xffeedd,
            dirLightIntensity: 0.8,
            pointLightColors: [0x00f5d4, 0x00f5d4, 0x00f5d4, 0x00f5d4, 0x00f5d4],
            points: pointsData,
            collectibles: generateCollectibles()
        };

        try {
            var customLevels = JSON.parse(localStorage.getItem('bb_custom_levels') || '[]');
            customLevels.push(customLevel);
            localStorage.setItem('bb_custom_levels', JSON.stringify(customLevels));
            alert('轨道保存成功！');
            if (onSaveCallback) onSaveCallback(customLevel);
        } catch (e) {
            alert('保存失败: ' + e.message);
        }
    }

    function generateCollectibles() {
        var collectibles = [];
        var numCoins = Math.floor(controlPoints.length * 3);
        for (var i = 0; i < numCoins; i++) {
            collectibles.push({
                type: i % 5 === 0 ? 'gem' : 'coin',
                t: (i + 1) / (numCoins + 1),
                offset: (Math.random() - 0.5) * 0.8
            });
        }
        return collectibles;
    }

    function close() {
        isActive = false;
        selectedPointIndex = -1;
        clearEditorMeshes();
        editorCanvas.removeEventListener('mousedown', onMouseDown);
        editorCanvas.removeEventListener('mousemove', onMouseMove);
        editorCanvas.removeEventListener('mouseup', onMouseUp);
        editorCanvas.removeEventListener('wheel', onMouseWheel);

        var ui = document.getElementById('track-editor-ui');
        if (ui) ui.remove();

        if (onCloseCallback) onCloseCallback();
    }

    function getCustomLevels() {
        try {
            return JSON.parse(localStorage.getItem('bb_custom_levels') || '[]');
        } catch (e) {
            return [];
        }
    }

    function deleteCustomLevel(levelId) {
        try {
            var customLevels = JSON.parse(localStorage.getItem('bb_custom_levels') || '[]');
            customLevels = customLevels.filter(function (l) { return l.id !== levelId; });
            localStorage.setItem('bb_custom_levels', JSON.stringify(customLevels));
            return true;
        } catch (e) {
            return false;
        }
    }

    return {
        init: init,
        open: open,
        close: close,
        getCustomLevels: getCustomLevels,
        deleteCustomLevel: deleteCustomLevel
    };
})();
