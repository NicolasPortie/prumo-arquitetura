import * as Dialog from "@radix-ui/react-dialog";
import { useRef } from "react";
import { STUDIO } from "../../data/studio";
import { MEDIA } from "../../lib/config";
import { gsap, useGSAP } from "../../lib/gsap";
import { Picture } from "../Picture";

const links = [
  { href: "#projetos", label: "Projetos" },
  { href: "#metodo", label: "Como trabalhamos" },
  { href: "#contato", label: "Contato" },
] as const;

type MenuProps = {
  open: boolean;
  onClose: () => void;
};

export function Menu({ open, onClose }: MenuProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Os links sobem de dentro da própria máscara quando o índice abre
  useGSAP(
    () => {
      if (!open || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.fromTo(
        ".menu-link strong",
        { yPercent: 110 },
        { yPercent: 0, duration: 1.05, stagger: 0.08, delay: 0.28, ease: "expo.out" },
      );
      gsap.fromTo(
        ".menu-film-still, .menu-footer",
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.8, delay: 0.5, ease: "power2.out" },
      );
    },
    { scope: panelRef, dependencies: [open] },
  );

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay forceMount className="menu-overlay" />
        <Dialog.Content
          forceMount
          id="site-menu"
          className="menu-panel"
          data-lenis-prevent
          ref={panelRef}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            panelRef.current?.focus({ preventScroll: true });
          }}
        >
          <Dialog.Title className="sr-only">Índice do site</Dialog.Title>
          <Dialog.Description className="sr-only">Navegação de {STUDIO.name} Arquitetura</Dialog.Description>
          <div className="site-grid menu-panel-inner">
            <div className="menu-brand">
              <span>{STUDIO.name}</span>
              <small>arquitetura</small>
            </div>
            <Dialog.Close asChild>
              <button type="button" className="menu-close" aria-label="Fechar índice">
                Fechar <span aria-hidden="true">×</span>
              </button>
            </Dialog.Close>

            <nav className="menu-nav" aria-label="Navegação principal">
              {links.map((link, index) => (
                <a key={link.href} href={link.href} onClick={onClose} className="menu-link">
                  <span className="menu-link-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  <span className="menu-link-mask"><strong>{link.label}</strong></span>
                  <i aria-hidden="true">↗</i>
                </a>
              ))}
            </nav>

            <figure className="menu-film-still">
              <Picture
                name={MEDIA.vilaMadalenaInterior}
                alt="Circulação arborizada de uma residência urbana"
                sizes="(max-width: 900px) 0px, 30vw"
              />
              
            </figure>

            <div className="menu-footer">
              <span>{STUDIO.city}, {STUDIO.country}</span>
              <a href={`mailto:${STUDIO.email}`}>{STUDIO.email}</a>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
