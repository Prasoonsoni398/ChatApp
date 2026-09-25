import { useState } from "react";
import { BsX, BsLockFill, BsShieldLock } from "react-icons/bs";
import toast from "react-hot-toast";

/**
 * PasscodeModal – WhatsApp-style 4-digit PIN prompt for Chat Lock (PRD Section 65-71).
 * Mode: "verify" (to unlock locked chats) or "setup" (to set/change 4-digit PIN).
 */
const PasscodeModal = ({ isOpen, onClose, onSuccess, mode = "verify" }) => {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  if (!isOpen) return null;

  const handleDigit = (digit) => {
    if (mode === "verify") {
      if (pin.length < 4) {
        const next = pin + digit;
        setPin(next);
        if (next.length === 4) {
          const storedPin = localStorage.getItem("chat_lock_pin") || "1234";
          if (next === storedPin) {
            toast.success("Unlocked");
            setPin("");
            onSuccess?.();
            onClose();
          } else {
            toast.error("Incorrect PIN");
            setPin("");
          }
        }
      }
    } else {
      // setup mode
      if (pin.length < 4) {
        setPin(pin + digit);
      } else if (confirmPin.length < 4) {
        const nextConfirm = confirmPin + digit;
        setConfirmPin(nextConfirm);
        if (nextConfirm.length === 4) {
          if (pin === nextConfirm) {
            localStorage.setItem("chat_lock_pin", pin);
            toast.success("Chat Lock PIN set successfully!");
            setPin("");
            setConfirmPin("");
            onSuccess?.();
            onClose();
          } else {
            toast.error("PINs do not match. Try again.");
            setPin("");
            setConfirmPin("");
          }
        }
      }
    }
  };

  const handleBackspace = () => {
    if (mode === "setup" && confirmPin.length > 0) {
      setConfirmPin(confirmPin.slice(0, -1));
    } else {
      setPin(pin.slice(0, -1));
    }
  };

  const currentDisplayLength =
    mode === "setup" && pin.length === 4 ? confirmPin.length : pin.length;
  const promptLabel =
    mode === "verify"
      ? "Enter your 4-digit PIN to unlock chats"
      : pin.length < 4
        ? "Create a 4-digit PIN for locked chats"
        : "Confirm your 4-digit PIN";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="bg-base-100 rounded-3xl w-full max-w-xs shadow-2xl overflow-hidden border border-base-300 flex flex-col items-center p-6 text-center">
        {/* Header icon */}
        <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
          <BsShieldLock size={32} />
        </div>

        <h3 className="font-bold text-lg mb-1">
          {mode === "verify" ? "Locked Chats" : "Set Chat Lock PIN"}
        </h3>
        <p className="text-xs text-base-content/60 mb-6">{promptLabel}</p>

        {/* 4 Dots indicator */}
        <div className="flex gap-4 mb-8">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                idx < currentDisplayLength
                  ? "bg-primary scale-110"
                  : "border-2 border-base-content/30 bg-transparent"
              }`}
            />
          ))}
        </div>

        {/* Number Pad */}
        <div className="grid grid-cols-3 gap-3 w-full mb-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigit(num.toString())}
              className="w-16 h-16 rounded-full bg-base-200/80 hover:bg-base-300 font-semibold text-xl flex items-center justify-center mx-auto active:scale-90 transition-transform"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={onClose}
            className="w-16 h-16 rounded-full text-xs font-semibold text-base-content/60 hover:bg-base-200 flex items-center justify-center mx-auto"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleDigit("0")}
            className="w-16 h-16 rounded-full bg-base-200/80 hover:bg-base-300 font-semibold text-xl flex items-center justify-center mx-auto active:scale-90 transition-transform"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="w-16 h-16 rounded-full hover:bg-base-200 font-semibold text-xs flex items-center justify-center mx-auto text-base-content/70"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default PasscodeModal;
