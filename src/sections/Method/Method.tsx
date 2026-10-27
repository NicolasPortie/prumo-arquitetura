import { useRef } from "react";
import { PROCESS_STEPS } from "../../data/process";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { gsap, ScrollTrigger, useGSAP } from "../../lib/gsap";
import type { House } from "../../lib/house";

const pad = (value: number) => String(value).padStart(2, "0");
const COUNT = PROCESS_STEPS.length;

/**
 * Uma casa que se constrói com a rolagem. A seção fica fixa na tela e um único
 * timeline do GSAP conduz tudo: a casa em 3D (lib/house), a troca de texto e a
 * barra de progresso. As três etapas ocupam um terço da rolagem cada.
 */
export function Method() {
  const rootRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const root = rootRef.current;
      const pin = pinRef.current;
      const canvas = canvasRef.current;
      if (!root || !pin || !canvas) return;

      const steps = gsap.utils.toArray<HTMLElement>(".method-step", root);
      const dots = gsap.utils.toArray<HTMLElement>(".method-progress li", root);
      const setActive = (index: number) =>
        dots.forEach((dot, i) => dot.setAttribute("data-active", String(i === index)));
      setActive(0);

      let house: House | undefined;
      let disposed = false;

      const master = gsap.timeline({
        defaults: { ease: "none" },
        paused: reduced,
        scrollTrigger: reduced
          ? undefined
          : {
              id: "method-pin",
              trigger: root,
              start: "top top",
              end: () => `+=${window.innerHeight * 3.4}`,
              pin,
              scrub: 0.9,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              onUpdate: (self) => setActive(Math.min(COUNT - 1, Math.floor(self.progress * COUNT))),
            },
      });
      master.set({}, {}, 1); // fixa a duração em 1, como a rolagem

      if (!reduced) {
        // Texto: cada etapa sai para cima e a próxima sobe no lugar
        steps.forEach((step, index) => {
          const parts = step.querySelectorAll("span, h3, p");
          if (index > 0) gsap.set(step, { autoAlpha: 0 });
          const at = index / COUNT;
          if (index > 0) {
            master.fromTo(
              parts,
              { y: 38, autoAlpha: 0 },
              { y: 0, autoAlpha: 1, duration: 0.07, stagger: 0.012, ease: "power3.out" },
              at - 0.005,
            );
            master.set(step, { autoAlpha: 1 }, at - 0.005);
          }
          if (index < COUNT - 1) {
            master.to(parts, { y: -38, autoAlpha: 0, duration: 0.05, stagger: 0.008, ease: "power2.in" }, (index + 1) / COUNT - 0.055);
          }
        });
        master.to(".method-progress-fill", { scaleY: 1, duration: 1 }, 0);
        // O céu esquenta junto com a luz da casa
        master.to(".method-sky-dusk", { autoAlpha: 1, duration: 0.3, ease: "power1.inOut" }, 0.7);
      }

      // A cena 3D chega depois: o texto e a rolagem já funcionam sem ela
      void import("../../lib/three")
        .then(async (THREE) => {
          const { createHouse } = await import("../../lib/house");
          if (disposed) return;
          house = createHouse(THREE, canvas);
          house.choreograph(master);

          if (reduced) {
            master.progress(1);
            house.renderOnce();
            return;
          }

          ScrollTrigger.create({
            trigger: root,
            start: "top bottom",
            end: "bottom top",
            onToggle: (self) => house?.setActive(self.isActive),
          });
          master.invalidate();
          ScrollTrigger.refresh();
        })
        .catch(() => {
          canvas.hidden = true;
        });

      return () => {
        disposed = true;
        house?.dispose();
      };
    },
    { scope: rootRef, dependencies: [reduced], revertOnUpdate: true },
  );

  return (
    <section ref={rootRef} id="metodo" className="method" data-reduced={reduced}>
      <div ref={pinRef} className="method-pin">
        <div className="method-sky" aria-hidden="true" />
        <div className="method-sky-dusk" aria-hidden="true" />
        <canvas ref={canvasRef} aria-hidden="true" />

        <div className="site-grid method-ui">
          <h2 className="method-title">
            Como a gente <em>trabalha</em>
          </h2>

          <ol className="method-copy">
            {PROCESS_STEPS.map((step, index) => (
              <li key={step.name} className="method-step">
                <span className="method-step-index">{pad(index + 1)}</span>
                <h3>{step.name}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>

          <div className="method-progress" aria-hidden="true">
            <span className="method-progress-track">
              <span className="method-progress-fill" />
            </span>
            <ul>
              {PROCESS_STEPS.map((step, index) => (
                <li key={step.name}>{pad(index + 1)}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
