import { useState } from "react";
import { BsX, BsPersonBadgeFill, BsSearch } from "react-icons/bs";

/**
 * ContactShareModal – WhatsApp-style contact sharing (PRD Section 33).
 */
const ContactShareModal = ({ isOpen, onClose, allUsers = [], onSendContact }) => {
  const [search, setSearch] = useState("");

  if (!isOpen) return null;

  const filtered = allUsers.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSelect = (user) => {
    onSendContact({
      name: user.name,
      phone: user.email,
      avatar: user.avatar,
      userId: user._id,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-base-100 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border border-base-300 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-base-300 flex items-center justify-between bg-base-200/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-info/20 text-info flex items-center justify-center">
              <BsPersonBadgeFill size={16} />
            </div>
            <h3 className="font-bold text-base">Share Contact</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-base-content/70 hover:text-base-content hover:bg-base-200 transition-colors cursor-pointer"
          >
            <BsX size={22} />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-base-300">
          <div className="relative">
            <BsSearch
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"
            />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts…"
              className="input input-sm w-full pl-9 bg-base-200 rounded-xl border-none focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-base-200">
          {filtered.length === 0 ? (
            <p className="text-center text-xs text-base-content/50 py-8">
              No contacts found
            </p>
          ) : (
            filtered.map((user) => (
              <div
                key={user._id}
                onClick={() => handleSelect(user)}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-base-200 cursor-pointer transition-colors"
              >
                <img
                  src={
                    user.avatar ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`
                  }
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm truncate">{user.name}</h4>
                  <p className="text-xs text-base-content/50 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactShareModal;
