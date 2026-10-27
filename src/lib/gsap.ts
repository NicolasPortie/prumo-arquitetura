import gsap from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { Flip } from "gsap/Flip";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, SplitText, Flip, DrawSVGPlugin, useGSAP);

gsap.config({ nullTargetWarn: false });
ScrollTrigger.config({ ignoreMobileResize: true });

// Só em desenvolvimento: ?slowmo=0.2 desacelera todas as animações para revisar quadro a quadro
if (import.meta.env.DEV) {
  const slowmo = Number(new URLSearchParams(window.location.search).get("slowmo"));
  if (slowmo > 0) gsap.globalTimeline.timeScale(slowmo);
}

export { gsap, Flip, ScrollTrigger, SplitText, useGSAP };
