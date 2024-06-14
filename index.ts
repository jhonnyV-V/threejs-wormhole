import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import spline from './spline';

const w = window.innerWidth;
const h = window.innerHeight;

const scene = new THREE.Scene();

const fov = 75;
const aspect = w / h;
const near = 0.1;
const far = 1000;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(w, h);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

document.body.appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.03;

//Post-processing
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), 1.5, 0.4, 100);
bloomPass.threshold = 0.002;
bloomPass.strength = 1.5;
bloomPass.radius = 0;

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

const tubeGeometry = new THREE.TubeGeometry(spline, 222, 0.65, 16, true);
const tubeMaterial = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  side: THREE.DoubleSide,
  wireframe: true,
});
const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
scene.add(tube);

const edges = new THREE.EdgesGeometry(tubeGeometry, 0.2);
const lineMat = new THREE.LineBasicMaterial({ color: 0xff0000 });
const tubeLine = new THREE.LineSegments(edges, lineMat);
scene.add(tubeLine);

scene.fog = new THREE.FogExp2(0x000000, 0.3);

const numberOfBoxes = 55;
const size = 0.075;
const geometry = new THREE.BoxGeometry(size, size, size);
const material = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
const boxEdges = new THREE.EdgesGeometry(geometry, 0.2);
for (let i = 0; i < numberOfBoxes; i += 1) {
  const cube = new THREE.Mesh(geometry, material);
  const p = (i / numberOfBoxes + Math.random() * 0.1) % 1;
  const pos = tubeGeometry.parameters.path.getPointAt(p);
  pos.y += Math.random() - 0.4;
  pos.x += Math.random() - 0.4;
  cube.position.copy(pos);
  const rotation = new THREE.Vector3(
    Math.random() * Math.PI,
    Math.random() * Math.PI,
    Math.random() * Math.PI
  );
  cube.rotation.set(rotation.x, rotation.y, rotation.z);


  const color = new THREE.Color().setHSL(1.0 - p, 1, 0.5);
  const lineMat = new THREE.LineBasicMaterial({ color });
  const boxLine = new THREE.LineSegments(boxEdges, lineMat);
  boxLine.position.copy(pos);
  boxLine.rotation.set(rotation.x, rotation.y, rotation.z);
  scene.add(cube);
  scene.add(boxLine);
}


function updateCamera(t: number) {
  const time = t * 0.1;
  const loopTime = 10 * 1000;
  const t2 = (time % loopTime) / loopTime;
  const pos = tubeGeometry.parameters.path.getPointAt(t2);
  const lookAt = tubeGeometry.parameters.path.getPointAt((t2 + 0.03) % 1);
  camera.position.copy(pos);
  camera.lookAt(lookAt);
}

function animate(t: number = 0) {
  requestAnimationFrame(animate);
  updateCamera(t);
  composer.render(t);
  controls.update();
}

animate();

function handleWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', handleWindowResize, false);
