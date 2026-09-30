import { useState, useEffect } from "react";
import { BsCloudLightningFill, BsCheckCircleFill, BsX, BsExclamationTriangleFill } from "react-icons/bs";
import { subscribeBackendStatus } from "../../config/api.js";

const BackendWakingBanner = () => {
  const [statusState, setStatusState] = useState({
    status: "idle",
    detail: "",
  });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeBackendStatus((state) => {
      setStatusState(state);
      if (state.status === "waking") {
        setDismissed(false);
      }
    });
    return unsubscribe;
  }, []);

  if (dismissed || statusState.status === "idle") {
    return null;
  }

  const isWaking = statusState.status === "waking";
  const isConnected = statusState.status === "connected";
  const isError = statusState.status === "error";

  return (
    <aside
      aria-label="Server status alert"
      className="fixed top-3 left-1/2 -translate-x-1/2 z-[9999] max-w-md w-[92%] sm:w-auto animate-bounce-subtle pointer-events-auto"
    >
      <div
        className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl shadow-xl backdrop-blur-md border text-xs sm:text-sm font-medium transition-all duration-300 ${
          isWaking
            ? "bg-amber-500/15 border-amber-500/40 text-amber-900 dark:text-amber-200"
            : isConnected
              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-900 dark:text-emerald-200"
              : "bg-rose-500/15 border-rose-500/40 text-rose-900 dark:text-rose-200"
        }`}
      >
        {isWaking && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
            <BsCloudLightningFill className="text-amber-500 text-base animate-pulse" />
          </div>
        )}

        {isConnected && (
          <BsCheckCircleFill className="text-emerald-500 text-base flex-shrink-0" />
        )}

        {isError && (
          <BsExclamationTriangleFill className="text-rose-500 text-base flex-shrink-0" />
        )}

        <div className="flex-1 min-w-0 pr-1">
          <p className="font-semibold leading-tight">
            {isWaking
              ? "Waking Cloud Backend..."
              : isConnected
                ? "Server Active"
                : "Server Unavailable"}
          </p>
          <p className="text-[11px] opacity-80 truncate">
            {statusState.detail ||
              (isWaking
                ? "Render free-tier container is starting up (~30s)"
                : isConnected
                  ? "Connected successfully!"
                  : "Please check your network and retry")}
          </p>
        </div>

        {isWaking && (
          <span className="loading loading-spinner loading-xs text-amber-500 flex-shrink-0" />
        )}

        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 opacity-70 hover:opacity-100 transition-opacity cursor-pointer flex-shrink-0"
          title="Dismiss notification"
          aria-label="Dismiss notification"
        >
          <BsX size={16} />
        </button>
      </div>
    </aside>
  );
};

export default BackendWakingBanner;
