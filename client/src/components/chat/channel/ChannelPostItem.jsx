import {
  BsTrash,
  BsFileEarmarkTextFill,
  BsDownload,
  BsMusicNoteBeamed,
} from "react-icons/bs";

const QUICK_EMOJIS = ["👍", "❤️", "🔥", "🎉", "🚀", "💡", "👏", "🙌"];

const ChannelPostItem = ({
  post,
  isOwner,
  currentUserId,
  activeEmojiPickerPostId,
  setActiveEmojiPickerPostId,
  onReact,
  onDelete,
}) => {
  const userReactedMap = {};
  post.reactions?.forEach((r) => {
    if (
      r.userIds?.some(
        (u) => (u?._id || u)?.toString() === currentUserId?.toString(),
      )
    ) {
      userReactedMap[r.emoji] = true;
    }
  });

  const isImageMedia =
    post.mediaType === "image" ||
    (post.mediaUrl &&
      (post.mediaUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i) ||
        post.mediaUrl.startsWith("data:image/")));

  const isVideoMedia =
    post.mediaType === "video" ||
    (post.mediaUrl &&
      (post.mediaUrl.match(/\.(mp4|webm|mov|mkv|avi|m4v)($|\?)/i) ||
        post.mediaUrl.startsWith("data:video/")));

  const isAudioMedia =
    post.mediaType === "audio" ||
    (post.mediaUrl &&
      (post.mediaUrl.match(/\.(mp3|wav|ogg|m4a|aac|flac|opus)($|\?)/i) ||
        post.mediaUrl.startsWith("data:audio/")));

  return (
    <div className="bg-base-100 rounded-2xl p-4 shadow-sm border border-base-300/80 max-w-xl mx-auto space-y-3 relative group">
      {isOwner && (
        <button
          onClick={() => onDelete(post._id)}
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 text-base-content/40 hover:text-error rounded-full hover:bg-base-200 transition-all cursor-pointer"
          title="Delete broadcast"
        >
          <BsTrash size={13} />
        </button>
      )}

      {/* Post Text */}
      {post.text && (
        <p className="text-sm text-base-content whitespace-pre-wrap leading-relaxed pr-6">
          {post.text}
        </p>
      )}

      {/* Post Media Attachment */}
      {post.mediaUrl && (
        <div className="rounded-xl overflow-hidden bg-base-200/50 border border-base-300/80">
          {isImageMedia ? (
            <img
              src={post.mediaUrl}
              alt="Channel Broadcast Attachment"
              className="w-full h-auto max-h-96 object-contain hover:opacity-95 transition-opacity cursor-pointer bg-base-300/30"
              onClick={() => window.open(post.mediaUrl, "_blank")}
              title="Click to view full image"
            />
          ) : isVideoMedia ? (
            <video
              controls
              src={post.mediaUrl}
              className="w-full max-h-96 rounded-xl bg-black"
            />
          ) : isAudioMedia ? (
            <div className="p-3 bg-base-200/70">
              <div className="flex items-center gap-2 mb-2 text-xs font-medium text-base-content/80">
                <BsMusicNoteBeamed className="text-primary flex-shrink-0" />
                <span className="truncate">
                  {post.fileName || "Audio broadcast"}
                </span>
              </div>
              <audio controls src={post.mediaUrl} className="w-full h-10" />
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-base-200/70">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <BsFileEarmarkTextFill size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">
                    {post.fileName || "Document attachment"}
                  </p>
                  <p className="text-[10px] text-base-content/50 uppercase">
                    Attachment
                  </p>
                </div>
              </div>
              <a
                href={post.mediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                download={post.fileName || "attachment"}
                className="btn btn-xs btn-outline btn-primary gap-1 ml-2"
              >
                <BsDownload size={12} /> Open
              </a>
            </div>
          )}
        </div>
      )}

      {/* Reactions Pill Display */}
      <div className="flex items-center justify-between pt-2 border-t border-base-200/60">
        <div className="flex items-center flex-wrap gap-1.5">
          {post.reactions?.map((r) => {
            const hasReacted = userReactedMap[r.emoji];
            return (
              <button
                key={r.emoji}
                type="button"
                onClick={() => onReact(post._id, r.emoji)}
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs transition-colors border ${
                  hasReacted
                    ? "bg-primary/10 border-primary/40 text-primary font-medium"
                    : "bg-base-200/60 border-transparent hover:bg-base-200 text-base-content/70"
                }`}
              >
                <span>{r.emoji}</span>
                <span className="text-[11px] font-semibold">
                  {r.userIds?.length || 1}
                </span>
              </button>
            );
          })}

          {/* Add reaction trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setActiveEmojiPickerPostId(
                  activeEmojiPickerPostId === post._id ? null : post._id,
                )
              }
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs bg-base-200/60 hover:bg-base-200 text-base-content/60 hover:text-base-content transition-colors font-bold"
              title="Add reaction"
            >
              +
            </button>

            {activeEmojiPickerPostId === post._id && (
              <div className="absolute bottom-8 left-0 z-20 flex items-center gap-1 bg-base-100 p-1.5 rounded-full shadow-xl border border-base-300 animate-scale-in">
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => onReact(post._id, emoji)}
                    className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-base-200 hover:scale-125 transition-transform text-sm"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <span className="text-[10px] text-base-content/40 font-medium">
          {new Date(post.createdAt || 0).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
};

export default ChannelPostItem;
