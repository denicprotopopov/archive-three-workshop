import * as THREE from "https://cdn.skypack.dev/three@0.132.2"
import { PointerLockControls } from "https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/PointerLockControls.js"
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.132.2/examples/jsm/loaders/GLTFLoader.js"

const canvas = document.querySelector('canvas.webgl')
const loadingScreen = document.getElementById('loading-screen')
const beginButtonContainer = document.getElementById('begin-button-container')
const beginButton = document.getElementById('begin-button')

const contButtonContainer = document.getElementById('cont-button-container')
const contButton = document.getElementById('cont-button')

const infoWindow = document.createElement('div')
infoWindow.id = 'info-window'
infoWindow.innerHTML = '<div id="info-content">Нет найденных объектов</div>'
document.body.appendChild(infoWindow)

const notification = document.createElement('div')
notification.id = 'notification'
document.body.appendChild(notification)

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

const listener = new THREE.AudioListener()
camera.add( listener )

const sound = new THREE.PositionalAudio( listener )
const ambientSound = new THREE.Audio( listener )

const audioLoader = new THREE.AudioLoader()
audioLoader.load( 'sounds/chair.mp3', function( buffer ) {
	sound.setBuffer( buffer )
    sound.setLoop( true )
    sound.setVolume( 2 )
	sound.setRefDistance( 5 )
	// sound.play()
});

const ambientAudioLoader = new THREE.AudioLoader();
ambientAudioLoader.load( 'sounds/wind.mp3', function( buffer ) {
	ambientSound.setBuffer( buffer )
	ambientSound.setLoop( true )
	ambientSound.setVolume( 0.1 )
})

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
    model.name = "Chair"
    scene.add(model)
    showBeginButton()
}, undefined, (error) => {
    console.error(error)
})

const cubeGeometry = new THREE.BoxGeometry(3, 3, 3)
const cubeMaterial = new THREE.MeshStandardMaterial({color: 'blue'})
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial)
cube.castShadow = true
cube.receiveShadow = true
cube.position.y = 8
cube.position.z = 8
cube.name = "Cube"
scene.add(cube)

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
        case 'KeyI':
            toggleInfoWindow();
            break;
    }
})

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

const collisionDistance = 3
let highlightedObject = null
let collectedObjects = []

const objectDescriptions = {
    "Cube": {
        description: "Это куб. Он синий и висит в воздухе",
        image: "images/texture1.jpeg"
    },
    "Chair": {
        description: "Это стул. Он золотой и не очень удобный.",
        image: "images/texture2.jpeg"
    }
}

const raycasters = [
    new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, 0, -1), 0, collisionDistance), // forward
    new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, 0, 1), 0, collisionDistance), // back
    new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(-1, 0, 0), 0, collisionDistance), // left
    new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(1, 0, 1), 0, collisionDistance) // right
]

const updateRaycasters = () =>{
    raycasters[0].set(camera.position, camera.getWorldDirection(new THREE.Vector3()).normalize()); // forward
    raycasters[1].set(camera.position, camera.getWorldDirection(new THREE.Vector3()).normalize().negate()); // backward
    raycasters[2].set(camera.position, new THREE.Vector3().crossVectors(camera.up, camera.getWorldDirection(new THREE.Vector3())).normalize()); // left
    raycasters[3].set(camera.position, new THREE.Vector3().crossVectors(camera.getWorldDirection(new THREE.Vector3()), camera.up).normalize()); // right
}

const checkCollision = (direction) => {
    updateRaycasters()
    const intersects = raycasters[direction].intersectObjects(scene.children, true)
    if (intersects.length > 0 && intersects[0].distance < collisionDistance) {
        return intersects[0].object
    }
    return intersects.length > 0 && intersects[0].distance < collisionDistance
};

const highlightObject = (object) => {
    if (highlightedObject !== object) {
        if (highlightedObject) {
            highlightedObject.material.emissive.setHex(0x000000)
        }
        if (object) {
            object.material.emissive.setHex(0x555555)
        }
        highlightedObject = object
    }
};

const getCollectableObjects = () => {
    return scene.children.filter(object => object.name)
}

const collectObject = (object) => {
    if (object && object.name && !collectedObjects.includes(object)) {
        collectedObjects.push(object)
        const totalCollectableObjects = getCollectableObjects().length;
        notification.innerHTML = `Найдено: ${collectedObjects.length}. Осталось: ${totalCollectableObjects - collectedObjects.length}.`
        notification.style.display = 'block'
        setTimeout(() => {
            notification.style.display = 'none'
        }, 2000)
        updateInventory()
    }
}
const updateInventory = () =>{
    const infoContent = document.getElementById('info-content')
    if (collectedObjects.length === 0) {
        infoContent.innerHTML = "Нет найденных объектов"
    } else {
        infoContent.innerHTML = collectedObjects.map(obj => `
            <div class="inventory-item">
                <img src="${objectDescriptions[obj.name].image}" alt="${obj.name}">
                <p> ${objectDescriptions[obj.name].description}</p>
            </div>
        `).join('');
    }
}

const moveControls = () => {
    if (keys.forward && !checkCollision(0)) controls.moveForward(0.1)
    if (keys.backward && !checkCollision(1)) controls.moveForward(-0.1)
    if (keys.left && !checkCollision(2)) controls.moveRight(-0.1)
    if (keys.right && !checkCollision(3)) controls.moveRight(0.1)
}





const animate = () => {
    // if (keys.forward) controls.moveForward(0.1)
    // if (keys.backward) controls.moveForward(-0.1)
    // if (keys.left) controls.moveRight(-0.1)
    // if (keys.right) controls.moveRight(0.1)
    moveControls()
    const object = checkCollision(0)
    highlightObject(object && object.name ? object : null)
    renderer.render(scene, camera)
    requestAnimationFrame(animate)
};

const toggleInfoWindow = () => {
    if (infoWindow.style.display === 'block') {
        infoWindow.style.display = 'none'
    } else {
         infoWindow.style.display = 'block'
    }
}

const showBeginButton = () => {
    loadingScreen.style.display = 'none'
    beginButtonContainer.style.display = 'flex'
};

const showContButton = () =>{
    contButtonContainer.style.display = 'flex'
}

contButton.addEventListener('click', () => {
    contButtonContainer.style.display = 'none'
    canvas.style.display = 'block'
    controls.lock()
})

controls.addEventListener('unlock', () =>{
    setTimeout(() => {
        showContButton()
      }, 1000)
})

beginButton.addEventListener('click', () => {
    beginButtonContainer.style.display = 'none'
    canvas.style.display = 'block'
    controls.lock()
    sound.play()
    ambientSound.play()
    animate()
});

document.addEventListener('mousedown', () => {
    if (controls.isLocked) {
        if(highlightedObject){
            collectObject(highlightedObject)
        }
    }
})
