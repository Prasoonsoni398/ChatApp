import { BsCheckCircleFill } from "react-icons/bs";

const ChannelListItem = ({ channel, isSelected, onSelect, onToggleFollow }) => {
  return (
    <div
      onClick={onSelect}
      className={`flex items-center justify-between p-3.5 hover:bg-base-200 cursor-pointer transition-colors ${
        isSelected ? "bg-primary/10 border-l-4 border-l-primary" : ""
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 pr-2">
        <img
          src={channel.avatar}
          alt={channel.name}
          className="w-11 h-11 rounded-full object-cover flex-shrink-0"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="font-semibold text-sm truncate">{channel.name}</h4>
            {channel.verified && (
              <BsCheckCircleFill className="text-primary flex-shrink-0" size={13} />
            )}
          </div>
          <p className="text-xs text-base-content/60 truncate">
            {channel.followerCount || 0} followers
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleFollow(channel._id);
        }}
        className={`btn btn-xs rounded-full px-3 flex-shrink-0 ${
          channel.isFollowing
            ? "btn-ghost border border-base-300 text-base-content/70"
            : "btn-primary"
        }`}
      >
        {channel.isFollowing ? "Following" : "Follow"}
      </button>
    </div>
  );
};

export default ChannelListItem;
