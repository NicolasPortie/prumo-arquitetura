import { useEffect, useRef, type RefObject } from "react";
import { STUDIO } from "../../data/studio";
import { ScrollTrigger, useGSAP } from "../../lib/gsap";

type HeaderProps = {
  onOpenMenu: () => void;
  onHero: boolean;
  menuOpen: boolean;
  menuTriggerRef: RefObject<HTMLButtonElement | null>;
};

export function Header({ onOpenMenu, onHero, menuOpen, menuTriggerRef }: HeaderProps) {
  const headerRef = useRef<HTMLElement>(null);
  const onHeroRef = useRef(onHero);

  useEffect(() => {
    onHeroRef.current = onHero;
    // De volta ao filme, o cabeçalho reaparece sempre
    if (onHero) headerRef.current?.setAttribute("data-hidden", "false");
  }, [onHero]);

  // Barra de leitura da página; some ao descer e volta ao subir (fora do filme)
  useGSAP(
    () => {
      const header = headerRef.current;
      if (!header) return;

      ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: (self) => {
          header.style.setProperty("--scroll-progress", self.progress.toFixed(4));
          if (onHeroRef.current || self.scroll() < 80) {
            header.dataset.hidden = "false";
          } else if (self.direction === 1) {
            header.dataset.hidden = "true";
          } else if (self.direction === -1) {
            header.dataset.hidden = "false";
          }
        },
      });
    },
    { scope: headerRef },
  );

  return (
    <header
      ref={headerRef}
      data-on-hero={onHero && !menuOpen}
      data-menu-open={menuOpen}
      data-hidden="false"
      className="site-header"
    >
      <div className="site-grid site-header-inner">
        <a href="#top" className="site-wordmark">
          <span>{STUDIO.name}</span>
          <small>arquitetura</small>
          <span className="sr-only">, início</span>
        </a>
        <div className="site-header-actions">
          <a href="#contato" className="site-header-cta arrow-link">
            <span>Iniciar projeto</span>
            <i aria-hidden="true">↗</i>
          </a>
          <button
            ref={menuTriggerRef}
            type="button"
            className="menu-toggle"
            onClick={onOpenMenu}
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            aria-controls="site-menu"
          >
            <span>{menuOpen ? "Fechar" : "Índice"}</span>
            <i aria-hidden="true" />
          </button>
        </div>
      </div>
      <span className="site-header-progress" aria-hidden="true" />
    </header>
  );
}
