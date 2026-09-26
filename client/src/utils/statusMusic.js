/**
 * statusMusic.js
 * Preset tracks, audio upload validation, and Web Audio melodic synthesizer for WhatsApp Status music.
 */

export const PRESET_SONGS = [
  {
    id: "preset:sunset",
    title: "Sunset Memories",
    artist: "Lofi Dreamer",
    genre: "Chillhop",
    audioUrl: "preset:sunset",
  },
  {
    id: "preset:acoustic",
    title: "Morning Sunshine",
    artist: "Acoustic Journey",
    genre: "Acoustic",
    audioUrl: "preset:acoustic",
  },
  {
    id: "preset:neon",
    title: "Neon City Lights",
    artist: "Synthwave Pulse",
    genre: "Electronic",
    audioUrl: "preset:neon",
  },
  {
    id: "preset:golden",
    title: "Golden Hour Glow",
    artist: "Piano Reflections",
    genre: "Classical / Calm",
    audioUrl: "preset:golden",
  },
  {
    id: "preset:breeze",
    title: "Summer Ocean Breeze",
    artist: "Tropical Chill",
    genre: "Tropical House",
    audioUrl: "preset:breeze",
  },
];

let activeAudioElement = null;
let activeSynthInterval = null;
let synthAudioCtx = null;

const getSynthContext = () => {
  if (!synthAudioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) synthAudioCtx = new AudioCtx();
  }
  if (synthAudioCtx && synthAudioCtx.state === "suspended") {
    synthAudioCtx.resume().catch(() => {});
  }
  return synthAudioCtx;
};

/**
 * Play harmonic melodic chord loop via Web Audio API for presets
 */
const playPresetMelody = (presetId) => {
  stopStatusTrack();
  const ctx = getSynthContext();
  if (!ctx) return;

  const notesByPreset = {
    "preset:sunset": [261.63, 329.63, 392.0, 493.88, 392.0, 329.63], // C major 7 arpeggio
    "preset:acoustic": [220.0, 277.18, 329.63, 440.0, 329.63, 277.18], // A major warm
    "preset:neon": [146.83, 220.0, 293.66, 349.23, 440.0, 349.23], // D minor synth
    "preset:golden": [261.63, 329.63, 392.0, 523.25, 659.25, 523.25], // C major cascading piano
    "preset:breeze": [174.61, 220.0, 261.63, 349.23, 392.0, 261.63], // F major uplifting
  };

  const notes = notesByPreset[presetId] || notesByPreset["preset:sunset"];
  let step = 0;

  const playStep = () => {
    try {
      const now = ctx.currentTime;
      const freq = notes[step % notes.length];
      step++;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = presetId === "preset:neon" ? "sawtooth" : "triangle";
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    } catch (_e) {}
  };

  playStep();
  activeSynthInterval = setInterval(playStep, 450);
};

/**
 * Play a status song (preset or uploaded audio url)
 */
export const playStatusTrack = (song) => {
  stopStatusTrack();
  if (!song) return;

  const audioUrl = song.audioUrl || "";

  if (audioUrl.startsWith("preset:")) {
    playPresetMelody(audioUrl);
    return;
  }

  if (
    audioUrl.startsWith("http://") ||
    audioUrl.startsWith("https://") ||
    audioUrl.startsWith("data:audio")
  ) {
    try {
      const audio = new Audio(audioUrl);
      audio.crossOrigin = "anonymous";
      audio.volume = 0.8;
      audio.play().catch(() => {
        // Autoplay policy or CORS error fallback to preset melody
        playPresetMelody("preset:sunset");
      });
      activeAudioElement = audio;
    } catch (_err) {
      playPresetMelody("preset:sunset");
    }
  } else {
    playPresetMelody("preset:sunset");
  }
};

/**
 * Stop any currently playing status track
 */
export const stopStatusTrack = () => {
  if (activeAudioElement) {
    try {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
    } catch (_e) {}
    activeAudioElement = null;
  }
  if (activeSynthInterval) {
    clearInterval(activeSynthInterval);
    activeSynthInterval = null;
  }
};
