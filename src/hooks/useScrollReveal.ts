import { type RefObject } from "react";
import { createBrise } from "../lib/brise";
import { gsap, ScrollTrigger, SplitText, useGSAP } from "../lib/gsap";
import { useReducedMotion } from "./useReducedMotion";

const START = "top 88%";

/**
 * Revelações da página, todas ligadas ao ScrollTrigger e disparadas uma vez:
 *
 * - `data-reveal="fade"`   sobe e aparece (em lote, com escalonamento)
 * - `data-reveal="brise"`  imagem que abre em lâminas, como brises (ver lib/brise)
 * - `data-reveal="line"`   filete que cresce
 * - `data-reveal="split"`  título em linhas, com máscara (SplitText)
 * - `data-scrub-words`     frase que acende palavra a palavra com a rolagem
 * - `data-parallax`        a imagem interna anda mais devagar que o quadro
 *
 * Os estados iniciais ficam em motion.css e só valem sem `prefers-reduced-motion`.
 */
export function useScrollReveal(container: RefObject<HTMLElement | null>) {
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const root = container.current;
      if (!root || reduced) return;

      const inRoot = <T extends HTMLElement>(selector: string) =>
        gsap.utils.toArray<T>(selector, root).filter((el) => !el.closest("#top"));

      ScrollTrigger.batch(inRoot('[data-reveal="fade"]'), {
        start: START,
        once: true,
        onEnter: (batch) =>
          gsap.fromTo(
            batch,
            { opacity: 0, y: 28 },
            { opacity: 1, y: 0, duration: 0.95, stagger: 0.08, ease: "expo.out", overwrite: "auto" },
          ),
      });

      const brises = inRoot('[data-reveal="brise"]').map((el) => {
        const brise = createBrise(el);
        ScrollTrigger.create({ trigger: el, start: START, once: true, onEnter: () => brise.timeline.play() });
        return brise;
      });

      inRoot('[data-reveal="line"]').forEach((el) => {
        ScrollTrigger.create({
          trigger: el,
          start: START,
          once: true,
          onEnter: () =>
            gsap.to(el, { scaleX: 1, duration: 0.9, ease: "expo.out", overwrite: "auto" }),
        });
      });

      inRoot('[data-reveal="split"]').forEach((el) => {
        SplitText.create(el, {
          type: "lines",
          mask: "lines",
          linesClass: "split-line",
          autoSplit: true,
          onSplit(self) {
            gsap.set(el, { visibility: "visible" });
            return gsap.from(self.lines, {
              yPercent: 108,
              duration: 1.15,
              stagger: 0.09,
              ease: "expo.out",
              scrollTrigger: { trigger: el, start: START, once: true },
            });
          },
        });
      });

      inRoot("[data-scrub-words]").forEach((el) => {
        // aria "none": o texto segue legível como está; um aria-label em <p> seria inválido
        const split = SplitText.create(el, { type: "words", wordsClass: "scrub-word", tag: "span", aria: "none" });
        gsap.set(el, { visibility: "visible" });
        gsap.fromTo(
          split.words,
          // piso de opacidade que ainda passa contraste 3:1 (texto grande); a palavra em destaque é mais escura
          { opacity: (_: number, word: Element) => (word.closest("em") ? 0.78 : 0.5) },
          {
            opacity: 1,
            ease: "none",
            stagger: 0.12,
            scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 55%", scrub: true },
          },
        );
      });

      inRoot("[data-parallax]").forEach((frame) => {
        const media = frame.querySelector("img");
        if (!media) return;
        gsap.fromTo(
          media,
          { yPercent: -7, scale: 1.16 },
          {
            yPercent: 7,
            scale: 1.16,
            ease: "none",
            scrollTrigger: { trigger: frame, start: "top bottom", end: "bottom top", scrub: 0.6 },
          },
        );
      });

      return () => brises.forEach((brise) => brise.destroy());
    },
    { scope: container, dependencies: [reduced], revertOnUpdate: true },
  );
}
