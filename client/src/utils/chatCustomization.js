/**
 * chatCustomization.js
 * Manages per-chat theme and custom wallpaper settings.
 * Persists to localStorage and broadcasts updates across the app.
 */

const STORAGE_PREFIX = "chat_customization_";
const GLOBAL_WALLPAPER_KEY = "chat_global_customization";

export const DEFAULT_CUSTOMIZATION = {
  theme: "default", // "default" means inherit global app theme
  wallpaperType: "default", // "default" | "color" | "preset" | "custom"
  wallpaperValue: "", // color hex, preset URL, or uploaded base64 data URL
  wallpaperDim: 0, // 0 to 80 (percentage)
  showDoodle: true, // show WhatsApp doodle overlay
  wallpaperBlur: 0, // 0 to 10 (px)
};

// Preset wallpapers (curated lightweight, beautiful chat backgrounds)
export const WALLPAPER_PRESETS = [
  {
    id: "dark_doodle",
    name: "Classic WhatsApp Dark",
    type: "color",
    color: "#0B141A",
    showDoodle: true,
    thumbnail: "#0B141A",
  },
  {
    id: "slate_doodle",
    name: "Dark Slate",
    type: "color",
    color: "#111B21",
    showDoodle: true,
    thumbnail: "#111B21",
  },
  {
    id: "teal_doodle",
    name: "WhatsApp Teal",
    type: "color",
    color: "#075E54",
    showDoodle: true,
    thumbnail: "#075E54",
  },
  {
    id: "midnight_blue",
    name: "Midnight Navy",
    type: "color",
    color: "#0D1B2A",
    showDoodle: true,
    thumbnail: "#0D1B2A",
  },
  {
    id: "forest_green",
    name: "Deep Forest",
    type: "color",
    color: "#0F281E",
    showDoodle: true,
    thumbnail: "#0F281E",
  },
  {
    id: "velvet_plum",
    name: "Velvet Plum",
    type: "color",
    color: "#1E0F1C",
    showDoodle: true,
    thumbnail: "#1E0F1C",
  },
  {
    id: "pure_black",
    name: "OLED Pitch Black",
    type: "color",
    color: "#000000",
    showDoodle: false,
    thumbnail: "#000000",
  },
  {
    id: "warm_cream",
    name: "Light Cream",
    type: "color",
    color: "#EFEAE2",
    showDoodle: true,
    thumbnail: "#EFEAE2",
  },
  {
    id: "soft_mint",
    name: "Soft Mint",
    type: "color",
    color: "#E3EFE9",
    showDoodle: true,
    thumbnail: "#E3EFE9",
  },
  {
    id: "sunset_blush",
    name: "Sunset Blush",
    type: "color",
    color: "#FBE9E7",
    showDoodle: true,
    thumbnail: "#FBE9E7",
  },
  // Scenic / Nature / Gradients
  {
    id: "scenic_sunset",
    name: "Neon Dusk",
    type: "preset",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1080&auto=format&fit=crop&q=80",
    showDoodle: false,
    thumbnail:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&auto=format&fit=crop&q=60",
  },
  {
    id: "cosmic_stars",
    name: "Deep Cosmos",
    type: "preset",
    url: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1080&auto=format&fit=crop&q=80",
    showDoodle: false,
    thumbnail:
      "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=160&auto=format&fit=crop&q=60",
  },
  {
    id: "minimal_waves",
    name: "Abstract Waves",
    type: "preset",
    url: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1080&auto=format&fit=crop&q=80",
    showDoodle: false,
    thumbnail:
      "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=160&auto=format&fit=crop&q=60",
  },
  {
    id: "mountain_dawn",
    name: "Misty Mountain",
    type: "preset",
    url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1080&auto=format&fit=crop&q=80",
    showDoodle: false,
    thumbnail:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=160&auto=format&fit=crop&q=60",
  },
];

// Available themes for per-chat theming
export const CHAT_THEMES = [
  { id: "default", name: "Default (App Theme)", bg: "bg-base-200" },
  { id: "mintlify", name: "Mintlify Green", bg: "bg-[#25D366]" },
  { id: "dark", name: "Dark Slate", bg: "bg-[#111B21]" },
  { id: "black", name: "OLED Midnight", bg: "bg-black" },
  { id: "luxury", name: "Luxury Gold", bg: "bg-[#dca54c]" },
  { id: "dracula", name: "Dracula Purple", bg: "bg-[#7957d5]" },
  { id: "ghibli", name: "Ghibli Warm", bg: "bg-[#f59e0b]" },
  { id: "corporate", name: "Corporate Blue", bg: "bg-[#3b82f6]" },
  { id: "light", name: "Clean Light", bg: "bg-white" },
  { id: "soft", name: "Soft Pastel", bg: "bg-[#ec4899]" },
];

/**
 * Get customization for a specific chat, falling back to global or defaults
 */
export function getChatCustomization(chatId) {
  if (!chatId) return { ...DEFAULT_CUSTOMIZATION };

  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${chatId}`);
    if (raw) {
      return { ...DEFAULT_CUSTOMIZATION, ...JSON.parse(raw) };
    }

    // Fallback to global customization if set
    const globalRaw = localStorage.getItem(GLOBAL_WALLPAPER_KEY);
    if (globalRaw) {
      return { ...DEFAULT_CUSTOMIZATION, ...JSON.parse(globalRaw) };
    }
  } catch (err) {
    console.error("Error reading chat customization:", err);
  }

  return { ...DEFAULT_CUSTOMIZATION };
}

/**
 * Save customization for a specific chat
 */
export function setChatCustomization(chatId, config) {
  if (!chatId) return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${chatId}`, JSON.stringify(config));
    window.dispatchEvent(
      new CustomEvent("chat-customization-changed", {
        detail: { chatId, config },
      }),
    );
  } catch (err) {
    console.error("Error saving chat customization:", err);
  }
}

/**
 * Apply customization globally to all chats
 */
export function setGlobalChatCustomization(config) {
  try {
    localStorage.setItem(GLOBAL_WALLPAPER_KEY, JSON.stringify(config));
    window.dispatchEvent(
      new CustomEvent("chat-customization-changed", {
        detail: { isGlobal: true, config },
      }),
    );
  } catch (err) {
    console.error("Error saving global chat customization:", err);
  }
}

/**
 * Reset customization for a specific chat back to default
 */
export function resetChatCustomization(chatId) {
  if (!chatId) return;
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${chatId}`);
    window.dispatchEvent(
      new CustomEvent("chat-customization-changed", {
        detail: { chatId, config: DEFAULT_CUSTOMIZATION },
      }),
    );
  } catch (err) {
    console.error("Error resetting chat customization:", err);
  }
}
