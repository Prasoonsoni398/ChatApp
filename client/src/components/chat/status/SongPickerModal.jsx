import { useState, useRef, useEffect } from "react";
import {
  BsX,
  BsMusicNoteBeamed,
  BsPlayFill,
  BsPauseFill,
  BsUpload,
  BsCheck2,
} from "react-icons/bs";
import toast from "react-hot-toast";
import {
  PRESET_SONGS,
  playStatusTrack,
  stopStatusTrack,
} from "../../../utils/statusMusic.js";

const SongPickerModal = ({ isOpen, onClose, onSelectSong }) => {
  const [playingId, setPlayingId] = useState(null);
  const [customAudioFile, setCustomAudioFile] = useState(null);
  const [customTitle, setCustomTitle] = useState("");
  const [customArtist, setCustomArtist] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      stopStatusTrack();
    };
  }, []);

  if (!isOpen) return null;

  const handleTogglePlay = (song) => {
    if (playingId === song.id) {
      stopStatusTrack();
      setPlayingId(null);
    } else {
      playStatusTrack(song);
      setPlayingId(song.id);
    }
  };

  const handleSelectPreset = (song) => {
    stopStatusTrack();
    onSelectSong({
      title: song.title,
      artist: song.artist,
      audioUrl: song.audioUrl,
    });
    onClose();
  };

  const handleCustomFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Audio files cannot exceed 5MB.");
      e.target.value = "";
      return;
    }

    setCustomAudioFile(file);
    const cleanName = file.name.replace(/\.[^/.]+$/, "");
    setCustomTitle(cleanName);
    setCustomArtist("My Track");
    e.target.value = "";
  };

  const handleConfirmCustomAudio = () => {
    if (!customAudioFile) return;
    stopStatusTrack();
    onSelectSong({
      title: customTitle.trim() || customAudioFile.name,
      artist: customArtist.trim() || "Custom Audio",
      audioFile: customAudioFile,
      audioUrl: URL.createObjectURL(customAudioFile),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-10001 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md bg-base-100 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-base-300">
        {/* Header */}
        <div className="px-5 py-4 border-b border-base-200 flex items-center justify-between bg-base-200/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
              <BsMusicNoteBeamed size={16} />
            </div>
            <h3 className="font-semibold text-base">Add Music to Status</h3>
          </div>
          <button
            type="button"
            onClick={() => {
              stopStatusTrack();
              onClose();
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-base-content/70 hover:text-base-content hover:bg-base-200 transition-colors cursor-pointer"
          >
            <BsX size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Custom Upload Button */}
          <div className="bg-primary/5 rounded-2xl p-3.5 border border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                Upload From Device (Max 5MB)
              </span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-xs btn-primary gap-1.5"
              >
                <BsUpload size={12} /> Choose Audio
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
                className="hidden"
                onChange={handleCustomFileChange}
              />
            </div>

            {customAudioFile ? (
              <div className="space-y-2 mt-2 pt-2 border-t border-primary/10">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="Track Title"
                    className="input input-bordered input-xs rounded-lg"
                  />
                  <input
                    type="text"
                    value={customArtist}
                    onChange={(e) => setCustomArtist(e.target.value)}
                    placeholder="Artist"
                    className="input input-bordered input-xs rounded-lg"
                  />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-base-content/60 truncate max-w-[200px]">
                    {customAudioFile.name} (
                    {(customAudioFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                  <button
                    type="button"
                    onClick={handleConfirmCustomAudio}
                    className="btn btn-xs btn-success text-white gap-1"
                  >
                    <BsCheck2 size={13} /> Attach
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-base-content/50">
                Pick your own song or voice track (strictly up to 5MB)
              </p>
            )}
          </div>

          {/* Preset Songs List */}
          <div>
            <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-2">
              Popular Tracks
            </h4>
            <div className="space-y-2">
              {PRESET_SONGS.map((song) => {
                const isPlaying = playingId === song.id;
                return (
                  <div
                    key={song.id}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-base-200/50 hover:bg-base-200 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleTogglePlay(song)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-95 ${
                          isPlaying
                            ? "bg-primary text-primary-content"
                            : "bg-base-300 text-base-content hover:bg-primary/20 hover:text-primary"
                        }`}
                        title={isPlaying ? "Pause" : "Preview"}
                      >
                        {isPlaying ? (
                          <BsPauseFill size={18} />
                        ) : (
                          <BsPlayFill size={18} className="ml-0.5" />
                        )}
                      </button>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">
                          {song.title}
                        </p>
                        <p className="text-[10px] text-base-content/60 truncate">
                          {song.artist} • {song.genre}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelectPreset(song)}
                      className="btn btn-xs btn-ghost text-primary hover:bg-primary/10 ml-2"
                    >
                      Use
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SongPickerModal;
