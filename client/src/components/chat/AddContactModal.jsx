import { useState } from "react";
import {
  BsX,
  BsSearch,
  BsTelephoneFill,
  BsPersonPlusFill,
  BsCheckCircleFill,
  BsPersonFill,
  BsPencilFill,
} from "react-icons/bs";
import toast from "react-hot-toast";
import * as contactService from "../../services/contactService.js";

/**
 * AddContactModal — WhatsApp-style contact addition.
 * Users search by phone number, edit their saved contact name, and add them.
 */
const AddContactModal = ({ isOpen, onClose, onContactAdded }) => {
  const [phone, setPhone] = useState("");
  const [searching, setSearching] = useState(false);
  const [foundUser, setFoundUser] = useState(null);
  const [customContactName, setCustomContactName] = useState("");
  const [adding, setAdding] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setSearching(true);
    setFoundUser(null);
    setAddedSuccess(false);
    try {
      const user = await contactService.searchContactByPhone(phone.trim());
      setFoundUser(user);
      setCustomContactName(user.name || "");
    } catch (err) {
      toast.error(err.message || "No user found with that phone number");
      setFoundUser(null);
    } finally {
      setSearching(false);
    }
  };

  const handleAddContact = async () => {
    if (!foundUser) return;
    setAdding(true);
    try {
      const chosenName = customContactName.trim() || foundUser.name;
      const result = await contactService.addContact(foundUser._id, chosenName);
      setAddedSuccess(true);
      toast.success(`${chosenName} added to contacts!`);
      // Notify parent to refresh sidebar
      if (onContactAdded) onContactAdded(result.contact);
      // Auto-close after brief delay
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      toast.error(err.message || "Failed to add contact");
    } finally {
      setAdding(false);
    }
  };

  const handleClose = () => {
    setPhone("");
    setFoundUser(null);
    setCustomContactName("");
    setAddedSuccess(false);
    setSearching(false);
    setAdding(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={handleClose}
    >
      <div
        className="bg-base-100 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-base-300 flex flex-col animate-modal-pop"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-base-300 bg-base-200/50">
          <div className="flex items-center gap-2">
            <BsPersonPlusFill className="text-primary text-lg" />
            <h3 className="font-bold text-base-content">New Contact</h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-base-content/70 hover:text-base-content hover:bg-base-200 transition-colors cursor-pointer"
            title="Close"
          >
            <BsX size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          <p className="text-sm text-base-content/60">
            Enter the phone number of the person you want to chat with. They must be registered on ChatApp.
          </p>

          {/* Phone search form */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40">
                <BsTelephoneFill className="text-sm" />
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setFoundUser(null);
                  setAddedSuccess(false);
                }}
                placeholder="+91 98765 43210"
                className="input input-bordered w-full pl-9 text-sm rounded-xl"
              />
            </div>
            <button
              type="submit"
              disabled={!phone.trim() || searching}
              className="btn btn-primary btn-sm rounded-xl px-4"
            >
              {searching ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <BsSearch />
              )}
            </button>
          </form>

          {/* Found user card */}
          {foundUser && (
            <div className="border border-base-300 rounded-2xl p-4 bg-base-200/50 space-y-4 animate-fadeIn shadow-xs">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="avatar flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-base-300 flex items-center justify-center overflow-hidden border border-base-300">
                    {foundUser.avatar ? (
                      <img
                        src={foundUser.avatar}
                        alt={foundUser.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <BsPersonFill className="text-2xl text-base-content/40" />
                    )}
                  </div>
                </div>

                {/* Registered Account Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-base-content text-sm truncate">
                    {foundUser.name}
                  </p>
                  <p className="text-xs text-base-content/60">
                    {foundUser.phone || foundUser.email}
                  </p>
                  {foundUser.about && (
                    <p className="text-[11px] text-base-content/50 italic truncate mt-0.5">
                      "{foundUser.about}"
                    </p>
                  )}
                </div>
              </div>

              {/* Editable Contact Name */}
              <div className="pt-1 border-t border-base-300/60">
                <label className="text-xs font-semibold text-base-content/80 flex items-center justify-between mb-1.5">
                  <span>Save Contact Name</span>
                  <span className="text-[10px] text-primary font-medium">Editable</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={customContactName}
                    onChange={(e) => setCustomContactName(e.target.value)}
                    placeholder="Enter custom nickname..."
                    className="input input-bordered input-sm w-full rounded-xl text-sm font-medium pr-8 bg-base-100"
                    autoFocus
                  />
                  <BsPencilFill className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-base-content/40 pointer-events-none" />
                </div>
                <p className="text-[11px] text-base-content/50 mt-1">
                  How this contact will appear in your chats and call logs.
                </p>
              </div>

              {/* Add CTA */}
              <div className="pt-1 flex justify-end">
                {addedSuccess ? (
                  <div className="flex items-center gap-1.5 text-success text-sm font-bold py-1">
                    <BsCheckCircleFill className="text-base" /> Contact Added!
                  </div>
                ) : (
                  <button
                    onClick={handleAddContact}
                    disabled={adding || !customContactName.trim()}
                    className="btn btn-primary btn-sm rounded-xl px-5 flex items-center gap-2"
                  >
                    {adding ? (
                      <span className="loading loading-spinner loading-xs" />
                    ) : (
                      <BsPersonPlusFill />
                    )}
                    Save Contact
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Hint */}
          <p className="text-xs text-base-content/40 text-center">
            💡 Make sure you include the country code (e.g. +91 for India)
          </p>
        </div>
      </div>
    </div>
  );
};

export default AddContactModal;
