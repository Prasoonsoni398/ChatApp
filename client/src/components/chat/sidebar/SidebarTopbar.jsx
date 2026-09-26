import {
  BsPeopleFill,
  BsThreeDotsVertical,
  BsPersonCircle,
  BsShieldLockFill,
  BsLaptop,
  BsKeyboardFill,
  BsBoxArrowRight,
  BsArrowLeft,
} from "react-icons/bs";
import { hoverPrimary } from "../../../constants/styles.js";

const SidebarTopbar = ({
  isArchivedViewOpen,
  setIsArchivedViewOpen,
  archivedChatsCount,
  loggedInUser,
  setShowCreateGroup,
  showProfileMenu,
  setShowProfileMenu,
  profileMenuRef,
  setEditName,
  setShowEditModal,
  onOpenPrivacySettings,
  onOpenLinkedDevices,
  onOpenShortcuts,
  handleLogout,
}) => {
  if (isArchivedViewOpen) {
    return (
      <div className="h-16 px-4 flex items-center gap-3 bg-base-200/50 border-b border-base-300 relative z-50">
        <button
          onClick={() => setIsArchivedViewOpen(false)}
          className="p-2 -ml-2 text-base-content/70 hover:text-primary rounded-full transition-colors"
          title="Back to chats"
        >
          <BsArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base leading-tight">Archived</h3>
          <p className="text-[11px] text-base-content/50">
            {archivedChatsCount}{" "}
            {archivedChatsCount === 1 ? "chat" : "chats"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-16 px-4 flex items-center justify-between bg-base-200/50 border-b border-base-300 relative z-50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/20 p-0.5 overflow-hidden">
          <img
            src={
              loggedInUser?.avatar ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=Me`
            }
            alt="me"
            className="rounded-full object-cover w-full h-full"
          />
        </div>
        <div>
          <span className="font-semibold block leading-tight text-sm">
            {loggedInUser?.name}
          </span>
          <span className="text-[11px] text-base-content/50">Online</span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-base-content/60">
        {/* New Group */}
        <button
          onClick={() => setShowCreateGroup(true)}
          className={hoverPrimary}
          title="New Group"
        >
          <BsPeopleFill size={18} />
        </button>

        {/* Profile Menu */}
        <div className="relative" ref={profileMenuRef}>
          <button
            onClick={() => setShowProfileMenu((v) => !v)}
            className={hoverPrimary}
            title="Menu"
          >
            <BsThreeDotsVertical size={18} />
          </button>
          {showProfileMenu && (
            <ul className="absolute right-0 z-50 menu p-2 shadow-xl text-sm bg-base-100 rounded-2xl w-46 border border-base-300 mt-2 animate-slide-up origin-top-right">
              <li>
                <a
                  onClick={() => {
                    setEditName(loggedInUser?.name || "");
                    setShowEditModal(true);
                    setShowProfileMenu(false);
                  }}
                  className="flex items-center gap-2 py-2"
                >
                  <BsPersonCircle size={15} /> Edit Profile
                </a>
              </li>
              <li>
                <a
                  onClick={() => {
                    setShowProfileMenu(false);
                    onOpenPrivacySettings?.();
                  }}
                  className="flex items-center gap-2 py-2"
                >
                  <BsShieldLockFill size={15} /> Privacy
                </a>
              </li>
              <li>
                <a
                  onClick={() => {
                    setShowProfileMenu(false);
                    onOpenLinkedDevices?.();
                  }}
                  className="flex items-center gap-2 py-2"
                >
                  <BsLaptop size={15} /> Linked Devices
                </a>
              </li>
              <li>
                <a
                  onClick={() => {
                    setShowProfileMenu(false);
                    onOpenShortcuts?.();
                  }}
                  className="flex items-center gap-2 py-2"
                >
                  <BsKeyboardFill size={15} /> Shortcuts
                </a>
              </li>
              <div className="divider my-1"></div>
              <li>
                <a
                  onClick={handleLogout}
                  className="text-error flex items-center gap-2 py-2"
                >
                  <BsBoxArrowRight size={15} /> Log Out
                </a>
              </li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default SidebarTopbar;
