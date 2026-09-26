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
} from "react-icons/bs";

const MobileNavAndFAB = ({
  activeTab,
  setActiveTab,
  selectedChat,
  onAddContact,
  allUsers,
  startCall,
}) => {
  if (selectedChat) return null;

  return (
    <>
      {/* ── MOBILE BOTTOM NAVIGATION BAR ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-base-100 border-t border-base-300 flex items-center justify-around z-40 shadow-lg px-1">
        <button
          onClick={() => setActiveTab("chats")}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            activeTab === "chats"
              ? "text-primary font-semibold"
              : "text-base-content/60"
          }`}
        >
          <BsChatSquareTextFill size={19} />
          <span className="text-[10px] mt-1">Chats</span>
        </button>
        <button
          onClick={() => setActiveTab("status")}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            activeTab === "status"
              ? "text-primary font-semibold"
              : "text-base-content/60"
          }`}
        >
          <BsRecordCircle size={19} />
          <span className="text-[10px] mt-1">Updates</span>
        </button>
        <button
          onClick={() => setActiveTab("communities")}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            activeTab === "communities"
              ? "text-primary font-semibold"
              : "text-base-content/60"
          }`}
        >
          <BsPeopleFill size={19} />
          <span className="text-[10px] mt-1">Communities</span>
        </button>
        <button
          onClick={() => setActiveTab("channels")}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            activeTab === "channels"
              ? "text-primary font-semibold"
              : "text-base-content/60"
          }`}
        >
          <BsMegaphoneFill size={18} />
          <span className="text-[10px] mt-1">Channels</span>
        </button>
        <button
          onClick={() => setActiveTab("calls")}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            activeTab === "calls"
              ? "text-primary font-semibold"
              : "text-base-content/60"
          }`}
        >
          <BsTelephoneFill size={18} />
          <span className="text-[10px] mt-1">Calls</span>
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
        {activeTab === "status" && (
          <button
            onClick={() => {
              const el = document.querySelector(
                'input[type="file"][accept="image/*"]',
              );
              el?.click();
            }}
            className="btn btn-circle btn-primary shadow-xl hover:scale-110 active:scale-95 transition-transform"
            title="Add Status"
          >
            <BsCameraFill size={20} />
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
