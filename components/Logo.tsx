import Image from "next/image";

// The square "tg" mark (design/home/TransferGit Home.dc.html's nav/footer
// logo block) — real asset already in public/, no need to recreate it as
// CSS. The sheen sweep reuses globals.css's .tg-sheen (tgSheen keyframe).
export function LogoMark({
  size = 38,
  sheen = true,
  glow = "default",
}: {
  size?: number;
  sheen?: boolean;
  // "default" (glow-green, used everywhere else this shows up, e.g. the
  // footer sticker) vs "subtle" — the mockup's own nav logo glow is a
  // near-flat, static box-shadow (0 0 18px rgba(0,230,118,.25)), nothing
  // animated or as bright as glow-green.
  glow?: "default" | "subtle";
}) {
  return (
    <span
      className={`relative inline-block shrink-0 overflow-hidden rounded-[9px] ${glow === "subtle" ? "" : "glow-green"}`}
      style={{ width: size, height: size, ...(glow === "subtle" ? { boxShadow: "0 0 18px rgba(0,230,118,0.25)" } : undefined) }}
    >
      <Image src="/transfergit/tg.png" alt="" width={size} height={size} className="h-full w-full object-cover" priority />
      {sheen && (
        <span
          aria-hidden
          className="tg-sheen pointer-events-none absolute -inset-y-[20%] left-0 w-[45%] bg-gradient-to-r from-transparent via-white/55 to-transparent"
        />
      )}
    </span>
  );
}

export function Logo({
  className = "",
  iconSize = 38,
  glow = "default",
}: {
  className?: string;
  iconSize?: number;
  glow?: "default" | "subtle";
}) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <LogoMark size={iconSize} glow={glow} />
      <span className="font-mono text-sm font-bold uppercase tracking-[0.3em] text-foreground">TRANSFERGIT</span>
    </span>
  );
}
