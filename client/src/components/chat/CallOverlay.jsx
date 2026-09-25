import { useEffect, useRef, useState } from "react";
import {
  BsTelephoneFill,
  BsTelephoneXFill,
  BsMicFill,
  BsMicMuteFill,
  BsCameraVideoFill,
  BsCameraVideoOffFill,
  BsDisplay,
} from "react-icons/bs";

const VideoStream = ({ stream, isLocal, muted }) => {
  const videoRef = useRef();

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!stream) return null;

  const hasVideo = stream.getVideoTracks().length > 0;

  return (
    <div
      className={`relative w-full h-full bg-black flex items-center justify-center overflow-hidden rounded-2xl shadow-xl ${isLocal ? "border-2 border-primary" : ""}`}
    >
      {hasVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted || isLocal}
          className={`w-full h-full object-cover ${isLocal ? "scale-x-[-1]" : ""}`}
        />
      ) : (
        <div className="w-24 h-24 rounded-full bg-base-300 flex items-center justify-center">
          <BsTelephoneFill size={32} className="text-base-content/30" />
          <audio ref={videoRef} autoPlay muted={muted || isLocal} />
        </div>
      )}
      {isLocal && (
        <span className="absolute bottom-4 left-4 badge badge-primary shadow-sm font-semibold">
          You
        </span>
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
  answerCall,
  rejectCall,
  endCall,
  toggleScreenShare,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === "voice");

  useEffect(() => {
    if (localStream) {
      localStream
        .getAudioTracks()
        .forEach((track) => (track.enabled = !isMuted));
    }
  }, [isMuted, localStream]);

  useEffect(() => {
    if (localStream) {
      localStream
        .getVideoTracks()
        .forEach((track) => (track.enabled = !isVideoOff));
    }
  }, [isVideoOff, localStream]);

  if (callState === "idle") return null;

  // Render Incoming Call Screen
  if (callState === "ringing" && incomingCall) {
    return (
      <div className="fixed inset-0 z-200 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center text-white animate-fade-in">
        <div className="text-center mb-12">
          <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6 animate-pulse">
            <BsTelephoneFill size={40} className="text-primary" />
          </div>
          <h2 className="text-3xl font-bold mb-2">{incomingCall.name}</h2>
          <p className="text-white/60">
            Incoming {incomingCall.callType} call...
            {incomingCall.isGroup && ` (Group: ${incomingCall.groupName})`}
          </p>
        </div>
        <div className="flex gap-8">
          <button
            onClick={rejectCall}
            className="w-16 h-16 rounded-full bg-error text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg"
          >
            <BsTelephoneXFill size={28} />
          </button>
          <button
            onClick={answerCall}
            className="w-16 h-16 rounded-full bg-success text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg animate-bounce"
          >
            <BsTelephoneFill size={28} />
          </button>
        </div>
      </div>
    );
  }

  // Render Outgoing Call Screen
  if (callState === "outgoing") {
    return (
      <div className="fixed inset-0 z-200 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center text-white animate-fade-in">
        <div className="text-center mb-12">
          <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
            <BsTelephoneFill
              size={40}
              className={`text-primary ${outgoingCallStatus === "ringing" ? "animate-pulse" : "opacity-50"}`}
            />
          </div>
          <h2 className="text-3xl font-bold mb-2">Outgoing {callType} call</h2>
          <p className="text-white/60 capitalize font-medium text-lg">
            {outgoingCallStatus === "ringing" ? "Ringing..." : "Calling..."}
          </p>
        </div>
        <div className="flex gap-8 mt-4">
          <button
            onClick={endCall}
            className="w-16 h-16 rounded-full bg-error text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg"
          >
            <BsTelephoneXFill size={28} />
          </button>
        </div>
      </div>
    );
  }

  // Render Active Call Screen
  const peers = Object.entries(remoteStreams);
  const totalParticipants = peers.length + 1; // +1 for local

  let gridClass = "grid-cols-1";
  if (totalParticipants === 2) gridClass = "grid-cols-1 md:grid-cols-2";
  else if (totalParticipants === 3 || totalParticipants === 4)
    gridClass = "grid-cols-2";
  else if (totalParticipants > 4) gridClass = "grid-cols-2 md:grid-cols-3";

  return (
    <div className="fixed inset-0 z-200 bg-base-300 flex flex-col animate-fade-in">
      <div className="flex-1 p-4 md:p-8">
        <div className={`grid gap-4 w-full h-full ${gridClass}`}>
          {/* Local Stream */}
          <VideoStream stream={localStream} isLocal={true} />

          {/* Remote Streams */}
          {peers.map(([userId, stream]) => (
            <VideoStream key={userId} stream={stream} isLocal={false} />
          ))}

          {/* Waiting state if no peers connected yet */}
          {peers.length === 0 && (
            <div className="w-full h-full bg-base-200 rounded-2xl flex flex-col items-center justify-center shadow-inner">
              <span className="loading loading-ring loading-lg text-primary mb-4"></span>
              <p className="text-base-content/60 font-medium">
                Connecting to peers...
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Controls Bar */}
      <div className="h-24 bg-base-100 border-t border-base-300 flex items-center justify-center gap-4 px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
            isMuted
              ? "bg-error text-white hover:bg-error/90 shadow-md"
              : "bg-base-200 text-base-content hover:bg-base-300"
          } active:scale-95 cursor-pointer`}
        >
          {isMuted ? <BsMicMuteFill size={24} /> : <BsMicFill size={24} />}
        </button>

        {callType === "video" && (
          <button
            onClick={() => setIsVideoOff(!isVideoOff)}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              isVideoOff
                ? "bg-error text-white hover:bg-error/90 shadow-md"
                : "bg-base-200 text-base-content hover:bg-base-300"
            } active:scale-95 cursor-pointer`}
          >
            {isVideoOff ? (
              <BsCameraVideoOffFill size={24} />
            ) : (
              <BsCameraVideoFill size={24} />
            )}
          </button>
        )}

        {callType === "video" && (
          <button
            onClick={toggleScreenShare}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              isScreenSharing
                ? "bg-primary text-primary-content hover:bg-primary/90 shadow-md"
                : "bg-base-200 text-base-content hover:bg-base-300"
            } active:scale-95 cursor-pointer`}
            title="Screen Share"
          >
            <BsDisplay size={24} />
          </button>
        )}

        <button
          onClick={endCall}
          className="w-14 h-14 rounded-full flex items-center justify-center bg-error text-white hover:bg-error/90 active:scale-95 shadow-lg ml-4 transition-all cursor-pointer"
        >
          <BsTelephoneXFill size={24} />
        </button>
      </div>
    </div>
  );
};

export default CallOverlay;
