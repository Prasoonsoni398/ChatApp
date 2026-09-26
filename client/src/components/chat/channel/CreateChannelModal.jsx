import { BsX } from "react-icons/bs";

const CreateChannelModal = ({
  show,
  onClose,
  channelName,
  setChannelName,
  channelDesc,
  setChannelDesc,
  onSubmit,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-base-100 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border border-base-300">
        <div className="px-5 py-4 border-b border-base-300 flex items-center justify-between bg-base-200/50">
          <h3 className="font-bold text-base">New Channel</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-base-content/70 hover:text-base-content hover:bg-base-200 transition-colors cursor-pointer"
          >
            <BsX size={20} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-base-content/70 uppercase tracking-wider block mb-1">
              Channel Name
            </label>
            <input
              type="text"
              required
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              placeholder="e.g. Tech Pulse"
              className="input input-bordered w-full rounded-xl bg-base-200"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-base-content/70 uppercase tracking-wider block mb-1">
              Description
            </label>
            <textarea
              value={channelDesc}
              onChange={(e) => setChannelDesc(e.target.value)}
              placeholder="Describe what updates your channel shares…"
              rows={2}
              className="textarea textarea-bordered w-full rounded-xl bg-base-200"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-sm btn-ghost rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-sm btn-primary rounded-xl px-4"
            >
              Create Channel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateChannelModal;
