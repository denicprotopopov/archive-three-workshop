import * as THREE from 'three';
import { PointerLockControls } from 'PointerLockControls';

var APP = {

    Player: function () {

        var renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio); // TODO: Use player.setPixelRatio()

        var loader = new THREE.ObjectLoader();
        var camera, scene, controls;

        var events = {};

        var dom = document.createElement('div');
        dom.appendChild(renderer.domElement);

        this.dom = dom;
        this.canvas = renderer.domElement;

        this.width = 500;
        this.height = 500;

        this.load = function (json) {

            var project = json.project;

            if (project.shadows !== undefined) renderer.shadowMap.enabled = project.shadows;
            if (project.shadowType !== undefined) renderer.shadowMap.type = project.shadowType;
            if (project.toneMapping !== undefined) renderer.toneMapping = project.toneMapping;
            if (project.toneMappingExposure !== undefined) renderer.toneMappingExposure = project.toneMappingExposure;

            this.setScene(loader.parse(json.scene));
            this.setCamera(loader.parse(json.camera));

            events = {
                init: [],
                start: [],
                stop: [],
                keydown: [],
                keyup: [],
                pointerdown: [],
                pointerup: [],
                pointermove: [],
                update: []
            };

            var scriptWrapParams = 'player,renderer,scene,camera';
            var scriptWrapResultObj = {};

            for (var eventKey in events) {

                scriptWrapParams += ',' + eventKey;
                scriptWrapResultObj[eventKey] = eventKey;

            }

            var scriptWrapResult = JSON.stringify(scriptWrapResultObj).replace(/\"/g, '');

            for (var uuid in json.scripts) {

                var object = scene.getObjectByProperty('uuid', uuid, true);

                if (object === undefined) {

                    console.warn('APP.Player: Script without object.', uuid);
                    continue;

                }

                var scripts = json.scripts[uuid];

                for (var i = 0; i < scripts.length; i++) {

                    var script = scripts[i];

                    var functions = (new Function(scriptWrapParams, script.source + '\nreturn ' + scriptWrapResult + ';').bind(object))(this, renderer, scene, camera);

                    for (var name in functions) {

                        if (functions[name] === undefined) continue;

                        if (events[name] === undefined) {

                            console.warn('APP.Player: Event type not supported (', name, ')');
                            continue;

                        }

                        events[name].push(functions[name].bind(object));

                    }

                }

            }

            dispatch(events.init, arguments);

        };

        let moveForward = false;
        let moveBackward = false;
        let moveLeft = false;
        let moveRight = false;

        const velocity = new THREE.Vector3();
        const direction = new THREE.Vector3();
        const moveSpeed = 20.0; // Adjust movement speed as needed
        const dampingFactor = 0.9; // Damping factor for smoothing

        const onKeyDown = function (event) {
            switch (event.code) {
                case 'KeyW':
                    moveForward = true;
                    break;
                case 'KeyA':
                    moveLeft = true;
                    break;
                case 'KeyS':
                    moveBackward = true;
                    break;
                case 'KeyD':
                    moveRight = true;
                    break;
            }
        };

        const onKeyUp = function (event) {
            switch (event.code) {
                case 'KeyW':
                    moveForward = false;
                    break;
                case 'KeyA':
                    moveLeft = false;
                    break;
                case 'KeyS':
                    moveBackward = false;
                    break;
                case 'KeyD':
                    moveRight = false;
                    break;
            }
        };

        const updateMovement = function (deltaTime) {
            direction.z = Number(moveForward) - Number(moveBackward);
            direction.x = Number(moveRight) - Number(moveLeft);
            direction.normalize(); // this ensures consistent movement in all directions

            if (moveForward || moveBackward) velocity.z -= direction.z * moveSpeed * deltaTime;
            if (moveLeft || moveRight) velocity.x -= direction.x * moveSpeed * deltaTime;

            velocity.x *= dampingFactor;
            velocity.z *= dampingFactor;

            controls.moveRight(-velocity.x * deltaTime);
            controls.moveForward(-velocity.z * deltaTime);
        };

        this.setCamera = function (value) {

            camera = value;
            camera.aspect = this.width / this.height;
            camera.updateProjectionMatrix();

            // Initialize Pointer Lock Controls here
            controls = new PointerLockControls(camera, document.body);
            document.body.addEventListener('click', function () {
                controls.lock();
            });

            document.addEventListener('keydown', onKeyDown);
            document.addEventListener('keyup', onKeyUp);

            this.controls = controls;
        };

        this.setScene = function (value) {

            scene = value;

        };

        this.setPixelRatio = function (pixelRatio) {

            renderer.setPixelRatio(pixelRatio);

        };

        this.setSize = function (width, height) {

            this.width = width;
            this.height = height;

            if (camera) {

                camera.aspect = this.width / this.height;
                camera.updateProjectionMatrix();

            }

            renderer.setSize(width, height);

        };

        function dispatch(array, event) {

            for (var i = 0, l = array.length; i < l; i++) {

                array[i](event);

            }

        }

        var time, startTime, prevTime;

        function animate() {

            time = performance.now();
            const deltaTime = (time - prevTime) / 1000; // Convert to seconds

            try {

                dispatch(events.update, { time: time - startTime, delta: time - prevTime });

            } catch (e) {

                console.error((e.message || e), (e.stack || ''));

            }

            if (controls) {
                updateMovement(deltaTime);
            }

            renderer.render(scene, camera);

            prevTime = time;

        }

        this.play = function () {

            startTime = prevTime = performance.now();

            document.addEventListener('keydown', onKeyDown);
            document.addEventListener('keyup', onKeyUp);

            dispatch(events.start, arguments);

            renderer.setAnimationLoop(animate);

        };

        this.stop = function () {

            document.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('keyup', onKeyUp);

            dispatch(events.stop, arguments);

            renderer.setAnimationLoop(null);

        };

        this.render = function (time) {

            dispatch(events.update, { time: time * 1000, delta: 0 /* TODO */ });

            renderer.render(scene, camera);

        };

        this.dispose = function () {

            renderer.dispose();

            camera = undefined;
            scene = undefined;

        };

        //

        function onPointerDown(event) {

            dispatch(events.pointerdown, event);

        }

        function onPointerUp(event) {

            dispatch(events.pointerup, event);

        }

        function onPointerMove(event) {

            dispatch(events.pointermove, event);

        }

    }

};

export { APP };
