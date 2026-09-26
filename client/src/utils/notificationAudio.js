/**
 * notificationAudio.js – Synthesized Audio Generator for Notifications & Calls
 * Uses Web Audio API for 100% reliable, zero-asset tone generation across browsers.
 */

let audioCtx = null;
let activeRingtoneTimer = null;
let activeLoopOscillators = [];

export const NOTIFICATION_SOUNDS = [
  {
    id: "default",
    name: "Classic Chime",
    description: "Default double-tone chime",
  },
  { id: "bubble", name: "Bubble Pop", description: "Soft cheerful water drop" },
  {
    id: "bell",
    name: "Crystal Bell",
    description: "Warm melodic harmonic chime",
  },
  {
    id: "electronic",
    name: "Digital Pulse",
    description: "Crisp modern electronic beep",
  },
  { id: "minimal", name: "Subtle Click", description: "Minimalist soft tap" },
];

export const RINGTONE_SOUNDS = [
  {
    id: "classic",
    name: "Classic Ring",
    description: "Standard telephone ringing cadence",
  },
  {
    id: "marimba",
    name: "Marimba Groove",
    description: "Lively melodic marimba sequence",
  },
  {
    id: "chime",
    name: "Peaceful Chimes",
    description: "Soft ascending acoustic chimes",
  },
  {
    id: "digital",
    name: "Cyber Phone",
    description: "Modern dual-tone digital ring",
  },
  {
    id: "retro",
    name: "Retro Rotary",
    description: "Vintage telephone bell ring",
  },
];

const getAudioContext = () => {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
};

/**
 * Play a specific notification chime
 */
export const playMessageChime = (soundKey) => {
  try {
    const soundEnabled =
      localStorage.getItem("setting_sound_enabled") !== "false";
    if (!soundEnabled) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    const sound =
      soundKey ||
      localStorage.getItem("setting_notification_sound") ||
      "default";
    const now = ctx.currentTime;

    if (sound === "bubble") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.12);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.14);
    } else if (sound === "bell") {
      [1046.5, 1318.5, 1567.98].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);
        gain.gain.setValueAtTime(0.12 - idx * 0.03, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.35);
      });
    } else if (sound === "electronic") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(950, now);
      osc.frequency.setValueAtTime(1420, now + 0.06);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    } else if (sound === "minimal") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(700, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } else {
      // Default Guftgu Double-Tone Chime
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(880, now); // A5
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.12);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1320, now + 0.08); // E6
      gain2.gain.setValueAtTime(0.14, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.22);
    }
  } catch (err) {
    console.debug("Audio notification suppressed:", err);
  }
};

/**
 * Play soft outgoing message "pop" tick
 */
export const playSentPop = () => {
  try {
    const soundEnabled =
      localStorage.getItem("setting_sound_enabled") !== "false";
    if (!soundEnabled) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(540, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.08);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  } catch (_e) {}
};

/**
 * Play one single cycle of a ringtone pattern
 */
const playRingtoneCycle = (ctx, ringtoneKey) => {
  const now = ctx.currentTime;
  const key = ringtoneKey || "classic";

  if (key === "marimba") {
    const notes = [659.25, 830.61, 987.77, 1318.51, 987.77, 1318.51];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + i * 0.16);
      gain.gain.setValueAtTime(0.15, now + i * 0.16);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.16 + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.16);
      osc.stop(now + i * 0.16 + 0.2);
      activeLoopOscillators.push(osc);
    });
  } else if (key === "chime") {
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + i * 0.18);
      gain.gain.setValueAtTime(0.14, now + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.18 + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.18);
      osc.stop(now + i * 0.18 + 0.4);
      activeLoopOscillators.push(osc);
    });
  } else if (key === "digital") {
    [0, 0.25, 0.5, 0.75].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(880, now + offset);
      osc.frequency.setValueAtTime(1174.66, now + offset + 0.1);
      gain.gain.setValueAtTime(0.08, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.2);
      activeLoopOscillators.push(osc);
    });
  } else if (key === "retro") {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(750, now);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 1.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 1.4);
    activeLoopOscillators.push(osc);
  } else {
    // Classic Dual-Tone Ring: 440Hz + 480Hz
    [440, 480].forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.8);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.0);
      activeLoopOscillators.push(osc);
    });
  }
};

/**
 * Start incoming call ringtone loop
 */
export const startIncomingRingtone = (ringtoneKey) => {
  stopRingtone();
  try {
    const soundEnabled =
      localStorage.getItem("setting_sound_enabled") !== "false";
    if (!soundEnabled) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    const selected =
      ringtoneKey ||
      localStorage.getItem("setting_ringtone_sound") ||
      "classic";
    playRingtoneCycle(ctx, selected);

    activeRingtoneTimer = setInterval(() => {
      playRingtoneCycle(ctx, selected);
    }, 2800);
  } catch (err) {
    console.debug("Failed to start incoming ringtone:", err);
  }
};

/**
 * Start outgoing call ringing sound (calling ringback tone)
 * Authentic telecommunication ringback: 440Hz + 480Hz dual tone 1.5s on, 2.5s off
 */
export const startOutgoingCallRingtone = () => {
  stopRingtone();
  try {
    const soundEnabled =
      localStorage.getItem("setting_sound_enabled") !== "false";
    if (!soundEnabled) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    const playOutRing = () => {
      const now = ctx.currentTime;
      [440, 480].forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.setValueAtTime(0.08, now + 1.4);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 1.5);
        activeLoopOscillators.push(osc);
      });
    };

    playOutRing();
    activeRingtoneTimer = setInterval(() => {
      playOutRing();
    }, 3500);
  } catch (err) {
    console.debug("Failed to start outgoing ringtone:", err);
  }
};

/**
 * Stop any active incoming or outgoing ringtones
 */
export const stopRingtone = () => {
  if (activeRingtoneTimer) {
    clearInterval(activeRingtoneTimer);
    activeRingtoneTimer = null;
  }
  activeLoopOscillators.forEach((osc) => {
    try {
      osc.stop();
      osc.disconnect();
    } catch (_e) {}
  });
  activeLoopOscillators = [];
};

/**
 * Preview one cycle of a ringtone (e.g. in settings modal)
 */
export const previewRingtone = (ringtoneKey) => {
  stopRingtone();
  const ctx = getAudioContext();
  if (ctx) {
    playRingtoneCycle(ctx, ringtoneKey);
  }
};

/**
 * Request browser desktop notifications permission
 */
export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    return "unsupported";
  }
  if (Notification.permission === "granted") {
    return "granted";
  }
  return await Notification.requestPermission();
};

/**
 * Show native desktop notification if user permitted and window not focused
 */
export const triggerDesktopNotification = (
  title,
  body,
  icon = "/favicon.ico",
) => {
  try {
    const notifsEnabled =
      localStorage.getItem("setting_notifications_enabled") !== "false";
    if (!notifsEnabled) return;
    if (!("Notification" in window) || Notification.permission !== "granted")
      return;

    const n = new Notification(title, {
      body,
      icon,
      badge: icon,
      silent: true,
    });

    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch (err) {
    console.debug("Desktop notification error:", err);
  }
};
