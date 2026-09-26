import React from "react";
import {
  BsShieldCheck,
  BsFileEarmarkArrowDownFill,
  BsDownload,
  BsPersonXFill,
} from "react-icons/bs";
import ToggleSwitch from "../../common/ToggleSwitch.jsx";
import RemoveActionButton from "../../common/RemoveActionButton.jsx";

const AccountTabContent = ({
  securityNotifs,
  handleToggleSecurityNotifs,
  handleExportAccountData,
  isExportingData,
  onOpenDeleteAccountModal,
}) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Security Notifications */}
      <div>
        <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
          Security Notifications
        </h4>
        <div className="p-4 rounded-2xl bg-base-200/50 border border-base-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-info/10 text-info flex-shrink-0">
              <BsShieldCheck size={18} />
            </div>
            <div>
              <span className="text-sm font-semibold block text-base-content">
                Show security notifications on this device
              </span>
              <span className="text-xs text-base-content/60 block mt-0.5">
                Get notified when your security code changes for a contact's
                phone
              </span>
            </div>
          </div>
          <ToggleSwitch
            checked={securityNotifs}
            onChange={handleToggleSecurityNotifs}
            size="sm"
          />
        </div>
      </div>

      {/* Request Account Info / Export Data */}
      <div>
        <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
          Account Information & Data
        </h4>
        <div className="p-4 rounded-2xl bg-base-200/50 border border-base-300 space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary mt-0.5">
              <BsFileEarmarkArrowDownFill size={20} />
            </div>
            <div>
              <span className="text-sm font-bold block text-base-content">
                Request Account Info (PRD Section 105)
              </span>
              <span className="text-xs text-base-content/60 block mt-1 leading-relaxed">
                Create a downloadable report of your ChatApp account information
                and settings. This export includes your profile details,
                contacts list, group memberships, and configuration data in JSON
                format.
              </span>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleExportAccountData}
              disabled={isExportingData}
              className="btn btn-sm btn-primary rounded-xl px-4 flex items-center gap-2"
            >
              {isExportingData ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <BsDownload size={14} />
              )}
              Download Account Report
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account (PRD Section 104) */}
      <div>
        <h4 className="text-xs font-semibold text-error uppercase tracking-wider mb-2">
          Danger Zone
        </h4>
        <div className="p-4 rounded-2xl bg-error/10 border border-error/30 space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-error/20 text-error mt-0.5">
              <BsPersonXFill size={20} />
            </div>
            <div>
              <span className="text-sm font-bold block text-base-content">
                Delete My Account (PRD Section 104)
              </span>
              <span className="text-xs text-base-content/70 block mt-1 leading-relaxed">
                Deleting your account is permanent and cannot be undone:
              </span>
              <ul className="text-xs text-base-content/60 mt-1.5 list-disc list-inside space-y-0.5">
                <li>Deletes your account from ChatApp entirely</li>
                <li>Wipes your message history across all personal chats</li>
                <li>Removes you from all your ChatApp groups</li>
                <li>Deletes your cloud backups and saved preferences</li>
              </ul>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <RemoveActionButton
              onClick={onOpenDeleteAccountModal}
              size="sm"
              label="Delete Account"
              className="px-4"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountTabContent;
