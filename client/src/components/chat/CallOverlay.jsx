import { useEffect, useRef, useState } from "react";
import {
  BsTelephoneFill,
  BsTelephoneXFill,
  BsMicFill,
  BsMicMuteFill,
  BsCameraVideoFill,
  BsCameraVideoOffFill,
  BsDisplay,
  BsArrowRepeat,
  BsPipFill,
  BsShieldLockFill,
  BsPersonFill,
  BsArrowsAngleExpand,
  BsArrowsAngleContract,
} from "react-icons/bs";

/**
 * Single Video / Audio Stream Renderer
 */
const StreamCard = ({
  stream,
  isLocal,
  isScreenShare = false,
  onStopScreenShare = null,
  isCompact = false,
  muted = false,
  userName = "User",
  userAvatar = "",
  isVideoOff = false,
  className = "",
  onClick,
}) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const hasVideoTrack =
    !isVideoOff &&
    stream &&
    stream.getVideoTracks &&
    stream.getVideoTracks().length > 0 &&
    stream.getVideoTracks().some((t) => t.enabled);

  // If local user is screen sharing, display the anti-infinite-mirror Presenter Card
  if (isLocal && isScreenShare) {
    if (isCompact) {
      return (
        <div
          onClick={onClick}
          className={`relative w-full h-full overflow-hidden bg-zinc-900 flex flex-col items-center justify-center p-3 text-center select-none ${className}`}
        >
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-1.5 shadow-md">
            <BsDisplay size={20} />
          </div>
          <span className="text-white text-xs font-semibold">Sharing Screen</span>
          <span className="text-emerald-400 text-[10px] mt-0.5 font-medium">Live to call</span>
        </div>
      );
    }

    return (
      <div
        onClick={onClick}
        className={`relative w-full h-full overflow-hidden bg-gradient-to-b from-[#111b21] via-[#0c1317] to-[#080d10] flex flex-col items-center justify-center p-6 text-center select-none ${className}`}
      >
        <div className="relative mb-5">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-emerald-500/15 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-2xl animate-pulse">
            <BsDisplay size={44} />
          </div>
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500" />
          </span>
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight">
          You are sharing your screen
        </h3>
        <p className="text-white/60 text-xs sm:text-sm max-w-sm leading-relaxed mb-6">
          Your screen is being shared live with the call in full quality. Mirror preview is paused here to prevent infinite tunnel copies.
        </p>
        {onStopScreenShare && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onStopScreenShare();
            }}
            className="btn bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-full px-6 border-none shadow-xl shadow-red-600/30 flex items-center gap-2 cursor-pointer font-medium text-sm transition-all"
          >
            <BsTelephoneXFill size={14} />
            <span>Stop Sharing</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`relative w-full h-full overflow-hidden bg-zinc-950 flex items-center justify-center select-none ${className}`}
    >
      {/* Video Element */}
      {hasVideoTrack ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted || isLocal}
          className={`w-full h-full pointer-events-none ${
            isScreenShare ? "object-contain bg-black" : "object-cover"
          } ${isLocal && !isScreenShare ? "scale-x-[-1]" : ""}`}
        />
      ) : (
        /* Video Off or Voice-only Avatar Card */
        <div className="flex flex-col items-center justify-center gap-3 p-4 text-center">
          <div className="relative">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-white/20 shadow-2xl bg-zinc-800 flex items-center justify-center">
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={userName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <BsPersonFill size={48} className="text-white/40" />
              )}
            </div>
            {isVideoOff && (
              <span className="absolute bottom-0 right-0 p-1.5 rounded-full bg-zinc-900 border border-white/20 text-white/70">
                <BsCameraVideoOffFill size={14} />
              </span>
            )}
          </div>
          <span className="text-white/90 font-medium text-sm sm:text-base tracking-wide">
            {userName}
          </span>
          {/* Audio stream tag for remote peers when video is off */}
          {!isLocal && stream && (
            <audio ref={videoRef} autoPlay playsInline muted={false} />
          )}
        </div>
      )}
    </div>
  );
};

const CallOverlay = ({
  callState,
  incomingCall,
  outgoingCallStatus,
  localStream,
  remoteStreams,
  isScreenSharing,
  callType,
  currentPeerInfo,
  loggedInUser = null,
  answerCall,
  rejectCall,
  endCall,
  toggleScreenShare,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === "voice");
  const [isSwapped, setIsSwapped] = useState(false); // Swap local and remote video sizes (PiP vs Fullscreen)
  const [pipPosition, setPipPosition] = useState("top-right"); // 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left'
  const [isPipExpanded, setIsPipExpanded] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Active call duration timer
  useEffect(() => {
    let timer = null;
    if (callState === "active") {
      setCallDuration(0);
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
      setIsSwapped(false);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [callState]);

  // Format call duration as mm:ss or hh:mm:ss
  const formatDuration = (secs) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;
    const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  // Mute audio track
  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted, localStream]);

  // Disable / Enable video track
  useEffect(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !isVideoOff;
      });
    }
  }, [isVideoOff, localStream]);

  // When screen sharing starts or stops, ensure camera video is enabled
  useEffect(() => {
    if (!isScreenSharing && callType === "video") {
      setIsVideoOff(false);
    }
  }, [isScreenSharing, callType]);

  if (callState === "idle") return null;

  // Contact details of the person we are on call with
  const contactName =
    incomingCall?.name || currentPeerInfo?.name || "Contact";
  const contactAvatar =
    incomingCall?.avatar || currentPeerInfo?.avatar || "";

  // ──────────────────────────────────────────
  // 1. INCOMING CALL SCREEN (WhatsApp Ringing)
  // ──────────────────────────────────────────
  if (callState === "ringing" && incomingCall) {
    return (
      <div className="fixed inset-0 z-[9999] bg-gradient-to-b from-[#111b21] via-[#0c1317] to-[#080d10] flex flex-col justify-between items-center text-white p-6 sm:p-10 animate-fade-in select-none pointer-events-auto">
        {/* Top Header */}
        <div className="flex flex-col items-center text-center mt-8">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium mb-3 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
            <BsShieldLockFill size={12} />
            <span>End-to-End Encrypted</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-1">
            {incomingCall.name || "Unknown Caller"}
          </h2>
          <p className="text-white/60 text-sm sm:text-base capitalize">
            Incoming WhatsApp {incomingCall.callType || "voice"} call...
            {incomingCall.isGroup && ` • Group: ${incomingCall.groupName}`}
          </p>
        </div>

        {/* Pulsing Avatar */}
        <div className="relative my-auto flex items-center justify-center">
          <div className="absolute w-44 h-44 sm:w-56 sm:h-56 rounded-full bg-emerald-500/10 animate-ping pointer-events-none" />
          <div className="absolute w-36 h-36 sm:w-48 sm:h-48 rounded-full bg-emerald-500/20 animate-pulse pointer-events-none" />
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border-3 border-emerald-400/40 shadow-2xl bg-zinc-800">
            {incomingCall.avatar ? (
              <img
                src={incomingCall.avatar}
                alt={incomingCall.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-white/50">
                <BsPersonFill size={56} />
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons: Cut (Decline) vs Pick up (Answer) */}
        <div className="w-full max-w-sm flex items-center justify-around mb-8">
          {/* Decline / Reject Call */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={rejectCall}
              className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-red-600 hover:bg-red-700 active:scale-90 text-white flex items-center justify-center shadow-xl shadow-red-600/30 transition-transform cursor-pointer"
              title="Decline Call"
            >
              <BsTelephoneXFill size={26} />
            </button>
            <span className="text-xs text-white/70 font-medium">Decline</span>
          </div>

          {/* Answer / Pick Up Call */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={answerCall}
              className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-90 text-white flex items-center justify-center shadow-xl shadow-emerald-600/30 transition-transform animate-bounce cursor-pointer"
              title="Answer Call"
            >
              <BsTelephoneFill size={26} />
            </button>
            <span className="text-xs text-white/70 font-medium">Answer</span>
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────
  // 2. OUTGOING CALL SCREEN (Calling / Ringing)
  // ──────────────────────────────────────────
  if (callState === "outgoing") {
    return (
      <div className="fixed inset-0 z-[9999] bg-gradient-to-b from-[#111b21] via-[#0c1317] to-[#080d10] flex flex-col justify-between items-center text-white p-6 sm:p-10 animate-fade-in select-none pointer-events-auto">
        {/* Top Header */}
        <div className="flex flex-col items-center text-center mt-8">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium mb-3 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
            <BsShieldLockFill size={12} />
            <span>End-to-End Encrypted</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-1">
            {contactName}
          </h2>
          <p className="text-emerald-400 font-medium text-sm sm:text-base capitalize tracking-wide flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
            {outgoingCallStatus === "ringing" ? "Ringing..." : "Calling..."}
          </p>
        </div>

        {/* Pulsing Avatar */}
        <div className="relative my-auto flex items-center justify-center">
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border-2 border-white/20 shadow-2xl bg-zinc-800">
            {contactAvatar ? (
              <img
                src={contactAvatar}
                alt={contactName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-white/50">
                <BsPersonFill size={56} />
              </div>
            )}
          </div>
        </div>

        {/* Cut / Cancel Outgoing Call Button */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <button
            onClick={endCall}
            className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-red-600 hover:bg-red-700 active:scale-90 text-white flex items-center justify-center shadow-xl shadow-red-600/30 transition-transform cursor-pointer"
            title="End Call"
          >
            <BsTelephoneXFill size={26} />
          </button>
          <span className="text-xs text-white/70 font-medium">Cancel</span>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────
  // 3. ACTIVE PICKED-UP CALL (WhatsApp Fullscreen + PiP Size Swap)
  // ──────────────────────────────────────────
  const peerEntries = Object.entries(remoteStreams);
  const primaryRemoteStream = peerEntries.length > 0 ? peerEntries[0][1] : null;

  // Determine which stream is fullscreen background and which is floating PiP window
  const mainStream = isSwapped ? localStream : primaryRemoteStream;
  const isMainLocal = isSwapped;
  const mainUserName = isSwapped ? "You" : contactName;
  const mainUserAvatar = isSwapped ? loggedInUser?.avatar || "" : contactAvatar;
  const isMainVideoOff = isSwapped ? isVideoOff : false;

  const pipStream = isSwapped ? primaryRemoteStream : localStream;
  const isPipLocal = !isSwapped;
  const pipUserName = isSwapped ? contactName : "You";
  const pipUserAvatar = isSwapped ? contactAvatar : loggedInUser?.avatar || "";
  const isPipVideoOff = !isSwapped ? isVideoOff : false;

  // Corner classes for floating PiP card
  const cornerPositions = {
    "top-right": "top-5 right-5 sm:top-7 sm:right-7",
    "top-left": "top-5 left-5 sm:top-7 sm:left-7",
    "bottom-right": "bottom-28 right-5 sm:bottom-32 sm:right-7",
    "bottom-left": "bottom-28 left-5 sm:bottom-32 sm:left-7",
  };

  const pipSizeClasses = isPipExpanded
    ? "w-40 h-56 sm:w-56 sm:h-80"
    : "w-28 h-40 sm:w-40 sm:h-56";

  return (
    <div className="fixed inset-0 z-[9999] bg-zinc-950 flex flex-col justify-between overflow-hidden select-none animate-fade-in font-sans pointer-events-auto">
      {/* ── TOP HEADER (WhatsApp Call Bar) ── */}
      <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base sm:text-lg text-white leading-tight drop-shadow-md">
                {contactName}
              </h3>
              <span className="badge badge-xs bg-emerald-500 text-black font-semibold border-none uppercase px-1.5 py-0.5 text-[9px]">
                {callType === "video" ? "Video" : "Voice"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-white/80 font-mono font-medium drop-shadow-sm mt-0.5">
              <span>{formatDuration(callDuration)}</span>
              <span className="text-white/40">•</span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-sans">
                <BsShieldLockFill size={10} /> Encrypted
              </span>
            </div>
          </div>
        </div>

        {/* Header Action Buttons (Swap Video + Quick End Call) */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {callType === "video" && (
            <button
              type="button"
              onClick={() => setIsSwapped((prev) => !prev)}
              className="btn btn-sm btn-circle bg-black/40 hover:bg-black/70 text-white border border-white/20 backdrop-blur-md shadow-lg"
              title="Swap Fullscreen & PiP Video"
            >
              <BsArrowRepeat size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              endCall();
            }}
            className="btn btn-sm btn-circle bg-red-600 hover:bg-red-700 text-white border-none shadow-lg active:scale-95"
            title="Cut Call (End Call)"
            aria-label="Cut Call"
          >
            <BsTelephoneXFill size={14} />
          </button>
        </div>
      </div>

      {/* ── MAIN VIDEO / CALL STAGE ── */}
      <div className="relative w-full h-full flex items-center justify-center bg-zinc-950 overflow-hidden">
        {callType === "video" ? (
          /* Main Background Video */
          <div className="relative w-full h-full">
            <StreamCard
              stream={mainStream}
              isLocal={isMainLocal}
              isScreenShare={isScreenSharing}
              onStopScreenShare={toggleScreenShare}
              isCompact={false}
              muted={isMainLocal}
              userName={mainUserName}
              userAvatar={mainUserAvatar}
              isVideoOff={isMainVideoOff}
              onClick={() => setIsSwapped((prev) => !prev)}
            />

            {/* Waiting for other peer state */}
            {!primaryRemoteStream && !isSwapped && (
              <div className="absolute inset-0 bg-zinc-900/90 backdrop-blur-md flex flex-col items-center justify-center gap-4 text-white z-10">
                <span className="loading loading-spinner loading-lg text-emerald-400" />
                <p className="font-medium text-sm sm:text-base text-white/80">
                  Connecting video with {contactName}...
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Voice Call Stage (WhatsApp Aesthetic) */
          <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#111b21] via-[#0c1317] to-[#080d10] text-white">
            <div className="relative flex items-center justify-center mb-6">
              <div className="absolute w-44 h-44 sm:w-56 sm:h-56 rounded-full bg-emerald-500/10 animate-pulse pointer-events-none" />
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border-2 border-white/20 shadow-2xl bg-zinc-800">
                {contactAvatar ? (
                  <img
                    src={contactAvatar}
                    alt={contactName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-white/50">
                    <BsPersonFill size={56} />
                  </div>
                )}
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-1">
              {contactName}
            </h2>
            <p className="font-mono text-base text-emerald-400 font-semibold mb-2">
              {formatDuration(callDuration)}
            </p>
            <span className="flex items-center gap-1.5 text-xs text-white/50 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
              <BsShieldLockFill size={11} className="text-emerald-400" />
              WhatsApp Voice Call
            </span>

            {/* Audio tag for remote voice stream */}
            {primaryRemoteStream && (
              <audio autoPlay playsInline muted={false} />
            )}
          </div>
        )}

        {/* ── FLOATING PICTURE-IN-PICTURE (PiP) WINDOW ── */}
        {callType === "video" && (
          <div
            className={`absolute ${cornerPositions[pipPosition]} ${pipSizeClasses} z-40 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border-2 border-white/30 backdrop-blur-xl transition-all duration-300 group cursor-pointer hover:border-emerald-400/80 active:scale-95`}
            onClick={() => setIsSwapped((prev) => !prev)}
            title="Click to Swap Video Sizes"
          >
            <StreamCard
              stream={pipStream}
              isLocal={isPipLocal}
              isScreenShare={isScreenSharing}
              onStopScreenShare={toggleScreenShare}
              isCompact={true}
              muted={isPipLocal}
              userName={pipUserName}
              userAvatar={pipUserAvatar}
              isVideoOff={isPipVideoOff}
            />

            {/* PiP Overlay Controls (Corner Swap & Size Expand) */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-start justify-between p-2 pointer-events-none">
              <span className="badge badge-xs bg-black/60 text-white font-semibold border-none px-2 py-0.5 text-[10px] backdrop-blur-sm">
                {pipUserName}
              </span>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
                {/* Expand / Minimize PiP size */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPipExpanded((prev) => !prev);
                  }}
                  className="p-1 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20"
                  title={isPipExpanded ? "Compact PiP" : "Expand PiP"}
                >
                  {isPipExpanded ? (
                    <BsArrowsAngleContract size={12} />
                  ) : (
                    <BsArrowsAngleExpand size={12} />
                  )}
                </button>

                {/* Move PiP Corner */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const corners = [
                      "top-right",
                      "bottom-right",
                      "bottom-left",
                      "top-left",
                    ];
                    const nextIdx =
                      (corners.indexOf(pipPosition) + 1) % corners.length;
                    setPipPosition(corners[nextIdx]);
                  }}
                  className="p-1 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20"
                  title="Move PiP to next corner"
                >
                  <BsPipFill size={12} />
                </button>
              </div>
            </div>

            {/* Click to Swap Badge Indicator */}
            <div className="absolute bottom-1.5 inset-x-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[10px] bg-black/70 text-white/90 px-2 py-0.5 rounded-full font-medium border border-white/20 backdrop-blur-sm flex items-center gap-1 shadow-sm">
                <BsArrowRepeat size={11} /> Tap to swap
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── FLOATING BOTTOM CONTROLS BAR (WhatsApp Call Action Pill) ── */}
      <div className="absolute bottom-6 inset-x-0 z-50 flex items-center justify-center px-4 pointer-events-none">
        <div className="flex items-center gap-3 sm:gap-5 px-6 py-3.5 rounded-full bg-black/75 backdrop-blur-2xl border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.6)] pointer-events-auto transition-transform">
          {/* 1. Mute / Unmute Mic */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full flex items-center justify-center transition-all ${
              isMuted
                ? "bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30"
                : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
            } active:scale-95 cursor-pointer shadow-md`}
            title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
            aria-label={isMuted ? "Unmute Microphone" : "Mute Microphone"}
          >
            {isMuted ? <BsMicMuteFill size={20} /> : <BsMicFill size={20} />}
          </button>

          {/* 2. Camera On / Off (Video Calls) */}
          {callType === "video" && (
            <button
              onClick={() => setIsVideoOff(!isVideoOff)}
              className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full flex items-center justify-center transition-all ${
                isVideoOff
                  ? "bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30"
                  : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
              } active:scale-95 cursor-pointer shadow-md`}
              title={isVideoOff ? "Turn On Camera" : "Turn Off Camera"}
              aria-label={isVideoOff ? "Turn On Camera" : "Turn Off Camera"}
            >
              {isVideoOff ? (
                <BsCameraVideoOffFill size={20} />
              ) : (
                <BsCameraVideoFill size={20} />
              )}
            </button>
          )}

          {/* 3. Swap Stream / Video Sizes Button (WhatsApp Switch View) */}
          {callType === "video" && (
            <button
              onClick={() => setIsSwapped((prev) => !prev)}
              className="w-12 h-12 sm:w-13 sm:h-13 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white border border-white/10 active:scale-95 cursor-pointer shadow-md transition-all"
              title="Change Video Sizes (Swap Caller & Callee)"
              aria-label="Swap Video Sizes"
            >
              <BsArrowRepeat size={20} />
            </button>
          )}

          {/* 4. Screen Sharing */}
          {callType === "video" && (
            <button
              onClick={toggleScreenShare}
              className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full flex items-center justify-center transition-all ${
                isScreenSharing
                  ? "bg-emerald-500 text-zinc-950 font-bold shadow-lg shadow-emerald-500/30"
                  : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
              } active:scale-95 cursor-pointer shadow-md`}
              title="Share Screen"
              aria-label="Share Screen"
            >
              <BsDisplay size={20} />
            </button>
          )}

          {/* 5. Cut Call / Hang Up (Big Red WhatsApp Button) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              endCall();
            }}
            className="w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center bg-red-600 hover:bg-red-700 active:scale-90 text-white shadow-xl shadow-red-600/40 transition-transform cursor-pointer ml-1 pointer-events-auto"
            title="Cut Call (End Call)"
            aria-label="Cut Call"
          >
            <BsTelephoneXFill size={22} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallOverlay;
