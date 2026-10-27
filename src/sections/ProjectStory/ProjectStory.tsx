import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent, type RefObject } from "react";
import { MagneticLink } from "../../components/MagneticLink";
import { Picture } from "../../components/Picture";
import { PORTFOLIO_PROJECTS, type PortfolioProject } from "../../data/projects";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { createBrise } from "../../lib/brise";
import { Flip, gsap, ScrollTrigger, useGSAP } from "../../lib/gsap";
import { setScrollLocked } from "../../lib/smooth-scroll";

const TOTAL = PORTFOLIO_PROJECTS.length;
const pad = (value: number) => String(value).padStart(2, "0");
const CARD_SIZES = "(max-width: 900px) 92vw, 56vw";
const FEATURE_SIZES = "(max-width: 1664px) 92vw, 1536px";

type FlipState = ReturnType<typeof Flip.getState>;

/**
 * Capa do projeto. Se veio de um clique no cartão, a foto voa do cartão até
 * aqui (Flip). Ao trocar de projeto dentro do dialog, abre em brises.
 */
function DialogCover({
  project,
  flipState,
  reduced,
}: {
  project: PortfolioProject;
  flipState: RefObject<FlipState | null>;
  reduced: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const image = project.images[0];
  // Enquanto voa, usa o mesmo arquivo já carregado no cartão; depois troca pelo maior
  const [sizes, setSizes] = useState(flipState.current ? CARD_SIZES : FEATURE_SIZES);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const state = flipState.current;

    if (state) {
      // a capa sai do fluxo durante o voo; o invólucro guarda o espaço dela
      const wrap = node.parentElement!;
      wrap.style.height = `${wrap.offsetHeight}px`;
      node.dataset.flipId = "cover";
      const flip = Flip.from(state, {
        targets: node,
        duration: 1.15,
        ease: "expo.inOut",
        absolute: true,
        zIndex: 20,
        onComplete: () => {
          wrap.style.height = "";
          flipState.current = null;
          setSizes(FEATURE_SIZES);
        },
      });
      return () => {
        // desmontado no meio do voo (ou o StrictMode refazendo o efeito): devolve o estado
        const interrupted = flip.progress() < 1;
        flip.revert();
        wrap.style.height = "";
        delete node.dataset.flipId;
        if (interrupted) flipState.current = state;
      };
    }

    if (reduced) return;
    const brise = createBrise(node, 14);
    brise.timeline.play();
    return () => brise.destroy();
  }, [flipState, reduced]);

  return (
    <div className="site-grid project-dialog-cover-wrap">
      <figure ref={ref} className="project-dialog-cover">
        <Picture name={image.name} alt={image.alt} priority sizes={sizes} />
      </figure>
    </div>
  );
}

/** Imagens da galeria: lâminas fechadas até entrarem na tela. */
function GalleryFigure({
  name,
  alt,
  caption,
  index,
  reduced,
}: {
  name: string;
  alt: string;
  caption: string;
  index: number;
  reduced: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node || reduced) return;
    const brise = createBrise(node, 9);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        brise.timeline.play();
        observer.disconnect();
      },
      { rootMargin: "0px 0px -15% 0px" },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      brise.destroy();
    };
  }, [reduced]);

  return (
    <figure className="project-dialog-figure">
      <div ref={ref} className="project-dialog-frame">
        <Picture name={name} alt={alt} sizes="(max-width: 900px) 100vw, 62vw" />
      </div>
      <figcaption>{String(index + 1).padStart(2, "0")} / {caption}</figcaption>
    </figure>
  );
}

export function ProjectStory() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [transition, setTransition] = useState<"flip" | "plain">("plain");
  const dialogRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const flipState = useRef<FlipState | null>(null);
  const reduced = useReducedMotion();
  const project = PORTFOLIO_PROJECTS[selectedIndex];
  const next = PORTFOLIO_PROJECTS[(selectedIndex + 1) % TOTAL];

  useGSAP(
    () => {
      const section = sectionRef.current;
      const pin = pinRef.current;
      const track = trackRef.current;
      if (!section || !pin || !track) return;

      const cards = gsap.utils.toArray<HTMLElement>(".project-card", track);
      const mm = gsap.matchMedia();

      // Computador: a página para e a rolagem empurra os projetos para o lado
      mm.add("(min-width: 901px) and (prefers-reduced-motion: no-preference)", () => {
        const current = section.querySelector<HTMLElement>("[data-projects-current]");
        const fill = section.querySelector<HTMLElement>(".projects-progress-fill");
        const distance = () => Math.max(0, track.scrollWidth - pin.clientWidth);

        const scroller = gsap.to(track, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            id: "projects-pin",
            trigger: pin,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.7,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              if (current) current.textContent = pad(Math.min(TOTAL, Math.round(self.progress * (TOTAL - 1)) + 1));
              if (fill) gsap.set(fill, { scaleX: self.progress });
            },
          },
        });

        cards.forEach((card) => {
          const media = card.querySelector<HTMLElement>(".project-card-media");
          const image = media?.querySelector("img");
          const copy = card.querySelector<HTMLElement>(".project-card-copy");
          const link = { containerAnimation: scroller, scrub: true } as const;

          if (image) {
            gsap.fromTo(
              image,
              { xPercent: -8, scale: 1.2 },
              { xPercent: 8, scale: 1.2, ease: "none", scrollTrigger: { ...link, trigger: card, start: "left right", end: "right left" } },
            );
          }
          if (media) {
            gsap.fromTo(
              media,
              { clipPath: "inset(14% 10% 14% 10%)" },
              { clipPath: "inset(0% 0% 0% 0%)", ease: "power2.out", scrollTrigger: { ...link, trigger: card, start: "left 96%", end: "left 52%" } },
            );
          }
          if (copy) {
            gsap.fromTo(
              copy,
              { autoAlpha: 0, y: 26 },
              { autoAlpha: 1, y: 0, ease: "power2.out", scrollTrigger: { ...link, trigger: card, start: "left 92%", end: "left 62%" } },
            );
          }
        });
      });

      // Celular: os projetos sobem em sequência e as fotos andam um pouco mais devagar
      mm.add("(max-width: 900px) and (prefers-reduced-motion: no-preference)", () => {
        gsap.set(cards, { autoAlpha: 0, y: 40 });
        ScrollTrigger.batch(cards, {
          start: "top 90%",
          once: true,
          onEnter: (batch) =>
            gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.95, stagger: 0.1, ease: "expo.out", overwrite: "auto" }),
        });
        cards.forEach((card) => {
          const image = card.querySelector(".project-card-media img");
          if (!image) return;
          gsap.fromTo(
            image,
            { yPercent: -6, scale: 1.14 },
            { yPercent: 6, scale: 1.14, ease: "none", scrollTrigger: { trigger: card, start: "top bottom", end: "bottom top", scrub: 0.6 } },
          );
        });
      });
    },
    { scope: sectionRef },
  );

  useEffect(() => {
    setScrollLocked(dialogOpen);
    return () => setScrollLocked(false);
  }, [dialogOpen]);

  function openProject(index: number, event: MouseEvent<HTMLElement>) {
    const media = event.currentTarget.querySelector<HTMLElement>(".project-card-media");
    if (media && !reduced) {
      media.dataset.flipId = "cover";
      flipState.current = Flip.getState(media);
      delete media.dataset.flipId;
      setTransition("flip");
    } else {
      flipState.current = null;
      setTransition("plain");
    }
    setSelectedIndex(index);
    setDialogOpen(true);
  }

  function goToNext() {
    flipState.current = null;
    setSelectedIndex((selectedIndex + 1) % TOTAL);
    dialogRef.current?.scrollTo({ top: 0 });
  }

  return (
    <section ref={sectionRef} id="projetos" className="projects-section">
      <div ref={pinRef} className="projects-pin">
        <div className="site-grid projects-head">
          <h2 className="projects-title" data-reveal="split">
            Nossos <em>projetos</em>
          </h2>
          <p className="projects-count" aria-hidden="true">
            <span data-projects-current>01</span> / {pad(TOTAL)}
          </p>
        </div>

        <div ref={trackRef} className="projects-list" role="group" aria-label="Portfólio de projetos">
          {PORTFOLIO_PROJECTS.map((item, index) => (
            // O clique vale para o cartão inteiro; o botão do título segue como caminho do teclado
            <article key={item.id} className="project-card" data-cursor="Abrir" onClick={(event) => openProject(index, event)}>
              <figure className="project-card-media">
                <Picture
                  name={item.images[0].name}
                  alt={item.images[0].alt}
                  priority={index < 2}
                  sizes={CARD_SIZES}
                />
                <span className="project-card-action" aria-hidden="true">Abrir <i>↗</i></span>
              </figure>
              <div className="project-card-copy">
                <h3>
                  <button
                    type="button"
                    className="project-card-trigger"
                    aria-label={`${item.title}, ${item.city}. Abrir projeto`}
                  >
                    {item.title}
                  </button>
                </h3>
                <p>{item.city}</p>
              </div>
            </article>
          ))}
        </div>

        <span className="projects-progress" aria-hidden="true">
          <span className="projects-progress-fill" />
        </span>
      </div>

      <div className="site-grid">
        <p className="portfolio-disclaimer">Imagens ilustrativas.</p>
      </div>

      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="project-dialog-overlay" />
          <Dialog.Content
            className="project-dialog"
            ref={dialogRef}
            data-transition={transition}
            data-lenis-prevent
            onOpenAutoFocus={(event) => {
              // o foco vai para o próprio dialog: leitor de tela anuncia o título, sem anel no "Fechar"
              event.preventDefault();
              dialogRef.current?.focus({ preventScroll: true });
            }}
          >
            <div className="site-grid project-dialog-top">
              <p>{project.number} / {String(TOTAL).padStart(2, "0")} · {project.city}</p>
              <Dialog.Close asChild>
                <button type="button" className="project-dialog-close" aria-label="Fechar projeto">
                  Fechar <span aria-hidden="true">×</span>
                </button>
              </Dialog.Close>
            </div>

            <DialogCover key={project.id} project={project} flipState={flipState} reduced={reduced} />

            <div className="site-grid project-dialog-intro" key={`${project.id}-intro`}>
              <p className="eyebrow project-dialog-kicker">{project.program}</p>
              <Dialog.Title className="project-dialog-title">{project.title}</Dialog.Title>
              <div className="project-dialog-copy">
                <Dialog.Description>{project.description}</Dialog.Description>
              </div>
            </div>

            <div className="site-grid project-dialog-gallery" key={`${project.id}-gallery`}>
              {project.images.slice(1).map((image, index) => (
                <GalleryFigure
                  key={image.name}
                  name={image.name}
                  alt={image.alt}
                  caption={image.caption}
                  index={index + 1}
                  reduced={reduced}
                />
              ))}
              <button type="button" className="project-dialog-next" onClick={goToNext} data-cursor="Ver">
                <small>Próximo projeto</small>
                <strong>{next.title}</strong>
              </button>
            </div>

            <div className="site-grid project-dialog-footer">
              <p>Quer conversar sobre a sua casa?</p>
              <MagneticLink
                href="#contato"
                className="arrow-link project-dialog-cta"
                onClick={() => setDialogOpen(false)}
              >
                <span>Iniciar meu projeto</span>
                <i aria-hidden="true">↗</i>
              </MagneticLink>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
