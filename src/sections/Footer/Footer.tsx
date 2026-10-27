import { MagneticLink } from "../../components/MagneticLink";
import { STUDIO } from "../../data/studio";

const NAV_LINKS = [
  { href: "#projetos", label: "Projetos" },
  { href: "#metodo", label: "Como trabalhamos" },
  { href: "#contato", label: "Contato" },
] as const;

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-grid footer-top">
        <div className="footer-brand">
          <a href="#top" className="footer-wordmark" aria-label={`${STUDIO.name}, voltar ao início`}>
            {STUDIO.name}
          </a>
          <p>{STUDIO.discipline} em {STUDIO.city}.</p>
        </div>
        <MagneticLink href={`mailto:${STUDIO.email}`} className="arrow-link footer-cta">
          <span>Iniciar um projeto</span>
          <i aria-hidden="true">↗</i>
        </MagneticLink>
      </div>

      <div className="site-grid footer-body">
        <nav className="footer-nav" aria-label="Navegação do rodapé">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="footer-link">
              {link.label} <i aria-hidden="true">↗</i>
            </a>
          ))}
        </nav>
        <div className="footer-contact">
          <span>{STUDIO.city}, {STUDIO.country}</span>
          <a href={`mailto:${STUDIO.email}`}>{STUDIO.email}</a>
        </div>
      </div>

      <div className="site-grid footer-bottom">
        <p>© {new Date().getFullYear()} {STUDIO.name}. Todos os direitos reservados.</p>
        <a href="#top">Voltar ao início <span aria-hidden="true">↑</span></a>
      </div>
    </footer>
  );
}
