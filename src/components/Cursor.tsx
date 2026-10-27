import { useEffect, useRef } from "react";
import { gsap } from "../lib/gsap";

/**
 * Rótulo que acompanha o ponteiro sobre elementos com `data-cursor="Texto"`.
 * Só existe com mouse; em telas de toque a ação já aparece no próprio cartão.
 */
export function Cursor() {
  const rootRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const label = labelRef.current;
    if (!root || !label || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const moveX = gsap.quickTo(root, "x", { duration: reduced ? 0 : 0.45, ease: "power3.out" });
    const moveY = gsap.quickTo(root, "y", { duration: reduced ? 0 : 0.45, ease: "power3.out" });

    const onMove = (event: PointerEvent) => {
      moveX(event.clientX);
      moveY(event.clientY);
    };

    const onOver = (event: PointerEvent) => {
      const target = (event.target as Element | null)?.closest<HTMLElement>("[data-cursor]");
      if (target) label.textContent = target.dataset.cursor ?? "";
      root.dataset.visible = String(Boolean(target));
    };

    const hide = () => {
      root.dataset.visible = "false";
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.documentElement.addEventListener("pointerleave", hide);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.documentElement.removeEventListener("pointerleave", hide);
    };
  }, []);

  return (
    <div ref={rootRef} className="cursor" data-visible="false" aria-hidden="true">
      <span ref={labelRef} className="cursor-label" />
    </div>
  );
}
