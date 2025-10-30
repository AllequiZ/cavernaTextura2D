import * as THREE from 'three';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';

let scene, camera, renderer, mesh, raycaster, texture, ctx;
let pointer = new THREE.Vector2();
let intersection = null;

init();
animate();

function init() {
  // CENA
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x222222);

  // CÂMERA
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 50);
  camera.position.z = 1.5;

  // RENDERER
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);
  document.body.appendChild(ARButton.createButton(renderer));

  // LUZ
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(1, 1, 2);
  scene.add(light);

  // CRIA UMA TEXTURA EDITÁVEL A PARTIR DE CANVAS
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  ctx = canvas.getContext('2d');
  ctx.fillStyle = '#888';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  texture = new THREE.CanvasTexture(canvas);

  // PLANO PARA PINTAR
  const geometry = new THREE.PlaneGeometry(1, 1);
  const material = new THREE.MeshStandardMaterial({ map: texture });
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.z = -1.5;
  scene.add(mesh);

  // RAYCASTER
  raycaster = new THREE.Raycaster();

  // EVENTO DE CLIQUE (para desktop)
  window.addEventListener('click', onClick);

  // VR CONTROLLER (para modo VR)
  const controller = renderer.xr.getController(0);
  controller.addEventListener('selectstart', () => paintFromCamera());
  scene.add(controller);

  window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// 🎯 Lança o raio do centro da câmera e pinta se acertar
function paintFromCamera() {
  const origin = new THREE.Vector3();
  const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  raycaster.set(origin.copy(camera.position), direction);
  const hits = raycaster.intersectObject(mesh);

  if (hits.length > 0) {
    const hit = hits[0];
    const uv = hit.uv;

    // converte UV em coordenadas do canvas
    const x = uv.x * ctx.canvas.width;
    const y = (1 - uv.y) * ctx.canvas.height;

    // pinta um pequeno círculo vermelho
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();

    texture.needsUpdate = true;
  }
}

// Clique de mouse no desktop
function onClick() {
  paintFromCamera();
}

function animate() {
  renderer.setAnimationLoop(() => {
    renderer.render(scene, camera);
  });
}
