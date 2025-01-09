import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x131313);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 10;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

const rgbeLoader = new RGBELoader();
rgbeLoader.setDataType(THREE.FloatType);
rgbeLoader.load(
  "/textures/night.hdr",
  function (texture) {
    console.log("HDR текстура загружена:", texture);
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    scene.environment = envMap;

    texture.dispose();
    pmremGenerator.dispose();

    createCube();
  },
  function (xhr) {
    console.log((xhr.loaded / xhr.total) * 100 + "% загружено");
  },
  function (err) {
    console.error("Ошибка при загрузке HDR-карты окружения:", err);
  }
);

// Загрузка нормальной карты
const textureLoader = new THREE.TextureLoader();
const normalMap = textureLoader.load(
  "/textures/glass.jpg",
  function (texture) {
    console.log("Normal map загружена:", texture);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
  },
  function (xhr) {
    console.log((xhr.loaded / xhr.total) * 100 + "% загружено");
  },
  function (err) {
    console.error("Ошибка при загрузке Normal Map:", err);
  }
);

let cube;

function createCube() {
  const geometry = new THREE.BoxGeometry(3.56, 2.1, 0.1);

  const material = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.2,

    normalMap: normalMap,
    envMap: scene.environment,
    envMapIntensity: 0.5,
    transmission: 1,
    thickness: 0.3,
    side: THREE.DoubleSide,
  });

  cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  animate();
}

window.addEventListener("resize", () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});

const spotLight = new THREE.SpotLight(0xffffff, 2, 100, Math.PI / 6, 0.1, 1);
spotLight.position.set(10, 10, 10);
scene.add(spotLight);

const ambientLight = new THREE.AmbientLight(0x404040, 1);
scene.add(ambientLight);

function animate() {
  requestAnimationFrame(animate);

  controls.update();

  renderer.render(scene, camera);
}
