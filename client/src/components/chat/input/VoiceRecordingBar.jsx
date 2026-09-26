import { BsFillSendFill } from "react-icons/bs";
import RemoveActionButton from "../../common/RemoveActionButton.jsx";

const VoiceRecordingBar = ({ voiceRecorder, onStopAndSend }) => {
  if (!voiceRecorder.isRecording) return null;

  return (
    <div className="flex items-center justify-between gap-3 py-1 animate-fade-in bg-base-200/80 px-4 rounded-2xl border border-primary/20">
      <div className="flex items-center gap-3">
        <span className="w-3 h-3 rounded-full bg-error animate-ping"></span>
        <span className="text-sm font-semibold text-error">
          {voiceRecorder.formattedTime}
        </span>
        <span className="text-xs text-base-content/60 hidden sm:inline">
          Recording audio note…
        </span>
      </div>

      <div className="flex items-center gap-2">
        <RemoveActionButton
          onClick={voiceRecorder.cancelRecording}
          size="sm"
          label="Cancel"
          title="Cancel recording"
        />
        <button
          type="button"
          onClick={onStopAndSend}
          className="btn btn-sm btn-primary rounded-xl gap-1 shadow-sm"
          title="Send voice note"
        >
          <BsFillSendFill size={14} />
          <span>Send</span>
        </button>
      </div>
    </div>
  );
};

export default VoiceRecordingBar;
