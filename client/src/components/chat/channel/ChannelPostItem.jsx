import { BsTrash } from "react-icons/bs";

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
        (u) =>
          (u?._id || u)?.toString() === currentUserId?.toString(),
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
        <div className="rounded-xl overflow-hidden max-h-96 bg-base-200/50 border border-base-300/80">
          {isImageMedia ? (
            <img
              src={post.mediaUrl}
              alt="Channel Broadcast Attachment"
              className="w-full h-auto max-h-96 object-contain hover:opacity-95 transition-opacity cursor-pointer bg-base-300/30"
              onClick={() => window.open(post.mediaUrl, "_blank")}
              title="Click to view full image"
            />
          ) : (
            <a
              href={post.mediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 text-xs text-primary font-medium hover:underline"
            >
              📎 View Attachment
            </a>
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
                <span className="text-[11px] font-semibold">{r.userIds?.length || 1}</span>
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
          {new Date(post.createdAt || Date.now()).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
};

export default ChannelPostItem;
