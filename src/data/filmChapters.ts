/**
 * Capítulos do filme do herói. `enter`, `hold`, `leave` e `exit` são
 * posições (0 a 1) na rolagem do herói: a frase entra, fica, sai e some.
 * O capítulo 0 é a abertura (título e chamada); os demais viram frases.
 */
export type FilmChapter = {
  line: string;
  enter: number;
  hold: number;
  leave: number;
  exit: number;
};

export const FILM_CHAPTERS: readonly FilmChapter[] = [
  { line: "Arquitetura para o seu lugar.", enter: 0, hold: 0, leave: 0.13, exit: 0.19 },
  { line: "Uma casa começa pela chegada.", enter: 0.22, hold: 0.3, leave: 0.4, exit: 0.46 },
  { line: "Pedra, madeira e muito verde.", enter: 0.46, hold: 0.54, leave: 0.64, exit: 0.7 },
  { line: "Por dentro, o jardim entra na sala.", enter: 0.7, hold: 0.77, leave: 0.86, exit: 0.91 },
  { line: "Vamos projetar a sua?", enter: 0.91, hold: 0.94, leave: 0.99, exit: 1 },
];
