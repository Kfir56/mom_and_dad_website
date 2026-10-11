import Image from "next/image";
import { photoUrl } from "@/lib/supabase";
import type { MediaKind, Side } from "@/lib/types";

const INBAR_SWATCHES = [
  "from-[#ff5d8f] to-[#ffb627]",
  "from-[#2ec4b6] to-[#7b2cbf]",
  "from-[#ffb627] to-[#2ec4b6]",
  "from-[#7b2cbf] to-[#ff5d8f]",
];

/** A photo (or a still from a video) from storage, or a themed placeholder while there is none. */
export function ItemImage({
  path,
  alt,
  side,
  seed,
  sizes,
  kind = "image",
  className = "",
}: {
  path: string | null;
  alt: string;
  side: Side;
  seed: string;
  sizes: string;
  kind?: MediaKind;
  className?: string;
}) {
  const src = photoUrl(path);
  if (src && kind === "video") {
    // "#t=0.1" makes browsers show the first frame as a thumbnail.
    return <video src={`${src}#t=0.1`} muted playsInline preload="metadata" aria-label={alt} className={`absolute inset-0 h-full w-full object-cover ${className}`} />;
  }
  if (src) return <Image src={src} alt={alt} fill sizes={sizes} className={`object-cover ${className}`} />;

  if (side === "inbar") {
    const swatch = INBAR_SWATCHES[[...seed].reduce((n, ch) => n + ch.charCodeAt(0), 0) % INBAR_SWATCHES.length];
    return (
      <div role="img" aria-label={alt} className={`absolute inset-0 bg-gradient-to-br ${swatch} ${className}`}>
        <div className="absolute inset-0 bg-[url('/textures/paper.svg')] opacity-60 mix-blend-multiply" />
      </div>
    );
  }
  return (
    <div role="img" aria-label={alt} className={`eli-wood absolute inset-0 flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 120 80" className="w-1/2 text-[#ffcf7a]/70" fill="none" stroke="currentColor" strokeWidth="2.5">
        <rect x="6" y="10" width="108" height="64" rx="12" />
        <rect x="16" y="20" width="52" height="44" rx="6" strokeDasharray="2 3" />
        <rect x="76" y="22" width="30" height="10" rx="2" />
        <circle cx="83" cy="50" r="7" />
        <circle cx="101" cy="50" r="7" />
      </svg>
    </div>
  );
}

/** The picture used for an item's card: its cover photo, else its first uploaded video. */
export function coverOf(item: { cover_path: string | null; item_photos: { path: string; kind: MediaKind }[] }) {
  if (item.cover_path) return { path: item.cover_path, kind: "image" as const };
  const video = item.item_photos.find((p) => p.kind === "video");
  return video ? { path: video.path, kind: "video" as const } : { path: null, kind: "image" as const };
}
