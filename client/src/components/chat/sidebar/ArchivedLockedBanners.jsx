import { BsArchiveFill, BsLockFill } from "react-icons/bs";

export const ArchivedRowBanner = ({
  archivedCount,
  onOpenArchived,
}) => {
  if (archivedCount === 0) return null;

  return (
    <div
      onClick={onOpenArchived}
      className="flex items-center gap-3.5 px-4 py-3 border-b border-base-200 hover:bg-base-200 cursor-pointer transition-colors"
    >
      <div className="w-11 h-11 rounded-full bg-base-200 text-base-content/70 flex items-center justify-center flex-shrink-0">
        <BsArchiveFill size={18} />
      </div>
      <div className="flex-1 min-w-0 flex items-center justify-between">
        <h4 className="font-semibold text-sm">Archived</h4>
        <span className="badge badge-xs badge-neutral font-bold">
          {archivedCount}
        </span>
      </div>
    </div>
  );
};

export const LockedChatsHeader = ({
  lockedCount,
  isLockedSectionUnlocked,
  onOpenLockedChats,
}) => {
  if (lockedCount === 0) return null;

  return (
    <div
      onClick={onOpenLockedChats}
      className="flex items-center gap-3.5 px-4 py-3 hover:bg-base-200 cursor-pointer transition-colors"
    >
      <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
        <BsLockFill size={19} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-sm">Locked chats</h4>
          <span className="badge badge-xs badge-primary font-bold">
            {lockedCount}
          </span>
        </div>
        <p className="text-xs text-base-content/50">
          {isLockedSectionUnlocked
            ? "Unlocked • Tap to hide"
            : "Tap to unlock with PIN"}
        </p>
      </div>
    </div>
  );
};
