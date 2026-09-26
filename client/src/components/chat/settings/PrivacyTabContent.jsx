import React from "react";
import {
  BsEyeFill,
  BsCheck2All,
  BsClockHistory,
  BsPersonCircle,
  BsInfoCircleFill,
  BsPersonXFill,
  BsGlobeAmericas,
  BsPeopleFill,
  BsEyeSlashFill,
} from "react-icons/bs";
import Dropdown from "../../common/Dropdown.jsx";
import ToggleSwitch from "../../common/ToggleSwitch.jsx";

export const audienceOptions = [
  {
    value: "everyone",
    label: "Everyone",
    icon: <BsGlobeAmericas size={13} />,
    description: "Visible to all users",
  },
  {
    value: "contacts",
    label: "My Contacts",
    icon: <BsPeopleFill size={13} />,
    description: "Saved contacts only",
  },
  {
    value: "nobody",
    label: "Nobody",
    icon: <BsEyeSlashFill size={13} />,
    description: "Hidden from everyone",
  },
];

export const timerOptions = [
  { value: "off", label: "Off", description: "Messages do not expire" },
  { value: "24h", label: "24 hours", description: "Disappear after 1 day" },
  { value: "7d", label: "7 days", description: "Disappear after 1 week" },
  { value: "90d", label: "90 days", description: "Disappear after 3 months" },
];

const PrivacyTabContent = ({
  settings,
  handleChange,
  blockedUsers,
  loadingBlocked,
  handleUnblock,
}) => {
  return (
    <div className="space-y-6">
      {/* Who can see my personal info */}
      <div>
        <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-3 px-1">
          Who can see my personal info
        </h4>
        <div className="rounded-2xl bg-base-200/40 border border-base-300 divide-y divide-base-300/60 overflow-visible">
          {/* Last Seen & Online */}
          <div className="p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <BsEyeFill size={15} />
              </div>
              <div className="min-w-0">
                <span className="text-sm font-medium text-base-content block leading-tight">
                  Last seen and online
                </span>
                <span className="text-[11px] text-base-content/55 block truncate mt-0.5">
                  Who can see when you are active
                </span>
              </div>
            </div>
            <Dropdown
              value={settings.lastSeen}
              onChange={(val) => handleChange("lastSeen", val)}
              options={audienceOptions}
              size="sm"
            />
          </div>

          {/* Profile Photo */}
          <div className="p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <BsPersonCircle size={15} />
              </div>
              <div className="min-w-0">
                <span className="text-sm font-medium text-base-content block leading-tight">
                  Profile photo
                </span>
                <span className="text-[11px] text-base-content/55 block truncate mt-0.5">
                  Choose who can view your photo
                </span>
              </div>
            </div>
            <Dropdown
              value={settings.profilePhoto}
              onChange={(val) => handleChange("profilePhoto", val)}
              options={audienceOptions}
              size="sm"
            />
          </div>

          {/* About */}
          <div className="p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <BsInfoCircleFill size={15} />
              </div>
              <div className="min-w-0">
                <span className="text-sm font-medium text-base-content block leading-tight">
                  About
                </span>
                <span className="text-[11px] text-base-content/55 block truncate mt-0.5">
                  Choose who can see your bio
                </span>
              </div>
            </div>
            <Dropdown
              value={settings.about}
              onChange={(val) => handleChange("about", val)}
              options={audienceOptions}
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Read Receipts */}
      <div className="p-4 rounded-2xl bg-base-200/40 border border-base-300 flex items-center justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
            <BsCheck2All size={16} />
          </div>
          <div className="min-w-0">
            <span className="text-sm font-medium text-base-content block">
              Read receipts
            </span>
            <p className="text-xs text-base-content/55 mt-0.5 leading-relaxed">
              If turned off, you won't send or receive Read receipts. Read
              receipts are always sent for group chats.
            </p>
          </div>
        </div>
        <ToggleSwitch
          checked={settings.readReceipts}
          onChange={(val) => handleChange("readReceipts", val)}
          size="sm"
        />
      </div>

      {/* Disappearing Messages */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-primary uppercase tracking-wider px-1">
          Disappearing messages
        </h4>
        <div className="p-4 rounded-2xl bg-base-200/40 border border-base-300 flex items-center justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
              <BsClockHistory size={15} />
            </div>
            <div className="min-w-0">
              <span className="text-sm font-medium text-base-content block">
                Default message timer
              </span>
              <p className="text-xs text-base-content/55 mt-0.5">
                Start new chats with disappearing messages
              </p>
            </div>
          </div>
          <Dropdown
            value={settings.disappearingMessageTimer}
            onChange={(val) => handleChange("disappearingMessageTimer", val)}
            options={timerOptions}
            size="sm"
          />
        </div>
      </div>

      {/* Blocked Contacts */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-xs font-bold text-primary uppercase tracking-wider">
            Blocked contacts
          </h4>
          <span className="text-xs text-base-content/50">
            {blockedUsers.length} blocked
          </span>
        </div>

        {loadingBlocked ? (
          <div className="p-6 text-center text-xs text-base-content/40 bg-base-200/40 rounded-2xl border border-base-300">
            Loading blocked list...
          </div>
        ) : blockedUsers.length === 0 ? (
          <div className="p-6 text-center text-xs text-base-content/50 bg-base-200/40 rounded-2xl border border-base-300">
            <BsPersonXFill
              size={24}
              className="mx-auto mb-2 text-base-content/30"
            />
            No blocked contacts
          </div>
        ) : (
          <div className="divide-y divide-base-300/60 rounded-2xl border border-base-300 bg-base-200/40 overflow-hidden">
            {blockedUsers.map((user) => (
              <div
                key={user._id}
                className="p-3.5 flex items-center justify-between gap-3 hover:bg-base-200/60 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-base-300 overflow-hidden flex-shrink-0">
                    <img
                      src={
                        user.avatar ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`
                      }
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-semibold text-base-content block truncate">
                      {user.name}
                    </span>
                    <span className="text-xs text-base-content/50 block truncate">
                      {user.phone || user.about || "ChatApp user"}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleUnblock(user._id)}
                  className="btn btn-xs btn-outline btn-error rounded-lg flex-shrink-0"
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PrivacyTabContent;
