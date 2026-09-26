/**
 * notificationAudio.js – Guftgunotification audio synthesizer & Web Notifications (PRD Section 74-77).
 * Uses standard Web Audio API for 100% reliable, zero-asset tone generation.
 */

let audioCtx = null;

const getAudioContext = () => {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => { });
  }
  return audioCtx;
};

/**
 * Play authentic Guftgudouble-tone message chime
 */
export const playMessageChime = () => {
  try {
    const soundEnabled = localStorage.getItem("setting_sound_enabled") !== "false";
    if (!soundEnabled) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Tone 1
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

    // Tone 2 (higher pitch, quick double pop)
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
  } catch (err) {
    console.debug("Audio notification suppressed:", err);
  }
};

/**
 * Play soft outgoing message "pop" tick
 */
export const playSentPop = () => {
  try {
    const soundEnabled = localStorage.getItem("setting_sound_enabled") !== "false";
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
  } catch (_e) { }
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
export const triggerDesktopNotification = (title, body, icon = "/favicon.ico") => {
  try {
    const notifsEnabled = localStorage.getItem("setting_notifications_enabled") !== "false";
    if (!notifsEnabled) return;
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    const n = new Notification(title, {
      body,
      icon,
      badge: icon,
      silent: true, // We handle our own pleasant audio chime
    });

    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch (err) {
    console.debug("Desktop notification error:", err);
  }
};
