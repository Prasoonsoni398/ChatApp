import React from "react";
import { BsVolumeUpFill, BsVolumeMuteFill } from "react-icons/bs";
import ToggleSwitch from "../../common/ToggleSwitch.jsx";

const NotificationsTabContent = ({
  soundEnabled,
  handleToggleSound,
  playMessageChime,
  reactionsAlerts,
  handleToggleReactionsAlerts,
  notifPermission,
  handleRequestPermission,
  notifsEnabled,
  handleToggleNotifications,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">
          Messages & Calls
        </h4>
        <div className="space-y-3">
          {/* Sound Toggle */}
          <div className="py-2 flex items-center justify-between border-b border-base-200">
            <div>
              <div className="flex items-center gap-2">
                {soundEnabled ? (
                  <BsVolumeUpFill className="text-primary" size={16} />
                ) : (
                  <BsVolumeMuteFill className="text-base-content/50" size={16} />
                )}
                <span className="text-sm font-medium">Message Sounds</span>
              </div>
              <p className="text-[11px] text-base-content/50 mt-0.5">
                Play incoming and outgoing chimes for messages
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={playMessageChime}
                className="btn btn-ghost btn-xs text-xs text-primary"
                title="Test sound"
              >
                Test
              </button>
              <ToggleSwitch
                checked={soundEnabled}
                onChange={handleToggleSound}
                size="sm"
              />
            </div>
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
