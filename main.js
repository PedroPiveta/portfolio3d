import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';  
import './style.css'

// setup

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight + 100);
// camera.position.setZ(30);
camera.position.setY(6);
// camera.rotateY = 5;

// // objects
// const geometry = new THREE.TorusGeometry(10, 3, 16, 100);
// const material = new THREE.MeshStandardMaterial({
//   color: 0xFF6347
// });
// const torus = new THREE.Mesh(geometry, material);

// scene.add(torus);

// lights
const pointLight = new THREE.PointLight(0xffffff);
pointLight.position.set(5, 5, 5);

const ambientLight = new THREE.AmbientLight(0xffffff);

scene.add(pointLight, ambientLight);

function addStar() {
  const geometry = new THREE.SphereGeometry(0.25, 24, 24);
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const star = new THREE.Mesh(geometry, material);

  const [x, y, z] = Array(3)
    .fill()
    .map(() => THREE.MathUtils.randFloatSpread(300));

  star.position.set(x, y, z);
  scene.add(star);
}

Array(300).fill().forEach(addStar);

// helpers

// const gridHelper = new THREE.GridHelper(200, 10);
// scene.add(gridHelper);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(300, 300, 10, 10),
  new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true})
);

ground.rotation.x = -Math.PI / 2;
ground.position.y = -1;

scene.add(ground);

const cube = new THREE.Mesh(
  new THREE.BoxGeometry(4, 4, 4),
  new THREE.MeshBasicMaterial({ color: 0xffffff })
);

cube.position.set(8, 10, 0);

scene.add(cube);

// const controls = new OrbitControls(camera, renderer.domElement);


function moveCamera() {
  const t = document.body.getBoundingClientRect().top;

  camera.position.z = 10 + window.scrollY / 10.0;
  cube.position.z  = t * -0.05;
  // camera.position.x = t * -0.0002;
  // camera.rotation.y = t * -0.0002;
}

window.addEventListener("scroll", () => {
  moveCamera();
  // renderer.setSize(window.innerWidth, window.innerHeight);
});
window.addEventListener("resize", () => {
  // rerender canvas
  // renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
  requestAnimationFrame(animate);

  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  cube.rotation.z += 0.01;

  // controls.update();

  // camera.position.z += 0.15;

  // if (camera.position.z > 80) {
  //   camera.position.z = 0;
  // }

  renderer.render(scene, camera);
}

animate();
