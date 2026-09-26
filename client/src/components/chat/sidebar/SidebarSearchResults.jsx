import {
  BsImage,
  BsCameraVideo,
  BsFileEarmarkText,
  BsMicFill,
  BsBarChartFill,
  BsGeoAltFill,
  BsPersonBadgeFill,
} from "react-icons/bs";
import { sidebarChat } from "../../../constants/styles.js";

const SidebarSearchResults = ({
  isSearchingMessages,
  filteredChats = [],
  messageResults = [],
  searchQuery,
  searchCategory,
  selectedChat,
  setSelectedChat,
  handleSelectMessageResult,
  loggedInUser,
}) => {
  if (isSearchingMessages) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-3 text-base-content/50">
        <span className="loading loading-spinner text-primary"></span>
        <span className="text-xs">Searching messages & media...</span>
      </div>
    );
  }

  if (filteredChats.length === 0 && messageResults.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-base-content/50 gap-2">
        <p className="text-sm font-medium">No results found</p>
        <p className="text-xs text-base-content/40">
          No chats or messages matching &ldquo;
          {searchQuery || searchCategory}&rdquo;
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-base-200">
      {/* 1. MATCHING CHATS */}
      {filteredChats.length > 0 && (
        <div>
          <div className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-base-content/50 bg-base-200/40">
            Chats ({filteredChats.length})
          </div>
          {filteredChats.map((chat) => {
            const isSelected = selectedChat?.id === chat.id;
            return (
              <div
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={`${sidebarChat} ${
                  isSelected
                    ? "bg-primary/10 border-l-4 border-l-primary"
                    : "border-l-4 border-l-transparent"
                }`}
              >
                <div className="avatar">
                  <div className="w-12 h-12 rounded-full relative">
                    <img src={chat.avatar} alt={chat.name} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">
                    {chat.customName || chat.displayName || chat.name}
                  </h3>
                  <p className="text-xs text-base-content/60 truncate">
                    {chat.lastMessage}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. MATCHING MESSAGES */}
      {messageResults.length > 0 && (
        <div>
          <div className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-base-content/50 bg-base-200/40">
            Messages & Media ({messageResults.length})
          </div>
          {messageResults.map((msg) => {
            const senderObj =
              typeof msg.senderId === "object" ? msg.senderId : null;
            const senderName =
              String(senderObj?._id || msg.senderId) ===
              String(loggedInUser?._id)
                ? "You"
                : senderObj?.name || "User";

            const chatName = msg.groupId
              ? typeof msg.groupId === "object"
                ? msg.groupId.name
                : "Group"
              : String(senderObj?._id || msg.senderId) ===
                  String(loggedInUser?._id)
                ? typeof msg.receiverId === "object"
                  ? msg.receiverId.name
                  : "Chat"
                : senderName;

            const chatAvatar = msg.groupId
              ? typeof msg.groupId === "object"
                ? msg.groupId.avatar
                : ""
              : String(senderObj?._id || msg.senderId) ===
                  String(loggedInUser?._id)
                ? typeof msg.receiverId === "object"
                  ? msg.receiverId.avatar
                  : ""
                : senderObj?.avatar;

            const date = new Date(msg.createdAt || Date.now());
            const timeStr = date.toLocaleDateString([], {
              month: "short",
              day: "numeric",
            });

            return (
              <div
                key={msg._id}
                onClick={() => handleSelectMessageResult(msg)}
                className={`${sidebarChat} hover:bg-base-200/70 border-l-4 border-l-transparent`}
              >
                <div className="avatar">
                  <div className="w-11 h-11 rounded-full relative">
                    <img
                      src={
                        chatAvatar ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${chatName}`
                      }
                      alt={chatName}
                    />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className="font-semibold text-sm truncate text-base-content">
                      {chatName}
                    </h3>
                    <span className="text-[11px] text-base-content/50">
                      {timeStr}
                    </span>
                  </div>
                  <div className="text-xs text-base-content/70 truncate flex items-center gap-1.5">
                    <span className="font-medium text-base-content/90">
                      {senderName}:
                    </span>
                    {msg.mediaType === "image" ? (
                      <span className="flex items-center gap-1 text-primary">
                        <BsImage size={11} /> Photo{" "}
                        {msg.text ? `• ${msg.text}` : ""}
                      </span>
                    ) : msg.mediaType === "video" ? (
                      <span className="flex items-center gap-1 text-primary">
                        <BsCameraVideo size={11} /> Video{" "}
                        {msg.text ? `• ${msg.text}` : ""}
                      </span>
                    ) : msg.mediaType === "document" ? (
                      <span className="flex items-center gap-1 text-primary">
                        <BsFileEarmarkText size={11} />{" "}
                        {msg.fileName || "Document"}
                      </span>
                    ) : msg.mediaType === "audio" ||
                      msg.mediaType === "voice" ? (
                      <span className="flex items-center gap-1 text-primary">
                        <BsMicFill size={11} /> Voice note
                      </span>
                    ) : msg.mediaType === "poll" ? (
                      <span className="flex items-center gap-1 text-primary">
                        <BsBarChartFill size={11} /> Poll:{" "}
                        {msg.poll?.question || msg.text}
                      </span>
                    ) : msg.mediaType === "location" ? (
                      <span className="flex items-center gap-1 text-primary">
                        <BsGeoAltFill size={11} /> Location:{" "}
                        {msg.location?.name || "Shared location"}
                      </span>
                    ) : msg.mediaType === "contact" ? (
                      <span className="flex items-center gap-1 text-primary">
                        <BsPersonBadgeFill size={11} /> Contact:{" "}
                        {msg.contactCard?.name}
                      </span>
                    ) : (
                      <span>{msg.text}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SidebarSearchResults;
