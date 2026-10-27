import { useEffect, useRef, type RefObject } from "react";

type WebGLHeroOverlayProps = {
  progressRef: RefObject<number>;
  reduced: boolean;
};

const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = `
  precision mediump float;

  varying vec2 vUv;
  uniform float uTime;
  uniform float uProgress;
  uniform float uAspect;
  uniform vec2 uPointer;

  float hash(vec2 value) {
    return fract(sin(dot(value, vec2(127.1, 311.7))) * 43758.5453123);
  }

  void main() {
    vec2 centered = vUv - 0.5;
    float vignette = 1.0 - smoothstep(0.12, 0.82, length(centered));

    // Grão de película, que muda a cada fração de segundo
    float grain = hash(floor(vUv * vec2(900.0, 506.0)) + floor(uTime * 24.0));

    // Faixa de luz que atravessa o quadro conforme o filme avança
    float sweep = smoothstep(-0.25, 0.45, vUv.x + (uProgress * 0.92) - 0.48);

    // Mancha de luz quente que acompanha o ponteiro, como sol entrando pela abertura
    vec2 toPointer = (vUv - uPointer) * vec2(uAspect, 1.0);
    float glow = exp(-dot(toPointer, toPointer) * 5.5);

    float horizon = smoothstep(0.0, 0.88, vUv.y);
    float base = (0.012 + grain * 0.034 + sweep * 0.024) * vignette * (0.35 + horizon * 0.65);
    float alpha = base + glow * 0.085;

    gl_FragColor = vec4(mix(vec3(0.92, 0.63, 0.34), vec3(1.0, 0.86, 0.62), glow), alpha);
  }
`;

/**
 * Camada de acabamento sobre o filme: grão, uma faixa de luz presa à rolagem e
 * uma mancha quente que segue o ponteiro. Só desenha enquanto o herói está à
 * vista e a aba está ativa, e some em telas pequenas de toque.
 */
export function WebGLHeroOverlay({ progressRef, reduced }: WebGLHeroOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || reduced) return;
    if (window.matchMedia("(max-width: 700px) and (pointer: coarse)").matches) {
      canvas.hidden = true;
      return;
    }

    let disposed = false;
    let release: (() => void) | undefined;

    void import("../lib/three")
      .then((THREE) => {
        if (disposed) return;

        try {
          const renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true,
            antialias: false,
            powerPreference: "low-power",
          });
          const scene = new THREE.Scene();
          const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
          const material = new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            uniforms: {
              uTime: { value: 0 },
              uProgress: { value: 0 },
              uAspect: { value: 1.78 },
              uPointer: { value: new THREE.Vector2(0.68, 0.38) },
            },
            vertexShader,
            fragmentShader,
          });
          const geometry = new THREE.PlaneGeometry(2, 2);
          scene.add(new THREE.Mesh(geometry, material));

          renderer.setClearColor(0x000000, 0);
          renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

          const pointer = new THREE.Vector2(0.68, 0.38);
          const startedAt = performance.now();
          let frame = 0;
          let inView = true;

          const resize = () => {
            const { width, height } = canvas.getBoundingClientRect();
            renderer.setSize(Math.max(1, width), Math.max(1, height), false);
            material.uniforms.uAspect.value = width / Math.max(1, height);
          };

          const render = () => {
            frame = 0;
            const uniforms = material.uniforms;
            uniforms.uTime.value = (performance.now() - startedAt) / 1000;
            uniforms.uProgress.value = progressRef.current;
            uniforms.uPointer.value.lerp(pointer, 0.06);
            renderer.render(scene, camera);
            schedule();
          };

          const schedule = () => {
            if (!frame && inView && !document.hidden) frame = window.requestAnimationFrame(render);
          };

          const onPointerMove = (event: PointerEvent) => {
            pointer.set(event.clientX / window.innerWidth, 1 - event.clientY / window.innerHeight);
          };

          const onVisibility = () => {
            if (document.hidden) {
              window.cancelAnimationFrame(frame);
              frame = 0;
            } else schedule();
          };

          const resizeObserver = new ResizeObserver(resize);
          resizeObserver.observe(canvas);
          const viewObserver = new IntersectionObserver(([entry]) => {
            inView = entry.isIntersecting;
            if (inView) schedule();
          });
          viewObserver.observe(canvas);

          window.addEventListener("pointermove", onPointerMove, { passive: true });
          document.addEventListener("visibilitychange", onVisibility);
          canvas.addEventListener("webglcontextlost", () => (canvas.hidden = true), { once: true });

          resize();
          schedule();

          release = () => {
            window.cancelAnimationFrame(frame);
            resizeObserver.disconnect();
            viewObserver.disconnect();
            window.removeEventListener("pointermove", onPointerMove);
            document.removeEventListener("visibilitychange", onVisibility);
            geometry.dispose();
            material.dispose();
            renderer.dispose();
          };

          if (disposed) release();
        } catch {
          canvas.hidden = true;
        }
      })
      .catch(() => {
        canvas.hidden = true;
      });

    return () => {
      disposed = true;
      release?.();
    };
  }, [progressRef, reduced]);

  return <canvas ref={canvasRef} className="hero-webgl" aria-hidden="true" />;
}
