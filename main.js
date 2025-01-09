import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x131313);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 20;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

const rgbeLoader = new RGBELoader();
rgbeLoader.setDataType(THREE.FloatType);
rgbeLoader.load(
  "public/textures/night.hdr",
  function (texture) {
    console.log("HDR текстура загружена:", texture);
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    scene.environment = envMap;

    texture.dispose();
    pmremGenerator.dispose();

    loadAssetsAndCreateScene();
  },
  function (xhr) {
    console.log((xhr.loaded / xhr.total) * 100 + "% загружено");
  },
  function (err) {
    console.error("Ошибка при загрузке HDR-карты окружения:", err);
  }
);

const normalMapPaths = [
  "public/textures/glassBlocks001.jpg",
  "public/textures/glass.jpg",
  "public/textures/glassBlocks002.jpg",
  "public/textures/glassPattern001.jpg",
  "public/textures/glassPattern002.jpg",
  "public/textures/glassStained001.jpg",
  "public/textures/glassVintage001.jpg",
  "public/textures/glassWindow002.jpg",
  "public/textures/glassWindow003.jpg",
  "public/textures/glassWindow004.jpg",
  "public/textures/woodWindow001.jpg",
];

function loadAssetsAndCreateScene() {
  const loader = new THREE.TextureLoader();
  const fontLoader = new FontLoader();

  const normalMapPromises = normalMapPaths.map(
    (path) =>
      new Promise((resolve, reject) => {
        loader.load(
          path,
          (texture) => {
            console.log(`Normal map загружена: ${path}`);
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(1, 1);
            resolve({ texture, name: getFileName(path) });
          },
          undefined,
          (err) => {
            console.error(`Ошибка при загрузке Normal Map: ${path}`, err);
            reject(err);
          }
        );
      })
  );

  Promise.all([...normalMapPromises])
    .then((results) => {
      const normalMaps = results.slice(0, normalMapPaths.length);

      createCubes(normalMaps);
    })
    .catch((err) => {
      console.error("Ошибка при загрузке ассетов:", err);
    });
}

function getFileName(path) {
  return path.split("/").pop().split(".").shift();
}

function createCubes(normalMaps, font) {
  const cubes = [];
  const labels = [];
  const geometry = new THREE.BoxGeometry(3.56, 2.1, 0.1);

  normalMaps.forEach((item, index) => {
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.2,
      normalMap: item.texture,
      envMap: scene.environment,
      envMapIntensity: 0.5,
      transmission: 1,
      thickness: 0.3,
      side: THREE.DoubleSide,
    });

    const cube = new THREE.Mesh(geometry, material);
    cube.castShadow = true;
    cube.receiveShadow = true;
    scene.add(cube);
    cubes.push(cube);

    const rows = 3;
    const cols = Math.ceil(normalMaps.length / rows);
    const spacingX = 4;
    const spacingY = 3;

    const row = Math.floor(index / cols);
    const col = index % cols;

    cube.position.x = (col - (cols - 1) / 2) * spacingX;
    cube.position.y = ((rows - 1) / 2 - row) * spacingY;
    cube.position.z = 0;
  });

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
spotLight.position.set(10, 20, 10);
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
spotLight.shadow.camera.near = 0.5;
spotLight.shadow.camera.far = 500;
scene.add(spotLight);

const ambientLight = new THREE.AmbientLight(0x404040, 1);
scene.add(ambientLight);

function animate() {
  requestAnimationFrame(animate);

  controls.update();

  renderer.render(scene, camera);
}
