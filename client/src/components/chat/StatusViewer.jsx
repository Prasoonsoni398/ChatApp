import { useState, useEffect } from "react";
import { BsX } from "react-icons/bs";

const StatusViewer = ({ group, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const STATUS_DURATION = 3000; // 3 seconds per status
  const statuses = group.statuses;

  useEffect(() => {
    let startTime = Date.now();
    let animationFrame;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const p = (elapsed / STATUS_DURATION) * 100;

      if (p >= 100) {
        if (currentIndex < statuses.length - 1) {
          setCurrentIndex((prev) => prev + 1);
          setProgress(0);
          startTime = Date.now(); // reset start time for next
          animationFrame = requestAnimationFrame(animate);
        } else {
          onClose(); // close if it was the last one
        }
      } else {
        setProgress(p);
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [currentIndex, statuses.length, onClose]);

  const handleNext = () => {
    if (currentIndex < statuses.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col animate-fade-in">
      {/* Progress Bars */}
      <div className="flex gap-1 p-2 pt-4 w-full max-w-xl mx-auto absolute top-0 left-0 right-0 z-10">
        {statuses.map((s, idx) => (
          <div
            key={s._id}
            className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden"
          >
            <div
              className="h-full bg-white transition-all duration-75"
              style={{
                width:
                  idx < currentIndex
                    ? "100%"
                    : idx === currentIndex
                      ? `${progress}%`
                      : "0%",
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-8 left-0 right-0 w-full max-w-xl mx-auto px-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-base-100 p-0.5">
            <img
              src={
                group.user.avatar ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${group.user.name}`
              }
              alt={group.user.name}
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          <div className="text-white">
            <p className="font-semibold">{group.user.name}</p>
            <p className="text-xs text-white/70">
              {new Date(statuses[currentIndex].createdAt).toLocaleTimeString(
                [],
                { hour: "2-digit", minute: "2-digit" },
              )}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
        >
          <BsX size={28} />
        </button>
      </div>

      {/* Image and click areas */}
      <div className="flex-1 relative flex items-center justify-center h-full max-w-xl mx-auto w-full">
        <div
          className="absolute inset-y-0 left-0 w-1/3 z-20 cursor-pointer"
          onClick={handlePrev}
        />
        <div
          className="absolute inset-y-0 right-0 w-2/3 z-20 cursor-pointer"
          onClick={handleNext}
        />

        <img
          src={statuses[currentIndex].image}
          alt="Status"
          className="max-h-full max-w-full object-contain"
        />
      </div>
    </div>
  );
};

export default StatusViewer;
