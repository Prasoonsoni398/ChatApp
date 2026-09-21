import React, { useState, useRef, useEffect } from "react";
import { BsChatSquareTextFill, BsRecordCircle, BsGear, BsPersonCircle } from "react-icons/bs";

const IconSidebar = ({ activeTab, setActiveTab, loggedInUser, handleLogout, setShowEditModal, setEditName }) => {
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const settingsMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target)) {
        setShowSettingsMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  return (
    <div className="w-16 h-full flex flex-col items-center py-4 bg-base-200 border-r border-base-300 justify-between flex-shrink-0 z-50">
      <div className="flex flex-col gap-6 w-full items-center">
        {/* Chats Tab */}
        <button
          onClick={() => setActiveTab('chats')}
          className={`p-3 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 ${
            activeTab === 'chats' ? "bg-base-300 text-primary shadow-sm" : "text-base-content/60 hover:bg-base-300 hover:text-base-content"
          }`}
          title="Chats"
        >
          <BsChatSquareTextFill size={22} />
        </button>

        {/* Status Tab */}
        <button
          onClick={() => setActiveTab('status')}
          className={`p-3 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 ${
            activeTab === 'status' ? "bg-base-300 text-primary shadow-sm" : "text-base-content/60 hover:bg-base-300 hover:text-base-content"
          }`}
          title="Status"
        >
          <BsRecordCircle size={24} className={activeTab === 'status' ? "" : "opacity-80"} />
        </button>
      </div>

      <div className="flex flex-col gap-6 w-full items-center">
        {/* Profile Avatar */}
        <div className="w-10 h-10 rounded-full bg-primary/20 p-0.5 overflow-hidden">
          <img
            src={loggedInUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=Me`}
            alt="me"
            className="rounded-full object-cover w-full h-full"
          />
        </div>

        {/* Settings Dropdown (Edit Profile / Logout) */}
        <div className="relative" ref={settingsMenuRef}>
          <button
            onClick={() => setShowSettingsMenu((v) => !v)}
            className={`p-3 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 ${
              showSettingsMenu ? "text-primary bg-primary/10 shadow-sm" : "text-base-content/60 hover:bg-base-300 hover:text-base-content"
            }`}
          >
            <BsGear size={22} className="hover:rotate-90 transition-transform duration-500" />
          </button>
          
          {showSettingsMenu && (
            <ul className="absolute bottom-full left-12 ml-4 mb-2 z-[100] menu p-2 shadow-lg bg-base-100 rounded-2xl w-40 border border-base-300 animate-slide-up origin-bottom-left">
              <li>
                <a onClick={() => {
                  setShowSettingsMenu(false);
                  setEditName(loggedInUser?.name || "");
                  setShowEditModal(true);
                }} className="active:scale-95 transition-transform">
                  Edit Profile
                </a>
              </li>
              <li><a onClick={() => {
                setShowSettingsMenu(false);
                handleLogout();
              }} className="text-error active:scale-95 transition-transform">Logout</a></li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default IconSidebar;
