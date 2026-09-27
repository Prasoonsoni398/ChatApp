import { useState, useEffect, useRef } from "react";
import {
  BsX,
  BsCheck2,
  BsPaletteFill,
  BsImage,
  BsUpload,
  BsTrash3,
  BsBrightnessHigh,
  BsSliders,
  BsArrowCounterclockwise,
  BsGlobe2,
  BsCrop,
} from "react-icons/bs";
import toast from "react-hot-toast";
import ImageCropModal from "./ImageCropModal.jsx";
import {
  getChatCustomization,
  setChatCustomization,
  setGlobalChatCustomization,
  resetChatCustomization,
  DEFAULT_CUSTOMIZATION,
  WALLPAPER_PRESETS,
  CHAT_THEMES,
} from "../../utils/chatCustomization.js";

const SOLID_COLORS = [
  { name: "WhatsApp Dark", hex: "#0B141A" },
  { name: "Dark Slate", hex: "#111B21" },
  { name: "Teal Green", hex: "#075E54" },
  { name: "Midnight Navy", hex: "#0D1B2A" },
  { name: "Deep Forest", hex: "#0F281E" },
  { name: "Velvet Plum", hex: "#1E0F1C" },
  { name: "Pure Black", hex: "#000000" },
  { name: "Light Cream", hex: "#EFEAE2" },
  { name: "Soft Mint", hex: "#E3EFE9" },
  { name: "Warm Blush", hex: "#FBE9E7" },
  { name: "Sky Blue", hex: "#E0F2FE" },
  { name: "Lavender", hex: "#EDE7F6" },
];

const ChatWallpaperModal = ({
  isOpen,
  onClose,
  selectedChat,
  onCustomizationApplied,
}) => {
  const [activeTab, setActiveTab] = useState("wallpaper"); // "wallpaper" | "theme"
  const [customization, setCustomization] = useState({
    ...DEFAULT_CUSTOMIZATION,
  });
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [cropWallpaperSrc, setCropWallpaperSrc] = useState(null);
  const fileInputRef = useRef(null);

  // Load current chat customization when opened
  useEffect(() => {
    if (isOpen && selectedChat?.id) {
      const current = getChatCustomization(selectedChat.id);
      setCustomization(current);
      if (current.wallpaperType === "custom") {
        setCustomImageUrl(current.wallpaperValue || "");
      } else {
        setCustomImageUrl("");
      }
      setUrlInput("");
    }
  }, [isOpen, selectedChat]);

  if (!isOpen || !selectedChat) return null;

  const chatName = selectedChat.name || selectedChat.customName || "this chat";

  // Handle uploading custom wallpaper file
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image file should be under 8MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (typeof dataUrl === "string") {
        setCropWallpaperSrc(dataUrl);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Handle pasting an image URL
  const handleApplyUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    setCustomImageUrl(trimmed);
    setCustomization((prev) => ({
      ...prev,
      wallpaperType: "custom",
      wallpaperValue: trimmed,
    }));
    toast.success("Custom image URL applied!");
    setUrlInput("");
  };

  // Select a preset solid color
  const handleSelectColor = (hex) => {
    setCustomization((prev) => ({
      ...prev,
      wallpaperType: "color",
      wallpaperValue: hex,
    }));
  };

  // Select a preset scenic wallpaper
  const handleSelectPreset = (preset) => {
    if (preset.type === "color") {
      setCustomization((prev) => ({
        ...prev,
        wallpaperType: "color",
        wallpaperValue: preset.color,
        showDoodle: preset.showDoodle !== undefined ? preset.showDoodle : true,
      }));
    } else {
      setCustomization((prev) => ({
        ...prev,
        wallpaperType: "preset",
        wallpaperValue: preset.url,
        showDoodle: false,
      }));
    }
  };

  // Save for this specific chat
  const handleSaveThisChat = () => {
    setChatCustomization(selectedChat.id, customization);
    toast.success(`Wallpaper & theme updated for ${chatName}`);
    if (onCustomizationApplied) onCustomizationApplied(customization);
    onClose();
  };

  // Save globally for all chats
  const handleSaveAllChats = () => {
    setChatCustomization(selectedChat.id, customization);
    setGlobalChatCustomization(customization);
    toast.success("Wallpaper & theme applied to ALL chats!");
    if (onCustomizationApplied) onCustomizationApplied(customization);
    onClose();
  };

  // Reset to default
  const handleReset = () => {
    resetChatCustomization(selectedChat.id);
    setCustomization({ ...DEFAULT_CUSTOMIZATION });
    setCustomImageUrl("");
    toast.success("Reset to default wallpaper & theme");
    if (onCustomizationApplied) onCustomizationApplied(DEFAULT_CUSTOMIZATION);
    onClose();
  };

  // Compute preview background styling
  const getPreviewBackgroundStyle = () => {
    const { wallpaperType, wallpaperValue, wallpaperBlur } = customization;

    if (wallpaperType === "color" && wallpaperValue) {
      return { backgroundColor: wallpaperValue };
    }
    if ((wallpaperType === "preset" || wallpaperType === "custom") && wallpaperValue) {
      return {
        backgroundImage: `url('${wallpaperValue}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        filter: wallpaperBlur > 0 ? `blur(${wallpaperBlur}px)` : "none",
        transform: wallpaperBlur > 0 ? "scale(1.05)" : "none",
      };
    }
    return {};
  };

  return (
    <div className="fixed inset-0 z-10003 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in select-none">
      <div className="w-full max-w-4xl bg-[#111B21] text-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-white/10">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-[#202C33]/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#25D366]/20 text-[#25D366] flex items-center justify-center shadow-xs">
              <BsPaletteFill size={17} />
            </div>
            <div>
              <h3 className="font-bold text-base text-white leading-tight">
                Wallpaper & Chat Theme
              </h3>
              <p className="text-[11px] text-[#8696A0] mt-0.5 truncate max-w-xs sm:max-w-md">
                Customizing for <span className="text-white font-medium">{chatName}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <BsX size={22} />
          </button>
        </div>

        {/* Content: Left Preview & Right Controls */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-white/10 min-h-0 bg-[#111B21]">
          {/* ── LEFT: LIVE CHAT PREVIEW ── */}
          <div className="md:col-span-5 p-4 flex flex-col items-center justify-center bg-[#0B141A]/60">
            <span className="text-[11px] text-[#8696A0] font-medium uppercase tracking-wider mb-2 self-start">
              Live Preview
            </span>

            {/* Mock Phone Frame */}
            <div
              data-theme={
                customization.theme !== "default" ? customization.theme : undefined
              }
              className="w-full max-w-[280px] sm:max-w-[300px] h-[380px] rounded-3xl overflow-hidden border border-white/20 shadow-2xl relative flex flex-col"
            >
              {/* Wallpaper Layer */}
              <div
                className="absolute inset-0 transition-all duration-300"
                style={getPreviewBackgroundStyle()}
              />

              {/* Optional WhatsApp Doodle Pattern */}
              {customization.showDoodle && (
                <div className="absolute inset-0 bg-[url('https://static.whatsapp.net/rsrc.php/v3/yl/r/r_QxI4xW8H8.png')] bg-repeat bg-center opacity-[0.08] pointer-events-none" />
              )}

              {/* Wallpaper Dimming Overlay */}
              {customization.wallpaperDim > 0 && (
                <div
                  className="absolute inset-0 bg-black pointer-events-none transition-opacity"
                  style={{ opacity: customization.wallpaperDim / 100 }}
                />
              )}

              {/* Mock Chat UI */}
              <div className="relative z-10 flex flex-col h-full justify-between p-3">
                {/* Mock Header */}
                <div className="flex items-center gap-2 p-2 bg-[#202C33]/90 rounded-2xl shadow-sm border border-white/5">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center font-bold text-xs text-white">
                    {chatName[0] || "C"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white truncate leading-tight">
                      {chatName}
                    </p>
                    <p className="text-[9px] text-[#25D366]">online</p>
                  </div>
                </div>

                {/* Mock Messages */}
                <div className="space-y-2.5 my-auto px-1">
                  {/* Incoming Bubble */}
                  <div className="flex items-end gap-1.5 max-w-[85%]">
                    <div className="bg-[#202C33] text-white p-2.5 rounded-2xl rounded-bl-xs text-xs shadow-md border border-white/5">
                      <p className="leading-relaxed">
                        Hey! How does this chat wallpaper look?
                      </p>
                      <span className="text-[9px] text-[#8696A0] float-right mt-1 ml-2">
                        12:30 PM
                      </span>
                    </div>
                  </div>

                  {/* Outgoing Bubble */}
                  <div className="flex items-end gap-1.5 max-w-[85%] ml-auto justify-end">
                    <div className="bg-[#005C4B] text-white p-2.5 rounded-2xl rounded-br-xs text-xs shadow-md">
                      <p className="leading-relaxed">
                        Looks incredible! Custom colors and themes are working.
                      </p>
                      <div className="flex items-center gap-1 justify-end mt-1">
                        <span className="text-[9px] text-white/70">12:31 PM</span>
                        <BsCheck2 size={12} className="text-[#53BDEB]" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mock Input Capsule */}
                <div className="p-2 bg-[#202C33]/90 rounded-2xl flex items-center gap-2 border border-white/5">
                  <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-white/60 text-xs">
                    +
                  </div>
                  <span className="text-[11px] text-[#8696A0] flex-1">Type a message</span>
                  <div className="w-6 h-6 rounded-full bg-[#25D366] flex items-center justify-center text-black font-bold text-xs">
                    ➤
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT: SETTINGS & OPTIONS ── */}
          <div className="md:col-span-7 p-4 sm:p-5 flex flex-col justify-between space-y-4">
            {/* Tab Buttons */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <button
                type="button"
                onClick={() => setActiveTab("wallpaper")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "wallpaper"
                    ? "bg-[#25D366] text-black shadow-md shadow-[#25D366]/20"
                    : "bg-[#202C33] text-white/80 hover:bg-[#2A3942]"
                }`}
              >
                <BsImage size={13} />
                <span>Wallpaper</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("theme")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "theme"
                    ? "bg-[#25D366] text-black shadow-md shadow-[#25D366]/20"
                    : "bg-[#202C33] text-white/80 hover:bg-[#2A3942]"
                }`}
              >
                <BsPaletteFill size={13} />
                <span>Chat Theme</span>
              </button>
            </div>

            {/* TAB 1: WALLPAPER CONTROLS */}
            {activeTab === "wallpaper" && (
              <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                {/* Custom Image Upload Card */}
                <div className="p-3.5 rounded-2xl bg-[#202C33]/80 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <BsUpload className="text-[#25D366]" /> Custom Photo Wallpaper
                    </span>
                    {customization.wallpaperType === "custom" && (
                      <span className="text-[10px] bg-[#25D366]/20 text-[#25D366] px-2 py-0.5 rounded-full font-medium">
                        Active
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-black font-semibold text-xs transition-colors cursor-pointer shadow-sm shadow-[#25D366]/20"
                    >
                      <BsUpload size={13} />
                      <span>Choose From Device</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />

                    {customImageUrl && (
                      <>
                        <button
                          type="button"
                          onClick={() => setCropWallpaperSrc(customImageUrl)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors cursor-pointer"
                          title="Crop or rotate this wallpaper"
                        >
                          <BsCrop size={12} />
                          <span>Crop & Rotate</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCustomImageUrl("");
                            setCustomization((prev) => ({
                              ...prev,
                              wallpaperType: "color",
                              wallpaperValue: "#0B141A",
                            }));
                          }}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 text-xs font-medium transition-colors cursor-pointer"
                        >
                          <BsTrash3 size={12} />
                          <span>Remove Photo</span>
                        </button>
                      </>
                    )}
                  </div>

                  {/* Image URL input */}
                  <div className="flex items-center gap-2 pt-1">
                    <div className="relative flex-1">
                      <BsGlobe2 className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8696A0]" size={12} />
                      <input
                        type="url"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="Or paste image URL (https://...)"
                        className="w-full bg-[#111B21] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#8696A0] focus:border-[#25D366] focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyUrl}
                      disabled={!urlInput.trim()}
                      className="px-3 py-1.5 rounded-xl bg-[#202C33] hover:bg-[#2A3942] text-white text-xs font-medium border border-white/10 disabled:opacity-40 cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                </div>

                {/* Solid Colors */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Solid Colors</span>
                    <label className="flex items-center gap-1.5 text-[11px] text-[#8696A0] cursor-pointer hover:text-white">
                      <span>Custom Color:</span>
                      <input
                        type="color"
                        value={
                          customization.wallpaperType === "color"
                            ? customization.wallpaperValue
                            : "#0B141A"
                        }
                        onChange={(e) => handleSelectColor(e.target.value)}
                        className="w-6 h-6 rounded-md cursor-pointer bg-transparent border-0"
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-6 sm:grid-cols-6 gap-2">
                    {SOLID_COLORS.map((col) => {
                      const isSelected =
                        customization.wallpaperType === "color" &&
                        customization.wallpaperValue.toLowerCase() === col.hex.toLowerCase();
                      return (
                        <button
                          key={col.hex}
                          type="button"
                          onClick={() => handleSelectColor(col.hex)}
                          className={`h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer relative group ${
                            isSelected
                              ? "border-[#25D366] scale-105 shadow-md shadow-[#25D366]/30 ring-2 ring-[#25D366]/40"
                              : "border-white/10 hover:border-white/30"
                          }`}
                          style={{ backgroundColor: col.hex }}
                          title={col.name}
                        >
                          {isSelected && (
                            <BsCheck2
                              size={16}
                              className={`drop-shadow-md ${
                                col.hex.startsWith("#E") || col.hex.startsWith("#F")
                                  ? "text-black"
                                  : "text-[#25D366]"
                              }`}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Scenic Presets */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-white">Curated Presets</span>
                  <div className="grid grid-cols-4 gap-2">
                    {WALLPAPER_PRESETS.map((preset) => {
                      const isSelected =
                        (preset.type === "preset" &&
                          customization.wallpaperValue === preset.url) ||
                        (preset.type === "color" &&
                          customization.wallpaperType === "color" &&
                          customization.wallpaperValue === preset.color);
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectPreset(preset)}
                          className={`h-14 rounded-xl border overflow-hidden relative transition-all cursor-pointer text-left group ${
                            isSelected
                              ? "border-[#25D366] ring-2 ring-[#25D366]/40 scale-105"
                              : "border-white/10 hover:border-white/30"
                          }`}
                        >
                          {preset.type === "color" ? (
                            <div
                              className="w-full h-full"
                              style={{ backgroundColor: preset.color }}
                            />
                          ) : (
                            <img
                              src={preset.thumbnail}
                              alt={preset.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          )}
                          <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-xs p-1">
                            <p className="text-[9px] text-white font-medium truncate">
                              {preset.name}
                            </p>
                          </div>
                          {isSelected && (
                            <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#25D366] text-black flex items-center justify-center">
                              <BsCheck2 size={11} className="stroke-[1.5]" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Wallpaper Options: Doodle, Dimming & Blur */}
                <div className="p-3.5 rounded-2xl bg-[#202C33]/60 border border-white/10 space-y-3">
                  {/* WhatsApp Doodle Pattern Toggle */}
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs font-semibold text-white">
                      WhatsApp Doodle Pattern
                    </span>
                    <input
                      type="checkbox"
                      checked={customization.showDoodle}
                      onChange={(e) =>
                        setCustomization((prev) => ({
                          ...prev,
                          showDoodle: e.target.checked,
                        }))
                      }
                      className="accent-[#25D366] w-4 h-4 cursor-pointer"
                    />
                  </label>

                  {/* Wallpaper Dimming Slider */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/90 flex items-center gap-1.5">
                        <BsBrightnessHigh size={13} className="text-[#25D366]" />
                        <span>Wallpaper Dimming</span>
                      </span>
                      <span className="text-[#8696A0] font-mono text-[11px]">
                        {customization.wallpaperDim}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={80}
                      step={5}
                      value={customization.wallpaperDim}
                      onChange={(e) =>
                        setCustomization((prev) => ({
                          ...prev,
                          wallpaperDim: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-[#25D366] cursor-pointer"
                    />
                  </div>

                  {/* Wallpaper Blur (only for photos/presets) */}
                  {(customization.wallpaperType === "preset" ||
                    customization.wallpaperType === "custom") && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/90 flex items-center gap-1.5">
                          <BsSliders size={13} className="text-[#25D366]" />
                          <span>Background Blur</span>
                        </span>
                        <span className="text-[#8696A0] font-mono text-[11px]">
                          {customization.wallpaperBlur}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={10}
                        step={1}
                        value={customization.wallpaperBlur}
                        onChange={(e) =>
                          setCustomization((prev) => ({
                            ...prev,
                            wallpaperBlur: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-[#25D366] cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: CHAT THEME CONTROLS */}
            {activeTab === "theme" && (
              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                <span className="text-xs font-bold text-white">Select Theme for this Chat</span>
                <div className="grid grid-cols-2 gap-2.5">
                  {CHAT_THEMES.map((th) => {
                    const isSelected = customization.theme === th.id;
                    return (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() =>
                          setCustomization((prev) => ({
                            ...prev,
                            theme: th.id,
                          }))
                        }
                        className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                          isSelected
                            ? "border-[#25D366] bg-[#25D366]/15 shadow-sm ring-1 ring-[#25D366]"
                            : "border-white/10 bg-[#202C33]/70 hover:bg-[#202C33]"
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-full ${th.bg} border border-white/20 flex-shrink-0 flex items-center justify-center`}
                        >
                          {isSelected && <BsCheck2 size={13} className="text-white stroke-[1.5]" />}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate leading-tight">
                            {th.name}
                          </p>
                          <p className="text-[10px] text-[#8696A0] mt-0.5">
                            {th.id === "default" ? "Inherit" : "Custom theme"}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="border-t border-white/10 pt-3 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 text-xs font-medium transition-colors cursor-pointer"
                title="Reset to default theme and wallpaper"
              >
                <BsArrowCounterclockwise size={12} />
                <span>Reset</span>
              </button>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={handleSaveAllChats}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-colors cursor-pointer"
                  title="Apply these wallpaper & theme settings to all chats"
                >
                  Set for All Chats
                </button>

                <button
                  type="button"
                  onClick={handleSaveThisChat}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#25D366] hover:bg-[#1EBE5D] text-black font-bold text-xs sm:text-sm shadow-lg shadow-[#25D366]/25 transition-all active:scale-95 cursor-pointer"
                >
                  <BsCheck2 size={16} className="stroke-[1.5]" />
                  <span>Set for this Chat</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Crop Modal for Custom Wallpaper */}
      {cropWallpaperSrc && (
        <ImageCropModal
          imageSrc={cropWallpaperSrc}
          title="Crop Wallpaper"
          cropShape="rect"
          initialAspect="9:16"
          onCropComplete={(_croppedFile, croppedUrl) => {
            setCustomImageUrl(croppedUrl);
            setCustomization((prev) => ({
              ...prev,
              wallpaperType: "custom",
              wallpaperValue: croppedUrl,
            }));
            setCropWallpaperSrc(null);
            toast.success("Wallpaper cropped & applied!");
          }}
          onCancel={() => setCropWallpaperSrc(null)}
        />
      )}
    </div>
  );
};

export default ChatWallpaperModal;
