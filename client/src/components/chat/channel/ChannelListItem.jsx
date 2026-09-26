import { BsCheckCircleFill, BsMegaphoneFill } from "react-icons/bs";

const ChannelListItem = ({
  channel,
  isSelected,
  onSelect,
  onClick,
  onToggleFollow,
  isOwner = false,
}) => {
  const handleClick = onSelect || onClick;
  const channelIsOwner = isOwner || Boolean(channel.isOwner);
  const followerCount =
    channel.followerCount ?? channel.followersCount ?? channel.followers?.length ?? 0;

  return (
    <div
      onClick={handleClick}
      className={`flex items-center justify-between p-3.5 hover:bg-base-200/70 cursor-pointer transition-colors border-l-4 ${
        isSelected
          ? "bg-primary/10 border-l-primary"
          : "border-l-transparent hover:border-l-base-300"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 pr-2">
        <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 bg-base-200 border border-base-300 flex items-center justify-center">
          {channel.avatar ? (
            <img
              src={channel.avatar}
              alt={channel.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <BsMegaphoneFill className="text-primary text-base" />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="font-semibold text-sm truncate">{channel.name}</h4>
            {channel.verified && (
              <BsCheckCircleFill className="text-primary flex-shrink-0" size={12} />
            )}
            {channelIsOwner && (
              <span className="badge badge-primary badge-xs py-1.5 px-2 text-[10px] font-semibold">
                Admin
              </span>
            )}
          </div>
          <p className="text-xs text-base-content/60 truncate">
            {channelIsOwner ? "You are the creator • " : ""}
            {followerCount} follower{followerCount === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        {channelIsOwner ? (
          <span className="text-[11px] font-medium text-primary px-2.5 py-1 bg-primary/10 rounded-full">
            Post & Manage
          </span>
        ) : onToggleFollow ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFollow(channel._id);
            }}
            className={`btn btn-xs rounded-full px-3 ${
              channel.isFollowing
                ? "btn-ghost border border-base-300 text-base-content/70 hover:btn-error hover:text-white"
                : "btn-primary font-medium"
            }`}
          >
            {channel.isFollowing ? "Following" : "Follow"}
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default ChannelListItem;
