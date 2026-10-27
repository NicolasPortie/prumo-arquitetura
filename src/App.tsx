import { useCallback, useEffect, useRef, useState } from "react";
import { Cursor } from "./components/Cursor";
import { Intro } from "./components/Intro";
import { Header } from "./components/navigation/Header";
import { Menu } from "./components/navigation/Menu";
import { useReducedMotion } from "./hooks/useReducedMotion";
import { ScrollTrigger } from "./lib/gsap";
import { isIntroDone, onIntroDone } from "./lib/intro";
import { scrollToHash, setScrollLocked, startSmoothScroll } from "./lib/smooth-scroll";
import { HomePage } from "./pages/HomePage";

export function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [onHero, setOnHero] = useState(true);
  const [introDone, setIntroDone] = useState(isIntroDone);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const wasMenuOpen = useRef(false);
  const reduced = useReducedMotion();
  const onHeroChange = useCallback((value: boolean) => setOnHero(value), []);

  useEffect(() => {
    if (reduced) return;
    return startSmoothScroll();
  }, [reduced]);

  useEffect(() => onIntroDone(() => setIntroDone(true)), []);

  // A rolagem fica presa durante a abertura e com o índice aberto
  useEffect(() => {
    setScrollLocked(menuOpen || !introDone);
  }, [menuOpen, introDone]);

  // Âncoras internas: rolagem suave, URL atualizada e foco no destino
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
      const hash = link?.getAttribute("href");
      if (!hash || hash === "#") return;

      event.preventDefault();
      scrollToHash(hash);
      history.pushState(null, "", hash === "#top" ? window.location.pathname : hash);
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // Com as fontes carregadas as alturas mudam: recalcula os gatilhos e respeita um #hash de entrada
  useEffect(() => {
    let cancelled = false;
    void document.fonts.ready.then(() => {
      if (cancelled) return;
      ScrollTrigger.refresh();
      if (window.location.hash) scrollToHash(window.location.hash, { immediate: true });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!menuOpen && wasMenuOpen.current) {
      window.requestAnimationFrame(() => {
        menuTriggerRef.current?.focus({ preventScroll: true });
      });
    }

    wasMenuOpen.current = menuOpen;
  }, [menuOpen]);

  return (
    <>
      <a href="#content" className="skip-link">
        Ir para o conteúdo
      </a>
      <Header
        onOpenMenu={() => setMenuOpen((current) => !current)}
        onHero={onHero}
        menuOpen={menuOpen}
        menuTriggerRef={menuTriggerRef}
      />
      <Menu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <HomePage onHeroChange={onHeroChange} />
      <Cursor />
      <Intro />
    </>
  );
}
