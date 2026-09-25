import { useState } from "react";
import { BsX, BsPlus, BsTrash, BsBarChartLineFill } from "react-icons/bs";
import toast from "react-hot-toast";
import RemoveActionButton from "../common/RemoveActionButton.jsx";
import ToggleSwitch from "../common/ToggleSwitch.jsx";

/**
 * CreatePollModal – Guftgumodal for creating a poll (PRD Section 47).
 */
const CreatePollModal = ({ isOpen, onClose, onCreatePoll }) => {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [allowMultipleAnswers, setAllowMultipleAnswers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleOptionChange = (idx, value) => {
    const updated = [...options];
    updated[idx] = value;
    setOptions(updated);
  };

  const handleAddOption = () => {
    if (options.length >= 12) {
      toast.error("Maximum 12 options allowed");
      return;
    }
    setOptions([...options, ""]);
  };

  const handleRemoveOption = (idx) => {
    if (options.length <= 2) {
      toast.error("At least 2 options are required");
      return;
    }
    setOptions(options.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) {
      toast.error("Please enter a question");
      return;
    }

    const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
    if (cleanOptions.length < 2) {
      toast.error("Please provide at least 2 options");
      return;
    }

    try {
      setIsSubmitting(true);
      await onCreatePoll({
        question: question.trim(),
        options: cleanOptions,
        allowMultipleAnswers,
      });
      // Reset
      setQuestion("");
      setOptions(["", ""]);
      setAllowMultipleAnswers(false);
      onClose();
    } catch (_err) {
      // error handled in parent
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
              <BsBarChartLineFill size={16} />
            </div>
            <h3 className="font-bold text-lg">Create a Poll</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-base-content/70 hover:text-base-content hover:bg-base-200 transition-colors cursor-pointer"
          >
            <BsX size={22} />
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-5 space-y-4"
        >
          {/* Question */}
          <div>
            <label className="text-xs font-semibold text-base-content/70 uppercase tracking-wider block mb-1.5">
              Question
            </label>
            <input
              type="text"
              autoFocus
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question…"
              className="input input-bordered w-full rounded-xl bg-base-200 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Options */}
          <div>
            <label className="text-xs font-semibold text-base-content/70 uppercase tracking-wider block mb-1.5">
              Options
            </label>
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`Option ${idx + 1}`}
                    className="input input-sm input-bordered flex-1 rounded-lg bg-base-200 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  {options.length > 2 && (
                    <RemoveActionButton
                      onClick={() => handleRemoveOption(idx)}
                      variant="circle"
                      size="xs"
                      title="Remove option"
                    />
                  )}
                </div>
              ))}
            </div>

            {options.length < 12 && (
              <button
                type="button"
                onClick={handleAddOption}
                className="btn btn-ghost btn-sm text-primary gap-1.5 mt-2 px-2 hover:bg-primary/10 rounded-lg text-xs"
              >
                <BsPlus size={18} />
                <span>Add option</span>
              </button>
            )}
          </div>

          {/* Multiple answers toggle */}
          <div className="pt-2 border-t border-base-200 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Allow multiple answers</p>
              <p className="text-xs text-base-content/50">
                Voters can select more than one option
              </p>
            </div>
            <ToggleSwitch
              checked={allowMultipleAnswers}
              onChange={(val) => setAllowMultipleAnswers(val)}
              size="sm"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-3 flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-sm btn-ghost rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-sm btn-primary rounded-xl px-5"
            >
              {isSubmitting ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                "Create Poll"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePollModal;
