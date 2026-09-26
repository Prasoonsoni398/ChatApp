import {
  BsBellFill,
  BsClockHistory,
  BsLockFill,
  BsUnlockFill,
  BsStarFill,
} from "react-icons/bs";
import toast from "react-hot-toast";
import Dropdown from "../../common/Dropdown.jsx";
import ToggleSwitch from "../../common/ToggleSwitch.jsx";

const ContactChatSettings = ({
  isMuted,
  onToggleMute,
  disappearingTimer,
  setDisappearingTimer,
  isLocked,
  onToggleLock,
  onOpenStarred,
  onClose,
}) => {
  return (
    <div className="p-4 bg-base-100 space-y-4">
      <span className="text-xs font-semibold text-primary uppercase tracking-wider block">
        Chat Settings
      </span>

      {/* Mute Notifications */}
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center gap-3">
          <BsBellFill
            className={isMuted ? "text-primary" : "text-base-content/50"}
            size={17}
          />
          <div>
            <span className="text-sm font-medium text-base-content block">
              Mute notifications
            </span>
            <span className="text-xs text-base-content/50">
              {isMuted ? "Muted" : "Unmuted"}
            </span>
          </div>
        </div>
        <ToggleSwitch
          checked={Boolean(isMuted)}
          onChange={() => onToggleMute?.()}
          size="sm"
        />
      </div>

      {/* Disappearing Messages */}
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center gap-3">
          <BsClockHistory className="text-base-content/50" size={17} />
          <div>
            <span className="text-sm font-medium text-base-content block">
              Disappearing messages
            </span>
            <span className="text-xs text-base-content/50">
              {disappearingTimer === "off" ? "Off" : disappearingTimer}
            </span>
          </div>
        </div>
        <Dropdown
          value={disappearingTimer}
          onChange={(val) => {
            setDisappearingTimer(val);
            toast.success(`Disappearing messages set to ${val}`);
          }}
          options={[
            {
              value: "off",
              label: "Off",
              description: "Messages do not expire",
            },
            {
              value: "24h",
              label: "24 hours",
              description: "Disappear after 1 day",
            },
            {
              value: "7d",
              label: "7 days",
              description: "Disappear after 1 week",
            },
            {
              value: "90d",
              label: "90 days",
              description: "Disappear after 3 months",
            },
          ]}
          size="sm"
          align="right"
          className="min-w-[110px]"
        />
      </div>

      {/* Chat Lock */}
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center gap-3">
          {isLocked ? (
            <BsLockFill className="text-primary" size={17} />
          ) : (
            <BsUnlockFill className="text-base-content/50" size={17} />
          )}
          <div>
            <span className="text-sm font-medium text-base-content block">
              Lock chat
            </span>
            <span className="text-xs text-base-content/50">
              {isLocked ? "Locked with passcode" : "Unlocked"}
            </span>
          </div>
        </div>
        <ToggleSwitch
          checked={Boolean(isLocked)}
          onChange={() => onToggleLock?.()}
          size="sm"
        />
      </div>

      {/* Starred Messages */}
      <div
        className="flex items-center justify-between py-1 cursor-pointer hover:bg-base-200/50 rounded-lg p-1 -mx-1"
        onClick={() => {
          onClose();
          onOpenStarred?.();
        }}
      >
        <div className="flex items-center gap-3">
          <BsStarFill className="text-warning" size={17} />
          <span className="text-sm font-medium text-base-content">
            Starred messages
          </span>
        </div>
        <span className="text-xs text-base-content/50">›</span>
      </div>
    </div>
  );
};

export default ContactChatSettings;
