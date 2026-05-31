var InputManager = (function () {
    var state = {
        left: false,
        right: false
    };

    var mobileLeft = false;
    var mobileRight = false;
    var dragTarget = null;
    var lastToggleTime = 0;
    var DEBOUNCE_MS = 16;

    var gyroEnabled = false;
    var gyroBeta = 0;
    var gyroGamma = 0;
    var gyroSensitivity = 2.0;
    var gyroDeadzone = 5;

    var gamepadEnabled = false;
    var gamepadIndex = -1;
    var gamepadAxisThreshold = 0.2;
    var hapticActuator = null;
    var lastHapticTime = 0;
    var HAPTIC_COOLDOWN = 100;

    function onKeyDown(e) {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            state.left = true;
            e.preventDefault();
        }
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            state.right = true;
            e.preventDefault();
        }
    }

    function onKeyUp(e) {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            state.left = false;
        }
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            state.right = false;
        }
    }

    function setMobileInput(direction, value) {
        var now = performance.now();
        if (now - lastToggleTime < DEBOUNCE_MS && value) return;
        lastToggleTime = now;

        if (direction === 'left') {
            mobileLeft = value;
        } else if (direction === 'right') {
            mobileRight = value;
        }
    }

    function clearDrag() {
        if (dragTarget === 'left') {
            mobileLeft = false;
        } else if (dragTarget === 'right') {
            mobileRight = false;
        }
        dragTarget = null;
    }

    function handleTouchStart(e) {
        var target = e.target.closest('.mobile-btn');
        if (!target) return;
        e.preventDefault();

        var direction = target.dataset.direction;
        if (!direction) return;

        setMobileInput(direction, true);
        dragTarget = direction;
    }

    function handleTouchEnd(e) {
        var changedTouch = e.changedTouches && e.changedTouches[0];
        if (!changedTouch) {
            clearDrag();
            return;
        }

        var endTarget = document.elementFromPoint(changedTouch.clientX, changedTouch.clientY);
        var btn = endTarget && endTarget.closest('.mobile-btn');

        if (dragTarget) {
            var direction = dragTarget;
            setMobileInput(direction, false);
            dragTarget = null;

            if (btn) {
                var newDir = btn.dataset.direction;
                if (newDir && newDir !== direction) {
                    setMobileInput(newDir, true);
                    dragTarget = newDir;
                }
            }
        }
    }

    function handleMouseDown(e) {
        var target = e.target.closest('.mobile-btn');
        if (!target) return;
        e.preventDefault();

        var direction = target.dataset.direction;
        if (!direction) return;

        setMobileInput(direction, true);
        dragTarget = direction;
    }

    function handleMouseUp(e) {
        if (!dragTarget) return;

        var target = e.target.closest('.mobile-btn');

        setMobileInput(dragTarget, false);

        if (target) {
            var direction = target.dataset.direction;
            if (direction && direction !== dragTarget) {
                setMobileInput(direction, true);
                dragTarget = direction;
            } else {
                dragTarget = null;
            }
        } else {
            dragTarget = null;
        }
    }

    function handleTouchCancel() {
        mobileLeft = false;
        mobileRight = false;
        dragTarget = null;
    }

    function onDeviceOrientation(e) {
        if (!gyroEnabled) return;

        if (e.beta !== null) {
            gyroBeta = e.beta;
        }
        if (e.gamma !== null) {
            gyroGamma = e.gamma;
        }
    }

    function enableGyro() {
        if (typeof DeviceOrientationEvent !== 'undefined' &&
            typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
                .then(function (permissionState) {
                    if (permissionState === 'granted') {
                        gyroEnabled = true;
                        window.addEventListener('deviceorientation', onDeviceOrientation);
                    }
                })
                .catch(console.error);
        } else {
            gyroEnabled = true;
            window.addEventListener('deviceorientation', onDeviceOrientation);
        }
    }

    function disableGyro() {
        gyroEnabled = false;
        window.removeEventListener('deviceorientation', onDeviceOrientation);
    }

    function setGyroSensitivity(value) {
        gyroSensitivity = GameUtils.clamp(value, 0.5, 5.0);
    }

    function getGyroInput() {
        if (!gyroEnabled || Math.abs(gyroGamma) < gyroDeadzone) {
            return 0;
        }

        var normalized = (gyroGamma - gyroDeadzone * Math.sign(gyroGamma)) / (45 - gyroDeadzone);
        return GameUtils.clamp(normalized * gyroSensitivity, -1, 1);
    }

    function pollGamepads() {
        if (!navigator.getGamepads) return;

        var gamepads = navigator.getGamepads();
        var found = false;

        for (var i = 0; i < gamepads.length; i++) {
            var gamepad = gamepads[i];
            if (gamepad && gamepad.connected) {
                if (!gamepadEnabled || gamepadIndex !== i) {
                    gamepadIndex = i;
                    gamepadEnabled = true;
                    hapticActuator = gamepad.vibrationActuator ||
                        (gamepad.hapticActuators && gamepad.hapticActuators[0]);
                }
                found = true;
                break;
            }
        }

        if (!found) {
            gamepadEnabled = false;
            gamepadIndex = -1;
            hapticActuator = null;
        }
    }

    function getGamepadInput() {
        if (!gamepadEnabled || gamepadIndex === -1) {
            return { left: false, right: false, axisValue: 0 };
        }

        var gamepads = navigator.getGamepads();
        var gamepad = gamepads[gamepadIndex];

        if (!gamepad) {
            return { left: false, right: false, axisValue: 0 };
        }

        var axisValue = 0;

        if (gamepad.axes && gamepad.axes.length >= 1) {
            axisValue = gamepad.axes[0];
        }

        if (gamepad.buttons) {
            if (gamepad.buttons[14] && gamepad.buttons[14].pressed) {
                axisValue = Math.min(axisValue, -0.5);
            }
            if (gamepad.buttons[15] && gamepad.buttons[15].pressed) {
                axisValue = Math.max(axisValue, 0.5);
            }
        }

        if (Math.abs(axisValue) < gamepadAxisThreshold) {
            axisValue = 0;
        }

        return {
            left: axisValue < -gamepadAxisThreshold,
            right: axisValue > gamepadAxisThreshold,
            axisValue: axisValue
        };
    }

    function triggerHapticFeedback(intensity, duration) {
        if (!hapticActuator || !hapticActuator.playEffect) return;

        var now = Date.now();
        if (now - lastHapticTime < HAPTIC_COOLDOWN) return;
        lastHapticTime = now;

        try {
            hapticActuator.playEffect('dual-rumble', {
                startDelay: 0,
                duration: duration || 100,
                weakMagnitude: intensity || 0.3,
                strongMagnitude: (intensity || 0.3) * 0.5
            });
        } catch (e) {
            console.log('Haptic feedback not supported');
        }
    }

    function handleGamepadConnect(e) {
        console.log('Gamepad connected:', e.gamepad.id);
        pollGamepads();
    }

    function handleGamepadDisconnect(e) {
        console.log('Gamepad disconnected:', e.gamepad.id);
        pollGamepads();
    }

    function init() {
        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);

        var container = document.getElementById('mobile-controls');
        if (container) {
            container.addEventListener('touchstart', handleTouchStart, { passive: false });
            container.addEventListener('touchend', handleTouchEnd);
            container.addEventListener('touchcancel', handleTouchCancel);
            container.addEventListener('mousedown', handleMouseDown);
        }

        document.addEventListener('mouseup', handleMouseUp);

        window.addEventListener('gamepadconnected', handleGamepadConnect);
        window.addEventListener('gamepaddisconnected', handleGamepadDisconnect);

        if (isTouchDevice()) {
            enableGyro();
        }
    }

    function isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    function getState() {
        pollGamepads();

        var gyroInput = getGyroInput();
        var gamepadInput = getGamepadInput();

        var left = state.left || mobileLeft ||
            gyroInput < -0.3 || gamepadInput.left;
        var right = state.right || mobileRight ||
            gyroInput > 0.3 || gamepadInput.right;

        return {
            left: left,
            right: right,
            gyroValue: gyroInput,
            gamepadValue: gamepadInput.axisValue,
            hasGyro: gyroEnabled,
            hasGamepad: gamepadEnabled
        };
    }

    function reset() {
        state.left = false;
        state.right = false;
        mobileLeft = false;
        mobileRight = false;
        dragTarget = null;
    }

    return {
        init: init,
        getState: getState,
        reset: reset,
        enableGyro: enableGyro,
        disableGyro: disableGyro,
        setGyroSensitivity: setGyroSensitivity,
        triggerHapticFeedback: triggerHapticFeedback,
        isGyroEnabled: function () { return gyroEnabled; },
        isGamepadEnabled: function () { return gamepadEnabled; }
    };
})();
