import { useState, useEffect } from "react";
import {
  BsX,
  BsLaptopFill,
  BsPhoneFill,
  BsQrCode,
  BsShieldCheck,
  BsArrowLeft,
  BsTrash,
  BsClockHistory,
} from "react-icons/bs";
import toast from "react-hot-toast";
import * as userService from "../../services/userService.js";
import RemoveActionButton from "../common/RemoveActionButton.jsx";

/**
 * LinkedDevicesModal – GuftguLinked Devices Manager (PRD Section 70-72).
 * View active sessions, pair new device via QR code, and remotely log out devices.
 */
const LinkedDevicesModal = ({ isOpen, onClose, loggedInUser }) => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isLinkingView, setIsLinkingView] = useState(false);
  const [qrToken, setQrToken] = useState("");
  const [isSimulatingPairing, setIsSimulatingPairing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadDevices();
      setIsLinkingView(false);
    }
  }, [isOpen]);

  const loadDevices = async () => {
    try {
      setLoading(true);
      const data = await userService.getLinkedDevices();
      if (!data || data.length === 0) {
        setDevices([
          {
            deviceId: "current_web_session",
            deviceName: "Google Chrome (Windows)",
            browser: "Chrome",
            os: "Windows",
            lastActive: new Date(),
            isCurrent: true,
          },
        ]);
      } else {
        setDevices(data);
      }
    } catch (_err) {
      setDevices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartLinking = () => {
    const token = `wa_pair_${loggedInUser?._id || "user"}_${Date.now()}`;
    setQrToken(token);
    setIsLinkingView(true);
  };

  const handleSimulatePair = async () => {
    try {
      setIsSimulatingPairing(true);
      const presets = [
        {
          deviceName: "Guftgufor Windows",
          browser: "Desktop App",
          os: "Windows",
        },
        { deviceName: "Safari (macOS)", browser: "Safari", os: "macOS" },
        { deviceName: "Chrome (Linux)", browser: "Chrome", os: "Linux" },
        { deviceName: "iPad Safari", browser: "Safari", os: "iPadOS" },
      ];
      const randomPreset = presets[Math.floor(Math.random() * presets.length)];
      const updated = await userService.linkDevice(randomPreset);
      setDevices(updated);
      toast.success("New device linked successfully!");
      setIsLinkingView(false);
    } catch (e) {
      toast.error(e.message || "Failed to link device");
    } finally {
      setIsSimulatingPairing(false);
    }
  };

  const handleUnlink = async (deviceId) => {
    try {
      await userService.unlinkDevice(deviceId);
      setDevices((prev) =>
        prev.filter((d) => d.deviceId !== deviceId && d._id !== deviceId),
      );
      toast.success("Device logged out successfully");
    } catch (e) {
      toast.error(e.message || "Failed to log out device");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-base-100 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-base-300 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-base-300 flex items-center justify-between bg-base-200/50">
          <div className="flex items-center gap-2.5">
            {isLinkingView ? (
              <button
                onClick={() => setIsLinkingView(false)}
                className="p-1 -ml-1 text-base-content/70 hover:text-primary transition-colors"
              >
                <BsArrowLeft size={18} />
              </button>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
                <BsLaptopFill size={16} />
              </div>
            )}
            <h3 className="font-bold text-lg">
              {isLinkingView ? "Scan QR Code" : "Linked Devices"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-base-content/70 hover:text-base-content hover:bg-base-200 transition-colors cursor-pointer"
          >
            <BsX size={22} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {isLinkingView ? (
            /* QR Code Linking View */
            <div className="flex flex-col items-center text-center space-y-4 animate-fade-in">
              <div className="bg-white p-3.5 rounded-2xl shadow-md border border-base-300">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                    qrToken,
                  )}`}
                  alt="Pairing QR Code"
                  className="w-52 h-52 object-contain"
                />
              </div>

              <div className="space-y-1.5 max-w-xs text-left text-xs text-base-content/70">
                <p className="font-semibold text-base-content text-sm mb-2 text-center">
                  To use Guftguon your devices:
                </p>
                <p>1. Open Guftguon your primary phone</p>
                <p>
                  2. Tap Menu (⋮) or Settings and select{" "}
                  <strong>Linked Devices</strong>
                </p>
                <p>
                  3. Tap <strong>Link a Device</strong> and point your camera
                  here
                </p>
              </div>

              <div className="pt-2 w-full">
                <button
                  type="button"
                  onClick={handleSimulatePair}
                  disabled={isSimulatingPairing}
                  className="btn btn-sm btn-primary w-full rounded-xl"
                >
                  {isSimulatingPairing ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    "Pair Device Simulator"
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Standard Linked Devices View */
            <div className="space-y-5 animate-fade-in">
              {/* Hero Banner */}
              <div className="p-4 rounded-2xl bg-base-200/50 border border-base-300 flex flex-col items-center text-center space-y-3">
                <div className="flex items-center gap-3 text-primary">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <BsLaptopFill size={22} />
                  </div>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center -ml-5">
                    <BsPhoneFill size={22} />
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-base-content">
                    Use Guftguon other devices
                  </h4>
                  <p className="text-xs text-base-content/60 mt-0.5">
                    Link up to 4 devices to your account and send messages
                    seamlessly.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleStartLinking}
                  className="btn btn-sm btn-primary rounded-xl px-5 flex items-center gap-2"
                >
                  <BsQrCode size={15} /> Link a Device
                </button>
              </div>

              {/* End-to-end security notice */}
              <div className="flex items-center gap-2 px-1 text-[11px] text-base-content/60">
                <BsShieldCheck
                  size={14}
                  className="text-primary flex-shrink-0"
                />
                <span>
                  Your personal messages are end-to-end encrypted across all
                  linked devices.
                </span>
              </div>

              {/* Devices list */}
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <h4 className="text-xs font-semibold text-primary uppercase tracking-wider">
                    Device status
                  </h4>
                  <span className="badge badge-sm badge-ghost font-bold">
                    {devices.length}
                  </span>
                </div>

                {loading ? (
                  <div className="flex justify-center p-6">
                    <span className="loading loading-spinner text-primary"></span>
                  </div>
                ) : devices.length === 0 ? (
                  <p className="text-xs text-base-content/50 py-2 px-1">
                    No linked devices found.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {devices.map((device, idx) => {
                      const isCurrent = device.isCurrent || idx === 0;
                      return (
                        <div
                          key={device.deviceId || device._id || idx}
                          className="flex items-center justify-between p-3 rounded-xl bg-base-200/50 border border-base-300"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-base-300 text-base-content/70 flex items-center justify-center flex-shrink-0">
                              <BsLaptopFill size={16} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-xs truncate text-base-content">
                                  {device.deviceName || "Web Client"}
                                </span>
                                {isCurrent && (
                                  <span className="badge badge-xs badge-primary text-[9px] font-bold">
                                    Current
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-[11px] text-base-content/50 mt-0.5">
                                <BsClockHistory size={10} />
                                <span>
                                  {isCurrent
                                    ? "Active now"
                                    : `Last active ${new Date(
                                        device.lastActive || Date.now(),
                                      ).toLocaleDateString([], {
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}`}
                                </span>
                              </div>
                            </div>
                          </div>

                          {!isCurrent && (
                            <RemoveActionButton
                              onClick={() =>
                                handleUnlink(device.deviceId || device._id)
                              }
                              variant="circle"
                              size="xs"
                              title="Log out device"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-base-300 flex justify-end bg-base-200/30">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-sm btn-ghost rounded-xl"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LinkedDevicesModal;
