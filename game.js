import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

// =====================================================
// SCENE
// =====================================================

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x87ceeb);

scene.fog = new THREE.Fog(
    0x87ceeb,
    60,
    300
);

// =====================================================
// CAMERA
// =====================================================

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

// =====================================================
// RENDERER
// =====================================================

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
);

renderer.shadowMap.enabled = true;

document
    .getElementById("game")
    .appendChild(renderer.domElement);

// =====================================================
// LIGHTS
// =====================================================

const skyLight = new THREE.HemisphereLight(
    0xffffff,
    0x557755,
    1.4
);

scene.add(skyLight);

const sun = new THREE.DirectionalLight(
    0xffffff,
    1.8
);

sun.position.set(
    60,
    100,
    50
);

sun.castShadow = true;

scene.add(sun);

// =====================================================
// GROUND
// =====================================================

const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(
        500,
        500
    ),

    new THREE.MeshStandardMaterial({
        color: 0x3ca34a
    })
);

ground.rotation.x =
    -Math.PI / 2;

ground.receiveShadow = true;

scene.add(ground);

// =====================================================
// PLAYER
// =====================================================

const player = new THREE.Object3D();

player.position.set(
    0,
    1.7,
    10
);

scene.add(player);

player.add(camera);

camera.position.set(
    0,
    0,
    0
);

// =====================================================
// WEAPON
// =====================================================

const weapon = new THREE.Group();

const weaponBody = new THREE.Mesh(
    new THREE.BoxGeometry(
        0.25,
        0.2,
        0.9
    ),

    new THREE.MeshStandardMaterial({
        color: 0x222222
    })
);

weaponBody.position.z =
    -0.45;

weapon.add(weaponBody);

const barrel = new THREE.Mesh(
    new THREE.BoxGeometry(
        0.08,
        0.08,
        0.4
    ),

    new THREE.MeshStandardMaterial({
        color: 0x111111
    })
);

barrel.position.z =
    -1;

weapon.add(barrel);

weapon.position.set(
    0.35,
    -0.3,
    -0.7
);

camera.add(weapon);

// =====================================================
// BUILDINGS
// =====================================================

function createBuilding(
    x,
    z,
    width,
    height,
    depth
) {

    const building =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                width,
                height,
                depth
            ),

            new THREE.MeshStandardMaterial({
                color: 0xb0b0b0
            })
        );

    building.position.set(
        x,
        height / 2,
        z
    );

    building.castShadow = true;
    building.receiveShadow = true;

    scene.add(building);
}

createBuilding(
    -25,
    -20,
    18,
    8,
    18
);

createBuilding(
    25,
    -20,
    18,
    10,
    18
);

createBuilding(
    -30,
    25,
    20,
    7,
    15
);

createBuilding(
    30,
    25,
    20,
    9,
    15
);

// =====================================================
// TREES
// =====================================================

function createTree(
    x,
    z
) {

    const trunk =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.35,
                0.45,
                3,
                8
            ),

            new THREE.MeshStandardMaterial({
                color: 0x704214
            })
        );

    trunk.position.set(
        x,
        1.5,
        z
    );

    trunk.castShadow = true;

    scene.add(trunk);

    const leaves =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                2.2,
                12,
                12
            ),

            new THREE.MeshStandardMaterial({
                color: 0x176b2c
            })
        );

    leaves.position.set(
        x,
        4,
        z
    );

    leaves.castShadow = true;

    scene.add(leaves);
}

[
    [-15, 5],
    [15, 5],
    [-20, 18],
    [20, 18],
    [-10, -15],
    [10, -15],
    [-25, 8],
    [25, 8]
].forEach(
    position => {
        createTree(
            position[0],
            position[1]
        );
    }
);

// =====================================================
// ENEMIES
// =====================================================

const enemies = [];

function createEnemy(
    x,
    z
) {

    const enemy =
        new THREE.Group();

    // BODY
    const body =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.9,
                1.4,
                0.6
            ),

            new THREE.MeshStandardMaterial({
                color: 0xcc2222
            })
        );

    body.position.y = 1;

    body.castShadow = true;

    body.userData.enemy =
        enemy;

    enemy.add(body);

    // HEAD
    const head =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.35,
                16,
                16
            ),

            new THREE.MeshStandardMaterial({
                color: 0xffc49a
            })
        );

    head.position.y = 2;

    head.castShadow = true;

    head.userData.enemy =
        enemy;

    enemy.add(head);

    enemy.position.set(
        x,
        0,
        z
    );

    enemy.userData.hp = 100;

    enemy.userData.dead = false;

    scene.add(enemy);

    enemies.push(enemy);
}

// أعداء البداية

createEnemy(
    0,
    -20
);

createEnemy(
    -15,
    -10
);

createEnemy(
    20,
    5
);

createEnemy(
    -20,
    25
);

// =====================================================
// KEYBOARD
// =====================================================

const keys = {};

window.addEventListener(
    "keydown",
    event => {

        keys[
            event.key.toLowerCase()
        ] = true;
    }
);

window.addEventListener(
    "keyup",
    event => {

        keys[
            event.key.toLowerCase()
        ] = false;
    }
);

// =====================================================
// MOUSE LOOK
// =====================================================

let yaw = 0;

let pitch = 0;

const mouseSensitivity =
    0.0022;

document.addEventListener(
    "mousemove",
    event => {

        if (
            document.pointerLockElement !==
            renderer.domElement
        ) {
            return;
        }

        yaw -=
            event.movementX *
            mouseSensitivity;

        pitch -=
            event.movementY *
            mouseSensitivity;

        pitch =
            THREE.MathUtils.clamp(
                pitch,
                -1.45,
                1.45
            );

        player.rotation.y =
            yaw;

        camera.rotation.x =
            pitch;
    }
);

// =====================================================
// POINTER LOCK
// =====================================================

renderer.domElement.addEventListener(
    "click",
    () => {

        renderer.domElement.requestPointerLock();

    }
);

// =====================================================
// MOVEMENT
// =====================================================

const clock =
    new THREE.Clock();

function updateMovement() {

    const delta =
        Math.min(
            clock.getDelta(),
            0.05
        );

    let forward = 0;

    let right = 0;

    if (keys["w"]) {
        forward += 1;
    }

    if (keys["s"]) {
        forward -= 1;
    }

    if (keys["d"]) {
        right += 1;
    }

    if (keys["a"]) {
        right -= 1;
    }

    if (
        forward === 0 &&
        right === 0
    ) {
        return;
    }

    const length =
        Math.sqrt(
            forward * forward +
            right * right
        );

    forward /= length;

    right /= length;

    const speed =
        keys["shift"]
            ? 9
            : 5;

    const distance =
        speed * delta;

    // الاتجاه الأمامي
    const forwardVector =
        new THREE.Vector3(
            0,
            0,
            -1
        );

    forwardVector.applyAxisAngle(
        new THREE.Vector3(
            0,
            1,
            0
        ),
        player.rotation.y
    );

    // الاتجاه الجانبي
    const rightVector =
        new THREE.Vector3(
            1,
            0,
            0
        );

    rightVector.applyAxisAngle(
        new THREE.Vector3(
            0,
            1,
            0
        ),
        player.rotation.y
    );

    player.position.add(
        forwardVector.multiplyScalar(
            forward * distance
        )
    );

    player.position.add(
        rightVector.multiplyScalar(
            right * distance
        )
    );

    // حدود الخريطة
    player.position.x =
        THREE.MathUtils.clamp(
            player.position.x,
            -240,
            240
        );

    player.position.z =
        THREE.MathUtils.clamp(
            player.position.z,
            -240,
            240
        );

    player.position.y =
        1.7;
}

// =====================================================
// SHOOTING
// =====================================================

const raycaster =
    new THREE.Raycaster();

let ammo = 30;

function shoot() {

    if (ammo <= 0) {
        return;
    }

    ammo--;

    raycaster.setFromCamera(
        new THREE.Vector2(
            0,
            0
        ),
        camera
    );

    const targets = [];

    for (
        const enemy of enemies
    ) {

        if (
            enemy.userData.dead
        ) {
            continue;
        }

        enemy.traverse(
            object => {

                if (
                    object.isMesh
                ) {

                    targets.push(
                        object
                    );
                }
            }
        );
    }

    const hits =
        raycaster.intersectObjects(
            targets,
            false
        );

    if (
        hits.length === 0
    ) {
        return;
    }

    const hit =
        hits[0].object;

    const enemy =
        hit.userData.enemy;

    if (!enemy) {
        return;
    }

    enemy.userData.hp -= 34;

    if (
        enemy.userData.hp <= 0
    ) {

        killEnemy(
            enemy
        );
    }
}

// =====================================================
// KILL ENEMY
// =====================================================

function killEnemy(
    enemy
) {

    if (
        enemy.userData.dead
    ) {
        return;
    }

    enemy.userData.dead =
        true;

    const startY =
        enemy.position.y;

    const startTime =
        performance.now();

    function fall(
        time
    ) {

        const progress =
            Math.min(
                (time - startTime) /
                500,
                1
            );

        enemy.rotation.z =
            progress *
            Math.PI /
            2;

        enemy.position.y =
            startY -
            progress *
            0.8;

        if (
            progress < 1
        ) {

            requestAnimationFrame(
                fall
            );

        } else {

            scene.remove(
                enemy
            );

            const index =
                enemies.indexOf(
                    enemy
                );

            if (
                index !== -1
            ) {

                enemies.splice(
                    index,
                    1
                );
            }

            setTimeout(
                spawnEnemy,
                2000
            );
        }
    }

    requestAnimationFrame(
        fall
    );
}

// =====================================================
// SPAWN NEW ENEMY
// =====================================================

function spawnEnemy() {

    let x;

    let z;

    do {

        x =
            THREE.MathUtils.randFloat(
                -30,
                30
            );

        z =
            THREE.MathUtils.randFloat(
                -30,
                30
            );

    } while (
        Math.hypot(
            x - player.position.x,
            z - player.position.z
        ) < 12
    );

    createEnemy(
        x,
        z
    );
}

// =====================================================
// ENEMY MOVEMENT
// =====================================================

function updateEnemies() {

    for (
        const enemy of enemies
    ) {

        if (
            enemy.userData.dead
        ) {
            continue;
        }

        const dx =
            player.position.x -
            enemy.position.x;

        const dz =
            player.position.z -
            enemy.position.z;

        const distance =
            Math.hypot(
                dx,
                dz
            );

        if (
            distance > 3 &&
            distance < 60
        ) {

            enemy.position.x +=
                dx /
                distance *
                0.025;

            enemy.position.z +=
                dz /
                distance *
                0.025;
        }

        enemy.lookAt(
            player.position.x,
            enemy.position.y,
            player.position.z
        );
    }
}

// =====================================================
// MOUSE SHOOT
// =====================================================

window.addEventListener(
    "mousedown",
    event => {

        if (
            event.button === 0 &&
            document.pointerLockElement ===
            renderer.domElement
        ) {

            shoot();
        }
    }
);

// =====================================================
// RESIZE
// =====================================================

window.addEventListener(
    "resize",
    () => {

        camera.aspect =
            window.innerWidth /
            window.innerHeight;

        camera.updateProjectionMatrix();

        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );
    }
);

// =====================================================
// GAME LOOP
// =====================================================

function animate() {

    requestAnimationFrame(
        animate
    );

    updateMovement();

    updateEnemies();

    renderer.render(
        scene,
        camera
    );
}

animate();