import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import './style.css'
import { inject } from "@vercel/analytics"
import { injectSpeedInsights } from '@vercel/speed-insights';

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

// lights
const pointLight = new THREE.PointLight(0xffffff);
pointLight.position.set(0, 0, 0);

const ambientLight = new THREE.AmbientLight(0xffffff);

scene.add(ambientLight);

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
  new THREE.PlaneGeometry(400, 400, 10, 10),
  new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true })
);

ground.rotation.x = -Math.PI / 2;
ground.position.y = -1;

scene.add(ground);


// const controls = new OrbitControls(camera, renderer.domElement);

function moveCamera() {
  const t = document.body.getBoundingClientRect().top;

  camera.position.z = 10 + window.scrollY / 10.0;
}

const header = document.querySelector('header');

window.addEventListener("scroll", () => {
  moveCamera();

  if (window.scrollY > 200) {
    // header.style.background = "rgba(15, 15, 15, .5)"
    header.style.width = "100vw"
  } else {
    header.style.background = "#000"
  }
});

function animate() {
  requestAnimationFrame(animate);


  // controls.update();

  // camera.position.z += 0.15;

  // if (camera.position.z > 80) {
  //   camera.position.z = 0;
  // }

  renderer.render(scene, camera);
}

animate();
inject();
injectSpeedInsights();

// Infinite carousel with pause on hover
const carouselContainer = document.querySelector('.carousel-container');
const carouselTrack = document.getElementById('carouselTrack');
if (carouselContainer && carouselTrack) {
  carouselContainer.addEventListener('mouseenter', () => {
    carouselTrack.classList.add('paused');
  });

  carouselContainer.addEventListener('mouseleave', () => {
    carouselTrack.classList.remove('paused');
  });
}

// Projects carousel with pause on hover and drag functionality
const projectsContainer = document.querySelector('.projects-container');
const projectsTrack = document.getElementById('projectsTrack');
if (projectsContainer && projectsTrack) {
  let isDragging = false;
  let startX = 0;
  let scrollLeft = 0;
  let isPaused = false;
  let currentOffset = 0;
  let animationFrameId = null;
  let dragStartTime = 0;
  let manualScrollSpeed = 0;

  // Initialize carousel - let CSS animation start first, then switch to manual after first interaction
  const initWhenReady = () => {
    // Wait for content to load, then initialize after a delay to let CSS animation start
    if (projectsTrack.scrollWidth > 100) {
      // Don't interfere with CSS animation initially
      // Only initialize manual animation after first drag
    } else {
      setTimeout(initWhenReady, 50);
    }
  };

  // Try immediately, then wait for load
  initWhenReady();
  window.addEventListener('load', () => {
    setTimeout(initWhenReady, 100);
  });

  // Manual animation loop for continuous scrolling
  const animateManual = () => {
    if (isPaused || isDragging) return;

    const trackWidth = projectsTrack.scrollWidth / 2;
    currentOffset -= 0.5; // Adjust speed as needed (0.5px per frame)

    // Handle seamless loop - reset when reaching the end
    if (currentOffset <= -trackWidth) {
      currentOffset += trackWidth;
    }
    // Also handle if somehow we go too far positive (shouldn't happen but safety)
    if (currentOffset > 0) {
      currentOffset -= trackWidth;
    }

    projectsTrack.style.transform = `translateX(${currentOffset}px)`;
    animationFrameId = requestAnimationFrame(animateManual);
  };

  // Check if we should use CSS animation or manual animation
  let useManualAnimation = false;

  // Pause on hover
  projectsContainer.addEventListener('mouseenter', () => {
    if (!isDragging) {
      projectsTrack.classList.add('paused');
      isPaused = true;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    }
  });

  projectsContainer.addEventListener('mouseleave', () => {
    if (!isDragging) {
      projectsTrack.classList.remove('paused');
      isPaused = false;
      // Resume animation (manual if we switched, CSS otherwise)
      if (useManualAnimation && !animationFrameId && !isDragging) {
        animateManual();
      }
    }
  });

  // Mouse drag handlers
  const handleMouseDown = (e) => {
    // Cancel manual animation if running
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }

    isDragging = true;
    projectsTrack.classList.add('dragging');
    projectsTrack.classList.add('paused');
    projectsTrack.classList.add('has-drag');

    // Get current scroll position from transform
    const computedStyle = window.getComputedStyle(projectsTrack);
    const matrix = new DOMMatrixReadOnly(computedStyle.transform);
    const currentPos = matrix.m41; // translateX value

    // If we have inline transform, use that; otherwise use computed
    scrollLeft = currentPos || currentOffset;
    currentOffset = scrollLeft;

    // Mark that we'll use manual animation after this interaction
    useManualAnimation = true;

    // Stop CSS animation
    projectsTrack.style.animation = 'none';

    startX = e.pageX - projectsContainer.offsetLeft;
    projectsContainer.style.cursor = 'grabbing';
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();

    const x = e.pageX - projectsContainer.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed multiplier
    let newTranslateX = scrollLeft + walk;

    // Handle seamless loop when dragging
    const trackWidth = projectsTrack.scrollWidth / 2;

    // If dragging to the right past 0, wrap to the left
    if (newTranslateX > 0) {
      newTranslateX = newTranslateX - trackWidth;
    }
    // If dragging to the left past -trackWidth, wrap to the right
    if (newTranslateX < -trackWidth) {
      newTranslateX = newTranslateX + trackWidth;
    }

    currentOffset = newTranslateX;

    projectsTrack.style.transform = `translateX(${newTranslateX}px)`;
    projectsTrack.style.setProperty('--drag-offset', `${newTranslateX}px`);
  };

  const handleMouseUp = () => {
    if (isDragging) {
      isDragging = false;
      projectsTrack.classList.remove('dragging');
      projectsTrack.classList.remove('has-drag');
      projectsContainer.style.cursor = 'grab';

      // Cancel any existing animation frame
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }

      // Store the final position
      const finalOffset = currentOffset;
      projectsTrack.style.transform = `translateX(${finalOffset}px)`;
      projectsTrack.style.animation = 'none';

      // Normalize position to be within bounds
      const trackWidth = projectsTrack.scrollWidth / 2;
      if (currentOffset > 0) {
        currentOffset = currentOffset - trackWidth;
      }
      if (currentOffset < -trackWidth) {
        currentOffset = currentOffset + trackWidth;
      }
      projectsTrack.style.transform = `translateX(${currentOffset}px)`;

      // If not paused, start manual animation from current position
      if (!isPaused) {
        animateManual();
      }
    }
  };

  // Touch drag handlers
  const handleTouchStart = (e) => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }

    isDragging = true;
    projectsTrack.classList.add('dragging');
    projectsTrack.classList.add('paused');
    projectsTrack.classList.add('has-drag');

    const computedStyle = window.getComputedStyle(projectsTrack);
    const matrix = new DOMMatrixReadOnly(computedStyle.transform);
    const currentPos = matrix.m41;

    scrollLeft = currentPos || currentOffset;
    currentOffset = scrollLeft;

    // Mark that we'll use manual animation after this interaction
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

    // Handle seamless loop when dragging
    const trackWidth = projectsTrack.scrollWidth / 2;

    // If dragging to the right past 0, wrap to the left
    if (newTranslateX > 0) {
      newTranslateX = newTranslateX - trackWidth;
    }
    // If dragging to the left past -trackWidth, wrap to the right
    if (newTranslateX < -trackWidth) {
      newTranslateX = newTranslateX + trackWidth;
    }

    currentOffset = newTranslateX;

    projectsTrack.style.transform = `translateX(${newTranslateX}px)`;
    projectsTrack.style.setProperty('--drag-offset', `${newTranslateX}px`);
  };

  const handleTouchEnd = () => {
    if (isDragging) {
      isDragging = false;
      projectsTrack.classList.remove('dragging');
      projectsTrack.classList.remove('has-drag');

      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }

      // Normalize position to be within bounds
      const trackWidth = projectsTrack.scrollWidth / 2;
      if (currentOffset > 0) {
        currentOffset = currentOffset - trackWidth;
      }
      if (currentOffset < -trackWidth) {
        currentOffset = currentOffset + trackWidth;
      }
      projectsTrack.style.transform = `translateX(${currentOffset}px)`;
      projectsTrack.style.animation = 'none';

      if (!isPaused) {
        animateManual();
      }
    }
  };

  // Prevent image dragging
  const projectImages = projectsContainer.querySelectorAll('.project img');
  projectImages.forEach(img => {
    img.addEventListener('dragstart', (e) => {
      e.preventDefault();
      return false;
    });
    img.addEventListener('mousedown', (e) => {
      e.preventDefault();
      return false;
    });
  });

  // Add event listeners
  projectsContainer.addEventListener('mousedown', handleMouseDown);
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);

  projectsContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
  projectsContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
  projectsContainer.addEventListener('touchend', handleTouchEnd);
}

