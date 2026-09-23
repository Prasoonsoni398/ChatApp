import { BsSearch, BsThreeDotsVertical, BsPeopleFill } from "react-icons/bs";
import {
  hoverPrimary,
  searchInput,
  sidebarChat,
} from "../../constants/styles.js";

/**
 * ChatSidebar – left panel containing the user avatar/profile menu,
 * chat search input, and the scrollable list of DM + group chats.
 */
const ChatSidebar = ({
  loggedInUser,
  chats,
  searchQuery,
  setSearchQuery,
  selectedChat,
  setSelectedChat,
  showProfileMenu,
  setShowProfileMenu,
  profileMenuRef,
  handleLogout,
  setShowEditModal,
  setShowCreateGroup,
  setEditName,
}) => {
  return (
    <div
      className={`w-full md:w-88 lg:w-96 flex-shrink-0 flex flex-col bg-base-100 border-r border-base-300 ${
        selectedChat ? "hidden md:flex" : "flex"
      }`}
    >
      {/* ── Header ── */}
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
          <span className="font-semibold">{loggedInUser?.name}</span>
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

          {/* Profile menu */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu((v) => !v)}
              className={hoverPrimary}
            >
              <BsThreeDotsVertical size={18} />
            </button>
            {showProfileMenu && (
              <ul className="absolute right-0 z-50 menu p-2 shadow-lg bg-base-100 rounded-2xl w-40 border border-base-300 mt-2 animate-slide-up origin-top-right">
                <li>
                  <a
                    onClick={() => {
                      setEditName(loggedInUser?.name || "");
                      setShowEditModal(true);
                      setShowProfileMenu(false);
                    }}
                    className="active:scale-95 transition-transform"
                  >
                    Edit Profile
                  </a>
                </li>
                <li>
                  <a
                    onClick={handleLogout}
                    className="text-error active:scale-95 transition-transform"
                  >
                    Logout
                  </a>
                </li>
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="p-3 border-b border-base-300">
        <div className="relative">
          <BsSearch
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats…"
            className={searchInput}
          />
        </div>
      </div>

      {/* ── Chat list ── */}
      <div className="flex-1 overflow-y-auto">
        {chats
          .filter((c) =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()),
          )
          .map((chat) => (
            <div
              key={chat.id}
              onClick={() => setSelectedChat(chat)}
              className={`${sidebarChat} ${
                selectedChat?.id === chat.id
                  ? "bg-primary/10 border-l-4 border-l-primary"
                  : "border-l-4 border-l-transparent"
              }`}
            >
              <div className="avatar">
                <div
                  className={`w-12 rounded-full relative ${
                    selectedChat?.id === chat.id
                      ? "ring ring-primary ring-offset-base-100 ring-offset-2"
                      : ""
                  }`}
                >
                  <img src={chat.avatar} alt={chat.name} />
                  {chat.isGroup && (
                    <span className="absolute -bottom-1 -right-1 bg-primary text-primary-content rounded-full p-0.5">
                      <BsPeopleFill size={10} />
                    </span>
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h3
                    className={`font-semibold truncate ${
                      selectedChat?.id === chat.id ? "text-primary" : ""
                    }`}
                  >
                    {chat.name}
                  </h3>
                  <span className="text-xs text-base-content/50">
                    {chat.time}
                  </span>
                </div>
                <p className="text-sm text-base-content/60 truncate">
                  {chat.lastMessage}
                </p>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default ChatSidebar;
