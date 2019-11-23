//Christina Alexander - CS 435 - Project 7

/* 
This project is a simple, first person 3D maze game.
The game can be played by using the WASD keys and using 
the mouse to look in different directions.
I used textures to build make the sky box, the ground, 
the hedges, etc. I was also able to make the meshes in the
game collide with the camera. 
*/

var camera, scene, renderer, controls;
var objects = [];
var raycaster;
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var canJump = false;
var prevTime = performance.now();
var velocity = new THREE.Vector3();
var direction = new THREE.Vector3();
var vertex = new THREE.Vector3();
var color = new THREE.Color();

init();
maze();
animate();

function init() {
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 5000);
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.background.autoUpdate = true;


    var light = new THREE.PointLight(0xf7dc6f, 1,500);
    light.position.set(-200, 200, 200);
    scene.add(light);

    var light = new THREE.HemisphereLight(0xffffff, 0xffffff,.5);
    scene.add(light);

    controls = new THREE.PointerLockControls(camera);
  
    var blocker = document.getElementById('blocker');
    var instructions = document.getElementById('instructions');
    instructions.addEventListener('click', function () {
        controls.lock();
    }, false);
    controls.addEventListener('lock', function () {
        instructions.style.display = 'none';
        blocker.style.display = 'none';
    });
    controls.addEventListener('unlock', function () {
        blocker.style.display = 'block';
        instructions.style.display = '';
    });
    scene.add(controls.getObject());
    var onKeyDown = function (event) {
        switch (event.keyCode) {
            case 38: // up
            case 87: // w
                moveForward = true;
                break;
            case 37: // left
            case 65: // a
                moveLeft = true;
                break;
            case 40: // down
            case 83: // s
                moveBackward = true;
                break;
            case 39: // right
            case 68: // d
                moveRight = true;
                break;
            case 32: // space
                if (canJump === true) velocity.y += 350;
                canJump = false;
                break;
        }
    };
    var onKeyUp = function (event) {
        switch (event.keyCode) {
            case 38: // up
            case 87: // w
                moveForward = false;
                break;
            case 37: // left
            case 65: // a
                moveLeft = false;
                break;
            case 40: // down
            case 83: // s
                moveBackward = false;
                break;
            case 39: // right
            case 68: // d
                moveRight = false;
                break;
        }
    };
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);
    raycaster = new THREE.Raycaster();

    var skyBox = new THREE.CubeGeometry(600, 600, 600);
    var cubeMats = [
        new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load("hills_ft.png"), side: THREE.DoubleSide }),
        new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load("hills_bk.png"), side: THREE.DoubleSide }),
        new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load("hills_up.png"), side: THREE.DoubleSide }),
        new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load("hills_dn.png"), side: THREE.DoubleSide }),
        new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load("hills_rt.png"), side: THREE.DoubleSide }),
        new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load("hills_lf.png"), side: THREE.DoubleSide }),
    ];

    var cubeMaterial = new THREE.MeshFaceMaterial(cubeMats);
    var cube = new THREE.Mesh(skyBox, cubeMaterial);
    cube.position.set(0,100,0);
    scene.add(cube);

    // floor
    var floorGeometry = new THREE.PlaneBufferGeometry(550, 1000, 100, 100);
    floorGeometry.rotateX(- Math.PI / 2);
    var texture = new THREE.TextureLoader().load("groundDiffuse.jpg");
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.offset.set(0, 0);
    texture.repeat.set(100, 100);

    var texture2 = new THREE.TextureLoader().load("groundNorm.jpg");
    texture2.wrapS = THREE.RepeatWrapping;
    texture2.wrapT = THREE.RepeatWrapping;
    texture2.offset.set(0, 0);
    texture2.repeat.set(100, 100);
    var texture3 = new THREE.TextureLoader().load("groundSpecular.jpg");
    texture3.wrapS = THREE.RepeatWrapping;
    texture3.wrapT = THREE.RepeatWrapping;
    texture3.offset.set(0, 0);
    texture3.repeat.set(100, 100);

    var floorMaterial = new THREE.MeshPhongMaterial({
        color: 0xdddddd,
		specular: 0xffffff,
        map: texture,
        normalMap: texture2,
        bumpMap: texture3,
        specularMap: texture3,
        shininess: 25,
    });

    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    scene.add(floor);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    //
    window.addEventListener('resize', onWindowResize, false);
}


function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

//AABB Checking


function animate() {
    requestAnimationFrame(animate);
    if (controls.isLocked === true) {


        var time = performance.now();
        // Create a delta value based on current time
        var delta = (time - prevTime) / 1000;

        // Set the velocity.x and velocity.z using the calculated time delta

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveLeft) - Number(moveRight);
        direction.normalize(); // this ensures consistent movements in all directions
        

        if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;


        var cameraDirection = controls.getDirection(new THREE.Vector3(0, 0, 0)).clone();
        
        if(!(moveForward || moveBackward) && (moveLeft || moveRight)){
            cameraDirection.add(direction);
            cameraDirection.normalize();
        }
        
        var ray = new THREE.Raycaster(controls.getObject().position, cameraDirection, 0, 10);
        raycaster.ray.origin.copy( controls.getObject().position );
        raycaster.ray.origin.y -= 10;
        raycaster.ray.origin.x += velocity.x * delta;
        raycaster.ray.origin.z += velocity.z * delta;
        var intersects = ray.intersectObjects(objects, true);

        if (intersects.length == 0)
        {
            controls.getObject().translateX(velocity.x * delta);
            controls.getObject().translateZ(velocity.z * delta);
        }
        // Prevent the camera/player from falling out of the 'world'
        if (controls.getObject().position.y < 10) {
            velocity.y = 0;
            controls.getObject().position.y = 10;
        }

        // Save the time for future delta calculations
        prevTime = time;
    }
    renderer.render(scene, camera);
}

function maze() {

    var finishPoint = new THREE.BoxBufferGeometry(4, 300, 4);
    var finishMaterial = new THREE.MeshPhongMaterial(
        {
            color: 0xFF0000,
            shininess: 25
        });

    var finishMesh = new THREE.Mesh(finishPoint, finishMaterial);
    finishMesh.position.set(0, 0, 30);
    scene.add(finishMesh);
    var hedge = new THREE.BoxBufferGeometry(500, 50, 10, 20, 20);
    //hedge.translate(-5,0,0);

    var hedgeTex = new THREE.TextureLoader().load("bushTex.jpg");
    hedgeTex.wrapS = THREE.RepeatWrapping;
    hedgeTex.wrapT = THREE.RepeatWrapping;
    hedgeTex.offset.set(0, 0);
    hedgeTex.repeat.set(100, 10);

    var specMap = new THREE.TextureLoader().load("bushSpec.jpg");
    specMap.wrapS = THREE.RepeatWrapping;
    specMap.wrapT = THREE.RepeatWrapping;
    specMap.offset.set(0, 0);
    specMap.repeat.set(100, 10);

    var hedgeMaterial = new THREE.MeshPhongMaterial({
        map: hedgeTex,
        specular: 0xffffff,
        shininess: 10,
    });
    //back wall
    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(0, 0, -250);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);
    //far wall
    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(0, 0, 250);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    //right wall
    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(250, 0, 0);
    hedgeMesh.rotateY(Math.PI / 2);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    //left wall
    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(-250, 0, 0);
    hedgeMesh.rotateY(Math.PI / 2);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedge = new THREE.BoxBufferGeometry(30, 50, 10, 20, 20);
    hedgeTex.repeat.set(3, 10);
    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(137.5, 0, 100);
    hedgeMesh.rotateY(Math.PI / 2);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(140, 0, -195);
    hedgeMesh.rotateY(Math.PI / 2);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(30, 0, -240);
    hedgeMesh.rotateY(Math.PI / 2);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(230, 0, 12.5);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(-80, 0, 85);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(120, 0, -195);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedge = new THREE.BoxBufferGeometry(45, 50, 10, 20, 20);
    hedgeTex.repeat.set(4.5, 10);
    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(65, 0, -102.5);
    hedgeMesh.rotateY(Math.PI / 2);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(162, 0, -117.5);
    hedgeMesh.rotateY(Math.PI / 2);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(130, 0, -167.5);
    hedgeMesh.rotateY(Math.PI / 2);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedge = new THREE.BoxBufferGeometry(50, 50, 10, 20, 20);
    hedgeTex.repeat.set(5, 10);
    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(0, 0, 10);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(-130, 0, -185);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(-50, 0, -55);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(117.5, 0, 115);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(90, 0, 180);
    hedgeMesh.rotateY(Math.PI / 2);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(120, 0, 160);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(97, 0, -65);
    hedgeMesh.rotateY(Math.PI / 2);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(-125, 0, -115);
    hedgeMesh.rotateY(Math.PI / 2);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(65, 0, -35);
    hedgeMesh.rotateY(Math.PI / 2);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(130, 0, -120);
    hedgeMesh.rotateY(Math.PI / 2);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedge = new THREE.BoxBufferGeometry(65, 50, 10, 20, 20);
    hedgeTex.repeat.set(6.5, 10);
    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(-100, 0, -212.5);
    hedgeMesh.rotateY(Math.PI / 2);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(-160, 0, -212.5);
    hedgeMesh.rotateY(Math.PI / 2);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(215, 0, -25);
    hedgeMesh.rotateY(Math.PI / 2);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedge = new THREE.BoxBufferGeometry(75, 50, 10, 20, 20);
    hedgeTex.repeat.set(7.5, 10);
    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(65, 0, -10);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(172.5, 0, -52.5);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(172.5, 0, -180);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(172.5, 0, -215);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);


    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(-92.5, 0, -85);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(-90, 0, 127.5);
    hedgeMesh.rotateY(Math.PI / 2);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(-160, 0, -135);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(-130, 0, 127.5);
    hedgeMesh.rotateY(Math.PI / 2);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(-170, 0, 210);
    hedgeMesh.rotateY(Math.PI / 2);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(-210, 0, 172.5);
    hedgeMesh.rotateY(Math.PI / 2);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(-170, 0, 140);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(65, 0, 74);
    hedgeMesh.rotateY(Math.PI / 2);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(130, 0, 200);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(65, 0, 74);
    hedgeMesh.rotateY(Math.PI / 2);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(65, 0, -120);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(130, 0, -20);
    hedgeMesh.rotateY(Math.PI / 2);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(140, 0, 50);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(170, 0, 12.5);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(129.5, 0, -90);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(90, 0, -150);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedge = new THREE.BoxBufferGeometry(100, 50, 10, 20, 20);
    hedgeTex.repeat.set(10, 10);
    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(-70, 0, 32.5);
    hedgeMesh.rotateY(Math.PI / 2);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(210, 0, -135);
    hedgeMesh.rotateY(Math.PI / 2);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(70, 0, -195);
    hedgeMesh.rotateY(Math.PI / 2);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedge = new THREE.BoxBufferGeometry(126, 50, 10, 20, 20);
    hedgeTex.repeat.set(12.6, 10);
    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(7, 0, 115);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(97.5, 0, 50);
    hedgeMesh.rotateY(Math.PI / 2);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(0, 0, -85);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(-190, 0, 95);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(-137.5, 0, -55);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(-35, 0, -120);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(-32, 0, -185);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(-32, 0, -230);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(-32, 0, -240);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedge = new THREE.BoxBufferGeometry(150, 50, 10, 20, 20);
    hedgeTex.repeat.set(15, 10);
    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(25, 0, 15);
    hedgeMesh.rotateY(Math.PI / 2);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(-22, 0, -150);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(-140, 0, -12.5);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(-200, 0, -125);
    hedgeMesh.rotateY(Math.PI / 2);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(-180, 0, 45);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(210, 0, 82.5);
    hedgeMesh.rotateY(Math.PI / 2);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(172.5, 0, 130);
    hedgeMesh.rotateY(Math.PI / 2);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);


    var hedge = new THREE.BoxBufferGeometry(170, 50, 10, 20, 20);
    hedgeTex.repeat.set(17, 10);
    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(-25, 0, 25);
    hedgeMesh.rotateY(Math.PI / 2);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(0, 0, 160);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    var hedge = new THREE.BoxBufferGeometry(220, 50, 10, 20, 20);
    hedgeTex.repeat.set(22, 10);
    var hedgeMesh = new THREE.Mesh(hedge, hedgeMaterial);
    hedgeMesh.position.set(-25, 0, 200);
    hedgeMesh.updateMatrix();
    objects.push(hedgeMesh);

    for (var i = 0; i < objects.length; i++){
        objects[i].castShadow = true;
        objects[i].recieveShadow = true;
        scene.add(objects[i]);
    }
}