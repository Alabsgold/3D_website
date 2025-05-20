// Main Three.js scene setup
let scene, camera, renderer, controls;
let model; // For our 3D model
let isMobile = window.innerWidth < 768;

// Initialize the scene
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    
    // Add some ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);
    
    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    // Create camera
    camera = new THREE.PerspectiveCamera(
        75, 
        window.innerWidth / window.innerHeight, 
        0.1, 
        1000
    );
    camera.position.z = isMobile ? 15 : 10;
    
    // Create renderer
    const canvas = document.querySelector('#bg');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Add orbit controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    
    // Add stars background
    addStars();
    
    // Load 3D model
    loadModel();
    
    // Add floating coins
    if (!isMobile) {
        addFloatingCoins(20);
    }
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
    
    // Start animation loop
    animate();
}

// Add stars to the background
function addStars() {
    const starsGeometry = new THREE.BufferGeometry();
    const starCount = 5000;
    
    const positions = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount * 3; i++) {
        positions[i] = (Math.random() - 0.5) * 2000;
    }
    
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 1,
        transparent: true,
        opacity: 0.8
    });
    
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
}

// Load 3D model from GLB file
function loadModel() {
    const modelViewer = document.getElementById('model-viewer');
    const modelScene = new THREE.Scene();
    const modelCamera = new THREE.PerspectiveCamera(
        75, 
        modelViewer.clientWidth / modelViewer.clientHeight, 
        0.1, 
        1000
    );
    
    const modelRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    modelRenderer.setSize(modelViewer.clientWidth, modelViewer.clientHeight);
    modelRenderer.setClearColor(0x000000, 0);
    modelViewer.appendChild(modelRenderer.domElement);
    
    // Add lights to model viewer
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    modelScene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    modelScene.add(directionalLight);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 5, 5);
    scene.add(light);
    
    // Load GLB model
    const loader = new THREE.GLTFLoader();
    
    // Replace this path with your own model in /assets/models folder
    loader.load(
        'assets/models/bitcoin.glb', 
        function (gltf) {
            model = gltf.scene;
            modelScene.add(model);
            
            // Center and scale the model
            const box = new THREE.Box3().expandByObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            
            model.position.x += (model.position.x - center.x);
            model.position.y += (model.position.y - center.y);
            model.position.z += (model.position.z - center.z);
            
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 5 / maxDim;
            model.scale.set(scale, scale, scale);
            
            modelCamera.position.z = 6;
            
            // Animation loop for model viewer
            function animateModel() {
                requestAnimationFrame(animateModel);
                
                if (model) {
                    model.rotation.y += 0.005;
                }
                
                modelRenderer.render(modelScene, modelCamera);
            }
            
            animateModel();
        },
        undefined, 
        function (error) {
            console.error('Error loading model:', error);
            modelViewer.innerHTML = '<p class="error">Failed to load 3D model. Please check console for details.</p>';
        }
    );
    
    // Handle model viewer resize
    window.addEventListener('resize', function() {
        modelCamera.aspect = modelViewer.clientWidth / modelViewer.clientHeight;
        modelCamera.updateProjectionMatrix();
        modelRenderer.setSize(modelViewer.clientWidth, modelViewer.clientHeight);
    });
}

// Add floating coins around the scene
function addFloatingCoins(count) {
    const geometry = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 32);
    const material = new THREE.MeshPhongMaterial({ 
        color: 0xf7931a,
        specular: 0x111111,
        shininess: 30
    });
    
    for (let i = 0; i < count; i++) {
        const coin = new THREE.Mesh(geometry, material);
        
        // Random position in a sphere
        const radius = 15 + Math.random() * 10;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        
        coin.position.x = radius * Math.sin(phi) * Math.cos(theta);
        coin.position.y = radius * Math.sin(phi) * Math.sin(theta);
        coin.position.z = radius * Math.cos(phi);
        
        // Random rotation
        coin.rotation.x = Math.random() * Math.PI;
        coin.rotation.z = Math.random() * Math.PI;
        
        // Add to scene
        scene.add(coin);
        
        // Add animation properties
        coin.userData = {
            speed: 0.01 + Math.random() * 0.02,
            direction: new THREE.Vector3(
                Math.random() - 0.5,
                Math.random() - 0.5,
                Math.random() - 0.5
            ).normalize()
        };
    }
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Rotate floating coins
    scene.children.forEach(child => {
        if (child.userData && child.userData.speed) {
            child.position.x += child.userData.direction.x * child.userData.speed;
            child.position.y += child.userData.direction.y * child.userData.speed;
            child.position.z += child.userData.direction.z * child.userData.speed;
            
            // Bounce off imaginary walls
            const limit = 25;
            if (Math.abs(child.position.x) > limit) child.userData.direction.x *= -1;
            if (Math.abs(child.position.y) > limit) child.userData.direction.y *= -1;
            if (Math.abs(child.position.z) > limit) child.userData.direction.z *= -1;
            
            child.rotation.y += 0.01;
        }
    });
    
    controls.update();
    renderer.render(scene, camera);
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    isMobile = window.innerWidth < 768;
}

// Start the application
init();