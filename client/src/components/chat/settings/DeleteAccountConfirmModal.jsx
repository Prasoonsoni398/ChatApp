import React from "react";
import { BsExclamationTriangleFill } from "react-icons/bs";
import RemoveActionButton from "../../common/RemoveActionButton.jsx";

const DeleteAccountConfirmModal = ({
  isOpen,
  onClose,
  deleteConfirmText,
  setDeleteConfirmText,
  handleDeleteAccount,
  isDeletingAccount,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-base-100 rounded-2xl p-5 border border-error/40 shadow-2xl max-w-sm w-full space-y-4 animate-scale-in">
        <div className="w-12 h-12 rounded-full bg-error/15 text-error flex items-center justify-center mx-auto">
          <BsExclamationTriangleFill size={22} />
        </div>
        <div className="text-center">
          <h4 className="font-bold text-base text-base-content">
            Delete Account Permanently?
          </h4>
          <p className="text-xs text-base-content/60 mt-1">
            This action cannot be undone. All your messages, contacts, and
            personal data will be erased immediately.
          </p>
        </div>
        <div>
          <label className="text-xs font-semibold text-base-content/70 block mb-1">
            Type <span className="text-error font-mono font-bold">DELETE</span>{" "}
            to confirm:
          </label>
          <input
            type="text"
            placeholder="DELETE"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            className="input input-bordered input-sm w-full rounded-xl text-center font-mono font-bold uppercase tracking-wider"
            autoFocus
          />
        </div>
        <div className="flex gap-2 justify-center pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeletingAccount}
            className="btn btn-sm btn-ghost rounded-xl"
          >
            Cancel
          </button>
          <RemoveActionButton
            onClick={handleDeleteAccount}
            disabled={
              isDeletingAccount ||
              deleteConfirmText.trim().toUpperCase() !== "DELETE"
            }
            loading={isDeletingAccount}
            size="sm"
            label="Permanently Delete"
            className="px-4"
          />
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountConfirmModal;
