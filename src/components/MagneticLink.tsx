import { useEffect, useRef, type AnchorHTMLAttributes, type ReactNode } from "react";
import { gsap } from "../lib/gsap";

type MagneticLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  strength?: number;
};

/**
 * Link que se aproxima do ponteiro. Só roda com mouse e sem pedido de movimento
 * reduzido. Não use junto de `data-reveal` no mesmo elemento: os dois mexem no
 * `transform`, então a revelação vai num invólucro.
 */
export function MagneticLink({ children, strength = 0.1, ...props }: MagneticLinkProps) {
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches
    ) {
      return;
    }

    const moveX = gsap.quickTo(node, "x", { duration: 0.4, ease: "power3.out" });
    const moveY = gsap.quickTo(node, "y", { duration: 0.4, ease: "power3.out" });

    const onMove = (event: PointerEvent) => {
      const bounds = node.getBoundingClientRect();
      moveX((event.clientX - (bounds.left + bounds.width / 2)) * strength * 2);
      moveY((event.clientY - (bounds.top + bounds.height / 2)) * strength * 2);
    };
    const onLeave = () => {
      moveX(0);
      moveY(0);
    };

    node.addEventListener("pointermove", onMove);
    node.addEventListener("pointerleave", onLeave);
    return () => {
      node.removeEventListener("pointermove", onMove);
      node.removeEventListener("pointerleave", onLeave);
      gsap.set(node, { x: 0, y: 0 });
    };
  }, [strength]);

  return (
    <a {...props} ref={ref}>
      {children}
    </a>
  );
}
