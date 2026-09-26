import { BsPersonFill } from "react-icons/bs";

const GroupParticipantItem = ({
  member,
  isMemberAdmin,
  isSelf,
  whoAddedText,
}) => {
  return (
    <div className="flex items-center justify-between p-2 rounded-xl hover:bg-base-200/50 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="avatar">
          <div className="w-10 h-10 rounded-full bg-base-300 overflow-hidden">
            {member.avatar ? (
              <img src={member.avatar} alt={member.name} />
            ) : (
              <BsPersonFill className="text-2xl text-base-content/40 m-auto mt-2" />
            )}
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm text-base-content truncate">
              {isSelf ? "You" : member.name || "Member"}
            </span>
            {isMemberAdmin && (
              <span className="badge badge-xs badge-primary font-medium text-[10px]">
                Group Admin
              </span>
            )}
          </div>
          {/* WHO ADDED THEM TO THE GROUP */}
          <p className="text-xs text-primary/80 font-medium truncate mt-0.5">
            {whoAddedText}
          </p>
        </div>
      </div>

      {member.phone && (
        <span className="text-[11px] text-base-content/40 flex-shrink-0 ml-2">
          {member.phone}
        </span>
      )}
    </div>
  );
};

export default GroupParticipantItem;
