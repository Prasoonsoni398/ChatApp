import { useState, useEffect } from "react";
import { BsX, BsGeoAltFill, BsPinMapFill } from "react-icons/bs";
import toast from "react-hot-toast";

/**
 * LocationShareModal – WhatsApp-style live/static location sharing (PRD Section 32).
 */
const LocationShareModal = ({ isOpen, onClose, onSendLocation }) => {
  const [coords, setCoords] = useState(null);
  const [addressName, setAddressName] = useState("Current Location");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setCoords({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            });
            setIsLoading(false);
          },
          (err) => {
            console.error("Location error:", err);
            // Fallback default coordinates if permission denied
            setCoords({ latitude: 23.2599, longitude: 77.4126 });
            setAddressName("Bhopal, India (Default)");
            setIsLoading(false);
            toast("Could not access precise GPS, using approximate location");
          },
          { enableHighAccuracy: true, timeout: 10000 },
        );
      } else {
        setCoords({ latitude: 23.2599, longitude: 77.4126 });
        setIsLoading(false);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSend = () => {
    if (!coords) return;
    onSendLocation({
      latitude: coords.latitude,
      longitude: coords.longitude,
      name: addressName,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-base-100 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border border-base-300 flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-base-300 flex items-center justify-between bg-base-200/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
              <BsGeoAltFill size={16} />
            </div>
            <h3 className="font-bold text-base">Share Location</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-base-content/70 hover:text-base-content hover:bg-base-200 transition-colors cursor-pointer"
          >
            <BsX size={22} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col items-center">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <span className="loading loading-spinner text-primary loading-lg"></span>
              <p className="text-xs text-base-content/60">Detecting GPS location…</p>
            </div>
          ) : coords ? (
            <div className="w-full space-y-4">
              {/* Map Preview Thumbnail */}
              <div className="w-full h-44 rounded-2xl overflow-hidden relative border border-base-300 shadow-inner bg-base-200">
                <iframe
                  title="Location Preview"
                  width="100%"
                  height="100%"
                  style={{ border: 0, pointerEvents: "none" }}
                  loading="lazy"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${coords.longitude - 0.01}%2C${coords.latitude - 0.01}%2C${coords.longitude + 0.01}%2C${coords.latitude + 0.01}&layer=mapnik&marker=${coords.latitude}%2C${coords.longitude}`}
                />
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-content flex items-center justify-center shadow-lg animate-bounce">
                    <BsPinMapFill size={16} />
                  </div>
                </div>
              </div>

              {/* Coordinates info */}
              <div>
                <label className="text-xs font-semibold text-base-content/60 uppercase tracking-wider block mb-1">
                  Location Label
                </label>
                <input
                  type="text"
                  value={addressName}
                  onChange={(e) => setAddressName(e.target.value)}
                  className="input input-sm input-bordered w-full rounded-xl bg-base-200"
                />
                <p className="text-[11px] text-base-content/50 mt-1">
                  Lat: {coords.latitude.toFixed(4)}, Long: {coords.longitude.toFixed(4)}
                </p>
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
                  type="button"
                  onClick={handleSend}
                  className="btn btn-sm btn-primary rounded-xl px-4 gap-1.5"
                >
                  <BsGeoAltFill size={13} />
                  <span>Send Location</span>
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-error">Unable to fetch location</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationShareModal;
