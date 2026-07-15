import {
  siTypescript,
  siJavascript,
  siPython,
  siGo,
  siRust,
  siOpenjdk,
  siCplusplus,
  siC,
  siDotnet,
  siRuby,
  siPhp,
  siSwift,
  siKotlin,
  siHtml5,
  siCss,
  siGnubash,
  siDart,
  siVuedotjs,
} from "simple-icons";

// Real brand marks from simple-icons (named imports tree-shake to just the
// icons below — Satori/edge only renders inline SVG, so we pass the raw
// path + hex through rather than the package's React/web-component helpers.
const LANGUAGE_ICONS: Record<string, { path: string; hex: string }> = {
  TypeScript: siTypescript,
  JavaScript: siJavascript,
  Python: siPython,
  Go: siGo,
  Rust: siRust,
  Java: siOpenjdk,
  "C++": siCplusplus,
  C: siC,
  "C#": siDotnet,
  Ruby: siRuby,
  PHP: siPhp,
  Swift: siSwift,
  Kotlin: siKotlin,
  HTML: siHtml5,
  CSS: siCss,
  Shell: siGnubash,
  Dart: siDart,
  Vue: siVuedotjs,
};

const DEFAULT_COLOR = "#00e676";

export function languageColor(language: string | null | undefined): string {
  if (!language) return DEFAULT_COLOR;
  return LANGUAGE_ICONS[language] ? `#${LANGUAGE_ICONS[language].hex}` : DEFAULT_COLOR;
}

// Headless lookup so non-JSX renderers (the plain-string SVG card generator
// in lib/svg-card) can draw the same brand mark without going through the
// React component below.
export function getLanguageIcon(language: string | null | undefined): { path: string; color: string } | null {
  if (!language) return null;
  const icon = LANGUAGE_ICONS[language];
  return icon ? { path: icon.path, color: `#${icon.hex}` } : null;
}

export function LanguageBadge({ language, size = 72 }: { language: string | null | undefined; size?: number }) {
  const icon = language ? LANGUAGE_ICONS[language] : undefined;
  const color = icon ? `#${icon.hex}` : DEFAULT_COLOR;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: size * 0.28,
        backgroundColor: `${color}26`,
        borderWidth: 2,
        borderStyle: "solid",
        borderColor: color,
      }}
    >
      {icon ? (
        <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill={color}>
          <path d={icon.path} />
        </svg>
      ) : (
        <span style={{ display: "flex", fontFamily: "Archivo Black", fontSize: size * 0.36, color }}>
          {(language ?? "—").slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
}
