import React from "react";
import {
  BsChatSquareTextFill,
  BsRecordCircle,
  BsPeopleFill,
  BsMegaphoneFill,
  BsTelephoneFill,
  BsPersonPlusFill,
  BsCameraFill,
  BsTelephonePlusFill,
  BsGear,
  BsGearFill,
} from "react-icons/bs";

const MobileNavAndFAB = ({
  activeTab,
  setActiveTab,
  onTabSelect,
  isSettingsOpen = false,
  unreadMessagesCount = 0,
  hasUnreadStatus = false,
  selectedChat,
  onAddContact,
  allUsers,
  startCall,
}) => {
  if (selectedChat) return null;

  const handleTabClick = (tabId) => {
    if (onTabSelect) onTabSelect(tabId);
    else setActiveTab(tabId);
  };

  return (
    <>
      {/* ── MOBILE BOTTOM NAVIGATION BAR ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-base-100 border-t border-base-300 flex items-center justify-around z-40 shadow-lg px-1">
        <button
          type="button"
          onClick={() => handleTabClick("chats")}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            !isSettingsOpen && activeTab === "chats"
              ? "text-primary font-semibold"
              : "text-base-content/60"
          }`}
        >
          <div className="relative">
            <BsChatSquareTextFill size={19} />
            {unreadMessagesCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 bg-primary text-primary-content text-[9px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center shadow-sm">
                {unreadMessagesCount > 99 ? "99+" : unreadMessagesCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1">Chats</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabClick("status")}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            !isSettingsOpen && activeTab === "status"
              ? "text-primary font-semibold"
              : "text-base-content/60"
          }`}
        >
          <div className="relative">
            <BsRecordCircle size={19} />
            {hasUnreadStatus && (
              <span className="absolute -top-0.5 -right-1 w-2 h-2 bg-primary rounded-full ring-1 ring-base-100 animate-pulse" />
            )}
          </div>
          <span className="text-[10px] mt-1">Updates</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabClick("communities")}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            !isSettingsOpen && activeTab === "communities"
              ? "text-primary font-semibold"
              : "text-base-content/60"
          }`}
        >
          <BsPeopleFill size={19} />
          <span className="text-[10px] mt-1">Communities</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabClick("channels")}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            !isSettingsOpen && activeTab === "channels"
              ? "text-primary font-semibold"
              : "text-base-content/60"
          }`}
        >
          <BsMegaphoneFill size={18} />
          <span className="text-[10px] mt-1">Channels</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabClick("calls")}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            !isSettingsOpen && activeTab === "calls"
              ? "text-primary font-semibold"
              : "text-base-content/60"
          }`}
        >
          <BsTelephoneFill size={18} />
          <span className="text-[10px] mt-1">Calls</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabClick("settings")}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            isSettingsOpen
              ? "text-primary font-semibold"
              : "text-base-content/60"
          }`}
        >
          {isSettingsOpen ? (
            <BsGearFill
              size={18}
              className="rotate-90 transition-transform duration-300"
            />
          ) : (
            <BsGear size={18} />
          )}
          <span className="text-[10px] mt-1">Settings</span>
        </button>
      </div>

      {/* ── MOBILE FLOATING ACTION BUTTON (FAB) ── */}
      <div className="md:hidden fixed bottom-20 right-4 z-40">
        {activeTab === "chats" && (
          <button
            onClick={onAddContact}
            className="btn btn-circle btn-primary shadow-xl hover:scale-110 active:scale-95 transition-transform"
            title="Add Contact"
          >
            <BsPersonPlusFill size={20} />
          </button>
        )}

        {activeTab === "calls" && (
          <button
            onClick={() => {
              if (allUsers?.length > 0) {
                startCall(allUsers[0], "voice");
              }
            }}
            className="btn btn-circle btn-primary shadow-xl hover:scale-110 active:scale-95 transition-transform"
            title="New Call"
          >
            <BsTelephonePlusFill size={19} />
          </button>
        )}
      </div>
    </>
  );
};

export default MobileNavAndFAB;
