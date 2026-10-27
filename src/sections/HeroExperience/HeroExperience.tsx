import { useCallback, useRef, useState } from "react";
import { MagneticLink } from "../../components/MagneticLink";
import { WebGLHeroOverlay } from "../../components/WebGLHeroOverlay";
import { FILM_CHAPTERS } from "../../data/filmChapters";
import { STUDIO } from "../../data/studio";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { useVideoScrub } from "../../hooks/useVideoScrub";
import { HERO_HOLD_TAIL, HERO_SCROLL_LENGTH_VH, MEDIA } from "../../lib/config";
import { gsap, ScrollTrigger, SplitText, useGSAP } from "../../lib/gsap";
import { onIntroDone } from "../../lib/intro";

type HeroExperienceProps = {
  onHeroChange: (onHero: boolean) => void;
};

const CAPTIONS = FILM_CHAPTERS.slice(1);

/** Conexão lenta ou modo "economizar dados": o poster basta e o filme não é baixado. */
function prefersLightMedia() {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } })
    .connection;
  return Boolean(connection?.saveData) || /(^|-)2g$/.test(connection?.effectiveType ?? "");
}

function chooseVideoSource() {
  return window.matchMedia("(max-width: 900px)").matches ? MEDIA.heroVideoCompact : MEDIA.heroVideo;
}

export function HeroExperience({ onHeroChange }: HeroExperienceProps) {
  const rootRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef(0);
  const [videoReady, setVideoReady] = useState(false);
  const [videoSource] = useState(chooseVideoSource);
  const reduced = useReducedMotion();
  const [lightMedia] = useState(prefersLightMedia);
  const handleVideoReady = useCallback(() => setVideoReady(true), []);

  useVideoScrub({
    videoRef,
    progressRef,
    holdTail: HERO_HOLD_TAIL,
    reduced: reduced || lightMedia,
    onReady: handleVideoReady,
  });

  useGSAP(
    () => {
      const root = rootRef.current;
      const pin = pinRef.current;
      if (!root || !pin) return;

      onHeroChange(true);
      const setProgress = (value: number) => {
        progressRef.current = value;
        root.style.setProperty("--hero-progress", value.toFixed(3));
        root.dataset.scrolled = String(value > 0.015);
      };

      setProgress(0);

      const visibilityTrigger = ScrollTrigger.create({
        id: "hero-visibility",
        trigger: root,
        start: "top top",
        // o pin ainda não existe quando este gatilho mede; soma-se a rolagem do pin à mão
        end: () => (reduced ? "bottom top" : `+=${window.innerHeight * (1 + HERO_SCROLL_LENGTH_VH / 100)}`),
        invalidateOnRefresh: true,
        onEnter: () => onHeroChange(true),
        onEnterBack: () => onHeroChange(true),
        onLeave: () => onHeroChange(false),
        onLeaveBack: () => onHeroChange(true),
      });

      if (reduced) return () => visibilityTrigger.kill();

      const media = root.querySelector<HTMLElement>(".hero-media");
      const fades = gsap.utils.toArray<HTMLElement>("[data-hero-fade]", root);
      const intro = gsap.utils.toArray<HTMLElement>("[data-hero-intro]", root);
      const words = gsap.utils.toArray<HTMLElement>("[data-hero-word]", root);
      const captions = gsap.utils.toArray<HTMLElement>("[data-hero-chapter]", root);

      // Entrada (depois da abertura): o filme assenta, o título sobe de dentro da máscara
      const entrance = gsap
        .timeline({ defaults: { ease: "expo.out" }, paused: true })
        .fromTo(media, { scale: 1.06 }, { scale: 1, duration: 1.8 })
        .fromTo(words, { yPercent: 108, autoAlpha: 1 }, { yPercent: 0, duration: 1.2, stagger: 0.09 }, 0.2)
        .fromTo(fades, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.07 }, 0.55);
      const stopWaiting = onIntroDone(() => entrance.play());

      // Rolagem: abertura sai, cada capítulo entra e sai nas posições de filmChapters
      const scrub = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          id: "hero-scrub",
          trigger: root,
          start: "top top",
          end: () => `+=${window.innerHeight * (HERO_SCROLL_LENGTH_VH / 100)}`,
          pin,
          scrub: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => setProgress(self.progress),
        },
      });

      scrub.set({}, {}, 1); // fixa a duração do timeline em 1, como a rolagem

      const opening = FILM_CHAPTERS[0];
      const openingSpan = opening.exit - opening.leave;
      scrub
        .fromTo(
          intro,
          { autoAlpha: 1, y: 0 },
          { autoAlpha: 0, y: -24, duration: openingSpan * 0.8, stagger: openingSpan * 0.1, immediateRender: false },
          opening.leave,
        );

      const splits = captions.map((caption, index) => {
        const chapter = CAPTIONS[index];
        const line = caption.querySelector<HTMLElement>(".hero-chapter-line");
        const split = SplitText.create(line!, { type: "words", tag: "span", aria: "none" });
        const isLast = index === CAPTIONS.length - 1;

        scrub
          .fromTo(caption, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.001 }, chapter.enter)
          .fromTo(
            split.words,
            { autoAlpha: 0, y: 36 },
            {
              autoAlpha: 1,
              y: 0,
              duration: chapter.hold - chapter.enter,
              stagger: (chapter.hold - chapter.enter) * 0.12,
              ease: "power3.out",
            },
            chapter.enter,
          );

        if (!isLast) {
          scrub
            .to(
              split.words,
              { autoAlpha: 0, y: -28, duration: chapter.exit - chapter.leave, stagger: 0.004, ease: "power2.in" },
              chapter.leave,
            )
            .to(caption, { autoAlpha: 0, duration: 0.001 }, chapter.exit);
        }
        return split;
      });

      return () => {
        stopWaiting();
        visibilityTrigger.kill();
        splits.forEach((split) => split.revert());
      };
    },
    { scope: rootRef, dependencies: [onHeroChange, reduced] },
  );

  return (
    <section
      ref={rootRef}
      id="top"
      aria-label={`Apresentação da ${STUDIO.name} Arquitetura`}
      className="hero"
    >
      <div ref={pinRef} className="hero-pin">
        <div className="hero-media" data-ready={videoReady} aria-hidden="true">
          <img
            className="hero-poster"
            src={MEDIA.heroPoster}
            alt=""
            width={1920}
            height={1080}
            fetchPriority="high"
          />
          {!lightMedia && (
            <video
              ref={videoRef}
              className="hero-video"
              muted
              playsInline
              preload="auto"
              poster={MEDIA.heroPoster}
              src={videoSource}
            />
          )}
        </div>
        <WebGLHeroOverlay progressRef={progressRef} reduced={reduced} />
        <div className="hero-veil" aria-hidden="true" />

        <div className="site-grid hero-grid">
          <div className="hero-stage">
            {CAPTIONS.map((chapter) => (
              <div key={chapter.line} className="hero-chapter" data-hero-chapter>
                <p className="hero-chapter-line">{chapter.line}</p>
              </div>
            ))}

            <div className="hero-title-block">
              <h1 data-hero-intro>
                <span className="hero-title-line"><span data-hero-word>Arquitetura</span></span>
                <span className="hero-title-line"><span data-hero-word>para o seu <em>lugar.</em></span></span>
              </h1>
            </div>

            <div className="hero-copy-block" data-hero-fade data-hero-intro>
              <p>Casas, reformas e interiores em {STUDIO.city}.</p>
              <div className="hero-actions">
                <MagneticLink href="#contato" className="hero-primary-cta arrow-link">
                  <span>Conte sobre o seu terreno</span>
                  <i aria-hidden="true">↗</i>
                </MagneticLink>
              </div>
            </div>
          </div>

          <div className="hero-rail" data-hero-fade aria-hidden="true">
            <span className="hero-rail-track"><span className="hero-rail-fill" /></span>
            <span className="hero-rail-cue">
              <span>Role</span>
              <i />
            </span>
          </div>
        </div>

        <p className="sr-only">
          Vista de uma residência organizada por jardim, pedra, madeira e concreto.
        </p>
      </div>
    </section>
  );
}
