import { useEffect, useState } from "react";
import {
  BsCookie,
  BsShieldLockFill,
  BsBellFill,
  BsCameraVideoFill,
  BsCheckLg,
  BsSliders,
  BsCheckCircleFill,
  BsPhoneFill,
  BsInfoCircleFill,
} from "react-icons/bs";

export const CONSENT_STORAGE_KEY = "guftgu_device_consent";

/**
 * DevicePermissionModal — Global device permission & cookie consent gate.
 * Ensures that on any device/browser, the user grants necessary permissions
 * (Cookies/Storage, Media Calling, Notifications) before accessing Guftgu.
 */
const DevicePermissionModal = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);

  // Preference options
  const [preferences, setPreferences] = useState({
    essential: true, // Always required
    media: true, // Camera & Mic for calls
    notifications: true, // Push alerts & sound chimes
    analytics: false, // Performance telemetry
  });

  useEffect(() => {
    // Check if permission has been granted on this device/browser
    try {
      const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (!stored) {
        // Small delay to allow the app shell to paint cleanly
        const timer = setTimeout(() => setIsVisible(true), 350);
        return () => clearTimeout(timer);
      }
    } catch (_e) {
      setIsVisible(true);
    }
  }, []);

  // Listen for manual re-opening request (e.g. from Settings or footer)
  useEffect(() => {
    const handleOpen = () => setIsVisible(true);
    window.addEventListener("open-cookie-consent", handleOpen);
    return () => window.removeEventListener("open-cookie-consent", handleOpen);
  }, []);

  const saveConsent = (acceptedPrefs) => {
    const consentRecord = {
      granted: true,
      timestamp: new Date().toISOString(),
      device: navigator.userAgent || "unknown",
      preferences: acceptedPrefs,
    };

    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consentRecord));
    } catch (e) {
      console.warn("Could not save device consent to localStorage:", e);
    }

    // Attempt to request notification permission if enabled by user
    if (
      acceptedPrefs.notifications &&
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission().catch(() => {});
    }

    setIsVisible(false);
    // Notify other components (e.g. MediaExpiryNoticeModal) that consent was provided
    window.dispatchEvent(
      new CustomEvent("guftgu-consent-given", { detail: consentRecord }),
    );
  };

  const handleAcceptAll = () => {
    saveConsent({
      essential: true,
      media: true,
      notifications: true,
      analytics: true,
    });
  };

  const handleSaveCustom = () => {
    saveConsent({
      ...preferences,
      essential: true,
    });
  };

  const handleAcceptEssentialOnly = () => {
    saveConsent({
      essential: true,
      media: false,
      notifications: false,
      analytics: false,
    });
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-[10001] flex items-end sm:items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-md animate-fade-in select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-consent-title"
    >
      <div
        className="relative w-full max-w-lg bg-base-100 border border-base-300/90 rounded-3xl shadow-2xl overflow-hidden animate-slide-up flex flex-col text-base-content max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with App Branding */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-6 py-5 text-white relative flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner flex-shrink-0">
              <BsCookie className="text-2xl text-amber-200 animate-bounce-short" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full text-white">
                  Device Permission
                </span>
                <span className="text-[11px] font-medium text-white/80 flex items-center gap-1">
                  <BsShieldLockFill className="text-xs text-emerald-200" />
                  Guftgu Privacy
                </span>
              </div>
              <h2
                id="cookie-consent-title"
                className="text-lg sm:text-xl font-bold leading-tight mt-0.5"
              >
                Welcome to Guftgu
              </h2>
            </div>
          </div>
          <p className="text-white/90 text-xs sm:text-sm mt-2 leading-relaxed">
            To provide real-time messaging, audio/video calling, and keep you
            securely signed in, Guftgu requests permission to use cookies and
            device storage.
          </p>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto px-5 sm:px-6 py-4 space-y-3.5 flex-1 text-sm">
          {!showCustomize ? (
            <>
              {/* Permission summary list */}
              <div className="space-y-2.5">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-base-200/60 border border-base-300/60">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <BsCookie size={17} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs sm:text-sm text-base-content">
                        Essential Cookies & Local Storage
                      </span>
                      <span className="badge badge-xs badge-primary font-medium py-1 px-2">
                        Required
                      </span>
                    </div>
                    <p className="text-xs text-base-content/65 mt-0.5 leading-relaxed">
                      Secures login authentication, session tokens, draft chats,
                      and chosen themes across page visits.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-base-200/60 border border-base-300/60">
                  <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <BsCameraVideoFill size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs sm:text-sm text-base-content">
                        Media & Calling Device Access
                      </span>
                      <span className="text-[11px] text-base-content/50">
                        Camera & Mic
                      </span>
                    </div>
                    <p className="text-xs text-base-content/65 mt-0.5 leading-relaxed">
                      Powers end-to-end peer video calls, crystal-clear voice
                      calls, and quick voice note recording.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-base-200/60 border border-base-300/60">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <BsBellFill size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs sm:text-sm text-base-content">
                        Notifications & Audio Ringtone
                      </span>
                      <span className="text-[11px] text-base-content/50">
                        Instant Alerts
                      </span>
                    </div>
                    <p className="text-xs text-base-content/65 mt-0.5 leading-relaxed">
                      Plays ringtones when friends call you and informs you of
                      new incoming messages immediately.
                    </p>
                  </div>
                </div>
              </div>

              {/* Privacy pledge banner */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300">
                <BsCheckCircleFill className="text-sm flex-shrink-0" />
                <span className="leading-snug">
                  No 3rd-party advertising or cross-site tracking cookies. Your
                  chats remain private and secure.
                </span>
              </div>
            </>
          ) : (
            /* Customise Granular Permissions */
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-base-200/60 border border-base-300">
                <div className="pr-3">
                  <p className="font-semibold text-xs sm:text-sm text-base-content">
                    Essential Cookies & Token Storage
                  </p>
                  <p className="text-[11px] text-base-content/60 leading-relaxed">
                    Authentication, session management, and encrypted data.
                  </p>
                </div>
                <span className="badge badge-sm badge-neutral font-medium">
                  Always Active
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-base-200/60 border border-base-300">
                <div className="pr-3">
                  <p className="font-semibold text-xs sm:text-sm text-base-content">
                    Camera & Microphone Access
                  </p>
                  <p className="text-[11px] text-base-content/60 leading-relaxed">
                    Needed to initiate and receive video/voice calls.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.media}
                  onChange={(e) =>
                    setPreferences((prev) => ({
                      ...prev,
                      media: e.target.checked,
                    }))
                  }
                  className="checkbox checkbox-primary checkbox-sm"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-base-200/60 border border-base-300">
                <div className="pr-3">
                  <p className="font-semibold text-xs sm:text-sm text-base-content">
                    Notifications & Sound Alerts
                  </p>
                  <p className="text-[11px] text-base-content/60 leading-relaxed">
                    Incoming call ringtones and desktop notification badges.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.notifications}
                  onChange={(e) =>
                    setPreferences((prev) => ({
                      ...prev,
                      notifications: e.target.checked,
                    }))
                  }
                  className="checkbox checkbox-primary checkbox-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 sm:px-6 py-4 border-t border-base-300/80 bg-base-200/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            {!showCustomize ? (
              <button
                type="button"
                onClick={() => setShowCustomize(true)}
                className="btn btn-ghost btn-sm text-xs text-base-content/70 hover:text-base-content gap-1.5 justify-center"
              >
                <BsSliders className="text-xs" />
                Customize
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowCustomize(false)}
                className="btn btn-ghost btn-sm text-xs text-base-content/70 hover:text-base-content"
              >
                Back
              </button>
            )}

            {!showCustomize && (
              <button
                type="button"
                onClick={handleAcceptEssentialOnly}
                className="btn btn-ghost btn-sm text-xs text-base-content/70 hover:text-base-content"
              >
                Essential Only
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {showCustomize ? (
              <button
                type="button"
                onClick={handleSaveCustom}
                className="btn btn-primary btn-sm flex-1 sm:flex-initial rounded-xl px-5 text-xs font-semibold gap-1.5"
              >
                <BsCheckLg />
                Save Preferences
              </button>
            ) : (
              <button
                type="button"
                onClick={handleAcceptAll}
                className="btn btn-primary btn-sm flex-1 sm:flex-initial rounded-xl px-5 text-xs font-semibold gap-1.5 shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                <BsCheckLg className="text-sm" />
                Accept All & Continue
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevicePermissionModal;
