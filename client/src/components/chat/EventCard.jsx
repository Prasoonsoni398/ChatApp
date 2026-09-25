import { useState } from "react";
import {
  BsCalendarEventFill,
  BsClockFill,
  BsGeoAltFill,
  BsCheckCircleFill,
  BsQuestionCircleFill,
  BsXCircleFill,
} from "react-icons/bs";

/**
 * EventCard – Interactive GuftguGroup Event Bubble (PRD Section 47).
 * Displays date badge, title, location, description, and interactive response buttons (Going / Maybe / Not Going).
 */
const EventCard = ({ message, loggedInUser, onRespond }) => {
  const event = message.event;
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!event) return null;

  const responses = event.responses || [];
  const myResponse = responses.find(
    (r) => String(r.userId?._id || r.userId) === String(loggedInUser?._id),
  )?.status;

  const goingCount = responses.filter((r) => r.status === "going").length;
  const maybeCount = responses.filter((r) => r.status === "maybe").length;
  const notGoingCount = responses.filter(
    (r) => r.status === "not_going",
  ).length;

  const eventDate = new Date(event.startDate || Date.now());
  const monthStr = eventDate
    .toLocaleDateString([], { month: "short" })
    .toUpperCase();
  const dayStr = eventDate.getDate();

  const handleSelectStatus = async (status) => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      await onRespond?.(message._id, status);
    } catch (_err) {
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-sm rounded-2xl bg-base-100/90 border border-base-300 shadow-sm overflow-hidden my-1">
      {/* Event Header Banner */}
      <div className="p-3.5 flex items-start gap-3 bg-base-200/40 border-b border-base-200">
        {/* Calendar Badge */}
        <div className="w-12 h-14 rounded-xl bg-primary text-primary-content flex flex-col items-center justify-center flex-shrink-0 shadow-sm overflow-hidden">
          <span className="text-[10px] font-bold tracking-wider leading-none uppercase bg-black/20 w-full text-center py-0.5">
            {monthStr}
          </span>
          <span className="text-xl font-extrabold leading-none my-auto">
            {dayStr}
          </span>
        </div>

        {/* Title & Details */}
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm text-base-content leading-snug truncate">
            {event.title}
          </h4>

          <div className="flex items-center gap-1.5 text-xs text-base-content/70 mt-1">
            <BsClockFill size={11} className="text-primary flex-shrink-0" />
            <span>
              {event.startDate}
              {event.startTime ? ` at ${event.startTime}` : ""}
            </span>
          </div>

          {event.location && (
            <div className="flex items-center gap-1.5 text-xs text-base-content/70 mt-0.5">
              <BsGeoAltFill size={11} className="text-primary flex-shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {event.description && (
        <div className="px-3.5 py-2 text-xs text-base-content/80 border-b border-base-200">
          <p className="whitespace-pre-wrap">{event.description}</p>
        </div>
      )}

      {/* Attendance Stats */}
      <div className="px-3.5 py-2 text-[11px] text-base-content/60 flex items-center justify-between bg-base-200/20 border-b border-base-200">
        <span>
          {goingCount} {goingCount === 1 ? "person going" : "people going"}
          {maybeCount > 0 ? ` • ${maybeCount} maybe` : ""}
        </span>
        {notGoingCount > 0 && <span>{notGoingCount} can't go</span>}
      </div>

      {/* Response Action Buttons */}
      <div className="p-2 grid grid-cols-3 gap-1.5 bg-base-100">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => handleSelectStatus("going")}
          className={`btn btn-xs rounded-xl flex items-center gap-1 transition-all ${
            myResponse === "going"
              ? "btn-primary shadow-xs font-bold"
              : "btn-ghost text-base-content/70 hover:bg-base-200"
          }`}
        >
          <BsCheckCircleFill size={11} /> Going
        </button>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => handleSelectStatus("maybe")}
          className={`btn btn-xs rounded-xl flex items-center gap-1 transition-all ${
            myResponse === "maybe"
              ? "btn-warning shadow-xs font-bold text-warning-content"
              : "btn-ghost text-base-content/70 hover:bg-base-200"
          }`}
        >
          <BsQuestionCircleFill size={11} /> Maybe
        </button>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => handleSelectStatus("not_going")}
          className={`btn btn-xs rounded-xl flex items-center gap-1 transition-all ${
            myResponse === "not_going"
              ? "btn-neutral shadow-xs font-bold"
              : "btn-ghost text-base-content/70 hover:bg-base-200"
          }`}
        >
          <BsXCircleFill size={11} /> Can't Go
        </button>
      </div>
    </div>
  );
};

export default EventCard;
