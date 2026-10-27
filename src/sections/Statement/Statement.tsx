import { Picture } from "../../components/Picture";
import { MEDIA } from "../../lib/config";

export function Statement() {
  return (
    <section id="escritorio" className="statement section-shell">
      <div className="site-grid statement-layout">
        <p className="statement-text" data-scrub-words>
          Projetamos casas, reformas e interiores pensando em como você <em>vive</em>.
        </p>
      </div>

      <div className="site-grid">
        <figure className="statement-band">
          <div className="statement-band-frame" data-reveal="brise" data-brise="16" data-parallax>
            <Picture
              name={MEDIA.practice}
              alt="Sala integrada a um jardim tropical, com madeira, pedra e luz natural"
              sizes="(max-width: 1664px) 92vw, 1536px"
            />
          </div>
        </figure>
      </div>
    </section>
  );
}
