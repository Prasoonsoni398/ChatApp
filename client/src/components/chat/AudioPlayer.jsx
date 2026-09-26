import { useState, useRef, useEffect } from "react";
import {
  BsPlayFill,
  BsPauseFill,
  BsMicFill,
  BsMusicNoteBeamed,
} from "react-icons/bs";

const AudioPlayer = ({
  src,
  isVoice = false,
  initialDuration = 0,
  isMe = false,
}) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 0);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => {
      if (
        audio.duration &&
        !isNaN(audio.duration) &&
        isFinite(audio.duration)
      ) {
        setDuration(audio.duration);
      }
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => console.error("Audio playback error:", e));
    }
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio) return;
    const seekTime = Number(e.target.value);
    audio.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const cyclePlaybackRate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const rates = [1, 1.5, 2];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const newRate = rates[nextIdx];
    audio.playbackRate = newRate;
    setPlaybackRate(newRate);
  };

  const formatTime = (secs) => {
    if (!secs || isNaN(secs) || !isFinite(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div
      className={`flex items-center gap-2.5 p-2 rounded-2xl min-w-[220px] max-w-[280px] sm:max-w-[320px] ${
        isMe ? "bg-black/5" : "bg-base-200/70"
      }`}
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className="w-10 h-10 rounded-full bg-primary text-primary-content flex items-center justify-center flex-shrink-0 shadow-sm hover:scale-105 active:scale-95 transition-transform"
      >
        {isPlaying ? (
          <BsPauseFill size={22} />
        ) : (
          <BsPlayFill size={22} className="ml-0.5" />
        )}
      </button>

      {/* Waveform / Scrubber & Time */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
        <input
          type="range"
          min="0"
          max={duration || 100}
          step="0.1"
          value={currentTime}
          onChange={handleSeek}
          className="range range-xs range-primary w-full h-1 cursor-pointer accent-primary"
        />

        <div className="flex justify-between items-center text-[11px] opacity-70">
          <span>{formatTime(currentTime || duration)}</span>
          <div className="flex items-center gap-1">
            {isVoice ? (
              <BsMicFill size={10} className="text-primary" />
            ) : (
              <BsMusicNoteBeamed size={10} />
            )}
            <span>{isVoice ? "Voice message" : "Audio"}</span>
          </div>
        </div>
      </div>

      {/* Speed Button (1x, 1.5x, 2x) */}
      <button
        type="button"
        onClick={cyclePlaybackRate}
        className="px-2 py-0.5 rounded-full bg-base-100/80 hover:bg-base-100 text-[10px] font-bold shadow-xs transition-colors flex-shrink-0"
        title="Playback speed"
      >
        {playbackRate}x
      </button>
    </div>
  );
};

export default AudioPlayer;
