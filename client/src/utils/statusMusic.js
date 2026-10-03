/**
 * statusMusic.js
 * Comprehensive GuftguStatus Music Engine.
 * Features:
 * - Curated preset catalog with genre categorization (Trending, Chill, Acoustic, Electronic, Travel, etc.)
 * - Web Audio API synthesizer for offline harmonic playback
 * - Song portion playback (startTime, endTime loop)
 * - Volume control for live audio mixing with video
 */

export const PRESET_GENRES = [
  "All",
  "Trending",
  "Chill",
  "Acoustic",
  "Electronic",
  "Travel",
  "Party",
  "Classical",
];

export const PRESET_SONGS = [
  {
    id: "preset:sunset",
    title: "Sunset Memories",
    artist: "Lofi Dreamer",
    genre: "Chill",
    duration: 60,
    color: "from-amber-500 to-rose-500",
    audioUrl: "preset:sunset",
  },
  {
    id: "preset:trending",
    title: "Midnight Vibes",
    artist: "Echo Beats",
    genre: "Trending",
    duration: 75,
    color: "from-emerald-500 to-teal-600",
    audioUrl: "preset:trending",
  },
  {
    id: "preset:acoustic",
    title: "Morning Sunshine",
    artist: "Acoustic Journey",
    genre: "Acoustic",
    duration: 90,
    color: "from-orange-400 to-amber-600",
    audioUrl: "preset:acoustic",
  },
  {
    id: "preset:neon",
    title: "Neon City Lights",
    artist: "Synthwave Pulse",
    genre: "Electronic",
    duration: 80,
    color: "from-fuchsia-600 to-indigo-600",
    audioUrl: "preset:neon",
  },
  {
    id: "preset:travel",
    title: "Mountain Highway",
    artist: "Wanderlust Crew",
    genre: "Travel",
    duration: 65,
    color: "from-cyan-500 to-blue-600",
    audioUrl: "preset:travel",
  },
  {
    id: "preset:breeze",
    title: "Summer Ocean Breeze",
    artist: "Tropical Chill",
    genre: "Party",
    duration: 70,
    color: "from-teal-400 to-emerald-600",
    audioUrl: "preset:breeze",
  },
  {
    id: "preset:golden",
    title: "Golden Hour Glow",
    artist: "Piano Reflections",
    genre: "Classical",
    duration: 85,
    color: "from-yellow-400 to-amber-500",
    audioUrl: "preset:golden",
  },
  {
    id: "preset:party",
    title: "Festival Energy",
    artist: "Bass Horizon",
    genre: "Party",
    duration: 60,
    color: "from-violet-600 to-pink-600",
    audioUrl: "preset:party",
  },
];

let activeAudioElement = null;
let activeSynthInterval = null;
let activeSynthTimer = null;
let synthAudioCtx = null;
let currentTrackingInterval = null;

export const formatTimestamp = (seconds) => {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

const getSynthContext = () => {
  if (!synthAudioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) synthAudioCtx = new AudioCtx();
  }
  if (synthAudioCtx && synthAudioCtx.state === "suspended") {
    synthAudioCtx.resume().catch(() => { });
  }
  return synthAudioCtx;
};

/**
 * Play melodic synth chords for presets, respecting start/end portion and volume
 */
const playPresetMelody = (presetId, options = {}) => {
  stopStatusTrack();
  const ctx = getSynthContext();
  if (!ctx) return;

  const notesByPreset = {
    "preset:sunset": [261.63, 329.63, 392.0, 493.88, 392.0, 329.63],
    "preset:trending": [293.66, 369.99, 440.0, 554.37, 440.0, 369.99],
    "preset:acoustic": [220.0, 277.18, 329.63, 440.0, 329.63, 277.18],
    "preset:neon": [146.83, 220.0, 293.66, 349.23, 440.0, 349.23],
    "preset:travel": [196.0, 246.94, 293.66, 392.0, 293.66, 246.94],
    "preset:breeze": [174.61, 220.0, 261.63, 349.23, 392.0, 261.63],
    "preset:golden": [261.63, 329.63, 392.0, 523.25, 659.25, 523.25],
    "preset:party": [130.81, 196.0, 261.63, 329.63, 392.0, 523.25],
  };

  const notes = notesByPreset[presetId] || notesByPreset["preset:sunset"];
  const volume =
    typeof options.volume === "number"
      ? Math.max(0, Math.min(1, options.volume))
      : 0.8;
  const startTime = options.startTime || 0;
  const songDuration = options.duration || 60;
  const endTime =
    options.endTime && options.endTime > startTime
      ? Math.min(options.endTime, songDuration)
      : songDuration;
  const portionLength = Math.max(1, endTime - startTime);

  let virtualElapsed = 0;
  let step = Math.floor(startTime / 0.45);

  const stepDuration = 0.45;

  const playStep = () => {
    try {
      if (volume <= 0.001) return;
      const now = ctx.currentTime;
      const freq = notes[step % notes.length];
      step++;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type =
        presetId === "preset:neon" || presetId === "preset:party"
          ? "sawtooth"
          : "triangle";
      osc.frequency.setValueAtTime(freq, now);

      const targetGain = 0.08 * volume;
      gain.gain.setValueAtTime(targetGain, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + stepDuration - 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + stepDuration);
    } catch (_e) { }
  };

  playStep();
  activeSynthInterval = setInterval(() => {
    virtualElapsed += stepDuration;
    if (virtualElapsed >= portionLength) {
      virtualElapsed = 0;
      step = Math.floor(startTime / stepDuration);
    }
    playStep();
    if (options.onTimeUpdate) {
      options.onTimeUpdate(startTime + virtualElapsed, songDuration);
    }
  }, stepDuration * 1000);
};

/**
 * Play a status song (preset or uploaded audio url)
 * Supports audio portion trimming (startTime, endTime) and mixing volume.
 */
export const playStatusTrack = (song, options = {}) => {
  stopStatusTrack();
  if (!song) return;

  const audioUrl = song.audioUrl || "";
  const volume =
    typeof options.volume === "number"
      ? Math.max(0, Math.min(1, options.volume))
      : song.volume !== undefined
        ? song.volume
        : 0.85;
  const startTime = Number(
    options.startTime !== undefined ? options.startTime : song.startTime || 0,
  );
  const endTime = Number(
    options.endTime !== undefined ? options.endTime : song.endTime || 0,
  );

  if (audioUrl.startsWith("preset:")) {
    playPresetMelody(audioUrl, {
      ...options,
      volume,
      startTime,
      endTime,
      duration: song.duration || 60,
    });
    return;
  }

  if (
    audioUrl.startsWith("blob:") ||
    audioUrl.startsWith("data:audio") ||
    audioUrl.startsWith("http://") ||
    audioUrl.startsWith("https://") ||
    audioUrl.startsWith("/") ||
    audioUrl.startsWith("./")
  ) {
    try {
      const audio = new Audio(audioUrl);
      audio.crossOrigin = "anonymous";
      audio.volume = volume;

      audio.addEventListener("loadedmetadata", () => {
        if (startTime > 0 && startTime < audio.duration) {
          audio.currentTime = startTime;
        }
      });

      const portionEnd = endTime > startTime ? endTime : Infinity;

      audio.addEventListener("timeupdate", () => {
        if (audio.currentTime >= portionEnd) {
          audio.currentTime = startTime || 0;
        }
        if (options.onTimeUpdate) {
          options.onTimeUpdate(audio.currentTime, audio.duration || 60);
        }
      });

      audio.loop = !portionEnd || portionEnd === Infinity;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((_err) => {
          // Autoplay policy or format error fallback
          playPresetMelody("preset:sunset", {
            ...options,
            volume,
            startTime,
            endTime,
          });
        });
      }
      activeAudioElement = audio;
    } catch (_err) {
      playPresetMelody("preset:sunset", {
        ...options,
        volume,
        startTime,
        endTime,
      });
    }
  } else {
    playPresetMelody("preset:sunset", {
      ...options,
      volume,
      startTime,
      endTime,
    });
  }
};

/**
 * Stop any currently playing status track and reset intervals
 */
export const stopStatusTrack = () => {
  if (activeAudioElement) {
    try {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
    } catch (_e) { }
    activeAudioElement = null;
  }
  if (activeSynthInterval) {
    clearInterval(activeSynthInterval);
    activeSynthInterval = null;
  }
  if (activeSynthTimer) {
    clearTimeout(activeSynthTimer);
    activeSynthTimer = null;
  }
  if (currentTrackingInterval) {
    clearInterval(currentTrackingInterval);
    currentTrackingInterval = null;
  }
};
