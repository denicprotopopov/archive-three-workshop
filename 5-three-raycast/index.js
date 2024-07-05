import * as THREE from "https://cdn.skypack.dev/three@0.132.2"
import { OrbitControls } from "https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/OrbitControls.js"
import { PointerLockControls } from "https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/PointerLockControls.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.132.2/examples/jsm/loaders/GLTFLoader.js"

const canvas = document.querySelector('canvas.webgl')
const loadingScreen = document.getElementById('loading-screen');
const beginButtonContainer = document.getElementById('begin-button-container');
const beginButton = document.getElementById('begin-button');

const scene = new THREE.Scene()

const textureLoader = new THREE.TextureLoader()
const floorTexture = textureLoader.load('images/texture1.jpeg')
const wallTexture = textureLoader.load('images/texture2.jpeg')

const floorGeometry = new THREE.PlaneGeometry(50, 50)
const floorMaterial = new THREE.MeshStandardMaterial({map: floorTexture})
const floor = new THREE.Mesh(floorGeometry, floorMaterial)
floor.receiveShadow = true
floor.rotation.x = - Math.PI / 2
scene.add(floor)

const wallGeometry = new THREE.PlaneGeometry(50, 30)
const wallMaterial = new THREE.MeshStandardMaterial({map:wallTexture})

const leftWall = new THREE.Mesh(wallGeometry, wallMaterial)
leftWall.position.x = -25
leftWall.position.y = 15
leftWall.rotation.y = Math.PI / 2
leftWall.receiveShadow = true
scene.add(leftWall)

const rightWall = new THREE.Mesh(wallGeometry, wallMaterial)
rightWall.position.x = 25
rightWall.position.y = 15
rightWall.rotation.y = - Math.PI / 2
rightWall.receiveShadow = true
scene.add(rightWall)

const backWall = new THREE.Mesh(wallGeometry, wallMaterial)
backWall.position.z = -25
backWall.position.y = 15
backWall.receiveShadow = true
scene.add(backWall)

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height)
camera.position.z = 30
camera.position.y = 10
scene.add(camera)

// create an AudioListener and add it to the camera
const listener = new THREE.AudioListener();
camera.add( listener );

// create the PositionalAudio object (passing in the listener)
const sound = new THREE.PositionalAudio( listener );
const ambientSound = new THREE.Audio( listener );

// load a sound and set it as the PositionalAudio object's buffer
const audioLoader = new THREE.AudioLoader();
audioLoader.load( 'sounds/chair.mp3', function( buffer ) {
	sound.setBuffer( buffer );
    sound.setLoop( true );
    sound.setVolume( 2 );
	sound.setRefDistance( 5 );
	// sound.play();
});

const ambientAudioLoader = new THREE.AudioLoader();
ambientAudioLoader.load( 'sounds/wind.mp3', function( buffer ) {
	ambientSound.setBuffer( buffer );
	ambientSound.setLoop( true );
	ambientSound.setVolume( 0.1 );
});

const loader = new GLTFLoader()
loader.load('objects/chair.glb', (gltf) => {
    gltf.scene.traverse(function (child) {
        if (child.isMesh) {
            child.castShadow = true
            child.receiveShadow = true
        }
    })
    const model = gltf.scene
    model.position.set(0, 0, 0)
    model.scale.set(2, 2, 2)
    model.add(sound)
    scene.add(model)
    showBeginButton();
}, undefined, (error) => {
    console.error(error)
})

const spotLight = new THREE.SpotLight(0xffffff)
spotLight.castShadow = true
spotLight.position.set(-20, 10, 10)
scene.add(spotLight)

const spotLightHelper = new THREE.SpotLightHelper(spotLight, 5)
scene.add(spotLightHelper)

const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.shadowMap.enabled = true
renderer.setSize(sizes.width, sizes.height)

window.addEventListener('resize', () =>{
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()
    renderer.setSize(sizes.width, sizes.height)
})

const controls = new PointerLockControls(camera, document.body);
controls.enableDamping = true

const keys = {
    forward: false,
    backward: false,
    left: false,
    right: false
};

document.addEventListener('keydown', (event) => {
    switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
            keys.forward = true;
            break;
        case 'KeyA':
        case 'ArrowLeft':
            keys.left = true;
            break;
        case 'KeyS':
        case 'ArrowDown':
            keys.backward = true;
            break;
        case 'KeyD':
        case 'ArrowRight':
            keys.right = true;
            break;
    }
});

document.addEventListener('keyup', (event) => {
    switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
            keys.forward = false;
            break;
        case 'KeyA':
        case 'ArrowLeft':
            keys.left = false;
            break;
        case 'KeyS':
        case 'ArrowDown':
            keys.backward = false;
            break;
        case 'KeyD':
        case 'ArrowRight':
            keys.right = false;
            break;
    }
});

const animate = () => {
    if (keys.forward) controls.moveForward(0.1);
    if (keys.backward) controls.moveForward(-0.1);
    if (keys.left) controls.moveRight(-0.1);
    if (keys.right) controls.moveRight(0.1);

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
};

const showBeginButton = () => {
    loadingScreen.style.display = 'none';
    beginButtonContainer.style.display = 'flex';
};

beginButton.addEventListener('click', () => {
    beginButtonContainer.style.display = 'none';
    canvas.style.display = 'block';
    controls.lock();
    sound.play(); // Start the audio after the user gesture
    ambientSound.play();
    animate();
});

animate()