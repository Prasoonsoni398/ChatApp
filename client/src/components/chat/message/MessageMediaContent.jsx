import {
  BsDownload,
  BsFileEarmarkPdfFill,
  BsFileEarmarkTextFill,
  BsFileEarmarkZipFill,
  BsFileEarmarkFill,
  BsGeoAltFill,
} from "react-icons/bs";
import AudioPlayer from "../AudioPlayer.jsx";
import PollCard from "../PollCard.jsx";
import EventCard from "../EventCard.jsx";

const formatFileSize = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getDocIcon = (filename = "") => {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return <BsFileEarmarkPdfFill size={28} className="text-error" />;
  if (["txt", "doc", "docx"].includes(ext))
    return <BsFileEarmarkTextFill size={28} className="text-info" />;
  if (["zip", "rar", "7z", "tar"].includes(ext))
    return <BsFileEarmarkZipFill size={28} className="text-warning" />;
  return <BsFileEarmarkFill size={28} className="text-base-content/60" />;
};

const MessageMediaContent = ({
  msg,
  isMe,
  loggedInUser,
  selectedChat,
  onOpenViewOnce,
  onRespondEvent,
  isSearchMatch,
  msgSearchQuery,
}) => {
  return (
    <>
      {/* 0. View-Once Media Pill */}
      {msg.isViewOnce &&
        (() => {
          const isOpened = isMe
            ? msg.viewedBy && msg.viewedBy.length > 0
            : msg.viewedBy &&
              msg.viewedBy.some(
                (v) => (v._id || v).toString() === loggedInUser?._id?.toString(),
              );

          if (isOpened) {
            return (
              <div className="flex items-center gap-2 py-2 px-3 rounded-xl bg-black/5 text-base-content/60 select-none mb-1">
                <div className="w-5 h-5 rounded-full border border-dashed border-base-content/40 flex items-center justify-center text-[10px] font-bold">
                  1
                </div>
                <span className="text-xs italic font-medium">Opened</span>
              </div>
            );
          }

          return (
            <div
              onClick={() => {
                if (!isMe && onOpenViewOnce) {
                  onOpenViewOnce(msg);
                }
              }}
              className={`flex items-center gap-2 py-2 px-3 rounded-xl transition-all select-none mb-1 ${
                isMe
                  ? "bg-black/10 text-base-content/80 cursor-default"
                  : "bg-primary/20 text-primary hover:bg-primary/30 cursor-pointer active:scale-95 shadow-xs"
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-primary text-primary-content flex items-center justify-center text-[10px] font-bold shadow-xs">
                1
              </div>
              <span className="text-xs font-semibold">
                {msg.mediaType === "video" ? "Video" : "Photo"}
              </span>
              {!isMe && (
                <span className="text-[10px] opacity-70 ml-1">Tap to open</span>
              )}
            </div>
          );
        })()}

      {/* 1. Voice Note or Audio File */}
      {(msg.mediaType === "voice" || msg.mediaType === "audio") && (
        <div className="mb-1.5">
          <AudioPlayer
            src={msg.mediaUrl || msg.image}
            isVoice={msg.mediaType === "voice"}
            initialDuration={msg.duration}
            isMe={isMe}
          />
        </div>
      )}

      {/* 2. Video in Chat */}
      {!msg.isViewOnce && msg.mediaType === "video" && (
        <div className="mb-2 rounded-xl overflow-hidden shadow-xs bg-black">
          <video
            controls
            preload="metadata"
            src={msg.mediaUrl || msg.image}
            className="max-h-72 w-full object-contain"
          />
        </div>
      )}

      {/* 3. Document Attachment Card */}
      {msg.mediaType === "document" && (
        <a
          href={msg.mediaUrl || msg.image}
          target="_blank"
          rel="noreferrer"
          download={msg.fileName || "attachment"}
          className="flex items-center gap-3 p-2.5 rounded-xl bg-base-200/80 hover:bg-base-200 border border-base-300/60 mb-2 transition-colors cursor-pointer group"
        >
          <div className="p-2 rounded-lg bg-base-100 flex-shrink-0 shadow-xs">
            {getDocIcon(msg.fileName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-xs truncate group-hover:underline">
              {msg.fileName || "Document"}
            </p>
            <p className="text-[10px] text-base-content/60">
              {formatFileSize(msg.fileSize)}
            </p>
          </div>
          <div className="p-2 rounded-full hover:bg-base-300 text-base-content/60">
            <BsDownload size={14} />
          </div>
        </a>
      )}

      {/* 4. Image Attachment */}
      {!msg.isViewOnce &&
        (!msg.mediaType || msg.mediaType === "image") &&
        (msg.mediaUrl || msg.image) && (
          <img
            src={msg.mediaUrl || msg.image}
            alt="Attachment"
            className="max-w-full rounded-xl mb-2 object-cover max-h-80"
          />
        )}

      {/* 5. Poll Widget */}
      {msg.mediaType === "poll" && (
        <PollCard
          message={msg}
          loggedInUser={loggedInUser}
          selectedChat={selectedChat}
        />
      )}

      {/* 6. Location Card */}
      {msg.mediaType === "location" && msg.location && (
        <a
          href={`https://www.google.com/maps?q=${msg.location.latitude},${msg.location.longitude}`}
          target="_blank"
          rel="noreferrer"
          className="block rounded-xl overflow-hidden border border-base-300 bg-base-200/50 mb-2 hover:opacity-95 transition-opacity"
        >
          <div className="w-full h-32 bg-base-300 relative overflow-hidden flex items-center justify-center">
            <iframe
              title="Location map"
              width="100%"
              height="100%"
              style={{ border: 0, pointerEvents: "none" }}
              loading="lazy"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${msg.location.longitude - 0.008}%2C${msg.location.latitude - 0.008}%2C${msg.location.longitude + 0.008}%2C${msg.location.latitude + 0.008}&layer=mapnik&marker=${msg.location.latitude}%2C${msg.location.longitude}`}
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-7 h-7 rounded-full bg-primary text-primary-content flex items-center justify-center shadow-lg">
                <BsGeoAltFill size={15} />
              </div>
            </div>
          </div>
          <div className="p-2.5">
            <h5 className="font-bold text-xs text-base-content truncate">
              {msg.location.name || "Live Location"}
            </h5>
            <p className="text-[10px] text-primary hover:underline mt-0.5">
              Open in Google Maps ↗
            </p>
          </div>
        </a>
      )}

      {/* 7. Contact Card */}
      {msg.mediaType === "contact" && msg.contactCard && (
        <div className="p-3 rounded-xl bg-base-200/80 border border-base-300/80 mb-2 flex items-center gap-3 min-w-56">
          <img
            src={
              msg.contactCard.avatar ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.contactCard.name}`
            }
            alt={msg.contactCard.name}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-xs truncate">
              {msg.contactCard.name}
            </h4>
            <p className="text-[11px] text-base-content/60 truncate">
              {msg.contactCard.phone || msg.contactCard.email || "Contact"}
            </p>
          </div>
        </div>
      )}

      {/* 8. Event Card */}
      {msg.mediaType === "event" && msg.event && (
        <EventCard
          message={msg}
          loggedInUser={loggedInUser}
          onRespond={onRespondEvent}
        />
      )}

      {/* 9. Text — with search highlight & group @mentions */}
      {msg.mediaType !== "poll" &&
        msg.mediaType !== "location" &&
        msg.mediaType !== "contact" &&
        msg.mediaType !== "event" &&
        msg.text &&
        (isSearchMatch ? (
          <span
            dangerouslySetInnerHTML={{
              __html: msg.text.replace(
                new RegExp(
                  `(${msgSearchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
                  "gi",
                ),
                '<mark class="bg-yellow-300 text-black rounded px-0.5">$1</mark>',
              ),
            }}
          />
        ) : (
          <span className="whitespace-pre-wrap break-words">
            {msg.text.split(/(@[A-Za-z0-9_]+)/g).map((part, pIdx) => {
              if (part.startsWith("@")) {
                const namePart = part.slice(1).trim();
                const isMeMentioned =
                  loggedInUser?.name &&
                  namePart.toLowerCase() === loggedInUser.name.toLowerCase();
                return (
                  <span
                    key={pIdx}
                    className={`font-semibold rounded px-1 py-0.5 inline-block ${
                      isMeMentioned
                        ? "bg-primary text-primary-content font-bold shadow-xs"
                        : "text-primary hover:underline cursor-pointer"
                    }`}
                  >
                    {part}
                  </span>
                );
              }
              return part;
            })}
          </span>
        ))}
    </>
  );
};

export default MessageMediaContent;
