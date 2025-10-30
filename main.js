import * as THREE from 'three';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';

let camera, scene, renderer;
let mesh, texture, ctx;
let hitTestSource = null;
let localSpace = null;
let hitTestSourceRequested = false;
let reticle;

// Inicializa tudo
init();
animate();

function init() {
  // Cena e câmera
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

  // Renderer transparente (para sobrepor o mundo real)
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  renderer.setClearAlpha(0);
  document.body.appendChild(renderer.domElement);

  // Botão de entrada AR
  document.body.appendChild(ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] }));

  // Luz ambiente
  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
  scene.add(light);

  // Canvas para textura
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  ctx = canvas.getContext('2d');
  ctx.fillStyle = '#777';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  texture = new THREE.CanvasTexture(canvas);

  // Plano que receberá a pintura
  const geometry = new THREE.PlaneGeometry(0.4, 0.4);
  const material = new THREE.MeshStandardMaterial({ map: texture });
  mesh = new THREE.Mesh(geometry, material);
  mesh.visible = false; // só mostra depois do hit-test
  scene.add(mesh);

  // Reticle (indicador de onde o plano será colocado)
  reticle = new THREE.Mesh(
    new THREE.RingGeometry(0.07, 0.1, 32).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  );
  reticle.visible = false;
  scene.add(reticle);

  // Pintar ao tocar
  window.addEventListener('click', () => {
    if (reticle.visible && !mesh.visible) {
      // Coloca o plano na posição detectada
      mesh.position.copy(reticle.position);
      mesh.quaternion.copy(reticle.quaternion);
      mesh.visible = true;
    } else if (mesh.visible) {
      paintFromCamera();
    }
  });

  window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Função de pintura — dispara do centro da câmera
function paintFromCamera() {
  const raycaster = new THREE.Raycaster();
  const origin = new THREE.Vector3();
  const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  raycaster.set(origin.copy(camera.position), direction);
  const hits = raycaster.intersectObject(mesh);
  if (hits.length > 0) {
    const uv = hits[0].uv;
    const x = uv.x * ctx.canvas.width;
    const y = (1 - uv.y) * ctx.canvas.height;
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fill();
    texture.needsUpdate = true;
  }
}

// Loop de animação + hit-test
function animate() {
  renderer.setAnimationLoop(render);
}

function render(timestamp, frame) {
  if (frame) {
    const referenceSpace = renderer.xr.getReferenceSpace();
    const session = renderer.xr.getSession();

    if (!hitTestSourceRequested) {
      session.requestReferenceSpace('viewer').then((space) => {
        session.requestHitTestSource({ space }).then((source) => {
          hitTestSource = source;
        });
      });
      hitTestSourceRequested = true;
      localSpace = referenceSpace;
      session.addEventListener('end', () => {
        hitTestSourceRequested = false;
        hitTestSource = null;
      });
    }

    if (hitTestSource) {
      const hitTestResults = frame.getHitTestResults(hitTestSource);
      if (hitTestResults.length > 0) {
        const hit = hitTestResults[0];
        const pose = hit.getPose(localSpace);
        reticle.visible = true;
        reticle.position.set(pose.transform.position.x, pose.transform.position.y, pose.transform.position.z);
        reticle.quaternion.setFromRotationMatrix(new THREE.Matrix4().fromArray(pose.transform.matrix));
      } else {
        reticle.visible = false;
      }
    }
  }

  renderer.render(scene, camera);
}
