// =============================================================================
// 🎨 Themes — 12 production-ready themes for public bio pages
// Har theme CSS variables provide karta hai jo BioRenderer par apply hote hain.
// =============================================================================

export interface Theme {
  id: string;
  name: string;
  description: string;
  /** Public page par inline style vars */
  vars: {
    bg: string; // page background (gradient/color)
    surface: string; // card background
    surfaceHover: string;
    border: string;
    text: string;
    muted: string;
    accent: string;
    onAccent: string;
    radius: string;
    font: "display" | "sans" | "mono" | "serif";
    cardStyle: "solid" | "glass" | "outline" | "shadow";
  };
  /** Theme picker me dikhne wala preview swatch */
  swatch: [string, string, string]; // bg, surface, accent
}

export const THEMES: Theme[] = [
  {
    id: "midnight",
    name: "Midnight",
    description: "Deep space dark with violet glow",
    swatch: ["#0b0b14", "#171728", "#8b5cf6"],
    vars: {
      bg: "radial-gradient(1200px 800px at 80% -10%, rgba(139,92,246,.25), transparent 60%), radial-gradient(900px 600px at 10% 110%, rgba(217,70,239,.14), transparent 55%), #0b0b14",
      surface: "rgba(255,255,255,.05)",
      surfaceHover: "rgba(255,255,255,.10)",
      border: "rgba(255,255,255,.12)",
      text: "#f4f4f8",
      muted: "rgba(244,244,248,.55)",
      accent: "#8b5cf6",
      onAccent: "#ffffff",
      radius: "18px",
      font: "display",
      cardStyle: "glass",
    },
  },
  {
    id: "aurora",
    name: "Aurora",
    description: "Northern lights gradient mesh",
    swatch: ["#041410", "#0b2a20", "#34d399"],
    vars: {
      bg: "radial-gradient(1000px 700px at 20% 0%, rgba(52,211,153,.22), transparent 55%), radial-gradient(900px 700px at 90% 90%, rgba(56,189,248,.18), transparent 55%), #041410",
      surface: "rgba(255,255,255,.06)",
      surfaceHover: "rgba(255,255,255,.12)",
      border: "rgba(255,255,255,.14)",
      text: "#ecfdf5",
      muted: "rgba(236,253,245,.55)",
      accent: "#34d399",
      onAccent: "#041410",
      radius: "22px",
      font: "display",
      cardStyle: "glass",
    },
  },
  {
    id: "paper",
    name: "Paper",
    description: "Clean editorial light",
    swatch: ["#faf7f2", "#ffffff", "#18181b"],
    vars: {
      bg: "linear-gradient(180deg, #faf7f2, #f3efe7)",
      surface: "#ffffff",
      surfaceHover: "#f6f3ec",
      border: "#e6e0d3",
      text: "#1c1917",
      muted: "rgba(28,25,23,.55)",
      accent: "#18181b",
      onAccent: "#ffffff",
      radius: "14px",
      font: "serif",
      cardStyle: "outline",
    },
  },
  {
    id: "candy",
    name: "Candy",
    description: "Playful pink pop",
    swatch: ["#fff1f6", "#ffffff", "#ec4899"],
    vars: {
      bg: "radial-gradient(900px 600px at 85% 0%, rgba(236,72,153,.18), transparent 55%), radial-gradient(700px 500px at 0% 100%, rgba(251,191,36,.16), transparent 55%), #fff1f6",
      surface: "#ffffff",
      surfaceHover: "#fff5fa",
      border: "#ffd6e8",
      text: "#3b0a24",
      muted: "rgba(59,10,36,.5)",
      accent: "#ec4899",
      onAccent: "#ffffff",
      radius: "24px",
      font: "sans",
      cardStyle: "shadow",
    },
  },
  {
    id: "sunset",
    name: "Sunset",
    description: "Warm ember gradient",
    swatch: ["#1a0b12", "#2a121c", "#fb7185"],
    vars: {
      bg: "radial-gradient(1100px 750px at 50% -10%, rgba(251,113,133,.28), transparent 55%), radial-gradient(900px 600px at 100% 100%, rgba(251,191,36,.15), transparent 55%), #1a0b12",
      surface: "rgba(255,255,255,.06)",
      surfaceHover: "rgba(255,255,255,.12)",
      border: "rgba(255,255,255,.12)",
      text: "#fff1f2",
      muted: "rgba(255,241,242,.55)",
      accent: "#fb7185",
      onAccent: "#2a0a12",
      radius: "18px",
      font: "display",
      cardStyle: "glass",
    },
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Deep blue calm",
    swatch: ["#030b1a", "#0a1a33", "#38bdf8"],
    vars: {
      bg: "radial-gradient(1000px 700px at 15% 0%, rgba(56,189,248,.20), transparent 55%), radial-gradient(800px 700px at 90% 100%, rgba(99,102,241,.16), transparent 55%), #030b1a",
      surface: "rgba(255,255,255,.05)",
      surfaceHover: "rgba(255,255,255,.10)",
      border: "rgba(255,255,255,.12)",
      text: "#eff6ff",
      muted: "rgba(239,246,255,.55)",
      accent: "#38bdf8",
      onAccent: "#04121f",
      radius: "16px",
      font: "sans",
      cardStyle: "glass",
    },
  },
  {
    id: "forest",
    name: "Forest",
    description: "Earthy moss tones",
    swatch: ["#0e150c", "#1a2415", "#a3e635"],
    vars: {
      bg: "radial-gradient(900px 650px at 80% 0%, rgba(163,230,53,.14), transparent 55%), #0e150c",
      surface: "rgba(255,255,255,.05)",
      surfaceHover: "rgba(255,255,255,.10)",
      border: "rgba(255,255,255,.10)",
      text: "#f1f7e9",
      muted: "rgba(241,247,233,.5)",
      accent: "#a3e635",
      onAccent: "#101a09",
      radius: "14px",
      font: "sans",
      cardStyle: "solid",
    },
  },
  {
    id: "noir",
    name: "Noir Mono",
    description: "Brutalist black & white",
    swatch: ["#090909", "#161616", "#ffffff"],
    vars: {
      bg: "#090909",
      surface: "#161616",
      surfaceHover: "#202020",
      border: "#2c2c2c",
      text: "#fafafa",
      muted: "rgba(250,250,250,.5)",
      accent: "#ffffff",
      onAccent: "#090909",
      radius: "4px",
      font: "mono",
      cardStyle: "outline",
    },
  },
  {
    id: "glass",
    name: "Glass",
    description: "Frosted pastel aurora",
    swatch: ["#e0e7ff", "#ffffff", "#6366f1"],
    vars: {
      bg: "radial-gradient(900px 620px at 10% 10%, rgba(244,114,182,.35), transparent 55%), radial-gradient(900px 620px at 90% 20%, rgba(56,189,248,.35), transparent 55%), radial-gradient(800px 600px at 50% 100%, rgba(167,139,250,.35), transparent 55%), #eef2ff",
      surface: "rgba(255,255,255,.55)",
      surfaceHover: "rgba(255,255,255,.75)",
      border: "rgba(255,255,255,.8)",
      text: "#111827",
      muted: "rgba(17,24,39,.55)",
      accent: "#6366f1",
      onAccent: "#ffffff",
      radius: "22px",
      font: "sans",
      cardStyle: "glass",
    },
  },
  {
    id: "cyber",
    name: "Cyber Neon",
    description: "Retro terminal glow",
    swatch: ["#020208", "#0a0a18", "#22d3ee"],
    vars: {
      bg: "repeating-linear-gradient(0deg, rgba(34,211,238,.04) 0 1px, transparent 1px 28px), repeating-linear-gradient(90deg, rgba(34,211,238,.04) 0 1px, transparent 1px 28px), radial-gradient(900px 600px at 50% 0%, rgba(34,211,238,.14), transparent 60%), #020208",
      surface: "rgba(34,211,238,.05)",
      surfaceHover: "rgba(34,211,238,.12)",
      border: "rgba(34,211,238,.35)",
      text: "#e0fbff",
      muted: "rgba(224,251,255,.5)",
      accent: "#22d3ee",
      onAccent: "#02141a",
      radius: "8px",
      font: "mono",
      cardStyle: "outline",
    },
  },
  {
    id: "ember",
    name: "Ember",
    description: "Smoky orange heat",
    swatch: ["#120a06", "#221207", "#fb923c"],
    vars: {
      bg: "radial-gradient(900px 600px at 85% 10%, rgba(251,146,60,.18), transparent 55%), #120a06",
      surface: "rgba(255,255,255,.05)",
      surfaceHover: "rgba(255,255,255,.10)",
      border: "rgba(255,255,255,.10)",
      text: "#fff7ed",
      muted: "rgba(255,247,237,.5)",
      accent: "#fb923c",
      onAccent: "#230f02",
      radius: "16px",
      font: "display",
      cardStyle: "solid",
    },
  },
  {
    id: "royal",
    name: "Royal",
    description: "Luxury gold on ink",
    swatch: ["#0c0a12", "#1a1526", "#eab308"],
    vars: {
      bg: "radial-gradient(1000px 700px at 50% -10%, rgba(234,179,8,.14), transparent 55%), #0c0a12",
      surface: "rgba(255,255,255,.04)",
      surfaceHover: "rgba(255,255,255,.09)",
      border: "rgba(234,179,8,.28)",
      text: "#fdf6e3",
      muted: "rgba(253,246,227,.5)",
      accent: "#eab308",
      onAccent: "#1c1502",
      radius: "12px",
      font: "serif",
      cardStyle: "outline",
    },
  },
];

export const THEME_MAP = new Map(THEMES.map((t) => [t.id, t]));

export function getTheme(id: string | null | undefined): Theme {
  return THEME_MAP.get(id ?? "") ?? THEMES[0];
}
