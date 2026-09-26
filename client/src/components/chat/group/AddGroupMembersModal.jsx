import { BsX, BsPersonPlusFill } from "react-icons/bs";

const AddGroupMembersModal = ({
  show,
  onClose,
  availableContacts,
  selectedToAdd,
  setSelectedToAdd,
  isAdding,
  onSubmit,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-120 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-base-300">
        <div className="px-5 py-4 border-b border-base-300 flex items-center justify-between bg-base-200/50">
          <h4 className="font-bold text-base flex items-center gap-2">
            <BsPersonPlusFill className="text-primary" />
            Add Participants
          </h4>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-base-content/70 hover:text-base-content hover:bg-base-200 transition-colors cursor-pointer"
            title="Close"
          >
            <BsX size={20} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <p className="text-xs text-base-content/60">
            Select from your added contacts to add to this group:
          </p>

          {availableContacts.length > 0 ? (
            <div className="max-h-60 overflow-y-auto space-y-1.5 border border-base-300 rounded-xl p-2">
              {availableContacts.map((contact) => {
                const isChecked = selectedToAdd.includes(contact._id);
                return (
                  <label
                    key={contact._id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-base-200 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary checkbox-sm"
                        checked={isChecked}
                        onChange={(e) => {
                          setSelectedToAdd((prev) =>
                            e.target.checked
                              ? [...prev, contact._id]
                              : prev.filter((id) => id !== contact._id),
                          );
                        }}
                      />
                      <div className="avatar">
                        <div className="w-8 h-8 rounded-full bg-base-300">
                          <img src={contact.avatar} alt={contact.name} />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{contact.name}</p>
                        <p className="text-[11px] text-base-content/50">
                          {contact.phone || contact.email}
                        </p>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-center text-base-content/50 py-4 italic">
              All your added contacts are already members of this group.
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-sm btn-ghost flex-1 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={selectedToAdd.length === 0 || isAdding}
              className="btn btn-sm btn-primary flex-1 rounded-xl"
            >
              {isAdding ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                `Add (${selectedToAdd.length})`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddGroupMembersModal;
