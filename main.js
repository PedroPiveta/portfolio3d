import * as THREE from 'three';
import './style.css'
import { inject } from "@vercel/analytics"
import { injectSpeedInsights } from '@vercel/speed-insights';

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050507, 0.0035);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 6, 10);

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
  antialias: true,
  alpha: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x050507, 1);

const ambientLight = new THREE.AmbientLight(0x6c63ff, 0.7);
scene.add(ambientLight);

const pointLight1 = new THREE.PointLight(0x6c63ff, 4, 300);
pointLight1.position.set(30, 20, 10);
scene.add(pointLight1);

const pointLight2 = new THREE.PointLight(0xff6584, 3, 300);
pointLight2.position.set(-30, -10, -20);
scene.add(pointLight2);

const starCount = 400;
const starGeometry = new THREE.BufferGeometry();
const positions = new Float32Array(starCount * 3);
const sizes = new Float32Array(starCount);

for (let i = 0; i < starCount; i++) {
  positions[i * 3] = (Math.random() - 0.5) * 400;
  positions[i * 3 + 1] = (Math.random() - 0.5) * 400;
  positions[i * 3 + 2] = (Math.random() - 0.5) * 400;
  sizes[i] = Math.random() * 2 + 0.5;
}
starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
starGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

const starMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 1.2,
  sizeAttenuation: true,
  transparent: true,
  opacity: 0.9,
});
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

const groundMaterial = new THREE.MeshBasicMaterial({
  color: 0x9d96ff,
  wireframe: true,
  transparent: true,
  opacity: 0.28,
});
const ground = new THREE.Mesh(new THREE.PlaneGeometry(700, 700, 28, 28), groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -8;
scene.add(ground);

// target values — smoothly lerped each frame
let groundTargetRotX = -Math.PI / 2;
let groundTargetRotZ = 0;
let groundTargetY = -8;
let groundCurrentRotX = -Math.PI / 2;
let groundCurrentRotZ = 0;
let groundCurrentY = -8;

// how far into the scroll transition (0 → 1)
let scrollProgress = 0;

const maxScroll = () => document.body.scrollHeight - window.innerHeight;

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const header = document.querySelector('header');

window.addEventListener("scroll", () => {
  const t = Math.min(window.scrollY / (maxScroll() * 0.35), 1); // reaches full effect at 35% scroll
  scrollProgress = t;

  // camera pulls back and sinks slightly
  camera.position.z = 10 + window.scrollY / 10.0;
  camera.position.y = 6 - window.scrollY / 80;

  // ground rotates from floor (-90°) toward facing the camera (0°), then tilts a bit more
  // phase 1 (0→0.6): plane rises up, rotating from floor to ~-20deg (almost flat background)
  // phase 2 (0.6→1): slight extra tilt + slow Z spin begins
  const phase1 = Math.min(t / 0.6, 1);
  const phase2 = Math.max((t - 0.6) / 0.4, 0);

  groundTargetRotX = -Math.PI / 2 + phase1 * (Math.PI / 2 - 0.35);
  groundTargetRotZ = phase2 * 0.25;
  groundTargetY = -8 + phase1 * 2;

  if (window.scrollY > 100) {
    header.style.background = "rgba(5,5,7,0.85)";
  } else {
    header.style.background = "rgba(5,5,7,0.65)";
  }
});

let time = 0;
function animate() {
  requestAnimationFrame(animate);
  time += 0.005;

  stars.rotation.y = time * 0.03;
  stars.rotation.x = Math.sin(time * 0.1) * 0.05;

  pointLight1.position.x = Math.sin(time * 0.7) * 40;
  pointLight1.position.y = Math.cos(time * 0.5) * 20;
  pointLight2.position.x = Math.cos(time * 0.4) * 40;
  pointLight2.position.z = Math.sin(time * 0.6) * 30;

  // smooth lerp toward targets
  const lerpSpeed = 0.06;
  groundCurrentRotX += (groundTargetRotX - groundCurrentRotX) * lerpSpeed;
  groundCurrentRotZ += (groundTargetRotZ - groundCurrentRotZ) * lerpSpeed;
  groundCurrentY += (groundTargetY - groundCurrentY) * lerpSpeed;

  ground.rotation.x = groundCurrentRotX;
  ground.rotation.z = groundCurrentRotZ + time * 0.04 * scrollProgress;
  ground.position.y = groundCurrentY;

  // fade opacity in as it becomes a background element
  groundMaterial.opacity = 0.18 + scrollProgress * 0.22;

  renderer.render(scene, camera);
}

animate();
inject();
injectSpeedInsights();

const carouselContainer = document.querySelector('.carousel-container');
const carouselTrack = document.getElementById('carouselTrack');
if (carouselContainer && carouselTrack) {
  carouselContainer.addEventListener('mouseenter', () => carouselTrack.classList.add('paused'));
  carouselContainer.addEventListener('mouseleave', () => carouselTrack.classList.remove('paused'));
}

const projectsContainer = document.querySelector('.projects-container');
const projectsTrack = document.getElementById('projectsTrack');
if (projectsContainer && projectsTrack) {
  let isDragging = false;
  let startX = 0;
  let scrollLeft = 0;
  let isPaused = false;
  let currentOffset = 0;
  let animationFrameId = null;
  let useManualAnimation = false;

  const animateManual = () => {
    if (isPaused || isDragging) return;
    const trackWidth = projectsTrack.scrollWidth / 2;
    currentOffset -= 0.5;
    if (currentOffset <= -trackWidth) currentOffset += trackWidth;
    if (currentOffset > 0) currentOffset -= trackWidth;
    projectsTrack.style.transform = `translateX(${currentOffset}px)`;
    animationFrameId = requestAnimationFrame(animateManual);
  };

  projectsContainer.addEventListener('mouseenter', () => {
    if (!isDragging) {
      projectsTrack.classList.add('paused');
      isPaused = true;
      if (animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null; }
    }
  });

  projectsContainer.addEventListener('mouseleave', () => {
    if (!isDragging) {
      projectsTrack.classList.remove('paused');
      isPaused = false;
      if (useManualAnimation && !animationFrameId && !isDragging) animateManual();
    }
  });

  const handleMouseDown = (e) => {
    if (animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null; }
    isDragging = true;
    projectsTrack.classList.add('dragging', 'paused', 'has-drag');
    const computedStyle = window.getComputedStyle(projectsTrack);
    const matrix = new DOMMatrixReadOnly(computedStyle.transform);
    scrollLeft = matrix.m41 || currentOffset;
    currentOffset = scrollLeft;
    useManualAnimation = true;
    projectsTrack.style.animation = 'none';
    startX = e.pageX - projectsContainer.offsetLeft;
    projectsContainer.style.cursor = 'grabbing';
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - projectsContainer.offsetLeft;
    const walk = (x - startX) * 2;
    let newTranslateX = scrollLeft + walk;
    const trackWidth = projectsTrack.scrollWidth / 2;
    if (newTranslateX > 0) newTranslateX -= trackWidth;
    if (newTranslateX < -trackWidth) newTranslateX += trackWidth;
    currentOffset = newTranslateX;
    projectsTrack.style.transform = `translateX(${newTranslateX}px)`;
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    isDragging = false;
    projectsTrack.classList.remove('dragging', 'has-drag');
    projectsContainer.style.cursor = 'grab';
    if (animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null; }
    const trackWidth = projectsTrack.scrollWidth / 2;
    if (currentOffset > 0) currentOffset -= trackWidth;
    if (currentOffset < -trackWidth) currentOffset += trackWidth;
    projectsTrack.style.transform = `translateX(${currentOffset}px)`;
    if (!isPaused) animateManual();
  };

  const handleTouchStart = (e) => {
    if (animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null; }
    isDragging = true;
    projectsTrack.classList.add('dragging', 'paused', 'has-drag');
    const computedStyle = window.getComputedStyle(projectsTrack);
    const matrix = new DOMMatrixReadOnly(computedStyle.transform);
    scrollLeft = matrix.m41 || currentOffset;
    currentOffset = scrollLeft;
    useManualAnimation = true;
    projectsTrack.style.animation = 'none';
    startX = e.touches[0].pageX - projectsContainer.offsetLeft;
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.touches[0].pageX - projectsContainer.offsetLeft;
    const walk = (x - startX) * 2;
    let newTranslateX = scrollLeft + walk;
    const trackWidth = projectsTrack.scrollWidth / 2;
    if (newTranslateX > 0) newTranslateX -= trackWidth;
    if (newTranslateX < -trackWidth) newTranslateX += trackWidth;
    currentOffset = newTranslateX;
    projectsTrack.style.transform = `translateX(${newTranslateX}px)`;
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    isDragging = false;
    projectsTrack.classList.remove('dragging', 'has-drag');
    if (animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null; }
    const trackWidth = projectsTrack.scrollWidth / 2;
    if (currentOffset > 0) currentOffset -= trackWidth;
    if (currentOffset < -trackWidth) currentOffset += trackWidth;
    projectsTrack.style.transform = `translateX(${currentOffset}px)`;
    projectsTrack.style.animation = 'none';
    if (!isPaused) animateManual();
  };

  const projectImages = projectsContainer.querySelectorAll('.project img');
  projectImages.forEach(img => {
    img.addEventListener('dragstart', (e) => { e.preventDefault(); return false; });
    img.addEventListener('mousedown', (e) => { e.preventDefault(); return false; });
  });

  projectsContainer.addEventListener('mousedown', handleMouseDown);
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
  projectsContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
  projectsContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
  projectsContainer.addEventListener('touchend', handleTouchEnd);
}