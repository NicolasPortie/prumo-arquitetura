import Lenis from "lenis";
import { gsap, ScrollTrigger } from "./gsap";

let instance: Lenis | null = null;

/** Rolagem suave ligada ao ticker do GSAP, para o ScrollTrigger enxergar o mesmo scroll. */
export function startSmoothScroll() {
  const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  instance = lenis;

  lenis.on("scroll", ScrollTrigger.update);
  const tick = (time: number) => lenis.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  return () => {
    gsap.ticker.remove(tick);
    lenis.destroy();
    instance = null;
  };
}

/** Congela a rolagem da página enquanto o índice ou um projeto estão abertos. */
export function setScrollLocked(locked: boolean) {
  if (!instance) return;
  if (locked) instance.stop();
  else instance.start();
}

/** Leva a página até um id (`#projetos`) e devolve o foco ao destino, para teclado e leitor de tela. */
export function scrollToHash(hash: string, { immediate = false } = {}) {
  const id = decodeURIComponent(hash.replace(/^#/, ""));
  const target = id && id !== "top" ? document.getElementById(id) : null;
  if (id && id !== "top" && !target) return;

  if (instance) {
    instance.scrollTo(target ?? 0, {
      immediate,
      force: true,
      duration: 1.5,
      easing: (t) => 1 - Math.pow(1 - t, 4),
    });
  } else {
    window.scrollTo({
      top: target ? target.getBoundingClientRect().top + window.scrollY : 0,
      behavior: immediate ? "auto" : "smooth",
    });
  }

  if (target) {
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  }
}
