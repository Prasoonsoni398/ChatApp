import { BsX, BsKeyboardFill } from "react-icons/bs";

/**
 * KeyboardShortcutsModal – GuftguWeb Keyboard Shortcuts reference (PRD Section 91).
 */
const KeyboardShortcutsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: "Ctrl + Alt + N", desc: "New chat / start conversation" },
    { key: "Ctrl + Alt + Shift + [", desc: "Previous chat" },
    { key: "Ctrl + Alt + Shift + ]", desc: "Next chat" },
    { key: "Ctrl + Alt + /", desc: "Search across chats" },
    { key: "Ctrl + Alt + Shift + F", desc: "Search in current chat" },
    { key: "Ctrl + Alt + Shift + M", desc: "Mute / unmute chat" },
    { key: "Ctrl + Alt + E", desc: "Archive / unarchive chat" },
    { key: "Ctrl + Alt + Shift + P", desc: "Pin / unpin message" },
    { key: "Ctrl + /", desc: "Show keyboard shortcuts" },
    { key: "Esc", desc: "Close popup or exit search" },
    { key: "Enter", desc: "Send message" },
    { key: "Shift + Enter", desc: "New line in message composer" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-base-100 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-base-300 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-base-300 flex items-center justify-between bg-base-200/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
              <BsKeyboardFill size={16} />
            </div>
            <h3 className="font-bold text-lg">Keyboard Shortcuts</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-base-content/70 hover:text-base-content hover:bg-base-200 transition-colors cursor-pointer"
          >
            <BsX size={22} />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-5 overflow-y-auto space-y-3">
          {shortcuts.map((sc, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-2 border-b border-base-200 last:border-0"
            >
              <span className="text-sm text-base-content/80 font-medium">
                {sc.desc}
              </span>
              <kbd className="kbd kbd-sm font-mono text-xs bg-base-200 text-primary font-bold px-2.5 py-1">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-base-300 bg-base-200/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-sm btn-primary px-6 rounded-xl"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsModal;
