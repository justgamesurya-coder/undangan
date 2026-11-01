/**
 * ============================================================================
 * THREE.JS 3D SCENE - LUXURY DARK FLORAL & GOLDEN WEDDING
 * ============================================================================
 * Fitur 3D:
 * 1. Sepasang Cincin Emas 3D (Interlocking Golden Wedding Rings + Sparkling Diamond)
 * 2. Kelopak Bunga Mawar 3D Melayang & Jatuh Alami (Falling Floral Petals)
 * 3. Partikel Cahaya Emas & Kunang-kunang 3D (Golden Bokeh Stars & Fireflies)
 * 4. Efek Interaktif Parallax Mouse & Sentuhan Layar Smartphone
 * 5. Efek Scroll Parallax & Celebration Burst saat "Buka Undangan" diklik
 * ============================================================================
 */

(function () {
  'use strict';

  if (typeof THREE === 'undefined') {
    console.warn('Three.js belum dimuat. Menunggu library siap...');
    return;
  }

  let scene, camera, renderer;
  let ringsGroup, ring1, ring2, diamond;
  let petals = [];
  let starParticles;
  let pointLight, mouseLight;

  let mouseX = 0, mouseY = 0;
  let targetX = 0, targetY = 0;
  let windowHalfX = window.innerWidth / 2;
  let windowHalfY = window.innerHeight / 2;
  let scrollY = 0;

  // Material Emas & Permata
  const goldMaterial = new THREE.MeshStandardMaterial({
    color: 0xd4af37, // Royal Champagne Gold
    metalness: 0.92,
    roughness: 0.20,
    envMapIntensity: 1.6
  });

  const goldTrimMaterial = new THREE.MeshStandardMaterial({
    color: 0xfcedb3,
    metalness: 0.96,
    roughness: 0.12
  });

  const diamondMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.05,
    roughness: 0.05,
    transmission: 0.95,
    thickness: 1.5,
    reflectivity: 0.9,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1
  });

  // Material Kelopak Bunga Mawar & Sakura
  const petalColors = [0xb8860b, 0xc5a059, 0xd4af37, 0xe2c275, 0xffe6aa];
  const petalMaterials = petalColors.map(c => new THREE.MeshStandardMaterial({
    color: c,
    roughness: 0.55,
    metalness: 0.15,
    side: THREE.DoubleSide
  }));

  function init() {
    const canvas = document.getElementById('canvas3d');
    if (!canvas) return;

    // 1. Scene & Camera
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 18;

    // 2. WebGL Renderer
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    // 3. Pencahayaan (Lighting)
    setupLighting();

    // 4. Buat Cincin Kawin 3D Emas & Berlian
    createWeddingRings();

    // 5. Buat Kelopak Bunga Emas Melayang 3D
    createPetals(45);

    // 6. Buat Partikel Debu Emas Berkilau (Golden Fireflies)
    createGoldDust(240);

    // 7. Event Listeners
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });

    // Hook ke tombol Buka Undangan
    const btnOpen = document.getElementById('btnOpenInvitation');
    if (btnOpen) {
      btnOpen.addEventListener('click', triggerCelebrationBurst);
    }

    animate();
  }

  function setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xfff6ea, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffe299, 1.8);
    dirLight1.position.set(10, 20, 15);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xa58d63, 0.9);
    dirLight2.position.set(-10, -10, -10);
    scene.add(dirLight2);

    mouseLight = new THREE.PointLight(0xffdf88, 2.5, 30);
    mouseLight.position.set(0, 0, 10);
    scene.add(mouseLight);
  }

  /**
   * Membuat Sepasang Cincin Emas 3D yang Saling Terkait (Interlocking Rings)
   */
  function createWeddingRings() {
    ringsGroup = new THREE.Group();

    // Cincin Pria
    const ringGeo1 = new THREE.TorusGeometry(1.6, 0.22, 32, 64);
    ring1 = new THREE.Mesh(ringGeo1, goldMaterial);
    ring1.rotation.x = Math.PI / 3;
    ring1.rotation.y = Math.PI / 6;
    ring1.position.set(-0.7, 0, 0);
    ringsGroup.add(ring1);

    // Cincin Wanita (dengan Permata Berlian di atasnya)
    const ringGeo2 = new THREE.TorusGeometry(1.45, 0.2, 32, 64);
    ring2 = new THREE.Mesh(ringGeo2, goldMaterial);
    ring2.rotation.x = -Math.PI / 3.5;
    ring2.rotation.y = -Math.PI / 5;
    ring2.position.set(0.7, 0.2, 0);

    // Permata Berlian (Diamond)
    const diamondGeo = new THREE.OctahedronGeometry(0.38, 2);
    diamond = new THREE.Mesh(diamondGeo, diamondMaterial);
    diamond.position.set(0, 1.55, 0);
    diamond.scale.set(1, 1.35, 1);
    ring2.add(diamond);

    ringsGroup.add(ring2);

    // Posisi awal di area atas
    ringsGroup.position.set(0, 3.6, 2);
    scene.add(ringsGroup);
  }

  /**
   * Membuat Kelopak Bunga Melayang 3D (3D Falling Petals)
   */
  function createPetals(count) {
    const petalShape = new THREE.Shape();
    petalShape.moveTo(0, 0);
    petalShape.bezierCurveTo(0.3, 0.4, 0.5, 0.9, 0, 1.4);
    petalShape.bezierCurveTo(-0.5, 0.9, -0.3, 0.4, 0, 0);

    const extrudeSettings = {
      depth: 0.03,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.02,
      bevelThickness: 0.02
    };

    const petalGeo = new THREE.ExtrudeGeometry(petalShape, extrudeSettings);
    petalGeo.center();

    for (let i = 0; i < count; i++) {
      const mat = petalMaterials[Math.floor(Math.random() * petalMaterials.length)];
      const mesh = new THREE.Mesh(petalGeo, mat);

      const scale = 0.35 + Math.random() * 0.4;
      mesh.scale.set(scale, scale, scale);

      resetPetal(mesh, true);
      petals.push(mesh);
      scene.add(mesh);
    }
  }

  function resetPetal(mesh, initial = false) {
    mesh.position.x = (Math.random() - 0.5) * 26;
    mesh.position.y = initial ? (Math.random() - 0.5) * 26 : 14 + Math.random() * 4;
    mesh.position.z = -5 + Math.random() * 18;

    mesh.rotation.x = Math.random() * Math.PI * 2;
    mesh.rotation.y = Math.random() * Math.PI * 2;
    mesh.rotation.z = Math.random() * Math.PI * 2;

    mesh.userData = {
      speedY: 0.02 + Math.random() * 0.03,
      speedX: (Math.random() - 0.5) * 0.015,
      speedZ: (Math.random() - 0.5) * 0.01,
      rotSpeedX: (Math.random() - 0.5) * 0.025,
      rotSpeedY: (Math.random() - 0.5) * 0.025,
      rotSpeedZ: (Math.random() - 0.5) * 0.02,
      swayOffset: Math.random() * Math.PI * 2
    };
  }

  /**
   * Membuat Partikel Emas Berkilau (Golden Fireflies / Dust)
   */
  function createGoldDust(count) {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 35;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 35;
      positions[i * 3 + 2] = -8 + Math.random() * 22;
      scales[i] = Math.random();
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

    const pCanvas = document.createElement('canvas');
    pCanvas.width = 32;
    pCanvas.height = 32;
    const ctx = pCanvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255, 240, 180, 1)');
    grad.addColorStop(0.4, 'rgba(212, 175, 55, 0.7)');
    grad.addColorStop(1, 'rgba(212, 175, 55, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);

    const texture = new THREE.CanvasTexture(pCanvas);

    const mat = new THREE.PointsMaterial({
      size: 0.38,
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: 0xffd97d
    });

    starParticles = new THREE.Points(geo, mat);
    scene.add(starParticles);
  }

  /**
   * Efek Ledakan Kelopak Bunga (Celebration Burst) saat Buka Undangan
   */
  function triggerCelebrationBurst() {
    for (let i = 0; i < 30; i++) {
      if (petals[i]) {
        petals[i].position.set(0, 2, 8);
        const angle = Math.random() * Math.PI * 2;
        const force = 0.15 + Math.random() * 0.25;
        petals[i].userData.speedX = Math.cos(angle) * force;
        petals[i].userData.speedY = (Math.sin(angle) * force) + 0.08;
        petals[i].userData.speedZ = (Math.random() - 0.5) * 0.2;
      }
    }

    if (ringsGroup) {
      ringsGroup.scale.set(0.9, 0.9, 0.9);
    }
  }

  function onWindowResize() {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function onMouseMove(event) {
    mouseX = (event.clientX - windowHalfX) * 0.0012;
    mouseY = (event.clientY - windowHalfY) * 0.0012;
  }

  function onTouchMove(event) {
    if (event.touches.length > 0) {
      mouseX = (event.touches[0].clientX - windowHalfX) * 0.0015;
      mouseY = (event.touches[0].clientY - windowHalfY) * 0.0015;
    }
  }

  function onScroll() {
    scrollY = window.pageYOffset || document.documentElement.scrollTop;
  }

  /**
   * Render Loop Animasi 3D (60 FPS)
   */
  function animate() {
    requestAnimationFrame(animate);

    const time = performance.now() * 0.001;

    targetX += (mouseX - targetX) * 0.05;
    targetY += (mouseY - targetY) * 0.05;

    camera.position.x = targetX * 6;
    camera.position.y = -targetY * 5;
    camera.lookAt(0, 0, 0);

    if (mouseLight) {
      mouseLight.position.x = targetX * 14;
      mouseLight.position.y = -targetY * 14;
    }

    // Animasi Cincin Kawin 3D
    if (ringsGroup) {
      ringsGroup.rotation.y = time * 0.35 + (scrollY * 0.002);
      ringsGroup.rotation.x = Math.sin(time * 0.5) * 0.15;
      ringsGroup.rotation.z = Math.cos(time * 0.4) * 0.1;

      if (diamond) {
        diamond.rotation.y = time * 0.8;
      }

      // Parallax scroll halus
      ringsGroup.position.y = 3.6 + Math.sin(time * 0.8) * 0.25 - (scrollY * 0.005);
    }

    // Animasi Kelopak Bunga Melayang
    for (let i = 0; i < petals.length; i++) {
      const p = petals[i];
      const ud = p.userData;

      p.position.y -= ud.speedY;
      p.position.x += ud.speedX + Math.sin(time + ud.swayOffset) * 0.015;
      p.position.z += ud.speedZ;

      p.rotation.x += ud.rotSpeedX;
      p.rotation.y += ud.rotSpeedY;
      p.rotation.z += ud.rotSpeedZ;

      if (p.position.y < -14) {
        resetPetal(p);
      }
    }

    // Animasi Partikel Debu Emas
    if (starParticles) {
      starParticles.rotation.y = time * 0.03;
      starParticles.rotation.x = Math.sin(time * 0.02) * 0.05;
    }

    renderer.render(scene, camera);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
