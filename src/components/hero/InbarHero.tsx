import Image from "next/image";
import type { SideProfile } from "@/lib/types";
import { photoUrl } from "@/lib/supabase";

/** Mom's side: colour, movement, paint. */
export function InbarBackground({ profile }: { profile: SideProfile }) {
  const hero = photoUrl(profile.hero_image);
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#fff4e6]">
      {hero && (
        <Image src={hero} alt="" fill priority sizes="100vw" className="object-cover opacity-40 mix-blend-multiply" />
      )}
      <div aria-hidden className="inbar-blob left-[-10%] top-[-10%] h-[55vmax] w-[55vmax] bg-[#ff5d8f]" />
      <div aria-hidden className="inbar-blob right-[-15%] top-[20%] h-[50vmax] w-[50vmax] bg-[#ffb627] [animation-delay:-6s]" />
      <div aria-hidden className="inbar-blob bottom-[-20%] left-[15%] h-[45vmax] w-[45vmax] bg-[#2ec4b6] [animation-delay:-12s]" />
      <div aria-hidden className="inbar-blob bottom-[5%] right-[5%] h-[30vmax] w-[30vmax] bg-[#7b2cbf] [animation-delay:-3s]" />
      <div aria-hidden className="absolute inset-0 bg-[url('/textures/paper.svg')] opacity-50 mix-blend-multiply" />
    </div>
  );
}

export function InbarContent({ profile, share }: { profile: SideProfile; share: number }) {
  const visible = share > 0.18;
  return (
    <div
      className="flex h-full flex-col items-center justify-center px-6 text-center text-[#2b1638]"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 300ms ease" }}
    >
      <p className="font-hand text-[clamp(1.1rem,5cqw,2rem)]" style={{ transform: "rotate(-4deg)" }}>
        the art of
      </p>
      <h1
        className="font-display text-[clamp(2.6rem,24cqw,14rem)] font-black italic leading-[0.95] tracking-tight"
      >
        <span className="px-[0.12em] bg-gradient-to-r from-[#ff5d8f] via-[#7b2cbf] to-[#2ec4b6] bg-clip-text text-transparent">
          {profile.display_name}
        </span>
      </h1>
      <p className="mt-4 max-w-sm text-[clamp(.95rem,3.4cqw,1.25rem)] font-medium">{profile.tagline}</p>
      <p className="mt-8 font-hand text-[clamp(1rem,3cqw,1.25rem)]" style={{ opacity: share > 0.55 && share < 0.98 ? 0.85 : 0 }}>
        ← pull me wider, or tap to step inside
      </p>
    </div>
  );
}
