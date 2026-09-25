import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  BsChatDotsFill,
  BsShieldLockFill,
  BsCameraVideoFill,
  BsEmojiSmileFill,
  BsSendFill,
  BsBellFill,
  BsTelephoneFill,
  BsThreeDotsVertical,
  BsCheckAll,
  BsMicFill,
} from "react-icons/bs";
import useTypewriter from "../hooks/useTypewriter.js";
import heroMessages from "../mockData/heroMessages.js";
import { floatingIconBase, floatingCircleBase } from "../constants/styles.js";

/* ── Typing bubble (3 bouncing dots like WhatsApp) ── */
const WhatsAppTypingDots = () => (
  <div className="flex items-center gap-1 px-3 py-2.5">
    {[0, 0.18, 0.36].map((delay, i) => (
      <motion.span
        key={i}
        className="w-1.5 h-1.5 rounded-full bg-gray-500 block"
        animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
        transition={{
          duration: 0.7,
          repeat: Infinity,
          delay,
          ease: "easeInOut",
        }}
      />
    ))}
  </div>
);

/* ── Individual chat message with typewriter ── */
const ChatMessage = ({ msg, typingDurationMs = 1200 }) => {
  const isMe = msg.from === "me";
  const { displayed, done } = useTypewriter(
    msg.text,
    msg.delay + typingDurationMs,
  );
  const [showTyping, setShowTyping] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowTyping(true), msg.delay);
    const t2 = setTimeout(
      () => setShowTyping(false),
      msg.delay + typingDurationMs,
    );
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [msg.delay, typingDurationMs]);

  if (!showTyping && !displayed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`flex items-end gap-1.5 ${isMe ? "self-end flex-row-reverse" : "self-start"} max-w-[92%]`}
    >
      {!isMe && (
        <img
          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.seed}`}
          alt={msg.seed}
          className="w-5 h-5 rounded-full border border-gray-200 bg-white shrink-0"
        />
      )}
      <div
        className={`rounded-xl text-[10.5px] leading-snug shadow-sm ${
          isMe
            ? "bg-primary text-primary-content rounded-br-sm shadow-primary/20"
            : "bg-base-100 text-base-content border border-base-300 rounded-bl-sm"
        }`}
      >
        {showTyping && !displayed ? (
          <WhatsAppTypingDots />
        ) : (
          <div className="px-2.5 py-2">
            {displayed}
            {!done && (
              <span className="inline-block w-0.5 h-3 bg-current ml-0.5 animate-pulse align-middle" />
            )}
            <div
              className={`flex items-center justify-end gap-1 mt-0.5 ${isMe ? "text-white/70" : "text-gray-400"}`}
            >
              <span className="text-[8px]">
                {isMe
                  ? "10:43 AM"
                  : msg.seed === "Alex"
                    ? "10:42 AM"
                    : "10:44 AM"}
              </span>
              {isMe && <BsCheckAll size={11} className="text-white" />}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

/* ── Floating icon with bounce + hover ── */
const FloatingIcon = ({ children, y, duration, delay, style, className }) => {
  const prefersReduced =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  return (
    <motion.div
      className={`absolute z-20 ${className}`}
      style={style}
      animate={
        prefersReduced
          ? {}
          : {
              y: [0, y, 0],
              transition: {
                duration,
                repeat: Infinity,
                ease: "easeInOut",
                delay,
              },
            }
      }
      whileHover={{
        scale: 1.2,
        y: -4,
        transition: { type: "spring", stiffness: 400, damping: 10 },
      }}
    >
      {children}
    </motion.div>
  );
};

/* ════════════════════════════════════════════ */
const HeroPhone = () => {
  const prefersReducedMotion =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  return (
    <div
      className="relative flex items-center justify-center group"
      style={{ width: "360px", height: "560px", margin: "0 auto" }}
    >
      {/* ─── FLOATING ICONS ─── */}

      {/* 1. Notification card — top-left */}
      <FloatingIcon
        y={-12}
        duration={5}
        delay={0}
        className="top-8 left-0"
        style={{ transform: "translateX(-78%)" }}
      >
        <motion.div
          className="bg-base-100/95 rounded-xl p-2 shadow-xl border border-base-300 flex items-center gap-2 cursor-default"
          animate={prefersReducedMotion ? {} : { y: [0, -12, 0] }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0,
          }}
        >
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <BsBellFill size={14} />
          </div>
          <div className="leading-none">
            <div className="text-[11px] font-bold text-base-content">
              New Message
            </div>
            <div className="text-[9px] text-base-content/60 mt-0.5">from Alex</div>
          </div>
        </motion.div>
      </FloatingIcon>

      {/* 2. Avatar — top-right */}
      <motion.div
        className="absolute top-10 right-0 z-20 cursor-default"
        style={{ transform: "translateX(65%)" }}
        animate={prefersReducedMotion ? {} : { y: [0, -14, 0] }}
        transition={{
          duration: 4.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
        whileHover={{
          scale: 1.2,
          transition: { type: "spring", stiffness: 400, damping: 10 },
        }}
      >
        <div className="w-11 h-11 rounded-full border-[3px] border-white shadow-xl overflow-hidden">
          <img
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah"
            alt="Sarah"
            className="w-full h-full object-cover bg-white"
          />
        </div>
      </motion.div>

      {/* 3. Lock — left-middle */}
      <motion.div
        className="absolute z-20 cursor-default"
        style={{ top: "40%", left: 0, transform: "translate(-75%, -50%)" }}
        animate={prefersReducedMotion ? {} : { y: [0, -10, 0] }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        whileHover={{
          scale: 1.25,
          rotate: -10,
          transition: { type: "spring", stiffness: 400 },
        }}
      >
        <div className={`${floatingIconBase} text-success`}>
          <BsShieldLockFill size={20} />
        </div>
      </motion.div>

      {/* 4. Video camera — right-middle */}
      <motion.div
        className="absolute z-20 cursor-default"
        style={{ top: "56%", right: 0, transform: "translateX(65%)" }}
        animate={prefersReducedMotion ? {} : { y: [0, -12, 0] }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
        whileHover={{
          scale: 1.25,
          rotate: 8,
          transition: { type: "spring", stiffness: 400 },
        }}
      >
        <div className={`${floatingCircleBase} text-primary`}>
          <BsCameraVideoFill size={20} />
        </div>
      </motion.div>

      {/* 5. Emoji smiley — bottom-left */}
      <motion.div
        className="absolute bottom-14 left-0 z-20 cursor-default"
        style={{ transform: "translateX(-65%)" }}
        animate={
          prefersReducedMotion
            ? {}
            : { y: [0, -14, 0], rotate: [0, 8, 0, -8, 0] }
        }
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.5,
        }}
        whileHover={{
          scale: 1.3,
          rotate: 20,
          transition: { type: "spring", stiffness: 300 },
        }}
      >
        <div className={`${floatingIconBase} rounded-full text-warning`}>
          <BsEmojiSmileFill size={20} />
        </div>
      </motion.div>

      {/* 6. Green chat bubble — bottom-right */}
      <motion.div
        className="absolute bottom-10 right-0 z-20 cursor-default"
        style={{ transform: "translateX(52%)" }}
        animate={
          prefersReducedMotion
            ? {}
            : { y: [0, -16, 0], rotate: [0, -5, 0, 5, 0] }
        }
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2.5,
        }}
        whileHover={{
          scale: 1.2,
          rotate: 12,
          transition: { type: "spring", stiffness: 300 },
        }}
      >
        <div className="w-12 h-12 rounded-2xl rounded-br-sm bg-primary shadow-xl flex items-center justify-center text-primary-content">
          <BsChatDotsFill size={22} />
        </div>
      </motion.div>

      {/* 7. Send icon — top-right high */}
      <motion.div
        className="absolute top-3 right-0 z-20 cursor-default"
        style={{ transform: "translateX(45%)" }}
        animate={
          prefersReducedMotion ? {} : { y: [0, 12, 0], rotate: [0, 15, 0] }
        }
        transition={{
          duration: 5.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.2,
        }}
        whileHover={{
          scale: 1.3,
          rotate: -20,
          transition: { type: "spring", stiffness: 400 },
        }}
      >
        <div className="w-9 h-9 rounded-full bg-base-100 flex items-center justify-center text-primary shadow-xl border border-base-300">
          <BsSendFill size={13} className="mr-0.5 mt-0.5" />
        </div>
      </motion.div>

      {/* 8. Typing dots bubble — lower-left */}
      <motion.div
        className="absolute z-20 bg-base-100 rounded-2xl rounded-bl-sm shadow-xl border border-base-300 px-3 py-2.5 flex items-center gap-1.5 cursor-default"
        style={{ bottom: "30%", left: 0, transform: "translateX(-68%)" }}
        animate={prefersReducedMotion ? {} : { y: [0, -10, 0] }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3,
        }}
        whileHover={{
          scale: 1.1,
          transition: { type: "spring", stiffness: 400 },
        }}
      >
        {[0, 0.18, 0.36].map((d, i) => (
          <motion.span
            key={i}
            className="w-2 h-2 rounded-full bg-gray-400 block"
            animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
            transition={{
              duration: 0.7,
              repeat: Infinity,
              delay: d,
              ease: "easeInOut",
            }}
          />
        ))}
      </motion.div>

      {/* ─── SMARTPHONE CHASSIS ─── */}
      <motion.div
        className="relative bg-gray-900 rounded-[2.6rem] shadow-2xl border-[2px] border-gray-700 z-10 shrink-0"
        style={{
          width: "230px",
          height: "470px",
          padding: "8px",
          transformStyle: "preserve-3d",
          boxShadow:
            "-18px 28px 52px rgba(0,0,0,0.28), inset 0 0 12px rgba(255,255,255,0.12)",
        }}
        initial={{ rotateY: 18, rotateX: 6, rotateZ: -3 }}
        animate={
          prefersReducedMotion
            ? {}
            : {
                rotateY: [18, 12, 18],
                rotateX: [6, 9, 6],
                y: [0, -9, 0],
              }
        }
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        whileHover={{
          rotateY: 0,
          rotateX: 0,
          rotateZ: 0,
          y: -16,
          scale: 1.03,
          transition: { type: "spring", stiffness: 120, damping: 18, mass: 1 },
        }}
      >
        {/* Side buttons */}
        <div className="absolute top-20 -left-0.5 w-0.5 h-8 bg-gray-700 rounded-l-sm" />
        <div className="absolute top-32 -left-0.5 w-0.5 h-8 bg-gray-700 rounded-l-sm" />
        <div className="absolute top-24 -right-0.5 w-0.5 h-12 bg-gray-700 rounded-r-sm" />

        {/* Screen */}
        <div className="relative w-full h-full bg-base-200 rounded-[2.1rem] overflow-hidden flex flex-col">
          {/* Notch */}
          <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-50">
            <div className="w-20 h-6 bg-neutral rounded-b-xl flex justify-center items-center gap-2">
              <div className="w-8 h-1 bg-base-300 rounded-full" />
              <div className="w-2 h-2 bg-info/30 rounded-full" />
            </div>
          </div>

          {/* Chat Header */}
          <div className="bg-base-100/95 backdrop-blur-md pt-8 pb-2.5 px-3 flex items-center justify-between shadow-sm z-40 border-b border-base-300">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-base-300 bg-base-100 shrink-0 shadow-sm">
                <img
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=DesignTeam"
                  alt="Guftagu Team"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="font-bold text-[12px] text-base-content leading-tight">
                  Guftagu Team
                </div>
                <div className="text-[9px] text-primary font-medium">
                  3 online
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-primary">
              <BsCameraVideoFill size={14} />
              <BsTelephoneFill size={12} />
              <BsThreeDotsVertical size={14} className="text-base-content/50" />
            </div>
          </div>

          {/* Chat Body — messages with typewriter */}
          <div className="flex-1 overflow-hidden flex flex-col px-3 pt-3 pb-1 gap-3 justify-end bg-base-200">
            {heroMessages.map((msg) => (
              <ChatMessage key={msg.id} msg={msg} typingDurationMs={1200} />
            ))}
          </div>

          {/* Footer */}
          <div className="bg-base-100/95 backdrop-blur-md px-2.5 pt-2 pb-5 flex items-center gap-1.5 border-t border-base-300">
            <div className="flex-1 bg-base-200 rounded-full h-8 flex items-center px-2.5 gap-1.5 border border-base-300">
              <BsEmojiSmileFill className="text-base-content/50" size={13} />
              <span className="text-base-content/50 text-[10px] flex-1">
                Message...
              </span>
              <BsMicFill className="text-base-content/50" size={13} />
            </div>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-md text-primary-content shrink-0">
              <BsSendFill size={11} className="mr-0.5 mt-0.5" />
            </div>
          </div>

          {/* Home indicator */}
          <div className="absolute bottom-1.5 inset-x-0 flex justify-center z-50">
            <div className="w-20 h-0.5 bg-gray-800 rounded-full" />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default HeroPhone;
