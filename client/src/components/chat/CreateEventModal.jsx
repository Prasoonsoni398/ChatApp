import { useState } from "react";
import {
  BsX,
  BsCalendarEventFill,
  BsClockFill,
  BsGeoAltFill,
  BsTextParagraph,
} from "react-icons/bs";
import toast from "react-hot-toast";

/**
 * CreateEventModal – GuftguGroup Event Composer (PRD Section 47).
 * Allows group members to create scheduled events with date, time, location, and description.
 */
const CreateEventModal = ({ isOpen, onClose, onCreateEvent, selectedChat }) => {
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    return today.toISOString().split("T")[0];
  });
  const [startTime, setStartTime] = useState("18:00");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter an event title");
      return;
    }
    if (!startDate) {
      toast.error("Please choose a date for the event");
      return;
    }

    try {
      setIsSubmitting(true);
      await onCreateEvent({
        title: title.trim(),
        startDate,
        startTime,
        location: location.trim(),
        description: description.trim(),
        groupId: selectedChat?.isGroup ? selectedChat.id : null,
        receiverId: !selectedChat?.isGroup ? selectedChat.id : null,
      });
      toast.success("Event created successfully");
      setTitle("");
      setLocation("");
      setDescription("");
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to create event");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-base-100 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-base-300 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-base-300 flex items-center justify-between bg-base-200/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
              <BsCalendarEventFill size={16} />
            </div>
            <h3 className="font-bold text-lg">Create Event</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-base-content/70 hover:text-base-content hover:bg-base-200 transition-colors cursor-pointer"
          >
            <BsX size={22} />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="p-5 space-y-4 flex-1 overflow-y-auto"
        >
          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-base-content/70 block mb-1.5">
              Event name *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Team Sync, Dinner Party"
              className="input input-bordered input-sm w-full rounded-xl focus:outline-primary"
              maxLength={80}
              required
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-base-content/70 flex items-center gap-1 mb-1.5">
                <BsCalendarEventFill size={11} className="text-primary" /> Date
                *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input input-bordered input-sm w-full rounded-xl focus:outline-primary"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-base-content/70 flex items-center gap-1 mb-1.5">
                <BsClockFill size={11} className="text-primary" /> Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="input input-bordered input-sm w-full rounded-xl focus:outline-primary"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="text-xs font-semibold text-base-content/70 flex items-center gap-1 mb-1.5">
              <BsGeoAltFill size={12} className="text-primary" /> Location
              (optional)
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Add location or link"
              className="input input-bordered input-sm w-full rounded-xl focus:outline-primary"
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-base-content/70 flex items-center gap-1 mb-1.5">
              <BsTextParagraph size={12} className="text-primary" /> Description
              (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details about the event…"
              rows={3}
              className="textarea textarea-bordered textarea-sm w-full rounded-xl focus:outline-primary resize-none text-xs"
              maxLength={300}
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex justify-end gap-2 border-t border-base-200">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-sm btn-ghost rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="btn btn-sm btn-primary rounded-xl px-5"
            >
              {isSubmitting ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                "Send Event"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventModal;
