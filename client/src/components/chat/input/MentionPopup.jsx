const MentionPopup = ({
  show,
  members = [],
  currentUserId,
  mentionFilter = "",
  onInsertMention,
}) => {
  if (!show) return null;

  const filteredMembers = members
    .filter((m) => m && m._id !== currentUserId && m.name)
    .filter((m) =>
      m.name.toLowerCase().includes((mentionFilter || "").toLowerCase()),
    );

  if (filteredMembers.length === 0) return null;

  return (
    <div className="absolute bottom-[calc(100%+8px)] left-0 w-64 max-h-48 overflow-y-auto bg-base-100 border border-base-300 rounded-xl shadow-2xl z-[150] animate-fade-in py-1">
      {filteredMembers.map((member) => (
        <div
          key={member._id}
          className="flex items-center gap-3 px-3 py-2 hover:bg-base-200 cursor-pointer transition-colors"
          onClick={() => onInsertMention(member)}
        >
          <img
            src={
              member.avatar ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`
            }
            alt={member.name}
            className="w-8 h-8 rounded-full border border-base-300"
          />
          <span className="text-sm font-medium">{member.name}</span>
        </div>
      ))}
    </div>
  );
};

export default MentionPopup;
