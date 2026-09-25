import { useState, useEffect } from "react";
import Dropdown from "./common/Dropdown.jsx";
import { BsPaletteFill } from "react-icons/bs";

const themeOptions = [
  { value: "mintlify", label: "Mintlify Green" },
  { value: "dark", label: "Dark Slate" },
  { value: "black", label: "OLED Midnight" },
  { value: "luxury", label: "Luxury Gold" },
  { value: "dracula", label: "Dracula" },
  { value: "corporate", label: "Corporate Clean" },
  { value: "ghibli", label: "Ghibli Warm" },
  { value: "light", label: "Clean Light" },
  { value: "soft", label: "Soft Pastel" },
];

const Navbar = () => {
  const [selectTheme, setSelectTheme] = useState(
    () => localStorage.getItem("app_theme") || "mintlify",
  );

  useEffect(() => {
    const handleThemeEvent = (e) => {
      const newTheme = e.detail || localStorage.getItem("app_theme") || "mintlify";
      setSelectTheme(newTheme);
    };
    window.addEventListener("app_theme_changed", handleThemeEvent);
    window.addEventListener("storage", handleThemeEvent);
    return () => {
      window.removeEventListener("app_theme_changed", handleThemeEvent);
      window.removeEventListener("storage", handleThemeEvent);
    };
  }, []);

  const handleThemeChange = (val) => {
    setSelectTheme(val);
    localStorage.setItem("app_theme", val);
    document.documentElement.setAttribute("data-theme", val);
    window.dispatchEvent(new CustomEvent("app_theme_changed", { detail: val }));
  };

  return (
    <div className="flex justify-between px-6 py-2 bg-primary text-primary-content items-center shadow-md">
      <a href="/" className="text-xl font-bold tracking-tight">
        Guftagu
      </a>
      <Dropdown
        value={selectTheme}
        onChange={handleThemeChange}
        options={themeOptions}
        size="sm"
        align="right"
        className="bg-base-100 text-base-content border-none shadow-sm rounded-full px-3"
      />
    </div>
  );
};

export default Navbar;
