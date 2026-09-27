import { useState, useEffect } from "react";
import {
  BsX,
  BsShieldLockFill,
  BsPeopleFill,
  BsPersonXFill,
  BsPersonCheckFill,
  BsCheck2,
  BsSearch,
} from "react-icons/bs";
import toast from "react-hot-toast";
import { getContacts } from "../../../services/contactService.js";

const STORAGE_KEY = "status_privacy_settings";

export const getStoredPrivacy = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return { type: "contacts", excludedUsers: [], allowedUsers: [] };
};

const StatusPrivacyModal = ({ isOpen, onClose, onSavePrivacy }) => {
  const [privacyType, setPrivacyType] = useState("contacts");
  const [excludedUsers, setExcludedUsers] = useState([]);
  const [allowedUsers, setAllowedUsers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const initial = getStoredPrivacy();
    setPrivacyType(initial.type || "contacts");
    setExcludedUsers(initial.excludedUsers || []);
    setAllowedUsers(initial.allowedUsers || []);

    const loadContacts = async () => {
      setLoading(true);
      try {
        const data = await getContacts();
        setContacts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error loading contacts:", err);
      } finally {
        setLoading(false);
      }
    };

    loadContacts();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleExclude = (userId) => {
    setExcludedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleToggleAllow = (userId) => {
    setAllowedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleSave = () => {
    try {
      setSaving(true);
      const payload = {
        type: privacyType,
        excludedUsers: privacyType === "contacts_except" ? excludedUsers : [],
        allowedUsers: privacyType === "only_share_with" ? allowedUsers : [],
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch {
        // ignore
      }

      if (onSavePrivacy) onSavePrivacy(payload);
      toast.success("Status privacy updated");
      onClose();
    } catch (err) {
      console.error("Error saving privacy:", err);
      toast.error("Failed to update privacy");
    } finally {
      setSaving(false);
    }
  };

  const filteredContacts = contacts.filter((c) => {
    const name = c.customName || c.name || "";
    const phone = c.phone || "";
    const query = search.toLowerCase();
    return name.toLowerCase().includes(query) || phone.includes(query);
  });

  return (
    <div className="fixed inset-0 z-10002 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in select-none">
      <div className="w-full max-w-md bg-[#111B21] text-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] border border-white/10">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-[#202C33]/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#25D366]/20 text-[#25D366] flex items-center justify-center">
              <BsShieldLockFill size={17} />
            </div>
            <div>
              <h3 className="font-bold text-base text-white leading-tight">
                Status Privacy
              </h3>
              <p className="text-[11px] text-[#8696A0] mt-0.5">
                Who can see your status updates
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

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 bg-[#111B21]">
          {/* Options */}
          <div className="space-y-2.5">
            {/* 1. My Contacts */}
            <label
              className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                privacyType === "contacts"
                  ? "bg-[#25D366]/15 border-[#25D366]/50 shadow-sm"
                  : "bg-[#202C33]/70 hover:bg-[#202C33] border-white/5"
              }`}
            >
              <input
                type="radio"
                name="status_privacy"
                value="contacts"
                checked={privacyType === "contacts"}
                onChange={() => setPrivacyType("contacts")}
                className="accent-[#25D366] mt-0.5 cursor-pointer"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 font-semibold text-xs text-white">
                  <BsPeopleFill size={14} className="text-[#25D366]" />
                  <span>My Contacts</span>
                </div>
                <p className="text-[11px] text-[#8696A0] mt-0.5">
                  Share with all your registered contacts on ChatApp
                </p>
              </div>
            </label>

            {/* 2. My Contacts Except... */}
            <label
              className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                privacyType === "contacts_except"
                  ? "bg-[#25D366]/15 border-[#25D366]/50 shadow-sm"
                  : "bg-[#202C33]/70 hover:bg-[#202C33] border-white/5"
              }`}
            >
              <input
                type="radio"
                name="status_privacy"
                value="contacts_except"
                checked={privacyType === "contacts_except"}
                onChange={() => setPrivacyType("contacts_except")}
                className="accent-[#25D366] mt-0.5 cursor-pointer"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-white">
                    <BsPersonXFill size={14} className="text-red-400" />
                    <span>My Contacts Except…</span>
                  </div>
                  {excludedUsers.length > 0 && (
                    <span className="bg-red-500/20 text-red-300 text-[10px] px-2 py-0.5 rounded-full font-mono">
                      {excludedUsers.length} excluded
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#8696A0] mt-0.5">
                  Hide your status updates from specific contacts
                </p>
              </div>
            </label>

            {/* 3. Only Share With... */}
            <label
              className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                privacyType === "only_share_with"
                  ? "bg-[#25D366]/15 border-[#25D366]/50 shadow-sm"
                  : "bg-[#202C33]/70 hover:bg-[#202C33] border-white/5"
              }`}
            >
              <input
                type="radio"
                name="status_privacy"
                value="only_share_with"
                checked={privacyType === "only_share_with"}
                onChange={() => setPrivacyType("only_share_with")}
                className="accent-[#25D366] mt-0.5 cursor-pointer"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-white">
                    <BsPersonCheckFill size={14} className="text-[#25D366]" />
                    <span>Only Share With…</span>
                  </div>
                  {allowedUsers.length > 0 && (
                    <span className="bg-[#25D366]/20 text-[#25D366] text-[10px] px-2 py-0.5 rounded-full font-mono">
                      {allowedUsers.length} included
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#8696A0] mt-0.5">
                  Only selected contacts will be able to see your status
                </p>
              </div>
            </label>
          </div>

          {/* Contact Selector Checklist for Option 2 & 3 */}
          {(privacyType === "contacts_except" ||
            privacyType === "only_share_with") && (
            <div className="border border-white/10 rounded-2xl p-3 bg-[#202C33] space-y-2.5 animate-slide-up">
              <div className="flex items-center justify-between text-xs font-semibold text-white/90">
                <span>
                  {privacyType === "contacts_except"
                    ? "Select Contacts to Exclude:"
                    : "Select Contacts to Share With:"}
                </span>
                <span className="text-[11px] text-[#8696A0]">
                  {privacyType === "contacts_except"
                    ? `${excludedUsers.length} selected`
                    : `${allowedUsers.length} selected`}
                </span>
              </div>

              {/* Search */}
              <div className="relative">
                <BsSearch
                  size={12}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8696A0] z-20 pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Search contacts…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[#111B21] border border-white/15 text-white placeholder-[#8696A0] text-xs rounded-xl pl-8 pr-3 py-1.5 focus:border-[#25D366] focus:outline-none"
                />
              </div>

              {/* Contacts list */}
              <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                {loading ? (
                  <div className="py-6 flex justify-center">
                    <span className="loading loading-spinner loading-xs text-[#25D366]" />
                  </div>
                ) : filteredContacts.length === 0 ? (
                  <p className="text-center text-[11px] text-[#8696A0] py-4">
                    {search ? "No matching contacts" : "No contacts available"}
                  </p>
                ) : (
                  filteredContacts.map((c) => {
                    const cId = c._id || c.id;
                    const isChecked =
                      privacyType === "contacts_except"
                        ? excludedUsers.includes(cId)
                        : allowedUsers.includes(cId);

                    return (
                      <div
                        key={cId}
                        onClick={() =>
                          privacyType === "contacts_except"
                            ? handleToggleExclude(cId)
                            : handleToggleAllow(cId)
                        }
                        className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-colors ${
                          isChecked
                            ? privacyType === "contacts_except"
                              ? "bg-red-500/20 text-red-300 font-medium"
                              : "bg-[#25D366]/20 text-[#25D366] font-medium"
                            : "hover:bg-[#111B21] text-white/90"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div className="w-6 h-6 rounded-full bg-white/10 overflow-hidden flex-shrink-0">
                            {c.avatar ? (
                              <img
                                src={c.avatar}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-[10px] text-white">
                                {(c.customName || c.name || "?")[0]}
                              </div>
                            )}
                          </div>
                          <div className="truncate">
                            <p className="truncate font-semibold text-xs text-white">
                              {c.customName || c.name}
                            </p>
                            {c.phone && (
                              <p className="text-[10px] text-[#8696A0] truncate">
                                {c.phone}
                              </p>
                            )}
                          </div>
                        </div>

                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className={`accent-[#25D366] rounded-md ${
                            privacyType === "contacts_except"
                              ? "accent-red-500"
                              : "accent-[#25D366]"
                          }`}
                        />
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          <p className="text-[11px] text-[#8696A0] px-1 leading-relaxed">
            Changes to your privacy settings won't affect status updates that
            you've already sent.
          </p>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#111B21] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-6 py-2 rounded-full bg-[#25D366] hover:bg-[#1EBE5D] text-black font-bold text-xs sm:text-sm shadow-lg shadow-[#25D366]/25 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <span className="loading loading-spinner loading-xs text-black" />
            ) : (
              <>
                <BsCheck2 size={16} className="stroke-[1.5]" />
                <span>Done</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusPrivacyModal;
