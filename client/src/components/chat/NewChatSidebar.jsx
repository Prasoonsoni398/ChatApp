import { useState, useMemo } from "react";
import {
  BsArrowLeft,
  BsGrid3X3GapFill,
  BsSearch,
  BsX,
  BsPeopleFill,
  BsPersonPlusFill,
  BsTelephoneFill,
  BsCheck2,
} from "react-icons/bs";
import toast from "react-hot-toast";

/**
 * NewChatSidebar - WhatsApp-style New Chat panel that opens in place of the chat sidebar.
 * Allows creating a new group, adding a new contact, creating a new community,
 * messaging yourself (Note to Self), or starting a chat with any contact.
 */
const NewChatSidebar = ({
  isOpen,
  onClose,
  loggedInUser,
  allUsers = [],
  onSelectUser,
  onNewGroup,
  onNewContact,
  onNewCommunity,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showDialpad, setShowDialpad] = useState(false);
  const [dialPhone, setDialPhone] = useState("");

  // Sort and filter contacts
  const filteredContacts = useMemo(() => {
    const list = (allUsers || []).filter(
      (u) => u._id !== loggedInUser?._id && u.id !== loggedInUser?._id,
    );

    if (!searchQuery.trim()) {
      return [...list].sort((a, b) =>
        (a.name || "").localeCompare(b.name || ""),
      );
    }

    const q = searchQuery.toLowerCase().trim();
    return list
      .filter((u) => {
        const name = (u.name || "").toLowerCase();
        const phone = (u.phone || "").toLowerCase();
        const email = (u.email || "").toLowerCase();
        const username = (u.username || "").toLowerCase();
        return (
          name.includes(q) ||
          phone.includes(q) ||
          email.includes(q) ||
          username.includes(q)
        );
      })
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [allUsers, loggedInUser, searchQuery]);

  // Group contacts alphabetically by first letter
  const groupedContacts = useMemo(() => {
    const groups = {};
    filteredContacts.forEach((contact) => {
      const firstChar = (contact.name?.[0] || "#").toUpperCase();
      const key = /[A-Z]/.test(firstChar) ? firstChar : "#";
      if (!groups[key]) groups[key] = [];
      groups[key].push(contact);
    });
    return groups;
  }, [filteredContacts]);

  // Group keys sorted alphabetically (# at the end)
  const sortedGroupKeys = useMemo(() => {
    const keys = Object.keys(groupedContacts);
    const alphaKeys = keys.filter((k) => k !== "#").sort();
    if (keys.includes("#")) alphaKeys.push("#");
    return alphaKeys;
  }, [groupedContacts]);

  const handleDialChat = (e) => {
    e.preventDefault();
    if (!dialPhone.trim()) return;
    const cleanNum = dialPhone.trim();
    const existing = allUsers.find(
      (u) =>
        (u.phone && u.phone.includes(cleanNum)) ||
        (u.name && u.name.includes(cleanNum)),
    );
    if (existing) {
      onSelectUser?.(existing);
      setShowDialpad(false);
    } else {
      // Start a direct chat with this phone number
      const syntheticUser = {
        _id: `phone_${cleanNum.replace(/\D/g, "")}`,
        name: cleanNum,
        phone: cleanNum,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanNum}`,
        about: "Guftguuser",
      };
      onSelectUser?.(syntheticUser);
      setShowDialpad(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:relative md:inset-auto md:z-auto w-full md:w-88 lg:w-96 flex-shrink-0 flex flex-col bg-base-100 border-r border-r-theme-soothing chat-sidebar-panel h-full overflow-hidden animate-slide-up md:animate-fade-in select-none">
      {/* ── Top Header ── */}
      <div className="h-16 px-4 border-b border-b-theme-soothing flex items-center justify-between bg-base-100 flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-base-content/70 hover:text-base-content hover:bg-base-200 transition-colors cursor-pointer"
            title="Back to chats"
          >
            <BsArrowLeft size={20} />
          </button>
          <h2 className="font-bold text-lg text-base-content tracking-wide">
            New chat
          </h2>
        </div>

        {/* 9-Dots Dialpad Icon Button */}
        <button
          type="button"
          onClick={() => setShowDialpad((v) => !v)}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
            showDialpad
              ? "bg-primary/20 text-primary"
              : "text-base-content/70 hover:text-base-content hover:bg-base-200"
          }`}
          title="Direct message a phone number"
        >
          <BsGrid3X3GapFill size={18} />
        </button>
      </div>

      {/* ── Dialpad / Direct Number Dropdown ── */}
      {showDialpad && (
        <form
          onSubmit={handleDialChat}
          className="p-3.5 bg-base-200/80 border-b border-b-theme-soothing flex items-center gap-2 animate-slide-up"
        >
          <input
            type="tel"
            value={dialPhone}
            onChange={(e) => setDialPhone(e.target.value)}
            placeholder="Enter phone number with country code"
            className="input input-sm flex-1 bg-base-100 text-xs border-base-300 focus:border-primary"
            autoFocus
          />
          <button
            type="submit"
            className="btn btn-sm btn-primary text-xs px-3"
            title="Start Chat"
          >
            Chat
          </button>
        </form>
      )}

      <div className="px-3 py-2 flex-shrink-0">
        <div className="relative flex items-center rounded-full bg-base-200/80 px-3 py-1.5 transition-all duration-200 border border-transparent focus-within:border-primary focus-within:bg-base-100 focus-within:ring-2 focus-within:ring-primary/20">
          <BsSearch
            className="text-base-content/50 flex-shrink-0 mr-2"
            size={13}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, number or @username"
            className="w-full bg-transparent text-xs focus:outline-none placeholder:text-base-content/40 text-base-content"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-base-content/50 hover:text-base-content p-0.5 cursor-pointer"
            >
              <BsX size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ── Scrollable Body ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {!searchQuery && (
          <div className="pt-0.5 pb-1 border-b border-b-theme-soothing/40">
            {/* New Group */}
            <div
              onClick={() => onNewGroup?.()}
              className="flex items-center gap-3 px-4 py-1.5 hover:bg-base-200/60 cursor-pointer transition-colors group"
            >
              <div className="w-8 h-8 rounded-full bg-primary text-primary-content flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform flex-shrink-0">
                <BsPeopleFill size={16} />
              </div>
              <span className="font-medium text-sm text-base-content">
                New group
              </span>
            </div>

            {/* New Contact */}
            <div
              onClick={() => onNewContact?.()}
              className="flex items-center gap-3 px-4 py-1.5 hover:bg-base-200/60 cursor-pointer transition-colors group"
            >
              <div className="w-8 h-8 rounded-full bg-primary text-primary-content flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform flex-shrink-0">
                <BsPersonPlusFill size={16} />
              </div>
              <span className="font-medium text-sm text-base-content">
                New contact
              </span>
            </div>

            {/* New Community */}
            <div
              onClick={() => onNewCommunity?.()}
              className="flex items-center gap-3 px-4 py-1.5 hover:bg-base-200/60 cursor-pointer transition-colors group"
            >
              <div className="w-8 h-8 rounded-full bg-primary text-primary-content flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform flex-shrink-0">
                <BsPeopleFill size={16} />
              </div>
              <span className="font-medium text-sm text-base-content">
                New community
              </span>
            </div>

            {/* Message Yourself (Note to Self) */}
            <div
              onClick={() => onSelectUser?.(loggedInUser)}
              className="flex items-center gap-3 px-4 py-1.5 hover:bg-base-200/60 cursor-pointer transition-colors group"
            >
              <div className="relative w-8 h-8 rounded-full overflow-hidden bg-primary/20 flex-shrink-0 ring-1 ring-base-content/10 group-hover:scale-105 transition-transform">
                <img
                  src={
                    loggedInUser?.avatar ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=Me`
                  }
                  alt="You"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-sm text-base-content block truncate group-hover:text-primary transition-colors">
                  {loggedInUser?.name || "You"} (You)
                </span>
                <span className="text-xs text-base-content/50 block truncate">
                  Message yourself
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Contacts List Header if search query */}
        {searchQuery && (
          <div className="px-4 py-2 text-xs font-semibold text-base-content/50 uppercase tracking-wider">
            Contacts ({filteredContacts.length})
          </div>
        )}

        {/* Grouped Contacts List */}
        {sortedGroupKeys.length > 0 ? (
          sortedGroupKeys.map((letter) => (
            <div key={letter} className="mb-2">
              <div className="px-5 pt-3 pb-1 text-xs font-bold text-primary tracking-wider uppercase">
                {letter}
              </div>
              {groupedContacts[letter].map((contact) => (
                <div
                  key={contact._id || contact.id}
                  onClick={() => onSelectUser?.(contact)}
                  className="flex items-center gap-4 px-4 py-2.5 hover:bg-base-200/60 cursor-pointer transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/20 flex-shrink-0 ring-1 ring-base-content/10 group-hover:scale-105 transition-transform">
                    <img
                      src={
                        contact.avatar ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.name}`
                      }
                      alt={contact.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm text-base-content block truncate group-hover:text-primary transition-colors">
                      {contact.name}
                    </span>
                    <span className="text-xs text-base-content/50 block truncate">
                      {contact.about ||
                        contact.phone ||
                        "Hey there! I am using ChatApp."}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-base-content/50 text-xs">
            {searchQuery ? (
              <p>No contacts found matching &quot;{searchQuery}&quot;</p>
            ) : (
              <div>
                <p className="font-medium text-sm text-base-content/70">
                  No contacts found
                </p>
                <button
                  type="button"
                  onClick={() => onNewContact?.()}
                  className="mt-3 btn btn-xs btn-primary font-normal"
                >
                  Add a contact
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewChatSidebar;
