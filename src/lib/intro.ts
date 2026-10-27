/**
 * Sinal único de "a abertura terminou". O herói espera por ele para começar a
 * própria entrada, e a rolagem só é liberada depois.
 */
let done = false;
const listeners = new Set<() => void>();

export function markIntroDone() {
  if (done) return;
  done = true;
  listeners.forEach((listener) => listener());
  listeners.clear();
}

export function onIntroDone(listener: () => void) {
  if (done) {
    listener();
    return () => {};
  }
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const isIntroDone = () => done;
