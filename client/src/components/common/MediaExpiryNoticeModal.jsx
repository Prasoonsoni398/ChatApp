import { useEffect, useState } from "react";
import {
  BsShieldFillExclamation,
  BsX,
  BsClockHistory,
  BsCameraFill,
  BsMicFill,
  BsFileEarmarkFill,
  BsCameraVideoFill,
  BsCheckCircleFill,
  BsCloudSlashFill,
  BsArrowDownCircleFill,
} from "react-icons/bs";

const STORAGE_KEY = "media_expiry_notice_accepted";

/**
 * MediaExpiryNoticeModal — Informative modal shown when the user opens the website.
 * Clearly details the permanent deletion of uploaded media from Cloudinary storage
 * after 48 hours, what is affected, what is preserved, and download recommendations.
 */
const MediaExpiryNoticeModal = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show if the user hasn't permanently dismissed it
    const alreadyAccepted = localStorage.getItem(STORAGE_KEY);
    if (alreadyAccepted) return;

    const showModalWithDelay = () => {
      const timer = setTimeout(() => setIsVisible(true), 800);
      return timer;
    };

    // If device permission/cookies hasn't been accepted yet, wait for user consent
    const deviceConsent = localStorage.getItem("guftgu_device_consent");
    if (!deviceConsent) {
      const handleConsentGiven = () => {
        showModalWithDelay();
      };
      window.addEventListener("guftgu-consent-given", handleConsentGiven, {
        once: true,
      });
      return () => {
        window.removeEventListener("guftgu-consent-given", handleConsentGiven);
      };
    }

    const timer = showModalWithDelay();
    return () => clearTimeout(timer);
  }, []);

  // Allow reopening the modal on-demand from settings, storage, or help
  useEffect(() => {
    const handleOpenRequest = () => setIsVisible(true);
    window.addEventListener("open-media-expiry-modal", handleOpenRequest);
    return () => {
      window.removeEventListener("open-media-expiry-modal", handleOpenRequest);
    };
  }, []);

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setIsVisible(false);
  };

  const handleDismiss = () => {
    // Dismiss for this session without permanently disabling future reminders
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-fade-in select-none"
      onClick={handleDismiss}
      role="dialog"
      aria-modal="true"
      aria-labelledby="media-expiry-title"
    >
      <div
        className="relative w-full max-w-lg bg-base-100 border border-base-300/80 rounded-3xl shadow-2xl overflow-hidden animate-slide-up max-h-[92vh] flex flex-col text-base-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header with Gradient & Branding */}
        <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 px-6 pt-6 pb-8 text-white relative flex-shrink-0">
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 flex items-center justify-center transition-all cursor-pointer text-white"
            title="Dismiss notice"
            aria-label="Close"
          >
            <BsX size={20} />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-md">
              <BsClockHistory size={26} className="text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                  Storage Policy
                </span>
                <span className="text-[11px] font-semibold text-white/80">
                  Cloudinary Auto-Purge
                </span>
              </div>
              <h2
                id="media-expiry-title"
                className="text-lg sm:text-xl font-bold leading-tight"
              >
                Media Deletion After 48 Hours
              </h2>
            </div>
          </div>
          <p className="text-white/85 text-xs sm:text-sm mt-1">
            Important information regarding media file storage on Guftgu
          </p>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto px-5 sm:px-6 py-5 space-y-4 flex-1">
          {/* Key Notice Banner */}
          <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5">
            <BsShieldFillExclamation
              size={22}
              className="text-amber-500 flex-shrink-0 mt-0.5"
            />
            <div className="text-xs sm:text-sm text-base-content/90 leading-relaxed">
              <span className="font-semibold text-base-content">
                Permanent 48-Hour Cloud Deletion:
              </span>{" "}
              All media files uploaded in chats and status updates are{" "}
              <strong className="text-amber-600 dark:text-amber-400">
                permanently deleted from Cloudinary servers after 48 hours
              </strong>{" "}
              from the exact time of upload.
            </div>
          </div>

          {/* Media Types Grid */}
          <div>
            <h3 className="text-xs font-bold text-base-content/60 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <BsCloudSlashFill className="text-error" /> Media files
              permanently purged
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-base-200/70 border border-base-300/50">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center flex-shrink-0">
                  <BsCameraFill size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-base-content">
                    Photos & Images
                  </p>
                  <p className="text-[10px] text-base-content/60 truncate">
                    Chat & Status images
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-base-200/70 border border-base-300/50">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center flex-shrink-0">
                  <BsCameraVideoFill size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-base-content">
                    Videos & Clips
                  </p>
                  <p className="text-[10px] text-base-content/60 truncate">
                    Uploaded video files
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-base-200/70 border border-base-300/50">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0">
                  <BsMicFill size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-base-content">
                    Voice & Audio
                  </p>
                  <p className="text-[10px] text-base-content/60 truncate">
                    Voice notes & music
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-base-200/70 border border-base-300/50">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center flex-shrink-0">
                  <BsFileEarmarkFill size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-base-content">
                    Documents
                  </p>
                  <p className="text-[10px] text-base-content/60 truncate">
                    PDFs, ZIPs, spreadsheets
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* What remains permanent & safe */}
          <div className="rounded-2xl bg-base-200/50 border border-base-300/70 p-3.5 space-y-2">
            <h3 className="text-xs font-bold text-base-content/70 uppercase tracking-wider flex items-center gap-1.5">
              <BsCheckCircleFill className="text-primary" /> What is NOT
              affected
            </h3>
            <ul className="text-xs space-y-1.5 text-base-content/80">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span>
                  <strong>Text Messages & Conversations:</strong> All text chat
                  history and message records remain saved.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span>
                  <strong>Profile & Group Pictures:</strong> User avatars, group
                  icons, and channel logos are permanent and never deleted.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span>
                  <strong>Account & Security:</strong> Your contact lists,
                  settings, and security preferences are never purged.
                </span>
              </li>
            </ul>
          </div>

          {/* Actionable Advice / Download Recommendation */}
          <div className="flex items-start gap-3 bg-primary/10 border border-primary/20 rounded-2xl p-3">
            <BsArrowDownCircleFill
              size={18}
              className="text-primary flex-shrink-0 mt-0.5"
            />
            <div className="text-xs text-base-content/80 leading-normal">
              <strong>Recommended Action:</strong> Save or download any
              important photos, documents, or videos to your local device within{" "}
              <strong>48 hours</strong> of receipt to keep a permanent personal
              copy.
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:px-6 bg-base-200/50 border-t border-base-300/70 flex flex-col sm:flex-row items-center gap-2 flex-shrink-0">
          <button
            onClick={handleAccept}
            className="w-full sm:flex-1 btn btn-primary rounded-xl font-medium text-sm transition-all hover:brightness-105 active:scale-[0.98] shadow-md cursor-pointer"
          >
            I Understand — Don't Show Again
          </button>
          <button
            onClick={handleDismiss}
            className="w-full sm:w-auto px-4 py-2.5 text-xs text-base-content/60 hover:text-base-content rounded-xl transition-colors cursor-pointer text-center"
          >
            Remind me next time
          </button>
        </div>
      </div>
    </div>
  );
};

export default MediaExpiryNoticeModal;
