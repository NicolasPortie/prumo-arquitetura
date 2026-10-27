import { useEffect, useRef, useState, type FocusEvent, type FormEvent } from "react";
import { MagneticLink } from "../../components/MagneticLink";
import { STUDIO } from "../../data/studio";

type FieldName = "name" | "email" | "location" | "message";
type Errors = Partial<Record<FieldName, string>>;

const MESSAGES: Record<FieldName, { missing: string; invalid?: string }> = {
  name: { missing: "Informe seu nome." },
  email: {
    missing: "Informe seu e-mail para podermos responder.",
    invalid: "Use um e-mail válido, como voce@exemplo.com.",
  },
  location: { missing: "Informe a cidade e o estado do projeto." },
  message: { missing: "Conte brevemente o que você quer fazer." },
};

function validate(field: HTMLInputElement | HTMLTextAreaElement): string | undefined {
  const messages = MESSAGES[field.name as FieldName];
  if (field.validity.valueMissing) return messages.missing;
  if (!field.validity.valid) return messages.invalid ?? messages.missing;
  return undefined;
}

const MAIL_CLIENT_WAIT_MS = 2000;

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function Contact() {
  const [errors, setErrors] = useState<Errors>({});
  const [formMessage, setFormMessage] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [draft, setDraft] = useState("");
  const cancelMailWatch = useRef<(() => void) | null>(null);

  useEffect(() => () => cancelMailWatch.current?.(), []);

  // mailto: não avisa se abriu ou não. Se a janela não perde o foco, não há app de e-mail.
  function openMailClient(href: string, text: string) {
    cancelMailWatch.current?.();

    let left = false;
    const markLeft = () => {
      left = true;
    };
    const onVisibility = () => {
      if (document.hidden) markLeft();
    };
    window.addEventListener("blur", markLeft);
    document.addEventListener("visibilitychange", onVisibility);

    const timer = window.setTimeout(() => {
      cancel();
      if (left) {
        setFormMessage("Seu app de e-mail abriu com a mensagem pronta. É só enviar por lá.");
      } else {
        setDraft(text);
        setFormMessage(`Nenhum app de e-mail respondeu. Copie a mensagem e envie para ${STUDIO.email}.`);
      }
    }, MAIL_CLIENT_WAIT_MS);

    function cancel() {
      window.clearTimeout(timer);
      window.removeEventListener("blur", markLeft);
      document.removeEventListener("visibilitychange", onVisibility);
      cancelMailWatch.current = null;
    }

    cancelMailWatch.current = cancel;
    window.location.href = href;
  }

  function checkField(field: HTMLInputElement | HTMLTextAreaElement) {
    const message = validate(field);
    setErrors((current) => ({ ...current, [field.name]: message }));
    return message;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    cancelMailWatch.current?.();
    setDraft("");
    const form = event.currentTarget;
    const fields = Array.from(form.elements).filter(
      (element): element is HTMLInputElement | HTMLTextAreaElement =>
        element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement,
    );

    const next: Errors = {};
    fields.forEach((field) => {
      next[field.name as FieldName] = validate(field);
    });
    setErrors(next);

    const firstInvalid = fields.find((field) => next[field.name as FieldName]);
    if (firstInvalid) {
      setFormMessage("Revise os campos indicados antes de continuar.");
      firstInvalid.focus();
      return;
    }

    const data = new FormData(form);
    const name = String(data.get("name") ?? "");
    const email = String(data.get("email") ?? "");
    const location = String(data.get("location") ?? "");
    const message = String(data.get("message") ?? "");
    const subject = `Contato pelo site | ${name}`;
    const body = [`Nome: ${name}`, `E-mail: ${email}`, `Local do projeto: ${location}`, "", message].join("\n");

    const href = `mailto:${STUDIO.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const text = `Para: ${STUDIO.email}\nAssunto: ${subject}\n\n${body}`;
    setFormMessage("Abrindo o seu app de e-mail…");
    openMailClient(href, text);
  }

  async function copyEmail() {
    const copied = await copyText(STUDIO.email);
    setCopyMessage(copied ? "E-mail copiado." : "Não foi possível copiar. Selecione o e-mail e copie manualmente.");
    window.setTimeout(() => setCopyMessage(""), 3200);
  }

  async function copyDraft() {
    const copied = await copyText(draft);
    setFormMessage(
      copied
        ? `Mensagem copiada. Cole no seu e-mail e envie para ${STUDIO.email}.`
        : `Não foi possível copiar. Escreva para ${STUDIO.email} com os dados do formulário.`,
    );
  }

  const field = (name: FieldName) => ({
    name,
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": `${name}-error`,
    required: true,
    onBlur: (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => checkField(event.currentTarget),
    onInput: (event: FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (errors[name]) checkField(event.currentTarget);
    },
  });

  return (
    <section id="contato" className="contact section-shell">
      <div className="site-grid contact-layout">
        <div className="contact-intro">
          <h2 data-reveal="split">
            Vamos conversar sobre a sua <em>casa</em>?
          </h2>
          <p data-reveal="fade">Conte o que você tem em mente. A gente responde por e-mail.</p>
          <div className="contact-email-row" data-reveal="fade">
            <MagneticLink href={`mailto:${STUDIO.email}`} className="contact-email">
              <span>{STUDIO.email}</span>
              <i aria-hidden="true">↗</i>
            </MagneticLink>
            <button type="button" className="contact-copy" onClick={copyEmail}>
              Copiar e-mail
            </button>
            <span className="sr-only" role="status" aria-live="polite">{copyMessage}</span>
          </div>
        </div>

        <div className="contact-form-wrap">
          <form onSubmit={handleSubmit} className="contact-form" noValidate data-reveal="fade">
            <div className="contact-form-row">
              <label className="contact-field" data-invalid={Boolean(errors.name)}>
                <span>Nome</span>
                <input type="text" autoComplete="name" placeholder="Nome e sobrenome" {...field("name")} />
                <span className="contact-field-error" id="name-error">{errors.name}</span>
              </label>
              <label className="contact-field" data-invalid={Boolean(errors.email)}>
                <span>E-mail</span>
                <input type="email" autoComplete="email" placeholder="voce@exemplo.com" {...field("email")} />
                <span className="contact-field-error" id="email-error">{errors.email}</span>
              </label>
            </div>
            <label className="contact-field" data-invalid={Boolean(errors.location)}>
              <span>Cidade e estado</span>
              <input type="text" placeholder="Ex.: São Paulo, SP" {...field("location")} />
              <span className="contact-field-error" id="location-error">{errors.location}</span>
            </label>
            <label className="contact-field" data-invalid={Boolean(errors.message)}>
              <span>Sua ideia</span>
              <textarea rows={5} placeholder="Construir, reformar, decorar..." {...field("message")} />
              <span className="contact-field-error" id="message-error">{errors.message}</span>
            </label>
            <div className="contact-submit-row">
              <button type="submit" className="contact-submit">
                Enviar <span aria-hidden="true">↗</span>
              </button>
            </div>
            <p className="contact-form-message" role="status" aria-live="polite">{formMessage}</p>
            {draft && (
              <div className="contact-fallback">
                <button type="button" className="contact-copy" onClick={copyDraft}>
                  Copiar mensagem
                </button>
                <a className="contact-copy" href={`mailto:${STUDIO.email}`}>
                  Abrir e-mail
                </a>
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
