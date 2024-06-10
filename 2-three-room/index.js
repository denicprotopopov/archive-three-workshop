import * as THREE from "https://cdn.skypack.dev/three@0.132.2"
import { OrbitControls } from "https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/OrbitControls.js"
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.132.2/examples/jsm/loaders/GLTFLoader.js"

const canvas = document.querySelector('canvas.webgl')

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
    scene.add(model)
}, undefined, (error) => {
    console.error(error)
})

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height)
camera.position.z = 30
camera.position.y = 30
scene.add(camera)

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

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true

const animate = () => {
    controls.update()

    renderer.render(scene, camera)

    requestAnimationFrame(animate)
}

animate()