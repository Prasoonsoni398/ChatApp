/**
 * statusBackgrounds.js
 * Rich creative backgrounds, gradients, patterns, text colors and overlay styles
 * for WhatsApp-style Status Creation and Viewing.
 */

export const SOLID_BACKGROUNDS = [
  { id: "teal", label: "WhatsApp Teal", value: "#075e54" },
  { id: "dark_slate", label: "Dark Slate", value: "#121b22" },
  { id: "emerald", label: "Emerald Green", value: "#128c7e" },
  { id: "bright_green", label: "Vibrant Green", value: "#25d366" },
  { id: "sapphire", label: "Sapphire Blue", value: "#1e3a8a" },
  { id: "sky_blue", label: "Sky Blue", value: "#0284c7" },
  { id: "royal_purple", label: "Royal Purple", value: "#6b21a8" },
  { id: "magenta", label: "Deep Magenta", value: "#be185d" },
  { id: "crimson", label: "Crimson Red", value: "#b91c1c" },
  { id: "coral", label: "Coral Orange", value: "#c2410c" },
  { id: "amber", label: "Warm Amber", value: "#b45309" },
  { id: "charcoal", label: "Pure Carbon", value: "#0f172a" },
];

export const GRADIENT_BACKGROUNDS = [
  {
    id: "sunset_glow",
    label: "Sunset Glow",
    value: "linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)",
  },
  {
    id: "emerald_lagoon",
    label: "Emerald Lagoon",
    value: "linear-gradient(135deg, #075e54 0%, #128c7e 50%, #25d366 100%)",
  },
  {
    id: "neon_cyber",
    label: "Neon Cyber",
    value: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)",
  },
  {
    id: "deep_ocean",
    label: "Deep Oceanic",
    value: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0284c7 100%)",
  },
  {
    id: "fire_ruby",
    label: "Fire Ruby",
    value: "linear-gradient(135deg, #991b1b 0%, #ea580c 50%, #facc15 100%)",
  },
  {
    id: "purple_haze",
    label: "Purple Haze",
    value: "linear-gradient(135deg, #311042 0%, #6b21a8 50%, #d946ef 100%)",
  },
  {
    id: "mystic_twilight",
    label: "Mystic Twilight",
    value: "linear-gradient(135deg, #180527 0%, #4338ca 60%, #06b6d4 100%)",
  },
  {
    id: "citrus_burst",
    label: "Citrus Burst",
    value: "linear-gradient(135deg, #f97316 0%, #f59e0b 50%, #84cc16 100%)",
  },
  {
    id: "rose_blush",
    label: "Rose Blush",
    value: "linear-gradient(135deg, #831843 0%, #e11d48 50%, #fda4af 100%)",
  },
  {
    id: "midnight_aurora",
    label: "Midnight Aurora",
    value: "linear-gradient(135deg, #022c22 0%, #065f46 40%, #10b981 100%)",
  },
  {
    id: "dark_mesh",
    label: "Obsidian Matrix",
    value: "linear-gradient(135deg, #000000 0%, #1c1917 50%, #44403c 100%)",
  },
];

export const CREATIVE_PATTERNS = [
  { id: "none", label: "Clean" },
  { id: "doodle", label: "Doodle" },
  { id: "dots", label: "Dots" },
  { id: "grid", label: "Grid" },
  { id: "diagonal", label: "Stripes" },
  { id: "spotlight", label: "Spotlight" },
  { id: "stars", label: "Sparkles" },
];

export const STATUS_TEXT_COLORS = [
  { id: "white", label: "White", value: "#ffffff" },
  { id: "yellow", label: "Yellow", value: "#ffeb3b" },
  { id: "green", label: "Neon Green", value: "#25d366" },
  { id: "cyan", label: "Cyan", value: "#00e5ff" },
  { id: "pink", label: "Hot Pink", value: "#ff4081" },
  { id: "orange", label: "Orange", value: "#ff9800" },
  { id: "purple", label: "Purple", value: "#e040fb" },
  { id: "red", label: "Red", value: "#ff5252" },
  { id: "black", label: "Black", value: "#0b141a" },
];

export const TEXT_OVERLAY_BG_STYLES = [
  { id: "transparent", label: "None" },
  { id: "translucent", label: "Frosted" },
  { id: "solid-dark", label: "Dark Pill" },
  { id: "solid-white", label: "White Pill" },
  { id: "colored-pill", label: "Color Pill" },
  { id: "gradient-pill", label: "Gradient" },
  { id: "neon-glow", label: "Neon Glow" },
];

/**
 * Returns inline styling for pattern overlay layer
 */
export function getPatternStyle(patternId) {
  switch (patternId) {
    case "doodle":
      return {
        backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.15) 10%, transparent 10.5%), radial-gradient(circle, rgba(255,255,255,0.15) 10%, transparent 10.5%)`,
        backgroundSize: "36px 36px",
        backgroundPosition: "0 0, 18px 18px",
        opacity: 0.7,
      };
    case "dots":
      return {
        backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.22) 1.5px, transparent 1.5px)`,
        backgroundSize: "20px 20px",
        opacity: 0.8,
      };
    case "grid":
      return {
        backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
        backgroundSize: "32px 32px",
        opacity: 0.8,
      };
    case "diagonal":
      return {
        backgroundImage: `repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.07) 12px, transparent 12px, transparent 24px)`,
        opacity: 0.75,
      };
    case "spotlight":
      return {
        backgroundImage: `radial-gradient(circle at center, rgba(255, 255, 255, 0.25) 0%, transparent 68%)`,
        opacity: 0.9,
      };
    case "stars":
      return {
        backgroundImage: `radial-gradient(1px 1px at 20px 30px, #ffffff, rgba(0,0,0,0)), radial-gradient(1.5px 1.5px at 70px 60px, #ffffff, rgba(0,0,0,0)), radial-gradient(1px 1px at 130px 40px, #ffffff, rgba(0,0,0,0)), radial-gradient(2px 2px at 210px 150px, #ffffff, rgba(0,0,0,0)), radial-gradient(1.5px 1.5px at 290px 90px, #ffffff, rgba(0,0,0,0))`,
        backgroundSize: "320px 320px",
        opacity: 0.65,
      };
    default:
      return {};
  }
}

/**
 * Computes exact text overlay style for media status overlays
 */
export function getTextOverlayStyle(color = "#ffffff", bgStyle = "transparent") {
  const isDarkColor =
    color.toLowerCase() === "#000000" ||
    color.toLowerCase() === "#0b141a" ||
    color.toLowerCase() === "#111827";

  switch (bgStyle) {
    case "translucent":
      return {
        color,
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        borderRadius: "16px",
        padding: "6px 14px",
        textShadow: "0 2px 4px rgba(0,0,0,0.5)",
      };
    case "solid-dark":
      return {
        color,
        backgroundColor: "#0B141A",
        border: "1px solid rgba(255, 255, 255, 0.15)",
        borderRadius: "16px",
        padding: "6px 14px",
        boxShadow: "0 4px 14px rgba(0,0,0,0.6)",
      };
    case "solid-white":
      return {
        color: isDarkColor ? "#ffffff" : color,
        backgroundColor: isDarkColor ? "#111827" : "#ffffff",
        borderRadius: "16px",
        padding: "6px 14px",
        boxShadow: "0 4px 14px rgba(0,0,0,0.4)",
        fontWeight: "bold",
      };
    case "colored-pill":
      return {
        color: isDarkColor ? "#ffffff" : "#0B141A",
        backgroundColor: color,
        borderRadius: "16px",
        padding: "6px 14px",
        boxShadow: `0 4px 14px ${color}55`,
        fontWeight: "bold",
      };
    case "gradient-pill":
      return {
        color: "#ffffff",
        background: "linear-gradient(135deg, #25D366, #128C7E)",
        borderRadius: "16px",
        padding: "6px 14px",
        boxShadow: "0 4px 14px rgba(37,211,102,0.4)",
        fontWeight: "bold",
        textShadow: "0 1px 2px rgba(0,0,0,0.4)",
      };
    case "neon-glow":
      return {
        color,
        backgroundColor: "rgba(11, 20, 26, 0.85)",
        border: `2px solid ${color}`,
        borderRadius: "16px",
        padding: "6px 14px",
        boxShadow: `0 0 16px ${color}88, inset 0 0 8px ${color}33`,
        textShadow: `0 0 8px ${color}`,
        fontWeight: "bold",
      };
    case "transparent":
    default:
      return {
        color,
        backgroundColor: "transparent",
        padding: "4px 8px",
        textShadow: "0 2px 8px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.7)",
      };
  }
}
