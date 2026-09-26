import { useState, useEffect } from "react";
import {
  BsX,
  BsShieldLockFill,
  BsCheck2,
  BsSearch,
  BsPeopleFill,
  BsPersonXFill,
  BsPersonCheckFill,
} from "react-icons/bs";
import { getContacts } from "../../../services/contactService.js";

const PRIVACY_STORAGE_KEY = "chatapp_status_privacy";

export const getStoredPrivacy = () => {
  try {
    const saved = localStorage.getItem(PRIVACY_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (_e) {}
  return {
    type: "contacts",
    excludedUsers: [],
    allowedUsers: [],
  };
};

export const setStoredPrivacy = (privacy) => {
  try {
    localStorage.setItem(PRIVACY_STORAGE_KEY, JSON.stringify(privacy));
  } catch (_e) {}
};

const StatusPrivacyModal = ({ isOpen, onClose, onSavePrivacy }) => {
  const [privacyType, setPrivacyType] = useState("contacts");
  const [excludedUsers, setExcludedUsers] = useState([]);
  const [allowedUsers, setAllowedUsers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredPrivacy();
      setPrivacyType(stored.type || "contacts");
      setExcludedUsers(stored.excludedUsers || []);
      setAllowedUsers(stored.allowedUsers || []);
      loadContacts();
    }
  }, [isOpen]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const data = await getContacts();
      setContacts(Array.isArray(data) ? data : []);
    } catch (_e) {
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

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
    const config = {
      type: privacyType,
      excludedUsers: privacyType === "contacts_except" ? excludedUsers : [],
      allowedUsers: privacyType === "only_share_with" ? allowedUsers : [],
    };
    setStoredPrivacy(config);
    if (onSavePrivacy) onSavePrivacy(config);
    onClose();
  };

  const filteredContacts = contacts.filter((c) => {
    const name = c.customName || c.name || "";
    const phone = c.phone || "";
    const query = search.toLowerCase();
    return name.toLowerCase().includes(query) || phone.includes(query);
  });

  return (
    <div className="fixed inset-0 z-10002 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md bg-base-100 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] border border-base-300">
        {/* Header */}
        <div className="px-5 py-4 border-b border-base-200 flex items-center justify-between bg-base-200/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
              <BsShieldLockFill size={16} />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Status Privacy</h3>
              <p className="text-[11px] text-base-content/60">
                Who can see your status updates
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-base-content/70 hover:text-base-content hover:bg-base-200 transition-colors cursor-pointer"
          >
            <BsX size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Options */}
          <div className="space-y-2">
            {/* 1. My Contacts */}
            <label
              className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                privacyType === "contacts"
                  ? "bg-primary/10 border-primary/40 shadow-xs"
                  : "bg-base-200/40 border-base-300 hover:bg-base-200"
              }`}
            >
              <input
                type="radio"
                name="status_privacy"
                value="contacts"
                checked={privacyType === "contacts"}
                onChange={() => setPrivacyType("contacts")}
                className="radio radio-primary radio-sm mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 font-semibold text-xs text-base-content">
                  <BsPeopleFill size={14} className="text-primary" />
                  <span>My Contacts</span>
                </div>
                <p className="text-[11px] text-base-content/60 mt-0.5">
                  Share with all your registered contacts on ChatApp
                </p>
              </div>
            </label>

            {/* 2. My Contacts Except... */}
            <label
              className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                privacyType === "contacts_except"
                  ? "bg-primary/10 border-primary/40 shadow-xs"
                  : "bg-base-200/40 border-base-300 hover:bg-base-200"
              }`}
            >
              <input
                type="radio"
                name="status_privacy"
                value="contacts_except"
                checked={privacyType === "contacts_except"}
                onChange={() => setPrivacyType("contacts_except")}
                className="radio radio-primary radio-sm mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-base-content">
                    <BsPersonXFill size={14} className="text-error" />
                    <span>My Contacts Except…</span>
                  </div>
                  {excludedUsers.length > 0 && (
                    <span className="badge badge-xs badge-error text-white font-mono">
                      {excludedUsers.length} excluded
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-base-content/60 mt-0.5">
                  Hide your status updates from specific contacts
                </p>
              </div>
            </label>

            {/* 3. Only Share With... */}
            <label
              className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                privacyType === "only_share_with"
                  ? "bg-primary/10 border-primary/40 shadow-xs"
                  : "bg-base-200/40 border-base-300 hover:bg-base-200"
              }`}
            >
              <input
                type="radio"
                name="status_privacy"
                value="only_share_with"
                checked={privacyType === "only_share_with"}
                onChange={() => setPrivacyType("only_share_with")}
                className="radio radio-primary radio-sm mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-base-content">
                    <BsPersonCheckFill size={14} className="text-success" />
                    <span>Only Share With…</span>
                  </div>
                  {allowedUsers.length > 0 && (
                    <span className="badge badge-xs badge-success text-white font-mono">
                      {allowedUsers.length} included
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-base-content/60 mt-0.5">
                  Only selected contacts will be able to see your status
                </p>
              </div>
            </label>
          </div>

          {/* Contact Selector Checklist for Option 2 & 3 */}
          {(privacyType === "contacts_except" ||
            privacyType === "only_share_with") && (
            <div className="border border-base-300 rounded-2xl p-3 bg-base-200/30 space-y-2.5 animate-slide-up">
              <div className="flex items-center justify-between text-xs font-semibold text-base-content/80">
                <span>
                  {privacyType === "contacts_except"
                    ? "Select Contacts to Exclude:"
                    : "Select Contacts to Share With:"}
                </span>
                <span className="text-[11px] text-base-content/50">
                  {privacyType === "contacts_except"
                    ? `${excludedUsers.length} selected`
                    : `${allowedUsers.length} selected`}
                </span>
              </div>

              {/* Search */}
              <div className="relative">
                <BsSearch
                  size={12}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 z-20 pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Search contacts…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input input-xs input-bordered w-full pl-8 rounded-xl bg-base-100"
                />
              </div>

              {/* Contacts list */}
              <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                {loading ? (
                  <div className="py-6 flex justify-center">
                    <span className="loading loading-spinner loading-xs text-primary" />
                  </div>
                ) : filteredContacts.length === 0 ? (
                  <p className="text-center text-[11px] text-base-content/50 py-4">
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
                              ? "bg-error/10 text-error font-medium"
                              : "bg-success/10 text-success font-medium"
                            : "hover:bg-base-200"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div className="w-6 h-6 rounded-full bg-base-300 overflow-hidden flex-shrink-0">
                            {c.avatar ? (
                              <img
                                src={c.avatar}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-[10px]">
                                {(c.customName || c.name || "?")[0]}
                              </div>
                            )}
                          </div>
                          <div className="truncate">
                            <p className="truncate font-semibold text-xs">
                              {c.customName || c.name}
                            </p>
                            {c.phone && (
                              <p className="text-[10px] text-base-content/50 truncate">
                                {c.phone}
                              </p>
                            )}
                          </div>
                        </div>

                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className={`checkbox checkbox-xs rounded-md ${
                            privacyType === "contacts_except"
                              ? "checkbox-error"
                              : "checkbox-success"
                          }`}
                        />
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          <p className="text-[11px] text-base-content/50 px-1 leading-relaxed">
            Changes to your privacy settings won't affect status updates that
            you've already sent.
          </p>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-base-200 bg-base-200/30 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-sm btn-ghost rounded-xl"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="btn btn-sm btn-primary rounded-xl px-5 gap-1.5"
          >
            <BsCheck2 size={16} /> Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusPrivacyModal;
