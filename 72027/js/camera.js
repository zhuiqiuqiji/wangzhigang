var CameraController = (function () {
    var camera = null;
    var targetPos = new THREE.Vector3();
    var targetLookAt = new THREE.Vector3();
    var currentLookAt = new THREE.Vector3();
    var followDistance = 5;
    var followHeight = 3;
    var lookAheadDist = 3;
    var smoothing = 0.05;

    function init(cam) {
        camera = cam;
        currentLookAt.set(0, 0, 0);
    }

    function update(ballPos, ballProgress, ballTilt) {
        if (!camera || !ballPos) return;
        if (typeof camera.position === 'undefined') return;

        var tangent = TrackGenerator.getTangentAt(ballProgress);
        var right = TrackGenerator.getRightAt(ballProgress);
        var up = TrackGenerator.getUpAt(ballProgress);

        targetPos.copy(ballPos);
        targetPos.sub(tangent.clone().multiplyScalar(followDistance));
        targetPos.add(up.clone().multiplyScalar(followHeight));
        targetPos.add(right.clone().multiplyScalar(-ballTilt * 0.01));

        camera.position.lerp(targetPos, smoothing);

        targetLookAt.copy(ballPos);
        targetLookAt.add(tangent.clone().multiplyScalar(lookAheadDist));

        currentLookAt.lerp(targetLookAt, smoothing * 1.5);
        camera.lookAt(currentLookAt);
    }

    function reset() {
        if (!camera) return;
        if (typeof camera.position === 'undefined') return;
        try {
            camera.position.set(0, followHeight, followDistance);
            currentLookAt.set(0, 0, 0);
        } catch (e) {
            return;
        }
    }

    function setSmoothing(val) {
        smoothing = val;
    }

    return {
        init: init,
        update: update,
        reset: reset,
        setSmoothing: setSmoothing
    };
})();
