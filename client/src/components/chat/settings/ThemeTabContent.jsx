import React from "react";

const themesList = [
  {
    id: "mintlify",
    name: "Mintlify Green",
    bg: "bg-primary",
    mode: "Light",
  },
  {
    id: "dark",
    name: "Dark Slate",
    bg: "bg-neutral",
    mode: "Dark",
  },
  {
    id: "black",
    name: "OLED Midnight",
    bg: "bg-base-300",
    mode: "Dark",
  },
  {
    id: "luxury",
    name: "Luxury Gold",
    bg: "bg-secondary",
    mode: "Dark",
  },
  {
    id: "dracula",
    name: "Dracula Purple",
    bg: "bg-accent",
    mode: "Dark",
  },
  {
    id: "ghibli",
    name: "Ghibli Warm",
    bg: "bg-primary",
    mode: "Light",
  },
  {
    id: "corporate",
    name: "Corporate Clean",
    bg: "bg-info",
    mode: "Light",
  },
  {
    id: "light",
    name: "Clean Light",
    bg: "bg-base-100",
    mode: "Light",
  },
  {
    id: "soft",
    name: "Soft Pastel",
    bg: "bg-secondary",
    mode: "Light",
  },
  {
    id: "system",
    name: "Match System",
    bg: "bg-gradient-to-r from-base-200 to-base-300",
    mode: "Auto",
  },
];

const ThemeTabContent = ({ appTheme, handleThemeChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">
          App Appearance
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {themesList.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => handleThemeChange(t.id)}
              className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                appTheme === t.id
                  ? "border-primary bg-primary/10 shadow-sm"
                  : "border-base-300 bg-base-200/50 hover:bg-base-200"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full ${t.bg} border border-base-content/20 flex-shrink-0`}
              />
              <div className="min-w-0">
                <span className="text-xs font-bold block truncate">
                  {t.name}
                </span>
                <span className="text-[10px] text-base-content/50">
                  {t.mode}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ThemeTabContent;
