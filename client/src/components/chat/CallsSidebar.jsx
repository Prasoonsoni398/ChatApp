import { useState, useEffect } from "react";
import {
  BsTelephone,
  BsCameraVideo,
  BsLink45Deg,
  BsTelephoneInbound,
  BsTelephoneOutbound,
  BsTelephoneX,
  BsPlus,
  BsSearch,
} from "react-icons/bs";
import toast from "react-hot-toast";

const CallsSidebar = ({ allUsers = [], startCall, onOpenNewCallModal }) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Default sample/saved call log stored in localStorage
  const [callLogs, setCallLogs] = useState(() => {
    try {
      const saved = localStorage.getItem("chat_call_logs");
      if (saved) return JSON.parse(saved);
    } catch (_e) {}
    // Seed initial realistic call history from available contacts
    return [];
  });

  useEffect(() => {
    const handleUpdate = () => {
      try {
        const saved = localStorage.getItem("chat_call_logs");
        if (saved) setCallLogs(JSON.parse(saved));
      } catch (_e) {}
    };
    window.addEventListener("call_logs_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("call_logs_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const handleCreateCallLink = () => {
    const roomId = `call-${Math.random().toString(36).substring(2, 9)}`;
    const callUrl = `${window.location.origin}/call/${roomId}`;
    navigator.clipboard.writeText(callUrl);
    toast.success("Call link copied to clipboard!");
  };

  const filteredLogs = callLogs.filter((log) =>
    log.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="w-full md:w-88 lg:w-96 flex-shrink-0 flex flex-col bg-base-100 border-r border-base-300 h-full">
      {/* ── Header ── */}
      <div className="h-16 px-4 flex items-center justify-between bg-base-200/50 border-b border-base-300">
        <h2 className="text-xl font-bold">Calls</h2>
        <button
          onClick={onOpenNewCallModal}
          className="p-2 hover:bg-base-300 text-primary rounded-full transition-all duration-200"
          title="Start new call"
        >
          <BsPlus size={24} />
        </button>
      </div>

      {/* ── Search ── */}
      <div className="p-3 border-b border-base-300">
        <div className="relative">
          <BsSearch
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search calls…"
            className="input input-sm w-full pl-9 bg-base-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50 border-none"
          />
        </div>
      </div>

      {/* ── Call List Content ── */}
      <div className="flex-1 overflow-y-auto">
        {/* Create Call Link Card */}
        <div
          onClick={handleCreateCallLink}
          className="flex items-center gap-3.5 p-3.5 hover:bg-base-200 cursor-pointer transition-colors border-b border-base-200/60"
        >
          <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0">
            <BsLink45Deg size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[15px]">Create call link</h3>
            <p className="text-xs text-base-content/60 truncate">
              Share a link for your Guftgucall
            </p>
          </div>
        </div>

        {/* Recent section header */}
        <div className="px-4 py-2 bg-base-200/30">
          <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">
            Recent
          </span>
        </div>

        {/* Call Logs */}
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-base-content/50 gap-3">
            <div className="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center">
              <BsTelephone size={24} className="opacity-60" />
            </div>
            <div>
              <p className="font-medium text-sm">No recent calls</p>
              <p className="text-xs text-base-content/40 mt-1">
                Tap the phone icon or a contact to start an audio or video call
              </p>
            </div>
            {allUsers.length > 0 && (
              <div className="w-full mt-4 text-left">
                <p className="text-xs font-semibold text-base-content/60 mb-2 px-1">
                  Start call with a contact:
                </p>
                <div className="space-y-1">
                  {allUsers.slice(0, 5).map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-base-200 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={
                            user.avatar ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`
                          }
                          alt={user.name}
                          className="w-9 h-9 rounded-full object-cover"
                        />
                        <span className="text-sm font-medium truncate">
                          {user.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startCall(user, "voice")}
                          className="p-2 hover:bg-primary/10 hover:text-primary rounded-lg text-base-content/60"
                          title="Voice call"
                        >
                          <BsTelephone size={15} />
                        </button>
                        <button
                          onClick={() => startCall(user, "video")}
                          className="p-2 hover:bg-primary/10 hover:text-primary rounded-lg text-base-content/60"
                          title="Video call"
                        >
                          <BsCameraVideo size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          filteredLogs.map((log, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3.5 hover:bg-base-200 transition-colors border-b border-base-200/50"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={
                    log.avatar ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${log.name}`
                  }
                  alt={log.name}
                  className="w-11 h-11 rounded-full object-cover"
                />
                <div className="min-w-0">
                  <h4
                    className={`font-semibold text-sm truncate ${
                      log.status === "missed" ? "text-error" : ""
                    }`}
                  >
                    {log.name}
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs text-base-content/60 mt-0.5">
                    {log.status === "missed" ? (
                      <BsTelephoneX className="text-error" size={12} />
                    ) : log.direction === "outgoing" ? (
                      <BsTelephoneOutbound className="text-success" size={12} />
                    ) : (
                      <BsTelephoneInbound className="text-primary" size={12} />
                    )}
                    <span>{log.time}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() =>
                  startCall(
                    { id: log.userId, name: log.name, avatar: log.avatar },
                    log.type || "voice",
                  )
                }
                className="p-2.5 hover:bg-primary/10 hover:text-primary rounded-full text-base-content/70"
                title={`Call ${log.name}`}
              >
                {log.type === "video" ? (
                  <BsCameraVideo size={17} />
                ) : (
                  <BsTelephone size={17} />
                )}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CallsSidebar;
