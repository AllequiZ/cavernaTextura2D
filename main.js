import * as THREE from 'three';
import {VRButton} from 'three/addons/webxr/VRButton.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.xr.enabled = true;
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );
document.body.appendChild(VRButton.createButton(renderer));


camera.position.z = 1;

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(2, 2, 5);
  scene.add(light);

const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load('textura.jpg');
texture.colorSpace = THREE.SRGBColorSpace;

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({ map: texture});
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

renderer.setAnimationLoop( function () {

  renderer.render( scene, camera );

} );