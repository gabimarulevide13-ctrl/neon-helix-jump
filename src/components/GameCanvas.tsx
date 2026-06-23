/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GameStats, Skin, BallParticle, Challenge } from '../types';
import { sfx } from '../audio';

interface GameCanvasProps {
  gameState: string;
  stats: GameStats;
  selectedSkin: Skin;
  difficultyMultiplier: number;
  onBounce: (platformIdx?: number) => void;
  onCoinCollected: () => void;
  onScoreUp: (points: number) => void;
  onLevelCompleted: () => void;
  onGameOver: () => void;
  onComboChange: (combo: number) => void;
  onFireballStateChange: (active: boolean) => void;
  isPlaying: boolean;
  activeChallenge?: Challenge | null;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  gameState,
  stats,
  selectedSkin,
  difficultyMultiplier,
  onBounce,
  onCoinCollected,
  onScoreUp,
  onLevelCompleted,
  onGameOver,
  onComboChange,
  onFireballStateChange,
  isPlaying,
  activeChallenge = null,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Core Three.js Refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const towerGroupRef = useRef<THREE.Group | null>(null);
  const ballMeshRef = useRef<THREE.Mesh | null>(null);
  const ballLightRef = useRef<THREE.PointLight | null>(null);
  const mainLightRef = useRef<THREE.DirectionalLight | null>(null);

  // Gameplay configuration & state variables
  const platformSpacing = 4.0;
  const numPlatforms = 12 + Math.min(stats.level, 10);
  const segmentsPerPlatform = 12;
  const targetRad = 1.4;

  // Ball physics state
  const physicsRef = useRef({
    y: 3.0,
    vy: 0.0,
    gravity: -0.012,
    bounceStrength: 0.28,
    isFirstFrame: true,
    lastPlatformIndex: -1,
    consecutivePlatformGaps: 0,
    invincibleTime: 0,
  });

  // Inertia/rotation state for tower spinning
  const interactionRef = useRef({
    isDragging: false,
    prevX: 0,
    targetRotationY: 0,
    currentRotationY: 0,
    rotationSpeed: 0,
    friction: 0.15,
    dragFactor: 0.012,
  });

  // Track platform types to easily do collision checks locally
  const levelPlatformsRef = useRef<Array<{
    y: number;
    segments: string[];
    meshes: THREE.Mesh[];
    hasCoin: boolean;
    coinCollected: boolean;
    coinMesh: THREE.Mesh | THREE.Group | null;
    shattered: boolean;
    passed?: boolean;
    group?: THREE.Group | null;
    rotationSpeed?: number;
  }>>([]);

  const activeChallengeRef = useRef<Challenge | null>(null);
  useEffect(() => {
    activeChallengeRef.current = activeChallenge || null;
  }, [activeChallenge]);

  const selectedSkinRef = useRef<Skin>(selectedSkin);
  useEffect(() => {
    selectedSkinRef.current = selectedSkin;
  }, [selectedSkin]);

  const shieldsRemainingRef = useRef<number>(0);
  useEffect(() => {
    const currentSkinId = selectedSkinRef.current?.id;
    if (currentSkinId === 'holy_crown') {
      shieldsRemainingRef.current = 2;
    } else if (currentSkinId === 'silver' || currentSkinId === 'rainbow') {
      shieldsRemainingRef.current = 1;
    } else {
      shieldsRemainingRef.current = 0;
    }
  }, [stats.level, isPlaying]);

  const particlesRef = useRef<BallParticle[]>([]);
  const projectileGroupRef = useRef<THREE.Group | null>(null);
  const decalPoolRef = useRef<Array<{
    mesh: THREE.Mesh;
    parentPlatformIdx: number;
    localAngle: number;
    spawnTime: number;
  }>>([]);

  const getLevelColorPalette = (level: number) => {
    const palettes = [
      { safe: 0x00f3ff, dead: 0xff0040, glow: 0x00a8ff },
      { safe: 0xb500ff, dead: 0xffec00, glow: 0xa100ff },
      { safe: 0x00ff66, dead: 0xff00b5, glow: 0x00d34f },
      { safe: 0xffa200, dead: 0x00f3ff, glow: 0xff8800 },
      { safe: 0xff00dd, dead: 0x24ff00, glow: 0xd300a4 },
    ];
    return palettes[level % palettes.length];
  };

  const levelPalette = getLevelColorPalette(stats.level);

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);
    const ob = new ResizeObserver(() => handleResize());
    if (containerRef.current) ob.observe(containerRef.current);

    return () => {
      window.removeEventListener('resize', handleResize);
      ob.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    scene.fog = new THREE.FogExp2(0x0a0616, 0.025);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100);
    camera.position.set(0, 4.6, 7.5);
    camera.lookAt(0, 1.8, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x06030c, 1);

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0x201535, 1.2);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 2.2);
    mainLight.position.set(5, 15, 8);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    mainLight.shadow.bias = -0.0005;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 25;
    mainLight.shadow.camera.left = -5;
    mainLight.shadow.camera.right = 5;
    mainLight.shadow.camera.top = 5;
    mainLight.shadow.camera.bottom = -5;
    scene.add(mainLight);
    mainLightRef.current = mainLight;

    const backLight = new THREE.DirectionalLight(0x4010ff, 1.5);
    backLight.position.set(-8, -5, -5);
    scene.add(backLight);

    const ballPtLight = new THREE.PointLight(levelPalette.glow, 4.0, 7.5, 1.5);
    ballPtLight.castShadow = false;
    scene.add(ballPtLight);
    ballLightRef.current = ballPtLight;

    const towerGroup = new THREE.Group();
    scene.add(towerGroup);
    towerGroupRef.current = towerGroup;

    const projGroup = new THREE.Group();
    scene.add(projGroup);
    projectileGroupRef.current = projGroup;

    buildTower();
    buildBall(selectedSkin);

    physicsRef.current.y = 3.0;
    physicsRef.current.vy = 0.0;
    physicsRef.current.lastPlatformIndex = -1;
    physicsRef.current.consecutivePlatformGaps = 0;
    physicsRef.current.isFirstFrame = true;

    let frameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (isPlaying) {
        updatePhysicsAndInteractivity();
        updateParticlesDecals(delta);
      } else {
        interactionRef.current.currentRotationY += 0.004;
        if (towerGroupRef.current) {
          towerGroupRef.current.rotation.y = interactionRef.current.currentRotationY;
        }
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      scene.clear();
      renderer.dispose();
    };
  }, [stats.level, selectedSkin, isPlaying]);

  const buildBall = (skin: Skin) => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (ballMeshRef.current) {
      scene.remove(ballMeshRef.current);
    }

    const radius = 0.18;
    const geometry = new THREE.SphereGeometry(radius, 24, 24);
    let material: THREE.Material;

    if (skin.type === 'metallic') {
      material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(skin.color),
        metalness: skin.metalness ?? 0.9,
        roughness: skin.roughness ?? 0.1,
        emissive: new THREE.Color(skin.color).multiplyScalar(0.15),
      });
    } else if (skin.type === 'gradient') {
      material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(skin.color),
        metalness: 0.4,
        roughness: 0.2,
        emissive: new THREE.Color(skin.secondaryColor || '#000').multiplyScalar(0.4),
      });
    } else if (skin.type === 'emoji') {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = skin.color;
        ctx.fillRect(0, 0, 128, 128);
        ctx.font = '84px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(skin.emoji || '⚽', 64, 64);
      }

      const texture = new THREE.CanvasTexture(canvas);
      material = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.3,
        metalness: 0.2,
      });
    } else {
      material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(skin.color),
        roughness: 0.15,
        metalness: 0.1,
      });
    }

    const ballMesh = new THREE.Mesh(geometry, material);
    ballMesh.castShadow = true;
    ballMesh.receiveShadow = false;
    ballMesh.position.set(0, physicsRef.current.y, targetRad);
    scene.add(ballMesh);
    ballMeshRef.current = ballMesh;
  };

  const buildTower = () => {
    const towerGroup = towerGroupRef.current;
    const scene = sceneRef.current;
    if (!towerGroup || !scene) return;

    while (towerGroup.children.length > 0) {
      towerGroup.remove(towerGroup.children[0]);
    }

    const cylinderHeight = (numPlatforms + 2) * platformSpacing;
    const cylinderGeom = new THREE.CylinderGeometry(0.75, 0.75, cylinderHeight, 20);
    const cylinderMat = new THREE.MeshStandardMaterial({
      color: 0x110c22,
      roughness: 0.1,
      metalness: 0.95,
      emissive: 0x24115e,
    });
    const column = new THREE.Mesh(cylinderGeom, cylinderMat);
    column.position.y = - (cylinderHeight / 2) + 6.0;
    column.receiveShadow = true;
    towerGroup.add(column);

    levelPlatformsRef.current = [];

    const sectorGeometrySafe = createSectorGeometry(0.82, 2.05, 0.2, Math.PI / 6);
    const sectorGeometryDead = createSectorGeometry(0.82, 2.05, 0.23, Math.PI / 6);
    const sectorGeometryTrap = createSectorGeometry(0.82, 2.05, 0.21, Math.PI / 6);

    const safeMat = new THREE.MeshStandardMaterial({
      color: levelPalette.safe,
      roughness: 0.1,
      metalness: 0.4,
      emissive: new THREE.Color(levelPalette.safe).multiplyScalar(0.45),
    });

    const deadMat = new THREE.MeshStandardMaterial({
      color: levelPalette.dead,
      roughness: 0.2,
      metalness: 0.15,
      emissive: new THREE.Color(levelPalette.dead).multiplyScalar(0.5),
    });

    const trapMat = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      roughness: 0.2,
      metalness: 0.3,
      emissive: new THREE.Color(0xff2200).multiplyScalar(0.45),
    });

    for (let pIdx = 0; pIdx < numPlatforms; pIdx++) {
      const platformY = -pIdx * platformSpacing;
      const segments: string[] = [];
      const platformMeshes: THREE.Mesh[] = [];

      let minGaps = 1;
      let maxGaps = Math.min(2 + Math.floor(stats.level / 3), 4);
      let gapCount = Math.floor(Math.random() * (maxGaps - minGaps + 1)) + minGaps;

      let maxHazards = pIdx === 0 ? 0 : Math.min(1 + Math.floor(pIdx / 2) + Math.floor(stats.level / 2), 5);
      let hazardCount = pIdx === 0 ? 0 : Math.floor(Math.random() * (maxHazards + 1));

      let maxTraps = pIdx === 0 ? 0 : Math.min(Math.floor(stats.level / 2.5) + 1, 3);
      let trapCount = (pIdx === 0 || stats.level < 2) ? 0 : Math.floor(Math.random() * (maxTraps + 1));

      for (let s = 0; s < segmentsPerPlatform; s++) {
        segments.push('SAFE');
      }

      const firstGapIdx = Math.floor(Math.random() * segmentsPerPlatform);
      for (let g = 0; g < gapCount; g++) {
        const gapIdx = (firstGapIdx + g) % segmentsPerPlatform;
        segments[gapIdx] = 'OPEN';
      }

      let injectedHazards = 0;
      let attempts = 0;
      while (injectedHazards < hazardCount && attempts < 30) {
        attempts++;
        const index = Math.floor(Math.random() * segmentsPerPlatform);
        if (segments[index] === 'SAFE') {
          segments[index] = 'DEAD';
          injectedHazards++;
        }
      }

      let injectedTraps = 0;
      let trapAttempts = 0;
      while (injectedTraps < trapCount && trapAttempts < 30) {
        trapAttempts++;
        const index = Math.floor(Math.random() * segmentsPerPlatform);
        if (segments[index] === 'SAFE') {
          segments[index] = 'TRAP';
          injectedTraps++;
        }
      }

      const platGroup = new THREE.Group();
      platGroup.position.y = platformY;

      for (let s = 0; s < segmentsPerPlatform; s++) {
        const type = segments[s];
        if (type === 'OPEN') continue;

        const thetaStart = s * (Math.PI / 6);
        const geoToUse = type === 'SAFE' ? sectorGeometrySafe : type === 'DEAD' ? sectorGeometryDead : sectorGeometryTrap;
        const matToUse = type === 'SAFE' ? safeMat : type === 'DEAD' ? deadMat : trapMat;

        const sectorMesh = new THREE.Mesh(geoToUse, matToUse);
        sectorMesh.rotation.y = thetaStart;
        sectorMesh.castShadow = true;
        sectorMesh.receiveShadow = true;

        sectorMesh.userData = { type, segmentIdx: s, platformIdx: pIdx };

        platGroup.add(sectorMesh);
        platformMeshes.push(sectorMesh);
      }

      let hasCoin = false;
      let coinMesh: THREE.Group | THREE.Mesh | null = null;

      if (pIdx > 0 && pIdx < numPlatforms - 1 && Math.random() < 0.40) {
        const safeIndices: number[] = [];
        segments.forEach((s, idx) => {
          if (s === 'SAFE') safeIndices.push(idx);
        });

        if (safeIndices.length > 0) {
          hasCoin = true;
          const coinSegIdx = safeIndices[Math.floor(Math.random() * safeIndices.length)];
          const coinAngle = coinSegIdx * (Math.PI / 6);

          const coinGroup = new THREE.Group();
          const radiusOfCoin = 1.45;
          coinGroup.position.set(
            Math.cos(coinAngle) * radiusOfCoin,
            0.45,
            -Math.sin(coinAngle) * radiusOfCoin
          );

          const gemGeom = new THREE.OctahedronGeometry(0.14, 0);
          const gemMat = new THREE.MeshStandardMaterial({
            color: 0xffdf00,
            metalness: 1.0,
            roughness: 0.15,
            emissive: 0x937500,
          });
          const gem = new THREE.Mesh(gemGeom, gemMat);
          coinGroup.add(gem);

          const ringGeom = new THREE.TorusGeometry(0.2, 0.03, 8, 16);
          const ringMat = new THREE.MeshStandardMaterial({
            color: 0xffbb00,
            metalness: 0.9,
            roughness: 0.2,
          });
          const ring = new THREE.Mesh(ringGeom, ringMat);
          ring.rotation.x = Math.PI / 2;
          coinGroup.add(ring);

          platGroup.add(coinGroup);
          coinMesh = coinGroup;
        }
      }

      if (pIdx === numPlatforms - 1) {
        const finishGeom = new THREE.TorusGeometry(2.2, 0.08, 12, 32);
        const finishMat = new THREE.MeshStandardMaterial({
          color: 0xff00ee,
          emissive: 0xff00d2,
          metalness: 0.5,
          roughness: 0.1,
        });
        const finishRing = new THREE.Mesh(finishGeom, finishMat);
        finishRing.rotation.x = Math.PI / 2;
        finishRing.position.y = -0.1;
        platGroup.add(finishRing);
      }

      towerGroup.add(platGroup);

      const levelSpeedBonus = Math.min(stats.level, 30) * 0.0006;
      // High levels feature moving/rotating platform hazards (trap colors and moving layouts) starting at Level 3
      const rotationSpeed = (stats.level >= 3 && pIdx > 0 && pIdx % 3 === 2) 
        ? (pIdx % 2 === 0 ? 1 : -1) * (0.0035 + levelSpeedBonus)
        : 0;

      levelPlatformsRef.current.push({
        y: platformY,
        segments,
        meshes: platformMeshes,
        hasCoin,
        coinCollected: false,
        coinMesh,
        shattered: false,
        passed: false,
        group: platGroup,
        rotationSpeed,
      });
    }
  };

  const createSectorGeometry = (
    innerRadius: number,
    outerRadius: number,
    depth: number,
    angle: number
  ): THREE.ExtrudeGeometry => {
    const shape = new THREE.Shape();
    const eps = 0.01;

    const a1 = -angle / 2 + eps;
    const a2 = angle / 2 - eps;

    shape.moveTo(Math.cos(a1) * outerRadius, Math.sin(a1) * outerRadius);
    shape.absarc(0, 0, outerRadius, a1, a2, false);
    shape.lineTo(Math.cos(a2) * innerRadius, Math.sin(a2) * innerRadius);
    shape.absarc(0, 0, innerRadius, a2, a1, true);
    shape.lineTo(Math.cos(a1) * outerRadius, Math.sin(a1) * outerRadius);

    const extrudeSettings = {
      depth: depth - 0.04,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.02,
      bevelThickness: 0.02,
    };

    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.rotateX(Math.PI / 2);
    geom.translate(0, depth / 2, 0);

    return geom;
  };

  const onDragStart = (clientX: number) => {
    if (!isPlaying) return;
    interactionRef.current.isDragging = true;
    interactionRef.current.prevX = clientX;
    interactionRef.current.rotationSpeed = 0;
    // Resynchroniser target et current au démarrage du drag pour un départ propre sans jump
    interactionRef.current.targetRotationY = interactionRef.current.currentRotationY;
  };

  const onDragMove = (clientX: number) => {
    const ir = interactionRef.current;
    if (!ir.isDragging || !isPlaying) return;

    let deltaX = clientX - ir.prevX;
    
    // Plafonner deltaX pour éviter d'énormes jumps si lag ou mouvement ultra brusque
    const maxDelta = 60; // pixels max par frame
    if (deltaX > maxDelta) deltaX = maxDelta;
    if (deltaX < -maxDelta) deltaX = -maxDelta;

    ir.prevX = clientX;

    ir.targetRotationY += deltaX * ir.dragFactor;
    
    // Vitesse de rotation directe pour éliminer l'emballement
    const nextSpeed = deltaX * ir.dragFactor;
    const maxSpeedCap = 0.08; // environ 4.5 degrés max par frame, soit ~270 degrés/s max
    ir.rotationSpeed = Math.max(-maxSpeedCap, Math.min(maxSpeedCap, nextSpeed));
  };

  const onDragEnd = () => {
    interactionRef.current.isDragging = false;
    // Freinage immédiat : la tour s'arrête net dès que la souris/le doigt est relâché(e)
    interactionRef.current.rotationSpeed = 0;
  };

  const updatePhysicsAndInteractivity = () => {
    const stats_ref = stats;
    const phys = physicsRef.current;
    const ir = interactionRef.current;
    const towerGroup = towerGroupRef.current;
    const ballMesh = ballMeshRef.current;
    const scene = sceneRef.current;

    if (!towerGroup || !ballMesh || !scene) return;

    // --- 1. TOWER ROTATION & INERTIA ---
    if (activeChallengeRef.current?.id === 'storm' && isPlaying) {
      if (!ir.isDragging) {
        ir.rotationSpeed = 0.007;
        ir.currentRotationY += ir.rotationSpeed;
        ir.targetRotationY = ir.currentRotationY;
      } else {
        ir.rotationSpeed *= 0.8;
        ir.targetRotationY += 0.004;
        ir.currentRotationY += (ir.targetRotationY - ir.currentRotationY) * 0.45;
      }
    } else {
      if (ir.isDragging) {
        // Amortir lentement la vitesse accumulée si le doigt reste immobile pour éviter
        // les départs de toupie intempestifs lors du relâché de drag.
        ir.rotationSpeed *= 0.8;
        ir.currentRotationY += (ir.targetRotationY - ir.currentRotationY) * 0.45;
      } else {
        ir.rotationSpeed *= ir.friction;
        ir.currentRotationY += ir.rotationSpeed;
        ir.targetRotationY = ir.currentRotationY;
      }
    }

    // Gestion synchrone du wrap d'angle (2π) sur current et target
    // En soustrayant ou ajoutant 2π aux deux en même temps, nous gardons leur différence (le delta de décalage)
    // strictement intacte, éliminant définitivement le bug de la tour qui tourne en boucle infinie.
    const twoPi = Math.PI * 2;
    if (ir.currentRotationY > twoPi) {
      ir.currentRotationY -= twoPi;
      ir.targetRotationY -= twoPi;
    } else if (ir.currentRotationY < -twoPi) {
      ir.currentRotationY += twoPi;
      ir.targetRotationY += twoPi;
    }

    towerGroup.rotation.y = ir.currentRotationY;

    // --- 2. BALL PHYSICS ---
    const speedMultiplier = activeChallengeRef.current?.id === 'extreme_speed' && isPlaying ? 1.3 : 1.0;
    let skinGravityMultiplier = 1.0;
    if (selectedSkinRef.current?.id === 'ball_beach') skinGravityMultiplier = 0.88;
    if (selectedSkinRef.current?.id === 'ball_soccer') skinGravityMultiplier = 1.15;
    if (selectedSkinRef.current?.id === 'emoji_alien') skinGravityMultiplier = 0.90;

    phys.vy += phys.gravity * speedMultiplier * skinGravityMultiplier;
    phys.y += phys.vy * speedMultiplier * skinGravityMultiplier;

    const bottomCutoff = -numPlatforms * platformSpacing - 5.0;
    if (phys.y < bottomCutoff) {
      phys.y = 3.0;
      phys.vy = 0.0;
    }

    ballMesh.position.y = phys.y;

    if (stats_ref.isFireball) {
      const pulseScalar = 1.0 + Math.sin(Date.now() * 0.02) * 0.2;
      ballMesh.scale.set(pulseScalar, pulseScalar, pulseScalar);
      spawnContinuousTrailParticles(ballMesh.position);
    } else {
      ballMesh.scale.set(1, 1, 1);
    }

    // --- 3. LEVEL END ---
    const finishY = -(numPlatforms - 1) * platformSpacing;
    if (phys.y <= finishY && phys.vy <= 0) {
      onLevelCompleted();
      sfx.playLevelUp();
      spawnCelebrationParticles(finishY);
      return;
    }

    // --- 4. PLATFORM COLLISION ---
    const currentPlatformIdx = Math.round(-phys.y / platformSpacing);

    if (currentPlatformIdx >= 0 && currentPlatformIdx < numPlatforms) {
      const platform = levelPlatformsRef.current[currentPlatformIdx];
      if (platform && !platform.shattered) {
        const relativeY = phys.y - platform.y;

        const thickness = 0.2;
        const collisionThreshold = 0.12;

        if (phys.vy <= 0 && relativeY >= -collisionThreshold && relativeY <= collisionThreshold + thickness) {
          // ✅ FIX 1: Pixel-perfect counter-clockwise local angle of front
          // Standard rotation around the Y-axis maps the segment center (θ) to world position.
          // The ball sits at (0, y, targetRad) in world space, which is along the positive Z-axis.
          // Positive Z-axis corresponds to world angle of 270 degrees (1.5 * PI) in our polar coordinate system
          // (since standard rotation of r * (cos(θ), -sin(θ)) rotated by R is r * (cos(θ+R), -sin(θ+R))).
          // This yields θ + R = 1.5 * PI  →  θ = 1.5 * PI - R.
          // We subtract platform's local rotation platformRot so rotation is relative to segments.
          const platformRot = platform.group ? platform.group.rotation.y : 0;
          const localAngleOfFront = 1.5 * Math.PI - ir.currentRotationY - platformRot;
          let normalizedAngle = (localAngleOfFront % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);

          const angleStepOfSegment = (Math.PI * 2) / segmentsPerPlatform;
          const currentSegIdx = Math.floor((normalizedAngle + Math.PI / 12) / angleStepOfSegment) % segmentsPerPlatform;

          const segmentType = platform.segments[currentSegIdx];

          if (segmentType === 'SAFE') {
            if (stats_ref.isFireball) {
              shatterPlatformAndDescend(currentPlatformIdx, platform);
            } else {
              let baseBounce = phys.bounceStrength;
              if (activeChallengeRef.current?.id === 'extreme_speed' && isPlaying) {
                baseBounce *= 1.3;
              }
              if (selectedSkinRef.current?.id === 'ball_volley') {
                baseBounce *= 1.15; // Volley-ball jumps 15% higher!
              }
              if (phys.miniBouncesRemaining && phys.miniBouncesRemaining > 0) {
                baseBounce *= 0.52; // rapid mini bounces
                phys.miniBouncesRemaining--;
              }
              phys.vy = baseBounce;
              phys.y = platform.y + collisionThreshold;
              phys.consecutivePlatformGaps = 0;
              // Mark passed as true so the gap traversal detector below doesn't trigger
              // as we bounce slightly around/above/below relative Y of this segment.
              platform.passed = true;
              onBounce(currentPlatformIdx);
              sfx.playBounce();
              triggerSquashAnimation();
              spawnPaintSplatDecal(currentPlatformIdx, currentSegIdx, platform.y);
              spawnBounceDustParticles(ballMesh.position, levelPalette.safe);
            }
          } else if (segmentType === 'TRAP') {
            if (stats_ref.isFireball) {
              shatterPlatformAndDescend(currentPlatformIdx, platform);
            } else {
              // Chaotic unstable trap bounce!
              // Triggers 2 or 3 unpredictable tiny bounces in rapid succession and a relative turn.
              phys.miniBouncesRemaining = Math.floor(Math.random() * 2) + 2; 
              let baseBounce = phys.bounceStrength;
              if (selectedSkinRef.current?.id === 'ball_volley') {
                baseBounce *= 1.15;
              }
              phys.vy = baseBounce * 0.45; // Low bounce height
              phys.y = platform.y + collisionThreshold;
              phys.consecutivePlatformGaps = 0;
              platform.passed = true;
              onBounce(currentPlatformIdx);
              sfx.playBounce();
              triggerSquashAnimation();
              spawnPaintSplatDecal(currentPlatformIdx, currentSegIdx, platform.y);
              spawnBounceDustParticles(ballMesh.position, 0xff7700); // Orange trap particles

              // Throw rotation slightly off track to disrupt muscle memory!
              interactionRef.current.targetRotationY += (Math.random() > 0.5 ? 1 : -1) * (Math.PI / 4.5);
              shakeCamera();
            }
          } else if (segmentType === 'DEAD') {
            if (stats_ref.isFireball) {
              shatterPlatformAndDescend(currentPlatformIdx, platform);
            } else {
              const currentSkinId = selectedSkinRef.current?.id;
              const hasShield = currentSkinId === 'silver' || currentSkinId === 'rainbow' || currentSkinId === 'holy_crown';
              if (hasShield && shieldsRemainingRef.current > 0) {
                shieldsRemainingRef.current--;
                // Absorb is a bounce!
                let baseBounce = phys.bounceStrength;
                if (selectedSkinRef.current?.id === 'ball_volley') {
                  baseBounce *= 1.15;
                }
                if (phys.miniBouncesRemaining && phys.miniBouncesRemaining > 0) {
                  baseBounce *= 0.52;
                  phys.miniBouncesRemaining--;
                }
                phys.vy = baseBounce;
                phys.y = platform.y + collisionThreshold;
                phys.consecutivePlatformGaps = 0;
                platform.passed = true;
                onBounce(currentPlatformIdx);
                // Play shield protective bounce sound or double bounce
                sfx.playBounce();
                triggerSquashAnimation();
                spawnPaintSplatDecal(currentPlatformIdx, currentSegIdx, platform.y);
                // Create spectacular shield particles!
                spawnBounceDustParticles(ballMesh.position, currentSkinId === 'holy_crown' ? 0xffea00 : 0xffd700);
              } else {
                onGameOver();
                sfx.playGameOver();
                spawnDeadExplosionParticles(ballMesh.position);
                shakeCamera();
              }
            }
          }
          // OPEN: ball continues dropping through gap
        }
      }
    }

    // --- 5. GAP TRAVERSAL DETECTION (Combo / Streak) ---
    levelPlatformsRef.current.forEach((platform) => {
      // ✅ Dynamic un-pass helper: if the ball bounces and rises above the platform,
      // allow this platform to be traversed again when we descend next time.
      if (phys.y > platform.y + 0.1) {
        platform.passed = false;
      }

      if (platform && !platform.passed && phys.y < platform.y - 0.2) {
        platform.passed = true;

        if (!platform.shattered) {
          phys.consecutivePlatformGaps++;

          const scoreGain = 10 * phys.consecutivePlatformGaps;
          onScoreUp(scoreGain);
          onComboChange(phys.consecutivePlatformGaps);

          if (phys.consecutivePlatformGaps >= 3 && !stats_ref.isFireball) {
            onFireballStateChange(true);
          }
        }
      }
    });

    // --- 6. COIN COLLECTION ---
    levelPlatformsRef.current.forEach((plat, pIdx) => {
      if (plat.hasCoin && !plat.coinCollected && plat.coinMesh) {
        plat.coinMesh.rotation.y += 0.04;

        const coinWorldPos = new THREE.Vector3();
        plat.coinMesh.getWorldPosition(coinWorldPos);

        const dist = ballMesh.position.distanceTo(coinWorldPos);
        if (dist < 0.35) {
          plat.coinCollected = true;
          plat.coinMesh.visible = false;
          onCoinCollected();
          sfx.playCoin();
          spawnCoinSparkleParticles(coinWorldPos);
        }
      }
    });

    // --- 6.5 INVISIBLE PLATFORMS CHALLENGE DYNAMICS ---
    if (activeChallengeRef.current?.id === 'invisible_platforms' && isPlaying) {
      levelPlatformsRef.current.forEach((plat) => {
        const distanceToBall = Math.abs(plat.y - phys.y);
        const targetOpacity = distanceToBall < 2.0 ? 1.0 : Math.max(0.01, 1.0 - (distanceToBall - 2.0) / 3.5);
        
        plat.meshes.forEach((mesh) => {
          if (mesh && mesh.visible) {
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((mat: any) => {
                mat.transparent = true;
                mat.opacity = THREE.MathUtils.lerp(mat.opacity ?? 1.0, targetOpacity, 0.15);
              });
            } else if (mesh.material) {
              const mat = mesh.material as any;
              mat.transparent = true;
              mat.opacity = THREE.MathUtils.lerp(mat.opacity ?? 1.0, targetOpacity, 0.15);
            }
          }
        });
      });
    } else {
      levelPlatformsRef.current.forEach((plat) => {
        plat.meshes.forEach((mesh) => {
          if (mesh) {
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((mat: any) => {
                mat.opacity = 1.0;
              });
            } else if (mesh.material) {
              const mat = mesh.material as any;
              mat.opacity = 1.0;
            }
          }
        });
      });
    }

    // --- 6.8 DYNAMIC ROTATING PLATFORMS (Starting from Level 3) ---
    levelPlatformsRef.current.forEach((plat) => {
      if (plat.group && plat.rotationSpeed && isPlaying) {
        plat.group.rotation.y += plat.rotationSpeed;
      }
    });

    // --- 6.9 NEON STROBOSCOPIC GLOW TRAPS & FLICKERING HAZARDS (Starting from Level 2) ---
    if (isPlaying) {
      const timeSec = Date.now() * 0.001;
      const pulseIntensity = 0.45 + Math.sin(timeSec * 7.5) * 0.3; // rapid frequency pulse
      levelPlatformsRef.current.forEach((plat) => {
        plat.meshes.forEach((mesh) => {
          if (mesh && mesh.userData) {
            const { type } = mesh.userData;
            if (type === 'TRAP') {
              const mat = mesh.material as THREE.MeshStandardMaterial;
              if (mat && mat.emissive) {
                // Flash the trap with blazing warning orange-red color
                mat.emissive.setRGB(0.85 * pulseIntensity, 0.22 * pulseIntensity, 0.0);
              }
            } else if (type === 'DEAD' && stats_ref.level >= 4) {
              const mat = mesh.material as THREE.MeshStandardMaterial;
              if (mat && mat.emissive) {
                // Glitchy high-voltage flicker for high levels
                const glitch = (Math.random() > 0.95) ? 0.2 : 1.0;
                const finalPulse = pulseIntensity * glitch;
                mat.emissive.setRGB(0.9 * finalPulse, 0.04 * finalPulse, 0.04 * finalPulse);
              }
            }
          }
        });
      });
    }

    // --- 7. CAMERA TRACKING ---
    if (cameraRef.current) {
      const targetCamY = phys.y + 1.6;
      cameraRef.current.position.y += (targetCamY - cameraRef.current.position.y) * 0.08;
      cameraRef.current.lookAt(0, cameraRef.current.position.y - 2.8, 0);
    }

    if (ballLightRef.current) {
      ballLightRef.current.position.set(ballMesh.position.x, ballMesh.position.y + 0.3, ballMesh.position.z + 0.3);

      if (stats_ref.isFireball) {
        ballLightRef.current.color.setHex(0xff3c00);
        ballLightRef.current.intensity = 5.0;
      } else {
        ballLightRef.current.color.setHex(levelPalette.glow);
        ballLightRef.current.intensity = 3.5;
      }
    }
  };

  const shatterPlatformAndDescend = (platIdx: number, platform: any) => {
    platform.shattered = true;
    onComboChange(0);
    onScoreUp(120);
    sfx.playBreak();

    if (physicsRef.current.consecutivePlatformGaps >= 3) {
      physicsRef.current.consecutivePlatformGaps = 2;
    } else {
      onFireballStateChange(false);
    }

    platform.meshes.forEach((mesh: THREE.Mesh) => {
      mesh.visible = false;
      spawnPlatformShatterDebris(mesh);
    });

    if (platform.coinMesh) {
      platform.coinMesh.visible = false;
    }

    physicsRef.current.vy *= 0.8;
    shakeCamera();
  };

  const createBaseParticle = (
    pos: THREE.Vector3,
    color: string,
    speed: number,
    size: number
  ): BallParticle => {
    return {
      x: pos.x + (Math.random() - 0.5) * 0.1,
      y: pos.y + (Math.random() - 0.5) * 0.1,
      z: pos.z + (Math.random() - 0.5) * 0.1,
      vx: (Math.random() - 0.5) * speed,
      vy: (Math.random() - 0.5) * speed,
      vz: (Math.random() - 0.5) * speed,
      color,
      size: size * (0.8 + Math.random() * 0.4),
      alpha: 1.0,
      life: 0,
      maxLife: 30 + Math.floor(Math.random() * 20),
    };
  };

  const triggerSquashAnimation = () => {
    const ballMesh = ballMeshRef.current;
    if (!ballMesh) return;

    let progress = 0;
    const interval = setInterval(() => {
      progress += 0.2;
      if (progress >= Math.PI) {
        ballMesh.scale.set(1, 1, 1);
        clearInterval(interval);
      } else {
        const scaleY = 1.0 - Math.sin(progress) * 0.28;
        const scaleXZ = 1.0 + Math.sin(progress) * 0.14;
        ballMesh.scale.set(scaleXZ, scaleY, scaleXZ);
      }
    }, 16);
  };

  const spawnPaintSplatDecal = (platIdx: number, segIdx: number, platformY: number) => {
    const towerGroup = towerGroupRef.current;
    if (!towerGroup) return;

    const decalGeom = new THREE.CircleGeometry(0.18, 8);
    const paintColor = stats.isFireball ? 0xff4500 : levelPalette.safe;
    const decalMat = new THREE.MeshBasicMaterial({
      color: paintColor,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    });

    const decal = new THREE.Mesh(decalGeom, decalMat);
    decal.rotation.x = -Math.PI / 2;

    const randOffset = (Math.random() - 0.5) * 0.12;
    const angle = segIdx * (Math.PI / 6) + randOffset;
    const radius = 1.45 + (Math.random() - 0.5) * 0.1;

    decal.position.set(
      Math.cos(angle) * radius,
      0.11,
      -Math.sin(angle) * radius
    );

    decal.rotation.z = Math.random() * Math.PI;

    const platGroup = towerGroup.children[platIdx + 1];
    if (platGroup) {
      platGroup.add(decal);
      decalPoolRef.current.push({
        mesh: decal,
        parentPlatformIdx: platIdx,
        localAngle: angle,
        spawnTime: Date.now(),
      });
    }

    if (decalPoolRef.current.length > 40) {
      const oldest = decalPoolRef.current.shift();
      if (oldest) {
        const oldestPlatGroup = towerGroup.children[oldest.parentPlatformIdx + 1];
        if (oldestPlatGroup) oldestPlatGroup.remove(oldest.mesh);
      }
    }
  };

  const spawnBounceDustParticles = (pos: THREE.Vector3, colorVal: number) => {
    const colorStr = '#' + new THREE.Color(colorVal).getHexString();
    for (let i = 0; i < 12; i++) {
      const p = createBaseParticle(pos, colorStr, 0.08, 0.07);
      const angle = (i / 12) * Math.PI * 2;
      p.vx = Math.cos(angle) * (0.05 + Math.random() * 0.05);
      p.vy = 0.02 + Math.random() * 0.04;
      p.vz = Math.sin(angle) * (0.05 + Math.random() * 0.05);
      particlesRef.current.push(p);
    }
  };

  const spawnContinuousTrailParticles = (pos: THREE.Vector3) => {
    const trailColor = '#ff5100';
    const p = createBaseParticle(pos, trailColor, 0.04, 0.08);
    p.vy = 0.02 + Math.random() * 0.04;
    p.vx = (Math.random() - 0.5) * 0.02;
    p.vz = (Math.random() - 0.5) * 0.02;
    p.maxLife = 12 + Math.floor(Math.random() * 10);
    particlesRef.current.push(p);
  };

  const spawnCoinSparkleParticles = (pos: THREE.Vector3) => {
    for (let i = 0; i < 15; i++) {
      const p = createBaseParticle(pos, '#ffea00', 0.12, 0.08);
      particlesRef.current.push(p);
    }
  };

  const spawnCelebrationParticles = (yPos: number) => {
    const colors = ['#ff00ff', '#00ffff', '#ffff00', '#00ff00', '#ff8800'];
    const origin = new THREE.Vector3(0, yPos, targetRad);
    for (let i = 0; i < 60; i++) {
      const col = colors[Math.floor(Math.random() * colors.length)];
      const p = createBaseParticle(origin, col, 0.25, 0.12);
      p.vy = 0.1 + Math.random() * 0.2;
      p.maxLife = 50 + Math.floor(Math.random() * 30);
      particlesRef.current.push(p);
    }
  };

  const spawnDeadExplosionParticles = (pos: THREE.Vector3) => {
    const explosionColor = '#' + new THREE.Color(levelPalette.dead).getHexString();
    for (let i = 0; i < 35; i++) {
      const p = createBaseParticle(pos, explosionColor, 0.2, 0.11);
      p.maxLife = 40 + Math.floor(Math.random() * 20);
      particlesRef.current.push(p);
    }
  };

  const spawnPlatformShatterDebris = (segMesh: THREE.Mesh) => {
    const scene = sceneRef.current;
    const projGroup = projectileGroupRef.current;
    if (!scene || !projGroup) return;

    const worldPos = new THREE.Vector3();
    segMesh.getWorldPosition(worldPos);

    for (let i = 0; i < 3; i++) {
      const size = 0.15 + Math.random() * 0.15;
      const debrisGeom = new THREE.BoxGeometry(size, size, size);
      const debrisMat = new THREE.MeshStandardMaterial({
        color: segMesh.material instanceof THREE.MeshStandardMaterial ? segMesh.material.color : 0xff4400,
        roughness: 0.2,
        metalness: 0.1,
      });

      const debris = new THREE.Mesh(debrisGeom, debrisMat);
      debris.position.set(
        worldPos.x + (Math.random() - 0.5) * 0.4,
        worldPos.y + (Math.random() - 0.5) * 0.2,
        worldPos.z + (Math.random() - 0.5) * 0.4
      );

      const vx = (Math.random() - 0.5) * 0.16 + (worldPos.x * 0.08);
      const vy = 0.05 + Math.random() * 0.12;
      const vz = (Math.random() - 0.5) * 0.16 + (worldPos.z * 0.08);

      debris.userData = {
        vx, vy, vz,
        rotX: (Math.random() - 0.5) * 0.2,
        rotY: (Math.random() - 0.5) * 0.2,
        rotZ: (Math.random() - 0.5) * 0.2,
        life: 0,
        maxLife: 45 + Math.floor(Math.random() * 25),
      };

      projGroup.add(debris);
    }
  };

  const shakeCamera = () => {
    const camera = cameraRef.current;
    if (!camera) return;

    const originalX = camera.position.x;
    const originalZ = camera.position.z;

    let time = 0;
    const interval = setInterval(() => {
      time += 40;
      if (time >= 350) {
        camera.position.x = originalX;
        camera.position.z = originalZ;
        clearInterval(interval);
      } else {
        const intensity = 0.12 * (1.0 - time / 350);
        camera.position.x = originalX + (Math.random() - 0.5) * intensity;
        camera.position.z = originalZ + (Math.random() - 0.5) * intensity;
      }
    }, 16);
  };

  const updateParticlesDecals = (delta: number) => {
    const projGroup = projectileGroupRef.current;
    const scene = sceneRef.current;
    if (!scene) return;

    const activeParticles: BallParticle[] = [];
    particlesRef.current.forEach((p) => {
      p.life++;
      if (p.life < p.maxLife) {
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;
        p.vy -= 0.004;
        p.alpha = 1.0 - (p.life / p.maxLife);
        activeParticles.push(p);
      }
    });
    particlesRef.current = activeParticles;

    let particlePoolMeshGroup = scene.getObjectByName('particlePool') as THREE.Group;
    if (!particlePoolMeshGroup) {
      particlePoolMeshGroup = new THREE.Group();
      particlePoolMeshGroup.name = 'particlePool';
      scene.add(particlePoolMeshGroup);
    }

    while (particlePoolMeshGroup.children.length < particlesRef.current.length) {
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.08, 0.08),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1.0 })
      );
      particlePoolMeshGroup.add(m);
    }

    particlePoolMeshGroup.children.forEach((child, index) => {
      const mesh = child as THREE.Mesh;
      if (index < particlesRef.current.length) {
        const p = particlesRef.current[index];
        mesh.visible = true;
        mesh.position.set(p.x, p.y, p.z);
        mesh.scale.set(p.size, p.size, p.size);
        const mat = mesh.material as THREE.MeshBasicMaterial;
        mat.color.set(p.color);
        mat.opacity = p.alpha;
      } else {
        mesh.visible = false;
      }
    });

    if (projGroup) {
      const cleanupDebris: THREE.Object3D[] = [];
      projGroup.children.forEach((child) => {
        const mesh = child as THREE.Mesh;
        const u = mesh.userData;
        u.life++;

        if (u.life >= u.maxLife) {
          cleanupDebris.push(mesh);
        } else {
          mesh.position.x += u.vx;
          mesh.position.y += u.vy;
          mesh.position.z += u.vz;
          u.vy -= 0.008;

          mesh.rotation.x += u.rotX;
          mesh.rotation.y += u.rotY;
          mesh.rotation.z += u.rotZ;

          const ratio = 1.0 - (u.life / u.maxLife);
          mesh.scale.set(ratio, ratio, ratio);
        }
      });

      cleanupDebris.forEach((mesh) => projGroup.remove(mesh));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => { onDragStart(e.clientX); };
  const handleMouseMove = (e: React.MouseEvent) => { onDragMove(e.clientX); };
  const handleMouseUpOrLeave = () => { onDragEnd(); };
  const handleTouchStart = (e: React.TouchEvent) => { if (e.touches.length > 0) onDragStart(e.touches[0].clientX); };
  const handleTouchMove = (e: React.TouchEvent) => { if (e.touches.length > 0) onDragMove(e.touches[0].clientX); };
  const handleTouchEnd = () => { onDragEnd(); };

  return (
    <>
      <div
        id="game-canvas-container"
        ref={containerRef}
        className="absolute inset-0 w-full h-full select-none cursor-grab active:cursor-grabbing outline-none overflow-hidden touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        tabIndex={0}
      />
      {activeChallenge?.id === 'blind' && isPlaying && (
        <div 
          id="blind-fog-vignette" 
          className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,transparent_15%,rgba(7,11,21,0.94)_75%)] z-10 transition-all duration-1000 animate-fade-in" 
        />
      )}
    </>
  );
};
