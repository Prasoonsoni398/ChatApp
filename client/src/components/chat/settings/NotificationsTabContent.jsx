import React from "react";
import {
  BsVolumeUpFill,
  BsVolumeMuteFill,
  BsPlayFill,
  BsTelephoneInboundFill,
} from "react-icons/bs";
import ToggleSwitch from "../../common/ToggleSwitch.jsx";
import {
  NOTIFICATION_SOUNDS,
  RINGTONE_SOUNDS,
  playMessageChime,
  previewRingtone,
} from "../../../utils/notificationAudio.js";

const NotificationsTabContent = ({
  soundEnabled,
  handleToggleSound,
  notificationSound,
  handleSelectNotificationSound,
  ringtoneSound,
  handleSelectRingtoneSound,
  reactionsAlerts,
  handleToggleReactionsAlerts,
  notifPermission,
  handleRequestPermission,
  notifsEnabled,
  handleToggleNotifications,
}) => {
  return (
    <div className="space-y-6">
      {/* Sound Toggles & Notification Sound */}
      <div>
        <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">
          Messages & Tones
        </h4>
        <div className="space-y-4">
          {/* Sound Toggle */}
          <div className="py-2 flex items-center justify-between border-b border-base-200">
            <div>
              <div className="flex items-center gap-2">
                {soundEnabled ? (
                  <BsVolumeUpFill className="text-primary" size={16} />
                ) : (
                  <BsVolumeMuteFill
                    className="text-base-content/50"
                    size={16}
                  />
                )}
                <span className="text-sm font-medium">Message Sounds</span>
              </div>
              <p className="text-[11px] text-base-content/50 mt-0.5">
                Play alert sounds for incoming messages
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ToggleSwitch
                checked={soundEnabled}
                onChange={handleToggleSound}
                size="sm"
              />
            </div>
          </div>

          {/* Notification Sound Selector */}
          <div className="py-2 border-b border-base-200">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-sm font-medium block">
                  Notification Sound
                </span>
                <p className="text-[11px] text-base-content/50">
                  Select the chime played on receiving new messages
                </p>
              </div>
              <button
                type="button"
                onClick={() => playMessageChime(notificationSound || "default")}
                className="btn btn-ghost btn-xs text-primary gap-1"
                title="Preview selected sound"
              >
                <BsPlayFill size={15} /> Preview
              </button>
            </div>
            <select
              value={notificationSound || "default"}
              onChange={(e) => handleSelectNotificationSound?.(e.target.value)}
              className="select select-bordered select-sm w-full bg-base-100 font-normal text-xs"
            >
              {NOTIFICATION_SOUNDS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.description})
                </option>
              ))}
            </select>
          </div>

          {/* Incoming Ringtone Selector */}
          <div className="py-2 border-b border-base-200">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <BsTelephoneInboundFill className="text-primary" size={14} />
                  <span className="text-sm font-medium">Ringing Sound</span>
                </div>
                <p className="text-[11px] text-base-content/50">
                  Select the ringtone played on incoming audio/video calls
                </p>
              </div>
              <button
                type="button"
                onClick={() => previewRingtone(ringtoneSound || "classic")}
                className="btn btn-ghost btn-xs text-primary gap-1"
                title="Preview selected ringtone"
              >
                <BsPlayFill size={15} /> Preview
              </button>
            </div>
            <select
              value={ringtoneSound || "classic"}
              onChange={(e) => handleSelectRingtoneSound?.(e.target.value)}
              className="select select-bordered select-sm w-full bg-base-100 font-normal text-xs"
            >
              {RINGTONE_SOUNDS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.description})
                </option>
              ))}
            </select>
          </div>

          {/* Reaction Alerts */}
          <div className="py-2 flex items-center justify-between border-b border-base-200">
            <div>
              <span className="text-sm font-medium block">
                Reaction Notifications
              </span>
              <p className="text-[11px] text-base-content/50 mt-0.5">
                Show notifications for reactions to messages you send
              </p>
            </div>
            <ToggleSwitch
              checked={reactionsAlerts}
              onChange={handleToggleReactionsAlerts}
              size="sm"
            />
          </div>

          {/* Desktop Push Notifications */}
          <div className="py-2 flex items-center justify-between">
            <div>
              <span className="text-sm font-medium block">
                Desktop Push Notifications
              </span>
              <p className="text-[11px] text-base-content/50 mt-0.5">
                Status:{" "}
                <span
                  className={`font-semibold ${
                    notifPermission === "granted"
                      ? "text-success"
                      : notifPermission === "denied"
                        ? "text-error"
                        : "text-warning"
                  }`}
                >
                  {notifPermission}
                </span>
              </p>
            </div>
            {notifPermission !== "granted" ? (
              <button
                type="button"
                onClick={handleRequestPermission}
                className="btn btn-xs btn-primary rounded-lg"
              >
                Enable
              </button>
            ) : (
              <ToggleSwitch
                checked={notifsEnabled}
                onChange={handleToggleNotifications}
                size="sm"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsTabContent;
