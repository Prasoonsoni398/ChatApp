import React from "react";
import RemoveActionButton from "../../common/RemoveActionButton.jsx";

const ChatsTabContent = ({ onOpenClearConfirm }) => {
  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Chat History & Data */}
      <div>
        <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">
          Chat History & Cleanup
        </h4>
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl bg-base-200/50 border border-base-300 flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold block text-base-content">
                Clear all messages
              </span>
              <span className="text-xs text-base-content/60 block mt-0.5">
                Deletes all messages from all your personal and group chats.
              </span>
            </div>
            <RemoveActionButton
              onClick={onOpenClearConfirm}
              size="xs"
              label="Clear all"
              className="flex-shrink-0 ml-3"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-base-200/50 border border-base-300">
            <span className="text-sm font-semibold block text-base-content">
              Chat Exports
            </span>
            <span className="text-xs text-base-content/60 block mt-0.5">
              To export individual chat history in standard Guftgu format
              (.txt), open any chat, click the 3-dot menu and select{" "}
              <strong className="text-primary">"Export Chat"</strong>.
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-base-200/50 border border-base-300">
            <span className="text-sm font-semibold block text-base-content">
              Ephemeral Media Policy
            </span>
            <span className="text-xs text-base-content/60 block mt-0.5">
              View-Once media burns immediately upon opening. Status updates
              strictly expire after 24 hours. Video Status is excluded per PRD.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatsTabContent;
