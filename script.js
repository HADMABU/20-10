/**
 * Botanical Flower Blooming 3D - Three.js Cinematic Experience
 * Updates:
 * 1. Flowers ALWAYS face OUTWARD away from the tree trunk (never facing inward or perpendicular to branches).
 * 2. Alignment uses true front face normal (Vector3(0, 0, 1)) to outward direction.
 * 3. Reduced petal transparency (solid, rich, opaque with depthWrite).
 * 4. Flower sizes: exactly x/4 large (100%), x/2 medium (50%), and x/4 small (30%), randomly distributed.
 * 5. Rich color palette with vibrant reds and radiant golden yellows.
 * 6. Slender stems (thickness reduced by 50%).
 * 7. Default audio enabled with seamless autoplay & interaction auto-unlock.
 * 8. Strict 5-second Y-axis rotation (2*PI/5 rad/s).
 * 9. Tree fade out & screen blossom blanket effect.
 */

(() => {
  'use strict';

  // ==========================================================================
  // COLOR PALETTE (Vibrant Botanical Palette with Reds & Golden Yellows)
  // ==========================================================================
  const PALETTE = {
    bgDeep: '#081a1b',
    bgMid: '#0f2e2f',
    bgGlow: '#194646',
    stem: '#8fa685',
    pedicel: '#cbd9c3',
    stamen: '#e59b56',
    stamenTip: '#ffeaa7',
    sparkle: '#ffeaa7',
    petals: [
      '#e63946', // Vibrant crimson red
      '#ffbe0b', // Radiant golden sunflower yellow
      '#d62828', // Deep scarlet ruby red
      '#ffd166', // Bright sunny warm yellow
      '#f7b297', // Warm coral peach
      '#e52b50', // Passionate rose red
      '#f9a03f', // Golden amber yellow
      '#f8a5c2', // Sakura blossom pink
      '#f5e2cc', // Soft buttercup cream
      '#ffca3a'  // Dandelion yellow
    ]
  };

  // Timeline configuration (in seconds)
  const ROTATION_PERIOD = 5.0; // Fixed 1 full revolution every 5 seconds
  const ANGULAR_VELOCITY = (Math.PI * 2) / ROTATION_PERIOD; // 2*PI/5 rad/s

  const FULL_BLOOM_TIME = 6.6;    // All flowers on tree are fully open
  const STEM_FADE_START = 7.0;    // Main tree stem starts fading out
  const STEM_FADE_END = 8.4;      // Main tree completely invisible
  const LOOP_RESTART_TIME = 16.5; // Holds full screen blanket then smoothly loops

  // DOM Elements
  const canvas = document.getElementById('bloomCanvas');
  const romanticHeader = document.getElementById('romanticHeader');
  const audioBtn = document.getElementById('audioBtn');
  const iconSoundOn = document.getElementById('iconSoundOn');
  const iconSoundOff = document.getElementById('iconSoundOff');
  const hintOverlay = document.getElementById('hintOverlay');

  // ==========================================================================
  // WEB AUDIO BACKGROUND MUSIC & CHIMES (Default: ON)
  // ==========================================================================
  let audioCtx = null;
  let masterGain = null;
  let isAudioEnabled = true;

  const CHORDS = [
    [261.63, 329.63, 392.00, 493.88, 587.33], // Cmaj9
    [220.00, 261.63, 329.63, 392.00, 493.88], // Am9
    [174.61, 220.00, 261.63, 329.63, 392.00], // Fmaj7
    [196.00, 246.94, 293.66, 392.00, 440.00]  // Gsus4 -> G
  ];
  let chordIdx = 0;
  let lastChordTime = -10;
  let lastBlanketChimeTime = 0;

  function initAudio() {
    if (audioCtx) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();
      masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(0.32, audioCtx.currentTime);
      masterGain.connect(audioCtx.destination);
    } catch (e) {
      console.warn('AudioContext not supported:', e);
    }
  }

  function playNote(freq, delay = 0, duration = 3.2, gainScale = 1.0) {
    if (!audioCtx || !isAudioEnabled) return;
    const now = audioCtx.currentTime + delay;

    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const noteGain = audioCtx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 1.002, now);

    noteGain.gain.setValueAtTime(0.0001, now);
    noteGain.gain.exponentialRampToValueAtTime(0.18 * gainScale, now + 0.04);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc1.connect(noteGain);
    osc2.connect(noteGain);
    noteGain.connect(masterGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration + 0.1);
    osc2.stop(now + duration + 0.1);
  }

  function playBloomChime() {
    if (!audioCtx || !isAudioEnabled) return;
    const chimePitches = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
    const pitch = chimePitches[Math.floor(Math.random() * chimePitches.length)];
    playNote(pitch, 0, 3.4, 0.9);
  }

  function tickHarmonicMusic(time) {
    if (!audioCtx || !isAudioEnabled) return;

    if (time - lastChordTime > 2.6) {
      lastChordTime = time;
      const notes = CHORDS[chordIdx % CHORDS.length];
      chordIdx++;
      notes.forEach((f, idx) => {
        playNote(f, idx * 0.14, 3.4, 0.85);
      });
    }

    if (time >= STEM_FADE_START && time - lastBlanketChimeTime > 2.0) {
      lastBlanketChimeTime = time;
      if (Math.random() < 0.65) {
        playBloomChime();
      }
    }
  }

  function toggleAudio() {
    initAudio();
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    isAudioEnabled = !isAudioEnabled;
    if (isAudioEnabled) {
      iconSoundOn.classList.remove('hidden');
      iconSoundOff.classList.add('hidden');
      CHORDS[0].forEach((f, i) => playNote(f, i * 0.14, 3.0));
    } else {
      iconSoundOn.classList.add('hidden');
      iconSoundOff.classList.remove('hidden');
    }
  }

  function setupAutoAudio() {
    initAudio();
    if (audioCtx) {
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      CHORDS[0].forEach((f, i) => playNote(f, i * 0.14, 3.2));
    }

    const unlock = () => {
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      ['click', 'touchstart', 'pointerdown', 'keydown', 'scroll', 'mousemove'].forEach(evt => {
        window.removeEventListener(evt, unlock);
      });
    };
    ['click', 'touchstart', 'pointerdown', 'keydown', 'scroll', 'mousemove'].forEach(evt => {
      window.addEventListener(evt, unlock, { passive: true });
    });
  }

  // ==========================================================================
  // HELPER: SHUFFLED SIZE TIERS (x/4 Large: 100%, x/2 Medium: 50%, x/4 Small: 30%)
  // ==========================================================================
  function generateShuffledSizeTiers(totalCount) {
    const countLarge = Math.round(totalCount * 0.25);
    const countSmall = Math.round(totalCount * 0.25);
    const countMedium = totalCount - countLarge - countSmall;

    const tiers = [];
    for (let i = 0; i < countLarge; i++) tiers.push(1.0);  // 100% size
    for (let i = 0; i < countMedium; i++) tiers.push(0.5); // 50% size
    for (let i = 0; i < countSmall; i++) tiers.push(0.3);  // 30% size

    for (let i = tiers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = tiers[i];
      tiers[i] = tiers[j];
      tiers[j] = temp;
    }
    return tiers;
  }

  // ==========================================================================
  // THREE.JS SETUP & PROCEDURAL TEXTURES (Solid, Rich, Opaque Petals)
  // ==========================================================================
  let scene, camera, renderer;
  let treeGroup, blossomSwarmGroup, atmosphereGroup;
  let petalGeometry;
  let treePetalMaterials = [];
  let swarmPetalMaterials = [];
  let stemMaterial;

  let animTime = 0;
  let lastTimestamp = 0;
  let isPlaying = true;

  let trunkData = null;
  const branchesData = [];
  const treeFlowers = [];
  const swarmFlowers = [];
  const swarmPetals = [];
  const starsList = [];
  const firefliesList = [];
  const sparkMeshList = [];

  function createPetalTexture(colorHex) {
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 256;
    pCanvas.height = 512;
    const pCtx = pCanvas.getContext('2d');

    // SOLID, OPAQUE WATERCOLOR GRADIENT (100% solid, non-transparent edges)
    const grad = pCtx.createRadialGradient(128, 430, 15, 128, 250, 240);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.2, '#fff6ed');
    grad.addColorStop(0.5, colorHex);
    grad.addColorStop(0.85, colorHex);
    grad.addColorStop(1.0, colorHex);

    pCtx.fillStyle = grad;
    pCtx.fillRect(0, 0, 256, 512);

    // Delicate petal veins
    pCtx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    pCtx.lineWidth = 2.8;
    pCtx.beginPath();
    pCtx.moveTo(128, 500);
    pCtx.quadraticCurveTo(128, 250, 128, 50);
    pCtx.stroke();

    pCtx.lineWidth = 1.4;
    pCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    for (let y = 140; y < 450; y += 45) {
      pCtx.beginPath();
      pCtx.moveTo(128, y);
      pCtx.quadraticCurveTo(80, y - 35, 45, y - 55);
      pCtx.moveTo(128, y);
      pCtx.quadraticCurveTo(176, y - 35, 211, y - 55);
      pCtx.stroke();
    }

    const tex = new THREE.CanvasTexture(pCanvas);
    tex.generateMipmaps = true;
    return tex;
  }

  function createPetalGeometry() {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(-0.38, 0.35, -0.62, 1.05, -0.28, 1.55);
    shape.bezierCurveTo(-0.12, 1.7, 0, 1.62, 0, 1.58);
    shape.bezierCurveTo(0, 1.62, 0.12, 1.7, 0.28, 1.55);
    shape.bezierCurveTo(0.62, 1.05, 0.38, 0.35, 0, 0);

    const geo = new THREE.ShapeGeometry(shape, 14);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const normY = y / 1.6;
      const z = -Math.sin(normY * Math.PI) * 0.24 - (x * x) * 0.35;
      pos.setZ(i, z);
    }
    geo.computeVertexNormals();
    return geo;
  }

  function createTaperedTubeGeometry(curve, numSegments, baseRadius, tipRadius, radialSegments, maxU) {
    const clampedU = Math.max(0.01, Math.min(1.0, maxU));
    const points = [];
    const radii = [];
    for (let i = 0; i <= numSegments; i++) {
      const u = (i / numSegments) * clampedU;
      points.push(curve.getPoint(u));
      radii.push(baseRadius + (tipRadius - baseRadius) * u);
    }

    const positions = [];
    const normals = [];
    const uvs = [];
    const indices = [];

    for (let i = 0; i <= numSegments; i++) {
      const pt = points[i];
      const r = radii[i];
      const uNorm = i / numSegments;

      const nextPt = i < numSegments ? points[i + 1] : points[i];
      const prevPt = i > 0 ? points[i - 1] : points[i];
      const tangent = new THREE.Vector3().subVectors(nextPt, prevPt).normalize();
      if (tangent.lengthSq() < 0.0001) tangent.set(0, 1, 0);

      let perp = new THREE.Vector3(0, 0, 1);
      if (Math.abs(tangent.z) > 0.88) perp.set(1, 0, 0);
      const normVec = new THREE.Vector3().crossVectors(tangent, perp).normalize();
      const binormVec = new THREE.Vector3().crossVectors(tangent, normVec).normalize();

      for (let j = 0; j <= radialSegments; j++) {
        const theta = (j / radialSegments) * Math.PI * 2;
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);

        const nx = normVec.x * cosT + binormVec.x * sinT;
        const ny = normVec.y * cosT + binormVec.y * sinT;
        const nz = normVec.z * cosT + binormVec.z * sinT;

        positions.push(pt.x + nx * r, pt.y + ny * r, pt.z + nz * r);
        normals.push(nx, ny, nz);
        uvs.push(j / radialSegments, uNorm);
      }
    }

    for (let i = 0; i < numSegments; i++) {
      for (let j = 0; j < radialSegments; j++) {
        const a = i * (radialSegments + 1) + j;
        const b = (i + 1) * (radialSegments + 1) + j;
        const c = (i + 1) * (radialSegments + 1) + (j + 1);
        const d = i * (radialSegments + 1) + (j + 1);

        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    return geo;
  }

  // ==========================================================================
  // 3D FLOWER CREATION
  // Front face of flower is along Vector3(0, 0, 1)!
  // ==========================================================================
  function createFlowerInstance(materialsArray, colorIdx, baseScale = 0.85) {
    const group = new THREE.Group();
    const petals = [];
    const petalCount = 5;
    const mat = materialsArray[colorIdx % materialsArray.length];

    for (let i = 0; i < petalCount; i++) {
      const pivot = new THREE.Group();
      pivot.rotation.z = (i * 2 * Math.PI) / petalCount;

      const pMesh = new THREE.Mesh(petalGeometry, mat);
      pMesh.scale.set(0.001, 0.001, 0.001);
      pivot.add(pMesh);

      group.add(pivot);
      petals.push(pMesh);
    }

    // Stamen center
    const centerGeo = new THREE.SphereGeometry(0.24, 12, 10);
    const centerMat = new THREE.MeshStandardMaterial({
      color: 0xe59b56,
      roughness: 0.35,
      metalness: 0.1,
      emissive: 0x552800,
      transparent: true,
      depthWrite: true
    });
    const centerMesh = new THREE.Mesh(centerGeo, centerMat);
    centerMesh.scale.set(0.001, 0.001, 0.001);
    group.add(centerMesh);

    // Calyx receptacle at back of flower (pointing along -Z)
    const calyxGeo = new THREE.ConeGeometry(0.22, 0.28, 6);
    const calyxMat = new THREE.MeshStandardMaterial({
      color: 0x768f6d,
      roughness: 0.5,
      metalness: 0.05,
      transparent: true,
      depthWrite: true
    });
    const calyxMesh = new THREE.Mesh(calyxGeo, calyxMat);
    calyxMesh.position.set(0, 0, -0.15);
    calyxMesh.rotation.x = -Math.PI / 2;
    group.add(calyxMesh);

    return { group, petals, centerMesh, centerMat, calyxMat, baseScale };
  }

  // ==========================================================================
  // BUILD 3D TREE MODEL
  // CRITICAL REQUIREMENT: Flowers ALWAYS face OUTWARD away from the trunk!
  // ==========================================================================
  function buildTreeScene() {
    treeGroup = new THREE.Group();
    scene.add(treeGroup);

    treeFlowers.length = 0;
    branchesData.length = 0;

    // 1. Main Trunk Spline (grows from y=0 to y=7.4)
    const trunkCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.18, 1.8, 0.12),
      new THREE.Vector3(-0.24, 3.8, -0.15),
      new THREE.Vector3(0.2, 5.6, 0.1),
      new THREE.Vector3(0, 7.4, 0)
    ]);

    const trunkMesh = new THREE.Mesh(
      createTaperedTubeGeometry(trunkCurve, 24, 0.16, 0.06, 8, 0.01),
      stemMaterial
    );
    treeGroup.add(trunkMesh);
    trunkData = { curve: trunkCurve, mesh: trunkMesh, growStart: 0.0, growEnd: 2.2, isDone: false };

    // 2. Lateral & Crown Branches (Total 76 flowers)
    const branchConfigs = [
      { attachU: 0.34, tip: new THREE.Vector3(2.4, 4.0, 1.2), growStart: 0.8, growEnd: 2.4, numFlowers: 11 },
      { attachU: 0.48, tip: new THREE.Vector3(-2.2, 5.2, 1.4), growStart: 1.2, growEnd: 2.8, numFlowers: 12 },
      { attachU: 0.62, tip: new THREE.Vector3(1.9, 6.2, -1.8), growStart: 1.6, growEnd: 3.2, numFlowers: 11 },
      { attachU: 0.74, tip: new THREE.Vector3(-1.8, 7.0, -1.3), growStart: 2.0, growEnd: 3.6, numFlowers: 11 },
      { attachU: 0.95, tip: new THREE.Vector3(1.3, 8.4, 0.9), growStart: 2.3, growEnd: 3.9, numFlowers: 10 },
      { attachU: 0.98, tip: new THREE.Vector3(-1.2, 8.6, 0.8), growStart: 2.4, growEnd: 4.0, numFlowers: 10 },
      { attachU: 1.00, tip: new THREE.Vector3(0.2, 9.0, -0.9), growStart: 2.5, growEnd: 4.2, numFlowers: 11 }
    ];

    const totalFlowersCount = branchConfigs.reduce((acc, c) => acc + c.numFlowers, 0); // 76 flowers
    const sizeTiers = generateShuffledSizeTiers(totalFlowersCount);
    let flowerCounter = 0;

    branchConfigs.forEach((cfg, bIdx) => {
      const attachPt = trunkCurve.getPoint(cfg.attachU);
      const midPt = new THREE.Vector3().addVectors(attachPt, cfg.tip).multiplyScalar(0.5);
      midPt.y += 0.35;
      midPt.x += (Math.random() - 0.5) * 0.4;
      midPt.z += (Math.random() - 0.5) * 0.4;

      const curve = new THREE.CatmullRomCurve3([attachPt, midPt, cfg.tip]);
      const mesh = new THREE.Mesh(
        createTaperedTubeGeometry(curve, 16, 0.08, 0.025, 6, 0.01),
        stemMaterial
      );
      mesh.visible = false;
      treeGroup.add(mesh);

      const branchObj = {
        curve,
        mesh,
        growStart: cfg.growStart,
        growEnd: cfg.growEnd,
        isDone: false,
        stalks: []
      };

      const tip = cfg.tip;
      for (let f = 0; f < cfg.numFlowers; f++) {
        const sizeMultiplier = sizeTiers[flowerCounter++];

        // 3D dome distribution around cluster tip
        const theta = (f / cfg.numFlowers) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
        const phi = 0.2 + (Math.random() * 0.9);
        const stalkLen = 0.65 + Math.random() * 0.85;

        const flowerPos = new THREE.Vector3(
          tip.x + Math.sin(phi) * Math.cos(theta) * stalkLen,
          tip.y + Math.cos(phi) * stalkLen + 0.1,
          tip.z + Math.sin(phi) * Math.sin(theta) * stalkLen
        );

        const stalkCurve = new THREE.CatmullRomCurve3([
          tip,
          new THREE.Vector3().lerpVectors(tip, flowerPos, 0.5).add(new THREE.Vector3(
            (Math.random() - 0.5) * 0.08,
            0.06,
            (Math.random() - 0.5) * 0.08
          )),
          flowerPos
        ]);

        const stalkMesh = new THREE.Mesh(
          createTaperedTubeGeometry(stalkCurve, 8, 0.02, 0.01, 5, 0.01),
          stemMaterial
        );
        stalkMesh.visible = false;
        treeGroup.add(stalkMesh);

        branchObj.stalks.push({
          curve: stalkCurve,
          mesh: stalkMesh,
          growStart: cfg.growEnd + (f / cfg.numFlowers) * 0.4,
          growEnd: cfg.growEnd + (f / cfg.numFlowers) * 0.4 + 0.6,
          isDone: false
        });

        // 3D Flower Instance
        const colorIdx = (bIdx * 3 + f) % PALETTE.petals.length;
        const flower = createFlowerInstance(treePetalMaterials, colorIdx, 0.85);
        flower.group.position.copy(flowerPos);

        // ====================================================================
        // CRITICAL REQUIREMENT: ALWAYS FACE OUTWARD AWAY FROM TRUNK!
        // 1. Calculate radial vector pointing outward from the central trunk axis (x=0, z=0)
        // 2. Combine with the branch stalk outward vector
        // 3. Add gentle upward lift (+Y) so flowers face toward the viewer and sky
        // 4. Align the FRONT FACE of the flower (Vector3(0, 0, 1)) directly to outwardDir!
        // ====================================================================
        const trunkToFlowerHoriz = new THREE.Vector3(flowerPos.x, 0, flowerPos.z);
        let radialOutward = new THREE.Vector3(0, 0, 1);
        if (trunkToFlowerHoriz.lengthSq() > 0.001) {
          radialOutward = trunkToFlowerHoriz.normalize();
        }

        const stalkDir = new THREE.Vector3().subVectors(flowerPos, tip).normalize();

        // Strong outward radial component (>= 75%) guarantees it NEVER points inward!
        const outwardDir = new THREE.Vector3(
          radialOutward.x * 0.75 + stalkDir.x * 0.25 + (Math.random() - 0.5) * 0.12,
          Math.max(0.22, stalkDir.y * 0.35 + 0.28 + Math.random() * 0.2),
          radialOutward.z * 0.75 + stalkDir.z * 0.25 + (Math.random() - 0.5) * 0.12
        ).normalize();

        // Align FRONT FACE (0, 0, 1) directly along outwardDir!
        // (This completely eliminates the previous bug where (0, 1, 0) made petals perpendicular!)
        flower.group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), outwardDir);

        // Spin ONLY around local Z (facing normal) so petal alignment varies naturally
        // while the face remains strictly locked pointing outward!
        flower.group.rotateZ(Math.random() * Math.PI * 2);

        flower.group.visible = false;
        treeGroup.add(flower.group);

        const bloomStart = cfg.growEnd + 0.3 + (f / cfg.numFlowers) * 1.5 + Math.random() * 0.4;
        treeFlowers.push({
          instance: flower,
          sizeMultiplier,
          bloomStart,
          bloomDuration: 1.1 + Math.random() * 0.4,
          sparkled: false,
          colorIdx
        });
      }

      branchesData.push(branchObj);
    });
  }

  // ==========================================================================
  // SCREEN BLANKET / SWARM CREATION (Phase 3: Multi-sized Flowers cover screen)
  // ==========================================================================
  function buildSwarmScene() {
    blossomSwarmGroup = new THREE.Group();
    scene.add(blossomSwarmGroup);

    swarmFlowers.length = 0;
    swarmPetals.length = 0;

    const flowerCount = 95;
    const swarmSizeTiers = generateShuffledSizeTiers(flowerCount);

    for (let i = 0; i < flowerCount; i++) {
      const colorIdx = i % PALETTE.petals.length;
      const isForeground = i < 24;
      const sizeMultiplier = swarmSizeTiers[i];

      const nominalScale = isForeground ? (2.4 + Math.random() * 1.6) : (1.0 + Math.random() * 1.0);
      const fl = createFlowerInstance(
        swarmPetalMaterials,
        colorIdx,
        nominalScale * sizeMultiplier
      );

      // Petals opened wide
      fl.petals.forEach(p => {
        p.rotation.x = 0.55;
        p.scale.set(1, 1, 1);
      });
      fl.centerMesh.scale.set(1, 1, 1);

      // Start near tree center
      const startPos = new THREE.Vector3(
        (Math.random() - 0.5) * 4.0,
        5.0 + (Math.random() - 0.5) * 3.5,
        (Math.random() - 0.5) * 4.0
      );

      // Target position distributed across the camera frustum
      const gridX = ((i % 10) / 9) * 2.0 - 1.0;
      const gridY = (Math.floor(i / 10) / 9) * 2.0 - 1.0;

      const targetX = gridX * (isForeground ? 12.0 : 18.0) + (Math.random() - 0.5) * 4.0;
      const targetY = gridY * (isForeground ? 8.0 : 13.0) + (Math.random() - 0.5) * 3.5;
      const targetZ = isForeground ? (10.0 + Math.random() * 6.0) : (-4.0 + Math.random() * 12.0);

      fl.group.position.copy(startPos);
      // Start facing outward toward camera with gentle random spin
      fl.group.rotation.set(
        (Math.random() - 0.5) * 0.4,
        (Math.random() - 0.5) * 0.4,
        Math.random() * Math.PI * 2
      );
      fl.group.scale.set(0.001, 0.001, 0.001);
      fl.group.visible = false;
      blossomSwarmGroup.add(fl.group);

      swarmFlowers.push({
        group: fl.group,
        baseScale: fl.baseScale,
        startPos,
        targetPos: new THREE.Vector3(targetX, targetY, targetZ),
        currentPos: startPos.clone(),
        driftVx: (Math.random() - 0.5) * 0.45,
        driftVy: -0.15 - Math.random() * 0.35,
        rotSpeedX: (Math.random() - 0.5) * 0.8,
        rotSpeedY: (Math.random() - 0.5) * 0.9,
        rotSpeedZ: (Math.random() - 0.5) * 0.7,
        phase: Math.random() * Math.PI * 2,
        delay: Math.random() * 1.4,
        duration: 1.4 + Math.random() * 0.8
      });
    }

    // 2. Loose Fluttering Petals
    const petalCount = 160;
    for (let j = 0; j < petalCount; j++) {
      const colorIdx = Math.floor(Math.random() * PALETTE.petals.length);
      const mat = swarmPetalMaterials[colorIdx];
      const pMesh = new THREE.Mesh(petalGeometry, mat);

      const isLarge = Math.random() < 0.3;
      const pScale = isLarge ? (1.5 + Math.random() * 1.2) : (0.5 + Math.random() * 0.7);

      const startPos = new THREE.Vector3(
        (Math.random() - 0.5) * 5.0,
        5.5 + (Math.random() - 0.5) * 4.0,
        (Math.random() - 0.5) * 4.0
      );

      const targetX = (Math.random() - 0.5) * 32.0;
      const targetY = (Math.random() - 0.5) * 24.0;
      const targetZ = -2.0 + Math.random() * 18.0;

      pMesh.position.copy(startPos);
      pMesh.scale.set(0.001, 0.001, 0.001);
      pMesh.visible = false;
      blossomSwarmGroup.add(pMesh);

      swarmPetals.push({
        mesh: pMesh,
        baseScale: pScale,
        startPos,
        targetPos: new THREE.Vector3(targetX, targetY, targetZ),
        currentPos: startPos.clone(),
        driftVx: (Math.random() - 0.5) * 0.6,
        driftVy: -0.25 - Math.random() * 0.45,
        rotX: Math.random() * Math.PI * 2,
        rotY: Math.random() * Math.PI * 2,
        rotZ: Math.random() * Math.PI * 2,
        rotSpeedX: (Math.random() - 0.5) * 1.8,
        rotSpeedY: (Math.random() - 0.5) * 1.5,
        rotSpeedZ: (Math.random() - 0.5) * 1.2,
        phase: Math.random() * Math.PI * 2,
        delay: Math.random() * 1.8,
        duration: 1.2 + Math.random() * 0.9
      });
    }
  }

  // ==========================================================================
  // ATMOSPHERE (Twinkling Stars & 3D Glowing Fireflies)
  // ==========================================================================
  function buildAtmosphereScene() {
    atmosphereGroup = new THREE.Group();
    scene.add(atmosphereGroup);

    starsList.length = 0;
    firefliesList.length = 0;

    // Stars
    const starGeo = new THREE.BufferGeometry();
    const starCount = 180;
    const starPos = [];
    for (let i = 0; i < starCount; i++) {
      const x = (Math.random() - 0.5) * 60;
      const y = (Math.random() - 0.5) * 50 + 5;
      const z = -25 + (Math.random() - 0.5) * 25;
      starPos.push(x, y, z);
      starsList.push({
        baseAlpha: 0.3 + Math.random() * 0.7,
        twinkleSpeed: 1.2 + Math.random() * 2.5,
        phase: Math.random() * Math.PI * 2
      });
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.22,
      transparent: true,
      opacity: 0.8
    });
    const starPoints = new THREE.Points(starGeo, starMat);
    atmosphereGroup.add(starPoints);

    // Fireflies
    const ffGeo = new THREE.SphereGeometry(0.12, 8, 8);
    for (let j = 0; j < 30; j++) {
      const ffMat = new THREE.MeshBasicMaterial({
        color: 0xfff3a8,
        transparent: true,
        opacity: 0.75
      });
      const ffMesh = new THREE.Mesh(ffGeo, ffMat);
      const x = (Math.random() - 0.5) * 22;
      const y = Math.random() * 15;
      const z = (Math.random() - 0.5) * 16;
      ffMesh.position.set(x, y, z);
      atmosphereGroup.add(ffMesh);

      firefliesList.push({
        mesh: ffMesh,
        mat: ffMat,
        baseX: x,
        baseY: y,
        baseZ: z,
        vx: (Math.random() - 0.5) * 0.35,
        vy: 0.15 + Math.random() * 0.25,
        vz: (Math.random() - 0.5) * 0.35,
        pulseSpeed: 1.5 + Math.random() * 2.0,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  // 3D Sparkle Particle System
  function spawn3DSparkles(pos, count = 5) {
    const sparkGeo = new THREE.SphereGeometry(0.08, 6, 6);
    for (let i = 0; i < count; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffeaa7,
        transparent: true,
        opacity: 1.0
      });
      const mesh = new THREE.Mesh(sparkGeo, mat);
      mesh.position.copy(pos);

      const angle = Math.random() * Math.PI * 2;
      const speed = 0.4 + Math.random() * 1.2;
      const vel = new THREE.Vector3(
        Math.cos(angle) * speed,
        0.3 + Math.random() * 1.0,
        Math.sin(angle) * speed
      );

      scene.add(mesh);
      sparkMeshList.push({ mesh, mat, vel, life: 1.0, decay: 0.02 + Math.random() * 0.02 });
    }
  }

  function updateSparkles(dt) {
    for (let i = sparkMeshList.length - 1; i >= 0; i--) {
      const sp = sparkMeshList[i];
      sp.mesh.position.addScaledVector(sp.vel, dt * 2.5);
      sp.vel.y -= 0.6 * dt;
      sp.life -= sp.decay;
      sp.mat.opacity = Math.max(0, sp.life);
      sp.mesh.scale.setScalar(Math.max(0.01, sp.life));

      if (sp.life <= 0) {
        scene.remove(sp.mesh);
        sp.mesh.geometry.dispose();
        sp.mat.dispose();
        sparkMeshList.splice(i, 1);
      }
    }
  }

  // ==========================================================================
  // EASING FUNCTIONS
  // ==========================================================================
  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  // ==========================================================================
  // ANIMATION UPDATE
  // ==========================================================================
  function updateAnimation(time, dt) {
    // 1. FIXED ROTATION SPEED: Exactly 1 rotation per 5.0 seconds around vertical Y-axis!
    if (treeGroup) {
      treeGroup.rotation.y = time * ANGULAR_VELOCITY;
    }

    // 2. Trunk growth (Tapered radius: 0.16 base, 0.06 tip)
    if (trunkData && !trunkData.isDone) {
      if (time >= trunkData.growStart) {
        const p = Math.min(1.0, (time - trunkData.growStart) / (trunkData.growEnd - trunkData.growStart));
        const easedP = easeOutCubic(p);
        trunkData.mesh.geometry.dispose();
        trunkData.mesh.geometry = createTaperedTubeGeometry(trunkData.curve, 24, 0.16, 0.06, 8, easedP);
        if (p >= 1.0) trunkData.isDone = true;
      }
    }

    // 3. Branches & Stalks growth
    branchesData.forEach(b => {
      if (!b.isDone && time >= b.growStart) {
        b.mesh.visible = true;
        const p = Math.min(1.0, (time - b.growStart) / (b.growEnd - b.growStart));
        const easedP = easeOutCubic(p);
        b.mesh.geometry.dispose();
        b.mesh.geometry = createTaperedTubeGeometry(b.curve, 16, 0.08, 0.025, 6, easedP);
        if (p >= 1.0) b.isDone = true;
      }

      b.stalks.forEach(s => {
        if (!s.isDone && time >= s.growStart) {
          s.mesh.visible = true;
          const p = Math.min(1.0, (time - s.growStart) / (s.growEnd - s.growStart));
          const easedP = easeOutCubic(p);
          s.mesh.geometry.dispose();
          s.mesh.geometry = createTaperedTubeGeometry(s.curve, 8, 0.02, 0.01, 5, easedP);
          if (p >= 1.0) s.isDone = true;
        }
      });
    });

    // 4. Flowers blooming (petals unfurl from tight bud to open flower with x/4 large, x/2 medium, x/4 small sizes)
    treeFlowers.forEach(f => {
      if (time < f.bloomStart) {
        f.instance.group.visible = false;
        return;
      }

      f.instance.group.visible = true;
      const elapsed = time - f.bloomStart;
      const p = Math.min(1.0, elapsed / f.bloomDuration);
      const easedP = easeOutBack(p);

      // Flower group scales to its designated size tier: 100% (large), 50% (medium), or 30% (small)
      const currentFlowerScale = f.sizeMultiplier * f.instance.baseScale * Math.max(0.001, Math.min(1.0, easedP));
      f.instance.group.scale.set(currentFlowerScale, currentFlowerScale, currentFlowerScale);

      // Unfold each petal from bud (-0.85 rad) to wide open (+0.55 rad)
      const petalAngle = -0.85 + Math.min(1.0, easedP) * 1.4;
      f.instance.petals.forEach(petal => {
        petal.rotation.x = petalAngle;
        petal.scale.set(1, 1, 1);
      });
      f.instance.centerMesh.scale.set(1, 1, 1);

      // Sparkle burst & romantic chime when flower opens
      if (!f.sparkled && p > 0.35) {
        f.sparkled = true;
        const worldPos = new THREE.Vector3();
        f.instance.group.getWorldPosition(worldPos);
        spawn3DSparkles(worldPos, 4);

        if (Math.random() < 0.28) {
          playBloomChime();
        }
      }
    });

    // 5. Tree Fade Out: When flowers reach full bloom, tree fades out & disappears!
    let treeAlpha = 1.0;
    if (time >= STEM_FADE_START) {
      const fadeProgress = (time - STEM_FADE_START) / (STEM_FADE_END - STEM_FADE_START);
      treeAlpha = Math.max(0.0, 1.0 - Math.min(1.0, fadeProgress));
      stemMaterial.opacity = treeAlpha;

      // Tree flowers fade out smoothly with the tree
      treeFlowers.forEach(f => {
        f.instance.centerMat.opacity = treeAlpha;
        if (f.instance.calyxMat) f.instance.calyxMat.opacity = treeAlpha;
      });
      treePetalMaterials.forEach(m => {
        m.opacity = treeAlpha;
        m.depthWrite = (treeAlpha > 0.85);
      });
    } else {
      stemMaterial.opacity = 1.0;
      treePetalMaterials.forEach(m => {
        m.opacity = 1.0;
        m.depthWrite = true;
      });
    }

    if (time >= STEM_FADE_END) {
      treeGroup.visible = false;
    } else {
      treeGroup.visible = true;
    }

    // 6. SCREEN-BLANKET SWARM: Blossoms and petals burst out and cover the entire screen!
    if (time >= STEM_FADE_START) {
      blossomSwarmGroup.visible = true;

      // Macro blossoms
      swarmFlowers.forEach(sf => {
        const flowerStartTime = STEM_FADE_START + sf.delay;
        if (time < flowerStartTime) {
          sf.group.visible = false;
          return;
        }

        sf.group.visible = true;
        const progress = Math.min(1.0, (time - flowerStartTime) / sf.duration);
        const easeP = easeOutCubic(progress);

        // Burst from center tree out to cover entire screen
        sf.currentPos.lerpVectors(sf.startPos, sf.targetPos, easeP);
        sf.currentPos.x += Math.sin(time * 1.1 + sf.phase) * 0.03 + sf.driftVx * (time - flowerStartTime) * 0.6;
        sf.currentPos.y += Math.cos(time * 0.8 + sf.phase) * 0.02 + sf.driftVy * (time - flowerStartTime) * 0.6;

        sf.group.position.copy(sf.currentPos);
        sf.group.rotation.x += sf.rotSpeedX * dt;
        sf.group.rotation.y += sf.rotSpeedY * dt;
        sf.group.rotation.z += sf.rotSpeedZ * dt;

        const currentScale = sf.baseScale * easeP;
        sf.group.scale.set(currentScale, currentScale, currentScale);
      });

      // Loose cascading petals
      swarmPetals.forEach(sp => {
        const petalStartTime = STEM_FADE_START + sp.delay;
        if (time < petalStartTime) {
          sp.mesh.visible = false;
          return;
        }

        sp.mesh.visible = true;
        const progress = Math.min(1.0, (time - petalStartTime) / sp.duration);
        const easeP = easeOutCubic(progress);

        sp.currentPos.lerpVectors(sp.startPos, sp.targetPos, easeP);
        sp.currentPos.x += Math.sin(time * 1.4 + sp.phase) * 0.04 + sp.driftVx * (time - petalStartTime) * 0.7;
        sp.currentPos.y += Math.cos(time * 1.0 + sp.phase) * 0.03 + sp.driftVy * (time - petalStartTime) * 0.7;

        sp.mesh.position.copy(sp.currentPos);
        sp.rotX += sp.rotSpeedX * dt;
        sp.rotY += sp.rotSpeedY * dt;
        sp.rotZ += sp.rotSpeedZ * dt;
        sp.mesh.rotation.set(sp.rotX, sp.rotY, sp.rotZ);

        const currentScale = sp.baseScale * easeP;
        sp.mesh.scale.set(currentScale, currentScale, currentScale);
      });
    } else {
      blossomSwarmGroup.visible = false;
    }

    // 7. Atmosphere updates
    firefliesList.forEach(ff => {
      ff.mesh.position.x = ff.baseX + Math.sin(time * ff.vx + ff.phase) * 1.8;
      ff.mesh.position.y = (ff.baseY + time * ff.vy) % 18;
      ff.mesh.position.z = ff.baseZ + Math.cos(time * ff.vz + ff.phase) * 1.8;

      const pulse = 0.5 + 0.5 * Math.sin(time * ff.pulseSpeed + ff.phase);
      ff.mat.opacity = 0.3 + 0.6 * pulse;
    });

    updateSparkles(dt);

    // 8. Romantic Header Typography Visibility
    if (time >= 2.4 && time < STEM_FADE_START + 0.5) {
      romanticHeader.classList.add('visible');
      romanticHeader.classList.remove('fade-out');
    } else if (time >= STEM_FADE_START + 0.5) {
      romanticHeader.classList.add('fade-out');
    } else {
      romanticHeader.classList.remove('visible');
      romanticHeader.classList.remove('fade-out');
    }
  }

  // ==========================================================================
  // RENDER & ANIMATION LOOP
  // ==========================================================================
  function animate(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const dt = Math.min(0.06, (timestamp - lastTimestamp) / 1000);
    lastTimestamp = timestamp;

    if (isPlaying) {
      animTime += dt;

      if (animTime > LOOP_RESTART_TIME) {
        restartAnimation();
      }
    }

    tickHarmonicMusic(animTime);
    updateAnimation(animTime, dt);

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  function restartAnimation() {
    animTime = 0;
    if (treeGroup) scene.remove(treeGroup);
    if (blossomSwarmGroup) scene.remove(blossomSwarmGroup);

    buildTreeScene();
    buildSwarmScene();

    romanticHeader.classList.remove('visible');
    romanticHeader.classList.remove('fade-out');
  }

  // ==========================================================================
  // VIEWPORT RESIZE & CAMERA ADAPTIVITY
  // ==========================================================================
  function handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / height;

    camera.aspect = aspect;
    if (aspect < 1.0) {
      camera.position.set(0, 4.8, 16.5 / aspect);
    } else {
      camera.position.set(0, 4.6, 18.5);
    }
    camera.lookAt(0, 4.8, 0);
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  }

  // ==========================================================================
  // USER INTERACTION
  // ==========================================================================
  function handleUserInteraction(e) {
    initAudio();
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    if (hintOverlay) {
      hintOverlay.classList.add('fade');
    }

    if (animTime >= STEM_FADE_END) {
      restartAnimation();
      return;
    }

    const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : window.innerWidth * 0.5);
    const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : window.innerHeight * 0.5);

    const ndcX = (clientX / window.innerWidth) * 2 - 1;
    const ndcY = -(clientY / window.innerHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
    const targetPt = raycaster.ray.at(14, new THREE.Vector3());

    spawn3DSparkles(targetPt, 8);
    playBloomChime();
  }

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================
  function init() {
    // 1. Scene
    scene = new THREE.Scene();

    // 2. Camera
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);

    // 3. Renderer
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xbfdede, 0.95);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff5e6, 1.35);
    sunLight.position.set(7, 14, 10);
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x7bc2c2, 0.7);
    rimLight.position.set(-8, 6, -9);
    scene.add(rimLight);

    const centerPointLight = new THREE.PointLight(0xffdfa8, 1.2, 28);
    centerPointLight.position.set(0, 5, 0);
    scene.add(centerPointLight);

    // 5. Shared Materials & Geometries
    stemMaterial = new THREE.MeshStandardMaterial({
      color: 0x8fa685,
      roughness: 0.45,
      metalness: 0.05,
      transparent: true,
      opacity: 1.0
    });

    petalGeometry = createPetalGeometry();

    // SOLID, VIBRANT PETAL MATERIALS (Opaque, rich, depthWrite enabled)
    treePetalMaterials = PALETTE.petals.map(hex => {
      const tex = createPetalTexture(hex);
      return new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.32,
        metalness: 0.04,
        transparent: true,
        opacity: 1.0,
        depthWrite: true,
        side: THREE.DoubleSide
      });
    });

    swarmPetalMaterials = PALETTE.petals.map(hex => {
      const tex = createPetalTexture(hex);
      return new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.32,
        metalness: 0.04,
        transparent: true,
        opacity: 1.0,
        depthWrite: true,
        side: THREE.DoubleSide
      });
    });

    // 6. Build Scenes
    buildAtmosphereScene();
    buildTreeScene();
    buildSwarmScene();

    handleResize();
    window.addEventListener('resize', handleResize);

    // 7. Event Listeners
    audioBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleAudio();
    });

    canvas.addEventListener('click', handleUserInteraction);
    canvas.addEventListener('touchstart', (e) => {
      handleUserInteraction(e);
    }, { passive: true });

    setTimeout(() => {
      if (hintOverlay) hintOverlay.classList.add('fade');
    }, 4000);

    // 8. Start Background Music & Unlocks
    setupAutoAudio();

    // 9. Start Loop
    requestAnimationFrame(animate);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
