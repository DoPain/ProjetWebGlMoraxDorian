(function() {
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


init();

function init() {
    const MODEL_PATH = 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/1376484/stacy_lightweight.glb';

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

    var loader = new THREE.GLTFLoader();
    loader.load(
        MODEL_PATH,
        function(g) {
            // A lot is going to happen here
            model = g.scene;
            let fileAnimations = g.animations;

            scene.add(model);
            loaderAnim.remove();

            mixer = new THREE.AnimationMixer(model);

            let clips = fileAnimations.filter(val => val.name !== 'idle');
            possibleAnims = clips.map(val => {
                    let clip = THREE.AnimationClip.findByName(clips, val.name);
                    clip.tracks.splice(3, 3);
                    clip.tracks.splice(9, 3);
                    clip = mixer.clipAction(clip);
                    return clip;
                }
            );

            let idleAnim = THREE.AnimationClip.findByName(fileAnimations, 'idle');
            idleAnim.tracks.splice(3, 3);
            idleAnim.tracks.splice(9, 3);
            idle = mixer.clipAction(idleAnim);
            idle.play();
            model.traverse(o => {
                if (o.isMesh) {
                    o.castShadow = true;
                    o.receiveShadow = true;
                }
                if (o.isBone && o.name === 'mixamorigNeck') {
                    neck = o;
                }
                if (o.isBone && o.name === 'mixamorigSpine') {
                    waist = o;
                }
            });
            model.scale.set(7, 7, 7);
            model.position.y = -11;

        },
        undefined, // We don't need this function
        function(error) {
            console.error(error);
        }
    );

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
    if (mixer) {
        mixer.update(clock.getDelta());
    }
    if (resizeRendererToDisplaySize(renderer)) {
        const canvas = renderer.domElement;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
    }
    renderer.render(scene, camera);
    requestAnimationFrame(update);
}

update();

function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let canvasPixelWidth = canvas.width / window.devicePixelRatio;
    let canvasPixelHeight = canvas.height / window.devicePixelRatio;

    const needResize =
        canvasPixelWidth !== width || canvasPixelHeight !== height;
    if (needResize) {
        renderer.setSize(width, height, false);
    }
    return needResize;
}

window.addEventListener('click', e => raycast(e));
window.addEventListener('touchend', e => raycast(e, true));

function raycast(e, touch = false) {
    var mouse = {};
    if (touch) {
        mouse.x = 2 * (e.changedTouches[0].clientX / window.innerWidth) - 1;
        mouse.y = 1 - 2 * (e.changedTouches[0].clientY / window.innerHeight);
    } else {
        mouse.x = 2 * (e.clientX / window.innerWidth) - 1;
        mouse.y = 1 - 2 * (e.clientY / window.innerHeight);
    }
    // update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // calculate objects intersecting the picking ray
    var intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects[0]) {
        var object = intersects[0].object;

        if (object.name === 'stacy') {

            if (!currentlyAnimating) {
                currentlyAnimating = true;
                playOnClick();
            }
        }
    }
}

function playOnClick() {
    let anim = Math.floor(Math.random() * possibleAnims.length) + 0;
    playModifierAnimation(idle, 0.25, possibleAnims[anim], 0.25);
}

function playModifierAnimation(from, fSpeed, to, tSpeed) {
    to.setLoop(THREE.LoopOnce);
    to.reset();
    to.play();
    from.crossFadeTo(to, fSpeed, true);
    setTimeout(function() {
        from.enabled = true;
        to.crossFadeTo(from, tSpeed, true);
        currentlyAnimating = false;
    }, to._clip.duration * 1000 - ((tSpeed + fSpeed) * 1000));
}

document.addEventListener('mousemove', function(e) {
    var mousecoords = getMousePos(e);
    if (neck && waist) {
        moveJoint(mousecoords, neck, 50);
        moveJoint(mousecoords, waist, 30);
    }
});

function getMousePos(e) {
    return { x: e.clientX, y: e.clientY };
}

function moveJoint(mouse, joint, degreeLimit) {
    let degrees = getMouseDegrees(mouse.x, mouse.y, degreeLimit);
    joint.rotation.y = THREE.Math.degToRad(degrees.x);
    joint.rotation.x = THREE.Math.degToRad(degrees.y);
}

function getMouseDegrees(x, y, degreeLimit) {
    let dx = 0,
        dy = 0,
        xdiff,
        xPercentage,
        ydiff,
        yPercentage;

    let w = { x: window.innerWidth, y: window.innerHeight };

    // 1. Si le curseur est sur la partie gauche de l'ecran
    if (x <= w.x / 2) {
        // 2. Différence entre le milieu de l'écran et la position de la souris
        xdiff = w.x / 2 - x;
        // 3. Pourcentage de cette différence
        xPercentage = (xdiff / (w.x / 2)) * 100;
        // 4. Convertissons cela en un pourcentage de la rotation maximale que nous autorisons pour le cou
        dx = ((degreeLimit * xPercentage) / 100) * -1; }
// Droite
    if (x >= w.x / 2) {
        xdiff = x - w.x / 2;
        xPercentage = (xdiff / (w.x / 2)) * 100;
        dx = (degreeLimit * xPercentage) / 100;
    }
    // Haut
    if (y <= w.y / 2) {
        ydiff = w.y / 2 - y;
        yPercentage = (ydiff / (w.y / 2)) * 100;
        // Note that I cut degreeLimit in half when she looks up
        dy = (((degreeLimit * 0.5) * yPercentage) / 100) * -1;
    }

    // Bas
    if (y >= w.y / 2) {
        ydiff = y - w.y / 2;
        yPercentage = (ydiff / (w.y / 2)) * 100;
        dy = (degreeLimit * yPercentage) / 100;
    }
    return { x: dx, y: dy };
}

})();
