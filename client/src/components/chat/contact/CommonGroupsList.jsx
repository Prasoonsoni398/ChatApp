import { BsPeopleFill } from "react-icons/bs";

const CommonGroupsList = ({ groups = [] }) => {
  return (
    <div className="p-4 bg-base-100 space-y-3">
      <span className="text-xs font-semibold text-primary uppercase tracking-wider block">
        Groups in Common ({groups.length})
      </span>
      {groups.length > 0 ? (
        <div className="space-y-2">
          {groups.map((grp) => (
            <div
              key={grp._id}
              className="flex items-center gap-3 p-2 rounded-xl bg-base-200/50"
            >
              <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/20 flex items-center justify-center">
                {grp.avatar ? (
                  <img
                    src={grp.avatar}
                    alt={grp.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <BsPeopleFill className="text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{grp.name}</p>
                <p className="text-xs text-base-content/50">
                  {grp.members?.length || 0} members
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-base-content/50 italic">
          No groups in common
        </p>
      )}
    </div>
  );
};

export default CommonGroupsList;
