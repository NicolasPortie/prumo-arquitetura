import { useRef, useState } from "react";
import { STUDIO } from "../data/studio";
import { gsap, useGSAP } from "../lib/gsap";
import { markIntroDone } from "../lib/intro";

const SESSION_KEY = "prumo:intro-seen";

/** Só na primeira visita da sessão e nunca com pedido de movimento reduzido. */
function shouldPlay() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  try {
    return !sessionStorage.getItem(SESSION_KEY);
  } catch {
    return true; // armazenamento bloqueado: toca a abertura mesmo assim
  }
}

const BRISES = Array.from({ length: 18 }, (_, i) => 466 + i * 30);

/**
 * Abertura: a elevação da casa se desenha em traço, uma junta
 * vertical corta a tela e os dois planos correm para os lados, revelando o
 * filme. O herói começa a própria entrada quando os planos se abrem.
 */
export function Intro() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(shouldPlay);

  useGSAP(
    () => {
      if (!visible) {
        markIntroDone();
        return;
      }

      const timeline = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        onComplete: () => {
          try {
            sessionStorage.setItem(SESSION_KEY, "1");
          } catch {
            /* sem armazenamento, a abertura volta na próxima visita */
          }
          setVisible(false);
        },
      });

      timeline
        .from("[data-draw]", { drawSVG: 0, duration: 0.85, stagger: 0.022 })
        .from(".intro-caption > *", { autoAlpha: 0, y: 12, duration: 0.6, stagger: 0.08, ease: "power2.out" }, 0.25)
        .addLabel("open", "+=0.15")
        .fromTo(".intro-seam", { scaleY: 0 }, { scaleY: 1, duration: 0.55, ease: "expo.inOut" }, "open")
        .to(".intro-drawing", { autoAlpha: 0, scale: 1.035, duration: 0.6, ease: "power2.in" }, "open")
        .to(".intro-caption", { autoAlpha: 0, duration: 0.35 }, "open")
        .to(".intro-plane--left", { xPercent: -101, duration: 1.25, ease: "expo.inOut" }, "open+=0.45")
        .to(".intro-plane--right", { xPercent: 101, duration: 1.25, ease: "expo.inOut" }, "open+=0.45")
        .to(".intro-seam", { autoAlpha: 0, duration: 0.3 }, "open+=0.55")
        .call(markIntroDone, [], "open+=0.85");
    },
    { scope: rootRef, dependencies: [visible] },
  );

  if (!visible) return null;

  return (
    <div ref={rootRef} className="intro" aria-hidden="true">
      <div className="intro-plane intro-plane--left" />
      <div className="intro-plane intro-plane--right" />
      <span className="intro-seam" />

      <div className="intro-drawing">
        <svg viewBox="0 0 1200 540" role="presentation">
          <path data-draw className="faint" d="M0 470 H1200" />
          <path data-draw d="M170 470 V456 H1030 V470" />
          <path data-draw d="M210 456 V328 H860 V456" />
          <path data-draw className="faint" d="M300 456 V338 M390 456 V338 M470 456 V338" />
          <path data-draw d="M560 456 V346 H624 V456" />
          <path data-draw d="M150 328 H1050 V316 H150 Z" />
          <path data-draw d="M930 456 V328 M1000 456 V328" />
          <path data-draw d="M430 316 V196 H1010 V316" />
          <path data-draw d="M390 196 H1070 V184 H390 Z" />
          {BRISES.map((x) => (
            <path key={x} data-draw className="thin" d={`M${x} 206 V306`} />
          ))}
          <path data-draw className="faint" d="M120 470 V404" />
          <circle data-draw className="faint" cx="120" cy="352" r="56" />
          <path data-draw className="faint" d="M1112 470 V424" />
          <circle data-draw className="faint" cx="1112" cy="394" r="32" />
          <path data-draw className="faint" d="M170 510 H1030 M170 500 V520 M1030 500 V520" />
        </svg>
      </div>

      <div className="intro-caption">
        <span>{STUDIO.name} arquitetura</span>
      </div>
    </div>
  );
}
