import { gsap } from "./gsap";

/**
 * Cobre a imagem com lâminas verticais da cor do fundo e as gira como brises
 * abrindo, da esquerda para a direita. A foto assenta de leve por trás. As
 * lâminas saem do DOM quando a animação termina.
 */
export function createBrise(frame: HTMLElement, count = Number(frame.dataset.brise ?? 9)) {
  const blinds = document.createElement("div");
  blinds.className = "brise";
  blinds.setAttribute("aria-hidden", "true");
  for (let i = 0; i < count; i++) blinds.appendChild(document.createElement("span"));
  frame.appendChild(blinds);
  gsap.set(frame, { visibility: "visible" });

  const picture = frame.querySelector("picture");
  const timeline = gsap.timeline({ paused: true, onComplete: () => blinds.remove() });

  timeline.to(blinds.children, {
    rotateY: -92,
    duration: 1.15,
    ease: "power3.inOut",
    stagger: { each: 0.06, from: "start" },
  });

  if (picture) {
    timeline.fromTo(
      picture,
      { scale: 1.1 },
      { scale: 1, duration: 1.7, ease: "expo.out", clearProps: "transform" },
      0.1,
    );
  }

  return {
    timeline,
    destroy() {
      timeline.kill();
      blinds.remove();
    },
  };
}
