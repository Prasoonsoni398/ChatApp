import React from "react";
import { BsShieldCheck, BsKeyFill } from "react-icons/bs";

const SecurityTabContent = ({
  twoStepEnabled,
  showPinSetup,
  handleToggleTwoStep,
  handleSavePin,
  tempPin,
  setTempPin,
  setShowPinSetup,
  securityNotifs,
  handleToggleSecurityNotifs,
}) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* End-to-End Encryption Banner */}
      <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 flex gap-3.5 items-start">
        <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
          <BsShieldCheck size={22} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-base-content">
            End-to-End Encrypted
          </h4>
          <p className="text-xs text-base-content/70 mt-1 leading-relaxed">
            Your personal messages and calls are secured with end-to-end
            encryption. Only you and the person you're communicating with can
            read or listen to them, not even ChatApp.
          </p>
          <div className="grid grid-cols-2 gap-2 mt-3 text-[11px] text-base-content/60">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Text & voice notes
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Audio & video calls
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Photos, video & docs
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Location & status
            </div>
          </div>
        </div>
      </div>

      {/* Two-Step Verification Section */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-primary uppercase tracking-wider">
          Two-Step Verification
        </h4>

        <div className="p-4 rounded-2xl bg-base-200/50 border border-base-300 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-base-300 text-base-content/80 mt-0.5">
                <BsKeyFill size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-base-content">
                    6-Digit Security PIN
                  </span>
                  <span
                    className={`badge badge-xs font-medium ${
                      twoStepEnabled
                        ? "badge-success text-white"
                        : "badge-ghost"
                    }`}
                  >
                    {twoStepEnabled ? "Enabled" : "Off"}
                  </span>
                </div>
                <p className="text-xs text-base-content/60 mt-1">
                  For extra security, require a 6-digit PIN when registering
                  your phone number with ChatApp again.
                </p>
              </div>
            </div>

            {!showPinSetup && (
              <button
                type="button"
                onClick={handleToggleTwoStep}
                className={`btn btn-xs rounded-xl flex-shrink-0 ${
                  twoStepEnabled ? "btn-outline btn-error" : "btn-primary"
                }`}
              >
                {twoStepEnabled ? "Turn off" : "Turn on"}
              </button>
            )}
          </div>

          {/* PIN Setup Form */}
          {showPinSetup && (
            <form
              onSubmit={handleSavePin}
              className="border-t border-base-300 pt-4 space-y-3"
            >
              <label className="block text-xs font-medium text-base-content/80">
                Create a 6-digit PIN that you can remember:
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  maxLength={6}
                  placeholder="••••••"
                  value={tempPin}
                  onChange={(e) =>
                    setTempPin(e.target.value.replace(/\D/g, ""))
                  }
                  className="input input-bordered input-sm rounded-xl font-mono tracking-widest text-center text-base font-bold flex-1"
                  autoFocus
                  required
                />
                <button
                  type="submit"
                  disabled={tempPin.length !== 6}
                  className="btn btn-sm btn-primary rounded-xl px-4"
                >
                  Save PIN
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPinSetup(false);
                    setTempPin("");
                  }}
                  className="btn btn-sm btn-ghost rounded-xl"
                >
                  Cancel
                </button>
              </div>
              <p className="text-[11px] text-base-content/50">
                Enter digits only (0-9).
              </p>
            </form>
          )}
        </div>
      </div>

      {/* Security Notifications Toggle */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-primary uppercase tracking-wider">
          Security Notifications
        </h4>

        <div className="p-4 rounded-2xl bg-base-200/50 border border-base-300">
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="text-sm font-semibold text-base-content block">
                Show security notifications
              </span>
              <span className="text-xs text-base-content/60 block mt-0.5">
                Get notified when your security code changes for a contact's
                phone.
              </span>
            </div>
            <input
              type="checkbox"
              className="toggle toggle-primary toggle-sm flex-shrink-0"
              checked={securityNotifs}
              onChange={(e) => handleToggleSecurityNotifs(e.target.checked)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityTabContent;
