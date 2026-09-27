import { useState, useEffect, useRef } from "react";
import {
  BsChatSquareTextFill,
  BsChatSquareText,
  BsRecordCircle,
  BsTelephoneFill,
  BsTelephone,
  BsPeopleFill,
  BsPeople,
  BsMegaphoneFill,
  BsMegaphone,
  BsGear,
  BsGearFill,
  BsShieldLock,
  BsLaptop,
  BsKeyboard,
  BsPersonCircle,
  BsBoxArrowRight,
} from "react-icons/bs";

const IconSidebar = ({
  activeTab,
  setActiveTab,
  onTabSelect,
  isSettingsOpen = false,
  unreadMessagesCount = 0,
  hasUnreadStatus = false,
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

  const handleTabClick = (tabId) => {
    if (onTabSelect) {
      onTabSelect(tabId);
    } else {
      setActiveTab(tabId);
    }
  };

  const navItems = [
    {
      id: "chats",
      label: "Chats",
      iconActive: BsChatSquareTextFill,
      iconInactive: BsChatSquareText,
      badgeCount: unreadMessagesCount,
    },
    {
      id: "status",
      label: "Status",
      iconActive: BsRecordCircle,
      iconInactive: BsRecordCircle,
      badgeDot: hasUnreadStatus,
    },
    {
      id: "communities",
      label: "Communities",
      iconActive: BsPeopleFill,
      iconInactive: BsPeople,
    },
    {
      id: "channels",
      label: "Channels",
      iconActive: BsMegaphoneFill,
      iconInactive: BsMegaphone,
    },
    {
      id: "calls",
      label: "Calls",
      iconActive: BsTelephoneFill,
      iconInactive: BsTelephone,
    },
  ];

  return (
    <aside
      aria-label="Navigation Sidebar"
      className="hidden md:flex w-16 h-full flex-col items-center py-3 bg-base-200 border-r border-r-theme-soothing icon-sidebar-panel justify-between flex-shrink-0 z-50 select-none"
    >
      {/* Top Navigation Tabs */}
      <div className="flex flex-col gap-2.5 w-full items-center">
        {navItems.map((item) => {
          const isActive = !isSettingsOpen && activeTab === item.id;
          const Icon = isActive ? item.iconActive : item.iconInactive;

          return (
            <div key={item.id} className="relative w-full flex justify-center group">
              {/* WhatsApp-style Active Indicator Bar */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 bg-primary rounded-r-full shadow-sm animate-fade-in" />
              )}

              <button
                type="button"
                onClick={() => handleTabClick(item.id)}
                className={`relative w-11 h-11 flex items-center justify-center rounded-2xl transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-primary/15 text-primary shadow-sm scale-100 font-semibold"
                    : "text-base-content/60 hover:text-base-content hover:bg-base-300/80 hover:scale-105 active:scale-95"
                }`}
                title={item.label}
                aria-label={item.label}
              >
                <Icon size={21} className="transition-transform duration-200" />

                {/* Unread message count badge */}
                {item.badgeCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 bg-primary text-primary-content text-[10px] font-bold min-w-4.5 h-4.5 px-1 rounded-full flex items-center justify-center shadow-md border-2 border-base-200 animate-scale-in"
                  >
                    {item.badgeCount > 99 ? "99+" : item.badgeCount}
                  </span>
                )}

                {/* Unread status dot indicator */}
                {item.badgeDot && !item.badgeCount && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-primary rounded-full ring-2 ring-base-200 animate-pulse" />
                )}
              </button>

              {/* Floating Tooltip */}
              <div className="absolute left-16 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-neutral text-neutral-content text-xs font-medium rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50 flex items-center gap-1.5 border border-base-content/10">
                <span>{item.label}</span>
                {item.badgeCount > 0 && (
                  <span className="bg-primary/25 text-primary px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                    {item.badgeCount}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Actions: Settings & Profile Menu */}
      <div className="flex flex-col gap-2.5 w-full items-center">
        {/* Settings Tab Button */}
        <div className="relative w-full flex justify-center group">
          {isSettingsOpen && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 bg-primary rounded-r-full shadow-sm animate-fade-in" />
          )}

          <button
            type="button"
            onClick={() => handleTabClick("settings")}
            className={`relative w-11 h-11 flex items-center justify-center rounded-2xl transition-all duration-200 cursor-pointer ${
              isSettingsOpen
                ? "bg-primary/15 text-primary shadow-sm font-semibold"
                : "text-base-content/60 hover:text-base-content hover:bg-base-300/80 hover:scale-105 active:scale-95"
            }`}
            title="Settings"
            aria-label="Settings"
          >
            {isSettingsOpen ? (
              <BsGearFill size={21} className="rotate-90 transition-transform duration-300" />
            ) : (
              <BsGear size={21} className="group-hover:rotate-45 transition-transform duration-300" />
            )}
          </button>

          {/* Floating Tooltip */}
          <div className="absolute left-16 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-neutral text-neutral-content text-xs font-medium rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50 border border-base-content/10">
            Settings
          </div>
        </div>

        {/* Profile Avatar & Options Menu */}
        <div className="relative w-full flex justify-center" ref={settingsMenuRef}>
          <button
            type="button"
            onClick={() => setShowSettingsMenu((v) => !v)}
            className={`relative w-10 h-10 rounded-full transition-all duration-200 flex items-center justify-center overflow-hidden cursor-pointer ring-2 ${
              showSettingsMenu
                ? "ring-primary scale-105"
                : "ring-base-content/20 hover:ring-primary/60 hover:scale-105 active:scale-95"
            }`}
            title={loggedInUser?.name || "Profile & Account"}
            aria-label="Profile and Account"
          >
            {loggedInUser?.avatar ? (
              <img
                src={loggedInUser.avatar}
                alt={loggedInUser.name || "Profile"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                {(loggedInUser?.name || "U")[0]?.toUpperCase()}
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success rounded-full ring-2 ring-base-200" />
          </button>

          {showSettingsMenu && (
            <ul className="absolute bottom-2 left-14 ml-2 z-100 menu p-2 shadow-2xl bg-base-100 rounded-2xl w-48 border border-base-300 animate-slide-up origin-bottom-left text-xs">
              <li className="menu-title px-3 py-1 font-semibold text-base-content/70">
                {loggedInUser?.name || "Account"}
              </li>
              <li>
                <a
                  onClick={() => {
                    setShowSettingsMenu(false);
                    setEditName(loggedInUser?.name || "");
                    setShowEditModal(true);
                  }}
                  className="py-2 active:scale-95 transition-transform flex items-center gap-2.5"
                >
                  <BsPersonCircle size={15} className="text-primary" /> Edit Profile
                </a>
              </li>
              <li>
                <a
                  onClick={() => {
                    setShowSettingsMenu(false);
                    if (onTabSelect) onTabSelect("settings");
                    else if (onOpenPrivacySettings) onOpenPrivacySettings();
                  }}
                  className="py-2 active:scale-95 transition-transform flex items-center gap-2.5"
                >
                  <BsShieldLock size={15} /> All Settings
                </a>
              </li>
              <li>
                <a
                  onClick={() => {
                    setShowSettingsMenu(false);
                    if (onOpenLinkedDevices) onOpenLinkedDevices();
                  }}
                  className="py-2 active:scale-95 transition-transform flex items-center gap-2.5"
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
                  className="py-2 active:scale-95 transition-transform flex items-center gap-2.5"
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
                  className="py-2 text-error active:scale-95 transition-transform flex items-center gap-2.5 font-medium hover:bg-error/10"
                >
                  <BsBoxArrowRight size={15} className="text-error" /> Logout
                </a>
              </li>
            </ul>
          )}
        </div>
      </div>
    </aside>
  );
};

export default IconSidebar;
