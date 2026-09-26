import {
  BsBellSlashFill,
  BsPinAngleFill,
  BsStarFill,
  BsArchiveFill,
} from "react-icons/bs";
import { sidebarChat } from "../../../constants/styles.js";

const SidebarChatListItem = ({
  chat,
  isSelected,
  onSelect,
  isMuted,
  isArchived,
  draft,
}) => {
  return (
    <div
      onClick={onSelect}
      className={`${sidebarChat} ${
        isSelected
          ? "bg-primary/10 border-l-4 border-l-primary"
          : "border-l-4 border-l-transparent"
      }`}
    >
      <div className="avatar">
        <div
          className={`w-12 h-12 rounded-full relative ${
            isSelected
              ? "ring ring-primary ring-offset-base-100 ring-offset-2"
              : ""
          }`}
        >
          <img src={chat.avatar} alt={chat.name} />
          {chat.online && (
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-success rounded-full ring-2 ring-base-100"></span>
          )}
          {isArchived && (
            <span className="absolute -bottom-1 -right-1 bg-neutral text-neutral-content rounded-full p-1 shadow-sm">
              <BsArchiveFill size={9} />
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-0.5">
          <h3
            className={`font-semibold text-sm truncate flex items-center gap-1 ${
              isSelected ? "text-primary" : ""
            }`}
          >
            {chat.customName || chat.displayName || chat.name}
            {isMuted && (
              <BsBellSlashFill
                size={11}
                className="text-base-content/40 inline ml-1"
                title="Muted"
              />
            )}
            {chat.isFavorite && (
              <BsStarFill
                size={10}
                className="text-warning fill-warning inline ml-0.5"
                title="Favorite"
              />
            )}
          </h3>
          <span className="text-[11px] text-base-content/50">{chat.time}</span>
        </div>

        <div className="flex justify-between items-center">
          <p className="text-xs text-base-content/60 truncate pr-2">
            {draft ? (
              <span className="text-primary font-medium">
                Draft:{" "}
                <span className="text-base-content/70 font-normal">
                  {draft}
                </span>
              </span>
            ) : (
              chat.lastMessage
            )}
          </p>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {chat.pinned && (
              <BsPinAngleFill
                className="text-base-content/40 -rotate-45"
                size={12}
                title="Pinned chat"
              />
            )}
            {chat.unread > 0 && (
              <span className="badge badge-primary badge-sm font-bold text-[10px] h-4.5 min-w-[1.125rem] px-1">
                {chat.unread}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SidebarChatListItem;
