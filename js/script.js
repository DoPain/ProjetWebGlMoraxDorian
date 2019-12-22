import * as THREE from '../vendor/three.js-master/build/three.module.js';
import Stats from '../vendor/three.js-master/examples/jsm/libs/stats.module.js';
import { OrbitControls } from '../vendor/three.js-master/examples/jsm/controls/OrbitControls.js';
import { FBXLoader } from '../vendor/three.js-master/examples/jsm/loaders/FBXLoader.js';

(function() {
// Set our main variables
    let scene,
        renderer,
        camera,
        model,
        neck,
        waist,
        possibleAnims,
        mixer,
        idle,
        clock = new THREE.Clock(),
        currentlyAnimating = false,
        raycaster = new THREE.Raycaster(),
        loaderAnim = document.getElementById('js-loader');

})();

function init() {
    const canvas = document.querySelector('#c');
    const backgroundColor = 0xf1f1f1;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(backgroundColor);
    scene.fog = new THREE.Fog(backgroundColor, 60, 100);

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.shadowMap.enabled = true;
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera(
        50,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.z = 30
    camera.position.x = 0;
    camera.position.y = -3;


    //Hemisphere light
    let hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.61);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    //Directional light
    let d = 8.25;
    let dirLight = new THREE.DirectionalLight(0xffffff, 0.54);
    dirLight.position.set(-8, 12, 8);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize = new THREE.Vector2(1024, 1024);
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 1500;
    dirLight.shadow.camera.left = d * -1;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = d * -1;
    scene.add(dirLight);

    // Floor
    let floorGeometry = new THREE.PlaneGeometry(5000, 5000, 1, 1);
    let floorMaterial = new THREE.MeshPhongMaterial({
        color: 0xeeeeee,
        shininess: 0,
    });

    let floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -0.5 * Math.PI; // This is 90 degrees by the way
    floor.receiveShadow = true;
    floor.position.y = -11;
    scene.add(floor);

    /*let elem = document.querySelector('#loading');
    elem.parentNode.removeChild(elem);*/
}

function update() {
    renderer.render(scene, camera);
    requestAnimationFrame(update);
}

init();
update();
