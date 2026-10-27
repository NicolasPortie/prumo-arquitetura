import { gsap } from "./gsap";
import type * as ThreeNS from "./three";

type Three = typeof ThreeNS;
type Timeline = ReturnType<typeof gsap.timeline>;

export type House = {
  /** Escreve a montagem da casa num timeline de duração 1 (posições de 0 a 1). */
  choreograph: (timeline: Timeline) => void;
  /** Liga ou desliga o desenho contínuo (só enquanto a cena aparece na tela). */
  setActive: (active: boolean) => void;
  /** Desenha um quadro agora (usado com movimento reduzido). */
  renderOnce: () => void;
  dispose: () => void;
};

const COLORS = {
  concrete: 0xd8d4cb,
  slate: 0x2a2f36,
  frame: 0x15181d,
  glass: 0x9cc3d6,
  lawn: 0x64795a,
  lawnDusk: 0x4f654a,
  water: 0x3a9bb8,
  clay: 0xe3b57c,
  stone: 0x8d9bb3,
  leaf: [0x5f8a4e, 0x74984f, 0x4f7a47, 0x86a55a],
} as const;

/** Textura de ripas de madeira, desenhada em canvas para não pesar no carregamento. */
function woodTexture(THREE: Three) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const g = canvas.getContext("2d")!;
  g.fillStyle = "#a9754b";
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 16; i++) {
    g.fillStyle = i % 2 ? "rgba(70,38,16,0.32)" : "rgba(255,226,180,0.1)";
    g.fillRect(i * 16, 0, i % 2 ? 2 : 14, 256);
  }
  for (let i = 0; i < 70; i++) {
    g.fillStyle = `rgba(60,30,10,${Math.random() * 0.12})`;
    g.fillRect(Math.random() * 256, Math.random() * 256, 1, 18 + Math.random() * 60);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.repeat.set(2, 1);
  return texture;
}

/** Pedra em fiadas irregulares, para a empena fechada da casa. */
function stoneTexture(THREE: Three) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const g = canvas.getContext("2d")!;
  g.fillStyle = "#6a7078";
  g.fillRect(0, 0, 256, 256);
  for (let row = 0; row < 8; row++) {
    let x = -Math.random() * 40;
    while (x < 256) {
      const w = 34 + Math.random() * 40;
      const tone = 105 + Math.random() * 45;
      g.fillStyle = `rgb(${tone},${tone + 4},${tone + 10})`;
      g.fillRect(x + 1.5, row * 32 + 1.5, w - 3, 29);
      x += w;
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createHouse(THREE: Three, canvas: HTMLCanvasElement): House {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 120);
  const disposables: { dispose(): void }[] = [renderer];
  const track = <T extends { dispose(): void }>(item: T) => {
    disposables.push(item);
    return item;
  };

  // ---- Luz: manhã fria que termina em entardecer quente ------------------
  const hemi = new THREE.HemisphereLight(0xcfe0f2, 0x2a2824, 0.8);
  const sun = new THREE.DirectionalLight(0xdbe8ff, 2.9);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -10;
  sun.shadow.camera.right = 10;
  sun.shadow.camera.top = 10;
  sun.shadow.camera.bottom = -10;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 40;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  scene.add(hemi, sun);

  const indoor = new THREE.PointLight(0xffb066, 0, 7, 1.6);
  indoor.position.set(0.2, 1.3, 0.3);
  const indoorUp = new THREE.PointLight(0xffb066, 0, 5, 1.6);
  indoorUp.position.set(1.4, 3.0, -0.2);
  scene.add(indoor, indoorUp);

  // ---- Materiais -----------------------------------------------------------
  const std = (color: number, roughness = 0.85, extra: NonNullable<ConstructorParameters<Three["MeshStandardMaterial"]>[0]> = {}) =>
    track(new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, ...extra }));

  const concrete = std(COLORS.concrete, 0.92);
  const slate = std(COLORS.slate, 0.9);
  const frame = std(COLORS.frame, 0.5, { metalness: 0.3 });
  const wood = std(0xffffff, 0.7, { map: track(woodTexture(THREE)) });
  const stone = std(0xffffff, 1, { map: track(stoneTexture(THREE)) });
  const glass = std(COLORS.glass, 0.06, { transparent: true, opacity: 0, metalness: 0.2, depthWrite: false });
  const lawn = std(COLORS.lawn, 1);
  const water = std(COLORS.water, 0.3, { metalness: 0.15, emissive: 0x0a4a66, emissiveIntensity: 0.3 });
  const warmFloor = track(new THREE.MeshBasicMaterial({ color: 0xffc27d, transparent: true, opacity: 0 }));

  // ---- Peças ---------------------------------------------------------------
  const world = new THREE.Group();
  scene.add(world);

  type Grown = ThreeNS.Mesh;
  const box = (
    [w, h, d]: [number, number, number],
    [x, y, z]: [number, number, number],
    material: ThreeNS.MeshStandardMaterial | ThreeNS.MeshBasicMaterial,
    { cast = true, receive = true }: { cast?: boolean; receive?: boolean } = {},
  ): Grown => {
    const geometry = track(new THREE.BoxGeometry(w, h, d));
    geometry.translate(0, h / 2, 0); // cresce a partir da base
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = cast;
    mesh.receiveShadow = receive;
    world.add(mesh);
    return mesh;
  };

  // Terreno: base escura + gramado
  const platformGeometry = track(new THREE.CylinderGeometry(7.4, 7.4, 0.5, 72));
  platformGeometry.translate(0, -0.25, 0);
  const platform = new THREE.Mesh(platformGeometry, slate);
  platform.receiveShadow = true;
  world.add(platform);

  const lawnGeometry = track(new THREE.CircleGeometry(7.2, 72));
  lawnGeometry.rotateX(-Math.PI / 2);
  const lawnMesh = new THREE.Mesh(lawnGeometry, lawn);
  lawnMesh.position.y = 0.004;
  lawnMesh.receiveShadow = true;
  world.add(lawnMesh);

  // Curvas de nível e limite do lote (desenhadas na etapa 1)
  const lineMaterial = track(new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }));
  const contours: ThreeNS.LineLoop[] = [];
  [2.6, 4.4, 6.2].forEach((radius, ring) => {
    const points: number[] = [];
    for (let i = 0; i < 96; i++) {
      const a = (i / 96) * Math.PI * 2;
      const wobble = 1 + Math.sin(a * 3 + ring) * 0.04;
      points.push(Math.cos(a) * radius * wobble, 0.02, Math.sin(a) * radius * wobble);
    }
    const geometry = track(new THREE.BufferGeometry());
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    const loop = new THREE.LineLoop(geometry, lineMaterial);
    contours.push(loop);
    world.add(loop);
  });

  const plotPoints = [-5.2, 0.03, -3.6, 5.2, 0.03, -3.6, 5.2, 0.03, 3.6, -5.2, 0.03, 3.6];
  const plotGeometry = track(new THREE.BufferGeometry());
  plotGeometry.setAttribute("position", new THREE.Float32BufferAttribute(plotPoints, 3));
  const plotMaterial = track(
    new THREE.LineDashedMaterial({ color: COLORS.clay, dashSize: 0.3, gapSize: 0.18, transparent: true, opacity: 0.95 }),
  );
  const plot = new THREE.LineLoop(plotGeometry, plotMaterial);
  plot.computeLineDistances();
  world.add(plot);
  const plotDraw = { n: 0 };
  plotGeometry.setDrawRange(0, 0);

  // Percurso do sol
  const arcPoints: number[] = [];
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * Math.PI;
    arcPoints.push(Math.cos(a) * 9.5, Math.sin(a) * 6.8 + 0.4, -2.5);
  }
  const arcGeometry = track(new THREE.BufferGeometry());
  arcGeometry.setAttribute("position", new THREE.Float32BufferAttribute(arcPoints, 3));
  const arcMaterial = track(new THREE.LineBasicMaterial({ color: COLORS.clay, transparent: true, opacity: 0.5, depthWrite: false }));
  const arc = new THREE.Line(arcGeometry, arcMaterial);
  world.add(arc);
  arcGeometry.setDrawRange(0, 0);
  const arcDraw = { n: 0 };
  const sunBall = new THREE.Mesh(
    track(new THREE.SphereGeometry(0.28, 24, 16)),
    track(new THREE.MeshBasicMaterial({ color: COLORS.clay })),
  );
  sunBall.scale.setScalar(0.0001);
  world.add(sunBall);

  // Casa
  const house = new THREE.Group();
  world.add(house);
  const parts: Grown[] = [];
  const add = (mesh: Grown) => {
    house.add(mesh);
    mesh.scale.y = 0.0001;
    parts.push(mesh);
    return mesh;
  };
  const keep = (mesh: Grown) => {
    house.add(mesh);
    return mesh;
  };

  const FLOOR = 0.3;
  const LEVEL1 = FLOOR + 1.7;
  const LEVEL2 = LEVEL1 + 0.22;

  const slab = add(box([8.4, FLOOR, 5.4], [0, 0, 0.1], concrete));
  const wall = add(box([1.7, 1.7, 4.2], [-3.2, FLOOR, 0], stone));
  const livingGlass = add(box([6.5, 1.7, 3.7], [0.55, FLOOR, 0.05], glass, { cast: false, receive: false }));
  const roof1 = add(box([8.4, 0.22, 5.4], [0, LEVEL1, 0.1], concrete));
  const upper = add(box([4.6, 1.5, 3.2], [1.5, LEVEL2, -0.3], wood));
  const upperGlass = add(box([3.2, 1.0, 0.06], [1.2, LEVEL2 + 0.25, 1.33], glass, { cast: false, receive: false }));
  const roof2 = add(box([5.6, 0.2, 4.0], [1.5, LEVEL2 + 1.5, -0.1], concrete));

  // Esquadrias do térreo
  const mullions: Grown[] = [];
  [-2.2, -1.1, 0, 1.1, 2.2, 3.3].forEach((x) => {
    mullions.push(add(box([0.07, 1.7, 0.07], [x + 0.1, FLOOR, 1.9], frame)));
  });
  // Colunas do terraço
  const columns: Grown[] = [];
  [-3.9, -1.0, 2.0, 3.9].forEach((x) => {
    columns.push(add(box([0.12, 1.7, 0.12], [x, FLOOR, 2.6], frame)));
  });
  // Brises de madeira na frente do pavimento superior
  const slats: Grown[] = [];
  for (let i = 0; i < 13; i++) {
    slats.push(add(box([0.06, 1.35, 0.14], [-0.65 + i * 0.36, LEVEL2 + 0.07, 1.85], wood)));
  }
  // Piso aceso visto através do vidro
  keep(box([6.2, 0.02, 3.4], [0.55, FLOOR + 0.01, 0.05], warmFloor, { cast: false, receive: false }));
  const sofa = add(box([1.9, 0.45, 0.8], [-0.4, FLOOR, -0.55], slate));
  const table = add(box([1.1, 0.4, 0.7], [1.6, FLOOR, 0.35], concrete));

  // Piscina e deck
  const deck = add(box([5.4, 0.1, 2.2], [1.3, 0, 4.3], concrete));
  const pool = add(box([4.4, 0.06, 1.4], [1.3, 0.09, 4.3], water));
  // Caminho de entrada
  const stepping: Grown[] = [];
  for (let i = 0; i < 5; i++) {
    stepping.push(add(box([1.1, 0.06, 0.55], [-2.2 - i * 0.18, 0, 5.2 + i * 0.5], concrete)));
  }

  // Árvores
  const trees: ThreeNS.Group[] = [];
  const treeSpots: [number, number, number][] = [
    [-5.4, -1.6, 1.25],
    [-4.4, 3.4, 1],
    [5.5, -2.0, 1.3],
    [5.8, 1.6, 0.9],
    [-1.0, -4.6, 1.1],
    [3.4, -4.4, 0.95],
    [-5.9, 0.9, 0.8],
  ];
  const trunkGeometry = track(new THREE.CylinderGeometry(0.07, 0.11, 1, 8));
  trunkGeometry.translate(0, 0.5, 0);
  const trunkMaterial = std(0x5a4636, 1);
  const canopyGeometry = track(new THREE.IcosahedronGeometry(0.75, 1));
  treeSpots.forEach(([x, z, size], i) => {
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.scale.set(size, size * 1.7, size);
    trunk.castShadow = true;
    const leaf = std(COLORS.leaf[i % COLORS.leaf.length], 0.95, { flatShading: true });
    const canopy = new THREE.Mesh(canopyGeometry, leaf);
    canopy.position.y = size * 1.7 + 0.55 * size;
    canopy.scale.set(size * 1.1, size * 0.95, size * 1.1);
    canopy.castShadow = true;
    canopy.receiveShadow = true;
    tree.add(trunk, canopy);
    tree.position.set(x, 0, z);
    tree.scale.setScalar(0.0001);
    world.add(tree);
    trees.push(tree);
  });

  // ---- Estado compartilhado (o timeline anima, o desenho lê) -------------
  const state = { angle: -1.0, height: 8.2, dist: 18, look: 0.6, dusk: 0, lights: 0 };
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

  const dayHemi = new THREE.Color(0xcfe0f2);
  const duskHemi = new THREE.Color(0x8da2cf);
  const daySun = new THREE.Color(0xdbe8ff);
  const duskSun = new THREE.Color(0xffc283);
  const dayLawn = new THREE.Color(COLORS.lawn);
  const duskLawn = new THREE.Color(COLORS.lawnDusk);
  const color = new THREE.Color();

  const applyState = () => {
    const d = state.dusk;

    hemi.intensity = 0.8 - d * 0.22;
    color.copy(dayHemi).lerp(duskHemi, d);
    hemi.color.copy(color);
    sun.intensity = 2.9 + d * 0.5;
    sun.color.copy(daySun).lerp(duskSun, d);
    // o sol desce enquanto a obra avança
    const sunAngle = Math.PI * (0.62 - 0.5 * d);
    sun.position.set(Math.cos(sunAngle) * 11, Math.sin(sunAngle) * 11 + 1.5, 4 + d * 2);
    sunBall.position.set(Math.cos(sunAngle) * 9.5, Math.sin(sunAngle) * 6.8 + 0.4, -2.5);
    lawn.color.copy(dayLawn).lerp(duskLawn, d);

    for (const part of parts) part.visible = part.scale.y > 0.01;
    for (const tree of trees) tree.visible = tree.scale.x > 0.01;
    sunBall.visible = sunBall.scale.x > 0.01;

    indoor.intensity = state.lights * 18;
    indoorUp.intensity = state.lights * 12;
    warmFloor.opacity = state.lights * 0.75;

    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;

    const aspect = camera.aspect;
    const fit = aspect < 0.8 ? 1.55 : aspect < 1.3 ? 1.6 : 1.38;
    const angle = state.angle + pointer.x * 0.1;
    const dist = state.dist * fit;
    camera.position.set(Math.sin(angle) * dist, state.height + pointer.y * 0.5, Math.cos(angle) * dist);
    camera.lookAt(0, state.look, 0);
  };

  const resize = () => {
    const { width, height } = canvas.getBoundingClientRect();
    renderer.setSize(Math.max(1, width), Math.max(1, height), false);
    camera.aspect = width / Math.max(1, height);
    // em telas largas a casa vai um pouco para a direita, abrindo espaço ao texto
    if (camera.aspect > 1.3) camera.setViewOffset(width, height, -width * 0.09, 0, width, height);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  };

  const draw = () => {
    applyState();
    renderer.render(scene, camera);
  };

  let active = false;
  const setActive = (next: boolean) => {
    if (next === active) return;
    active = next;
    if (active) gsap.ticker.add(draw);
    else gsap.ticker.remove(draw);
  };

  const onPointerMove = (event: PointerEvent) => {
    pointer.tx = (event.clientX / window.innerWidth - 0.5) * 2;
    pointer.ty = (0.5 - event.clientY / window.innerHeight) * 2;
  };
  window.addEventListener("pointermove", onPointerMove, { passive: true });

  const resizeObserver = new ResizeObserver(() => {
    resize();
    draw();
  });
  resizeObserver.observe(canvas);
  resize();

  // ---- Coreografia ---------------------------------------------------------
  const choreograph = (tl: Timeline) => {
    const rise = (target: Grown | Grown[], at: number, duration = 0.12, stagger = 0, ease = "power3.out") =>
      tl.to(
        gsap.utils.toArray<Grown>(target).map((m) => m.scale),
        { y: 1, duration, stagger, ease },
        at,
      );

    // Etapa 1: o terreno (0 a 0.3)
    tl.fromTo(platform.scale, { x: 0.5, z: 0.5 }, { x: 1, z: 1, duration: 0.12, ease: "power3.out" }, 0)
      .fromTo(lawnMesh.scale, { x: 0.0001, z: 0.0001 }, { x: 1, z: 1, duration: 0.14, ease: "power3.out" }, 0.02)
      .to(lineMaterial, { opacity: 0.38, duration: 0.1 }, 0.06)
      .to(plotDraw, { n: 4, duration: 0.16, ease: "power2.inOut", onUpdate: () => plotGeometry.setDrawRange(0, Math.ceil(plotDraw.n)) }, 0.08)
      .to(arcDraw, { n: 65, duration: 0.18, ease: "power2.out", onUpdate: () => arcGeometry.setDrawRange(0, Math.ceil(arcDraw.n)) }, 0.06)
      .to(sunBall.scale, { x: 1, y: 1, z: 1, duration: 0.08, ease: "back.out(2)" }, 0.18);

    // Etapa 2: o projeto (0.3 a 0.65)
    rise(slab, 0.3, 0.1);
    rise(wall, 0.34, 0.12);
    rise(roof1, 0.4, 0.1);
    rise(upper, 0.45, 0.13);
    rise(roof2, 0.52, 0.1);
    tl.to(glass, { opacity: 0.34, duration: 0.1, ease: "power1.out" }, 0.5);
    rise(livingGlass, 0.46, 0.1);
    rise(upperGlass, 0.56, 0.06);
    rise(mullions, 0.55, 0.08, 0.012);
    rise(columns, 0.58, 0.08, 0.015);
    tl.to(plotMaterial, { opacity: 0.35, duration: 0.1 }, 0.6);

    // Etapa 3: a obra (0.65 a 1)
    rise(slats, 0.66, 0.1, 0.012);
    rise([sofa, table], 0.72, 0.08, 0.03);
    rise(deck, 0.7, 0.08);
    rise(pool, 0.76, 0.08);
    rise(stepping, 0.76, 0.06, 0.02);
    // cada árvore já carrega o próprio tamanho; o grupo só cresce de 0 a 1
    tl.to(trees.map((t) => t.scale), { x: 1, y: 1, z: 1, duration: 0.12, stagger: 0.02, ease: "back.out(1.7)" }, 0.74);
    tl.to(state, { dusk: 1, duration: 0.3, ease: "power1.inOut" }, 0.66).to(state, { lights: 1, duration: 0.14, ease: "power1.in" }, 0.8);

    // A câmera acompanha as três etapas em um só movimento contínuo
    tl.fromTo(
      state,
      { angle: -1.0, height: 8.2, dist: 18, look: 0.6 },
      { angle: -0.42, height: 6.6, dist: 16, look: 0.8, duration: 0.33, ease: "none" },
      0,
    )
      .to(state, { angle: 0.12, height: 5.0, dist: 14.4, look: 1.2, duration: 0.33, ease: "none" }, 0.33)
      .to(state, { angle: 0.52, height: 3.8, dist: 15.4, look: 1.3, duration: 0.34, ease: "none" }, 0.66);
  };

  return {
    choreograph,
    setActive,
    renderOnce: draw,
    dispose: () => {
      setActive(false);
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      disposables.forEach((item) => item.dispose());
    },
  };
}
