import { useState, useEffect, useRef } from "react";
import {
  BsChatSquareTextFill,
  BsRecordCircle,
  BsTelephoneFill,
  BsPeopleFill,
  BsMegaphoneFill,
  BsGear,
  BsShieldLock,
  BsLaptop,
  BsKeyboard,
  BsPersonCircle,
  BsBoxArrowRight,
} from "react-icons/bs";

const IconSidebar = ({
  activeTab,
  setActiveTab,
  loggedInUser,
  handleLogout,
  setShowEditModal,
  setEditName,
  onOpenPrivacySettings,
  onOpenLinkedDevices,
  onOpenShortcuts,
}) => {
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const settingsMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        settingsMenuRef.current &&
        !settingsMenuRef.current.contains(event.target)
      ) {
        setShowSettingsMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="hidden md:flex w-16 h-full flex-col items-center py-4 bg-base-200 border-r border-base-300 justify-between flex-shrink-0 z-50">
      <div className="flex flex-col gap-4 w-full items-center">
        {/* Chats Tab */}
        <button
          onClick={() => setActiveTab("chats")}
          className={`p-3 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 ${
            activeTab === "chats"
              ? "bg-base-300 text-primary shadow-sm"
              : "text-base-content/60 hover:bg-base-300 hover:text-base-content"
          }`}
          title="Chats"
        >
          <BsChatSquareTextFill size={21} />
        </button>

        {/* Status / Updates Tab */}
        <button
          onClick={() => setActiveTab("status")}
          className={`p-3 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 ${
            activeTab === "status"
              ? "bg-base-300 text-primary shadow-sm"
              : "text-base-content/60 hover:bg-base-300 hover:text-base-content"
          }`}
          title="Status"
        >
          <BsRecordCircle
            size={22}
            className={activeTab === "status" ? "" : "opacity-80"}
          />
        </button>

        {/* Communities Tab */}
        <button
          onClick={() => setActiveTab("communities")}
          className={`p-3 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 ${
            activeTab === "communities"
              ? "bg-base-300 text-primary shadow-sm"
              : "text-base-content/60 hover:bg-base-300 hover:text-base-content"
          }`}
          title="Communities"
        >
          <BsPeopleFill
            size={22}
            className={activeTab === "communities" ? "" : "opacity-80"}
          />
        </button>

        {/* Channels Tab */}
        <button
          onClick={() => setActiveTab("channels")}
          className={`p-3 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 ${
            activeTab === "channels"
              ? "bg-base-300 text-primary shadow-sm"
              : "text-base-content/60 hover:bg-base-300 hover:text-base-content"
          }`}
          title="Channels"
        >
          <BsMegaphoneFill
            size={20}
            className={activeTab === "channels" ? "" : "opacity-80"}
          />
        </button>

        {/* Calls Tab */}
        <button
          onClick={() => setActiveTab("calls")}
          className={`p-3 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 ${
            activeTab === "calls"
              ? "bg-base-300 text-primary shadow-sm"
              : "text-base-content/60 hover:bg-base-300 hover:text-base-content"
          }`}
          title="Calls"
        >
          <BsTelephoneFill
            size={20}
            className={activeTab === "calls" ? "" : "opacity-80"}
          />
        </button>
      </div>

      <div className="flex flex-col gap-5 w-full items-center">
        {/* Settings Dropdown */}
        <div className="relative" ref={settingsMenuRef}>
          <button
            onClick={() => setShowSettingsMenu((v) => !v)}
            className={`p-3 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 ${
              showSettingsMenu
                ? "text-primary bg-primary/10 shadow-sm"
                : "text-base-content/60 hover:bg-base-300 hover:text-base-content"
            }`}
            title="Settings"
          >
            <BsGear
              size={21}
              className="hover:rotate-90 transition-transform duration-500"
            />
          </button>

          {showSettingsMenu && (
            <ul className="absolute bottom-full text-sm left-12 ml-4 z-100 menu p-2 shadow-xl bg-base-100 rounded-2xl w-45 border border-base-300 animate-slide-up origin-bottom-left">
              <li>
                <a
                  onClick={() => {
                    setShowSettingsMenu(false);
                    setEditName(loggedInUser?.name || "");
                    setShowEditModal(true);
                  }}
                  className="active:scale-95 transition-transform flex items-center gap-2.5"
                >
                  <BsPersonCircle size={15} className="text-primary" /> Edit
                  Profile
                </a>
              </li>
              <li>
                <a
                  onClick={() => {
                    setShowSettingsMenu(false);
                    if (onOpenPrivacySettings) onOpenPrivacySettings();
                  }}
                  className="active:scale-95 transition-transform flex items-center gap-2.5"
                >
                  <BsShieldLock size={15} /> Settings
                </a>
              </li>
              <li>
                <a
                  onClick={() => {
                    setShowSettingsMenu(false);
                    if (onOpenLinkedDevices) onOpenLinkedDevices();
                  }}
                  className="active:scale-95 transition-transform flex items-center gap-2.5"
                >
                  <BsLaptop size={15} /> Linked Devices
                </a>
              </li>
              <li>
                <a
                  onClick={() => {
                    setShowSettingsMenu(false);
                    if (onOpenShortcuts) onOpenShortcuts();
                  }}
                  className="active:scale-95 transition-transform flex items-center gap-2.5"
                >
                  <BsKeyboard size={15} /> Shortcuts
                </a>
              </li>
              <div className="divider my-1"></div>
              <li>
                <a
                  onClick={() => {
                    setShowSettingsMenu(false);
                    handleLogout();
                  }}
                  className="text-error active:scale-95 transition-transform flex items-center gap-2.5 font-medium"
                >
                  <BsBoxArrowRight size={15} className="text-error" /> Logout
                </a>
              </li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default IconSidebar;
