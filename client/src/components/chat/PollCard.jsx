import { useState } from "react";
import {
  BsCheckCircleFill,
  BsCircle,
  BsCheckSquareFill,
  BsSquare,
} from "react-icons/bs";
import toast from "react-hot-toast";
import * as messageService from "../../services/messageService.js";
import socketAPI from "../../config/webSocket.js";

/**
 * PollCard – WhatsApp-style interactive Poll widget inside message bubbles (PRD Section 47).
 */
const PollCard = ({ message, loggedInUser, selectedChat }) => {
  const poll = message.poll;
  const [localPoll, setLocalPoll] = useState(poll);
  const [isVoting, setIsVoting] = useState(false);

  // Sync if prop updates from outside (socket)
  if (poll && (!localPoll || message.updatedAt !== localPoll.updatedAt)) {
    // Keep local in sync
  }

  if (!poll) return null;

  const currentPoll = localPoll || poll;
  const allowMultiple = currentPoll.allowMultipleAnswers;
  const myId = loggedInUser?._id?.toString();

  // Calculate total votes across all options
  const totalVotes = currentPoll.options.reduce(
    (acc, opt) => acc + (opt.votes?.length || 0),
    0,
  );

  const handleVote = async (optionIndex) => {
    if (isVoting) return;
    setIsVoting(true);

    // Optimistic local update
    const updatedOptions = currentPoll.options.map((opt, idx) => {
      const votes = Array.isArray(opt.votes) ? [...opt.votes] : [];
      const hasVoted = votes.some((v) => (v?._id || v)?.toString() === myId);

      if (!allowMultiple) {
        // Clear all votes for me
        const filtered = votes.filter(
          (v) => (v?._id || v)?.toString() !== myId,
        );
        if (idx === optionIndex && !hasVoted) {
          filtered.push(myId);
        }
        return { ...opt, votes: filtered };
      } else {
        // Toggle for this option
        if (idx === optionIndex) {
          const newVotes = hasVoted
            ? votes.filter((v) => (v?._id || v)?.toString() !== myId)
            : [...votes, myId];
          return { ...opt, votes: newVotes };
        }
        return opt;
      }
    });

    const optimisticPoll = { ...currentPoll, options: updatedOptions };
    setLocalPoll(optimisticPoll);

    try {
      const updatedMsg = await messageService.votePoll(
        message._id,
        optionIndex,
      );
      if (updatedMsg?.poll) {
        setLocalPoll(updatedMsg.poll);
        socketAPI.emit("pollVote", {
          messageId: message._id,
          poll: updatedMsg.poll,
          groupId: selectedChat?.isGroup ? selectedChat.id : null,
          receiverId: !selectedChat?.isGroup ? selectedChat?.id : null,
          senderId: myId,
        });
      }
    } catch (_err) {
      toast.error("Failed to record vote");
      setLocalPoll(poll); // Revert
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="w-full max-w-sm rounded-xl overflow-hidden py-1">
      {/* Poll Header */}
      <div className="mb-3">
        <h4 className="font-bold text-[15px] text-base-content leading-snug wrap-bread-word">
          {currentPoll.question}
        </h4>
        <p className="text-[11px] text-base-content/60 mt-0.5 flex items-center gap-1.5">
          <span>{allowMultiple ? "Select one or more" : "Select one"}</span>
        </p>
      </div>

      {/* Options List */}
      <div className="space-y-2">
        {currentPoll.options.map((opt, idx) => {
          const voteCount = opt.votes?.length || 0;
          const percentage =
            totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          const isSelected = opt.votes?.some(
            (v) => (v?._id || v)?.toString() === myId,
          );

          return (
            <div
              key={idx}
              onClick={() => handleVote(idx)}
              className={`relative overflow-hidden rounded-xl border p-2.5 cursor-pointer transition-all duration-150 select-none ${
                isSelected
                  ? "border-primary bg-primary/10"
                  : "border-base-300 hover:bg-base-200/50"
              }`}
            >
              {/* Progress bar fill */}
              {totalVotes > 0 && (
                <div
                  className={`absolute left-0 top-0 bottom-0 transition-all duration-300 pointer-events-none ${
                    isSelected ? "bg-primary/25" : "bg-base-300/40"
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              )}

              {/* Option row content */}
              <div className="relative z-10 flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {/* Radio / Checkbox Indicator */}
                  <span className="flex-shrink-0 text-primary">
                    {allowMultiple ? (
                      isSelected ? (
                        <BsCheckSquareFill size={18} />
                      ) : (
                        <BsSquare size={18} className="text-base-content/40" />
                      )
                    ) : isSelected ? (
                      <BsCheckCircleFill size={18} />
                    ) : (
                      <BsCircle size={18} className="text-base-content/40" />
                    )}
                  </span>
                  <span
                    className={`text-sm wrap-break-word ${
                      isSelected
                        ? "font-semibold text-base-content"
                        : "text-base-content"
                    }`}
                  >
                    {opt.text}
                  </span>
                </div>

                {/* Vote percentage & count */}
                <div className="flex-shrink-0 flex items-center gap-1.5 text-xs text-base-content/70 font-medium">
                  {voteCount > 0 && <span>{voteCount}</span>}
                  {totalVotes > 0 && (
                    <span className="text-[11px] opacity-60">
                      ({percentage}%)
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Total */}
      <div className="mt-2.5 pt-1.5 border-t border-base-200/60 flex items-center justify-between text-[11px] text-base-content/50">
        <span>
          {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
        </span>
      </div>
    </div>
  );
};

export default PollCard;
