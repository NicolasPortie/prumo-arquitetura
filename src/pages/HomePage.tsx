import { useRef } from "react";
import { useScrollReveal } from "../hooks/useScrollReveal";
import { Contact } from "../sections/Contact/Contact";
import { Footer } from "../sections/Footer/Footer";
import { HeroExperience } from "../sections/HeroExperience/HeroExperience";
import { Method } from "../sections/Method/Method";
import { ProjectStory } from "../sections/ProjectStory/ProjectStory";
import { Statement } from "../sections/Statement/Statement";

type HomePageProps = {
  onHeroChange: (onHero: boolean) => void;
};

export function HomePage({ onHeroChange }: HomePageProps) {
  const rootRef = useRef<HTMLElement>(null);
  useScrollReveal(rootRef);

  return (
    <main id="content" ref={rootRef} tabIndex={-1}>
      <HeroExperience onHeroChange={onHeroChange} />
      <Statement />
      <ProjectStory />
      <Method />
      <Contact />
      <Footer />
    </main>
  );
}
