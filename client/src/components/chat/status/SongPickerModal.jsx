import { useState, useRef, useEffect } from "react";
import {
  BsX,
  BsMusicNoteBeamed,
  BsPlayFill,
  BsPauseFill,
  BsUpload,
  BsCheck2,
  BsSearch,
  BsSliders,
  BsArrowCounterclockwise,
} from "react-icons/bs";
import toast from "react-hot-toast";
import {
  PRESET_GENRES,
  PRESET_SONGS,
  formatTimestamp,
  playStatusTrack,
  stopStatusTrack,
} from "../../../utils/statusMusic.js";

const DEFAULT_PORTION_DURATION = 15; // 15 seconds portion default per PRD

const SongPickerModal = ({ isOpen, onClose, onSelectSong, initialSong = null }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [activeSong, setActiveSong] = useState(initialSong || null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Portion Selector State (PRD Section 20)
  const [portionStart, setPortionStart] = useState(initialSong?.startTime || 0);
  const [portionEnd, setPortionEnd] = useState(
    initialSong?.endTime || DEFAULT_PORTION_DURATION,
  );
  const [songVolume, setSongVolume] = useState(
    initialSong?.volume !== undefined ? initialSong.volume : 0.85,
  );

  // Custom Audio State
  const [customAudioFile, setCustomAudioFile] = useState(null);
  const [customTitle, setCustomTitle] = useState("");
  const [customArtist, setCustomArtist] = useState("");
  const [customDuration, setCustomDuration] = useState(60);
  const customAudioUrlRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && initialSong) {
      setActiveSong(initialSong);
      setPortionStart(initialSong.startTime || 0);
      setPortionEnd(initialSong.endTime || (initialSong.startTime || 0) + DEFAULT_PORTION_DURATION);
      if (initialSong.volume !== undefined) setSongVolume(initialSong.volume);
    }
  }, [isOpen, initialSong]);

  useEffect(() => {
    return () => {
      stopStatusTrack();
      if (customAudioUrlRef.current) {
        URL.revokeObjectURL(customAudioUrlRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  const totalDuration = activeSong?.duration || 60;
  const currentLength = Math.max(1, portionEnd - portionStart);

  const handleTogglePlay = (song) => {
    if (activeSong?.id === song.id && isPlaying) {
      stopStatusTrack();
      setIsPlaying(false);
    } else {
      setActiveSong(song);
      const sStart = activeSong?.id === song.id ? portionStart : 0;
      const sEnd =
        activeSong?.id === song.id
          ? portionEnd
          : Math.min(song.duration || 60, DEFAULT_PORTION_DURATION);

      setPortionStart(sStart);
      setPortionEnd(sEnd);

      playStatusTrack(song, {
        startTime: sStart,
        endTime: sEnd,
        volume: songVolume,
      });
      setIsPlaying(true);
    }
  };

  const handlePlayPortionPreview = () => {
    if (!activeSong) return;
    if (isPlaying) {
      stopStatusTrack();
      setIsPlaying(false);
    } else {
      playStatusTrack(activeSong, {
        startTime: portionStart,
        endTime: portionEnd,
        volume: songVolume,
      });
      setIsPlaying(true);
    }
  };

  const handleCustomFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Audio files cannot exceed 5MB.");
      e.target.value = "";
      return;
    }

    if (customAudioUrlRef.current) {
      URL.revokeObjectURL(customAudioUrlRef.current);
      customAudioUrlRef.current = null;
    }
    stopStatusTrack();
    setIsPlaying(false);

    const blobUrl = URL.createObjectURL(file);
    customAudioUrlRef.current = blobUrl;
    setCustomAudioFile(file);

    const cleanName = file.name.replace(/\.[^/.]+$/, "");
    setCustomTitle(cleanName);
    setCustomArtist("My Track");

    // Detect actual audio duration
    const tempAudio = new Audio(blobUrl);
    tempAudio.addEventListener("loadedmetadata", () => {
      const dur = Math.round(tempAudio.duration) || 60;
      setCustomDuration(dur);
      const newCustomSong = {
        id: "custom:" + Date.now(),
        title: cleanName,
        artist: "My Track",
        genre: "Custom",
        duration: dur,
        audioFile: file,
        audioUrl: blobUrl,
      };
      setActiveSong(newCustomSong);
      setPortionStart(0);
      setPortionEnd(Math.min(dur, DEFAULT_PORTION_DURATION));
    });

    e.target.value = "";
  };

  const handleConfirmSelection = () => {
    if (!activeSong) {
      toast.error("Please select a song first");
      return;
    }

    stopStatusTrack();
    onSelectSong({
      title: customAudioFile ? customTitle.trim() || activeSong.title : activeSong.title,
      artist: customAudioFile ? customArtist.trim() || activeSong.artist : activeSong.artist,
      audioUrl: activeSong.audioUrl,
      audioFile: customAudioFile || undefined,
      duration: activeSong.duration || customDuration,
      startTime: portionStart,
      endTime: portionEnd,
      volume: songVolume,
    });
    onClose();
  };

  // Filter songs
  const filteredSongs = PRESET_SONGS.filter((s) => {
    const matchesGenre = selectedGenre === "All" || s.genre.toLowerCase() === selectedGenre.toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !query ||
      s.title.toLowerCase().includes(query) ||
      s.artist.toLowerCase().includes(query) ||
      s.genre.toLowerCase().includes(query);
    return matchesGenre && matchesQuery;
  });

  return (
    <div className="fixed inset-0 z-10001 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in select-none">
      <div className="w-full max-w-xl bg-[#111B21] text-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/10">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-[#202C33]/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#25D366]/20 text-[#25D366] flex items-center justify-center shadow-xs">
              <BsMusicNoteBeamed size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-white leading-tight">Music Library</h3>
              <p className="text-[11px] text-[#8696A0] mt-0.5">Search, preview & trim music segment</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopStatusTrack();
              onClose();
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <BsX size={22} />
          </button>
        </div>

        {/* Search Bar & Custom Upload */}
        <div className="p-4 border-b border-white/10 space-y-3 bg-[#111B21]">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <BsSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8696A0]" size={14} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search songs, artists, genres…"
                className="w-full bg-[#202C33] border border-white/10 text-white placeholder-[#8696A0] rounded-xl pl-9 pr-8 py-2 text-xs focus:outline-none focus:border-[#25D366] transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  <BsX size={16} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#25D366]/50 text-[#25D366] hover:bg-[#25D366]/15 text-xs font-medium transition-colors cursor-pointer flex-shrink-0"
              title="Upload your own song (max 5MB)"
            >
              <BsUpload size={12} /> <span className="hidden sm:inline">Upload</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
              className="hidden"
              onChange={handleCustomFileChange}
            />
          </div>

          {/* Genre Chips (PRD Section 18) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {PRESET_GENRES.map((genre) => (
              <button
                key={genre}
                type="button"
                onClick={() => setSelectedGenre(genre)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  selectedGenre === genre
                    ? "bg-[#25D366] text-black font-semibold shadow-sm shadow-[#25D366]/20 scale-105"
                    : "bg-[#202C33] hover:bg-[#2A3942] text-white/80"
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-[#111B21]">
          {/* Custom Uploaded Card if exists */}
          {customAudioFile && (
            <div className="bg-[#25D366]/10 border border-[#25D366]/30 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="badge badge-success badge-xs uppercase font-mono tracking-wider text-black font-bold">
                  Custom Audio Upload
                </span>
                <span className="text-[11px] text-[#8696A0]">
                  {(customAudioFile.size / (1024 * 1024)).toFixed(2)} MB
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Song Title"
                  className="bg-[#202C33] border border-white/10 rounded-lg text-xs px-2.5 py-1 text-white focus:outline-none focus:border-[#25D366]"
                />
                <input
                  type="text"
                  value={customArtist}
                  onChange={(e) => setCustomArtist(e.target.value)}
                  placeholder="Artist"
                  className="bg-[#202C33] border border-white/10 rounded-lg text-xs px-2.5 py-1 text-white focus:outline-none focus:border-[#25D366]"
                />
              </div>
            </div>
          )}

          {/* Songs List */}
          <div className="space-y-2">
            {filteredSongs.length === 0 ? (
              <div className="text-center py-8 text-[#8696A0] text-xs">
                No songs matching "{searchQuery}" in {selectedGenre}.
              </div>
            ) : (
              filteredSongs.map((song) => {
                const isSelected = activeSong?.id === song.id;
                const isCurrentlyPlaying = isSelected && isPlaying;
                return (
                  <div
                    key={song.id}
                    onClick={() => handleTogglePlay(song)}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#25D366]/15 border-[#25D366]/50 shadow-sm"
                        : "bg-[#202C33]/70 hover:bg-[#202C33] border-white/5 hover:border-white/15"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${song.color || "from-emerald-500 to-teal-700"} text-white flex items-center justify-center shadow-md flex-shrink-0 relative overflow-hidden`}
                      >
                        <button
                          type="button"
                          className="w-full h-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95 text-white"
                        >
                          {isCurrentlyPlaying ? (
                            <BsPauseFill size={20} />
                          ) : (
                            <BsPlayFill size={20} className="ml-0.5" />
                          )}
                        </button>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-white truncate leading-tight">
                          {song.title}
                        </p>
                        <p className="text-[11px] text-[#8696A0] truncate mt-0.5">
                          {song.artist} • {song.genre} • {formatTimestamp(song.duration)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      {isSelected ? (
                        <span className="bg-[#25D366] text-black font-bold text-xs px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                          <BsCheck2 size={13} /> Selected
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTogglePlay(song);
                          }}
                          className="text-[#25D366] hover:bg-[#25D366]/15 font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          Preview
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── SONG PORTION SELECTOR (PRD Section 20) ── */}
        {activeSong && (
          <div className="p-4 bg-[#202C33] border-t border-white/10 space-y-3 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <BsSliders className="text-[#25D366]" /> Song Portion
                </span>
                <span className="text-[11px] text-[#8696A0]">
                  {formatTimestamp(portionStart)} – {formatTimestamp(portionEnd)} ({currentLength}s)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPortionStart(0);
                    setPortionEnd(Math.min(totalDuration, DEFAULT_PORTION_DURATION));
                  }}
                  className="text-white/60 hover:text-white text-[11px] flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  title="Reset to beginning"
                >
                  <BsArrowCounterclockwise size={11} /> Reset
                </button>
                <button
                  type="button"
                  onClick={handlePlayPortionPreview}
                  className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition-all active:scale-95 cursor-pointer ${
                    isPlaying
                      ? "bg-amber-400 text-black hover:bg-amber-300"
                      : "bg-[#25D366] text-black hover:bg-[#1EBE5D]"
                  }`}
                >
                  {isPlaying ? <BsPauseFill size={13} /> : <BsPlayFill size={13} />}
                  <span>{isPlaying ? "Pause" : "Test Portion"}</span>
                </button>
              </div>
            </div>

            {/* Range Slider for Portion Start & End */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] text-[#8696A0] font-mono">
                <span>00:00</span>
                <span>Portion: {currentLength} sec</span>
                <span>{formatTimestamp(totalDuration)}</span>
              </div>

              <div className="relative pt-1 pb-1">
                <input
                  type="range"
                  min={0}
                  max={Math.max(1, totalDuration - 5)}
                  value={portionStart}
                  onChange={(e) => {
                    const newStart = Number(e.target.value);
                    setPortionStart(newStart);
                    if (newStart >= portionEnd) {
                      setPortionEnd(Math.min(totalDuration, newStart + DEFAULT_PORTION_DURATION));
                    }
                  }}
                  className="w-full accent-[#25D366] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1 text-white/80">
                <div className="flex items-center gap-1.5">
                  <span className="text-[#8696A0]">Start:</span>
                  <input
                    type="number"
                    min={0}
                    max={totalDuration - 1}
                    value={portionStart}
                    onChange={(e) => {
                      const val = Math.max(0, Math.min(totalDuration - 1, Number(e.target.value)));
                      setPortionStart(val);
                      if (val >= portionEnd) setPortionEnd(Math.min(totalDuration, val + 5));
                    }}
                    className="w-14 bg-[#111B21] border border-white/20 text-white text-center rounded-lg font-mono text-xs py-0.5 focus:border-[#25D366] focus:outline-none"
                  />
                  <span className="text-[#8696A0]">s</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[#8696A0]">End:</span>
                  <input
                    type="number"
                    min={portionStart + 1}
                    max={totalDuration}
                    value={portionEnd}
                    onChange={(e) => {
                      const val = Math.max(portionStart + 1, Math.min(totalDuration, Number(e.target.value)));
                      setPortionEnd(val);
                    }}
                    className="w-14 bg-[#111B21] border border-white/20 text-white text-center rounded-lg font-mono text-xs py-0.5 focus:border-[#25D366] focus:outline-none"
                  />
                  <span className="text-[#8696A0]">s</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[#8696A0]">Vol:</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={songVolume}
                    onChange={(e) => setSongVolume(Number(e.target.value))}
                    className="w-18 accent-[#25D366] cursor-pointer"
                  />
                  <span className="font-mono text-[10px] text-white/70 w-7">
                    {Math.round(songVolume * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-white/10 bg-[#111B21] flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              stopStatusTrack();
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirmSelection}
            disabled={!activeSong}
            className="flex items-center gap-1.5 px-6 py-2 rounded-full bg-[#25D366] hover:bg-[#1EBE5D] text-black font-bold text-xs sm:text-sm shadow-lg shadow-[#25D366]/25 transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <BsCheck2 size={16} className="stroke-[1.5]" />
            <span>Use This Song</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SongPickerModal;
