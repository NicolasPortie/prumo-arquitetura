import type { CSSProperties } from "react";
import manifest from "../data/media-manifest.json";

type Entry = { width: number; height: number; color: string; widths: number[] };
const entries = manifest as Record<string, Entry>;

type PictureProps = {
  /** Nome-base do arquivo em static/media, sem tamanho nem extensão. */
  name: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  imgClassName?: string;
  draggable?: boolean;
};

const srcSet = (name: string, widths: number[], ext: "avif" | "webp") =>
  widths.map((w) => `/media/${name}-${w}.${ext} ${w}w`).join(", ");

/**
 * Imagem responsiva com AVIF + WebP. As dimensões e a cor média vêm do
 * manifest gerado por `npm run media`, então o espaço é reservado antes do
 * carregamento e a imagem entra sobre a cor dominante da própria foto.
 */
export function Picture({
  name,
  alt,
  sizes = "100vw",
  priority = false,
  className,
  imgClassName,
  draggable = false,
}: PictureProps) {
  const entry = entries[name];
  if (!entry) return null;

  const largest = entry.widths[entry.widths.length - 1];

  return (
    <picture className={className} style={{ "--picture-color": entry.color } as CSSProperties}>
      <source type="image/avif" srcSet={srcSet(name, entry.widths, "avif")} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet(name, entry.widths, "webp")} sizes={sizes} />
      <img
        className={imgClassName}
        src={`/media/${name}-${largest}.webp`}
        width={entry.width}
        height={entry.height}
        alt={alt}
        sizes={sizes}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        draggable={draggable}
      />
    </picture>
  );
}
