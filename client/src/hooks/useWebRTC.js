import { useState, useEffect, useRef } from "react";
import socketAPI from "../config/webSocket.js";
import toast from "react-hot-toast";
import {
  startIncomingRingtone,
  startOutgoingCallRingtone,
  stopRingtone,
} from "../utils/notificationAudio.js";

// Standard public STUN servers for NAT traversal
const RTC_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" },
  ],
};

const extractTargetId = (target) => {
  if (!target) return null;
  if (typeof target === "string") return target;
  // Handles all chat/contact variants: _id (MongoDB), id (UI chat item), userId (call log)
  return (target._id || target.id || target.userId || "").toString();
};

const extractTargetName = (target) => {
  if (!target || typeof target === "string") return "Contact";
  return target.displayName || target.customName || target.name || "Contact";
};

const extractTargetAvatar = (target) => {
  if (!target || typeof target === "string") return "";
  return target.avatar || "";
};

const useWebRTC = (loggedInUser) => {
  const [callState, setCallState] = useState("idle"); // 'idle' | 'ringing' | 'outgoing' | 'active'
  const [incomingCall, setIncomingCall] = useState(null);
  const [outgoingCallStatus, setOutgoingCallStatus] = useState("calling"); // 'calling' | 'ringing'
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({}); // { [userId]: MediaStream }
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callType, setCallType] = useState("video"); // 'video' | 'voice'
  const [activeRoomId, setActiveRoomId] = useState(null);

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const targetPeerIdRef = useRef(null);
  const pendingOfferRef = useRef(null);
  const queuedIceCandidatesRef = useRef([]);
  const screenTrackRef = useRef(null);

  // Synchronize audio ringtone with call states
  useEffect(() => {
    if (callState === "ringing") {
      startIncomingRingtone();
    } else if (callState === "outgoing") {
      startOutgoingCallRingtone();
    } else {
      stopRingtone();
    }
    return () => {
      stopRingtone();
    };
  }, [callState]);

  // Persist call history to local storage
  const recordCallLog = (logEntry) => {
    try {
      const saved = JSON.parse(localStorage.getItem("chat_call_logs") || "[]");
      const updated = [logEntry, ...saved.slice(0, 49)];
      localStorage.setItem("chat_call_logs", JSON.stringify(updated));
      window.dispatchEvent(new Event("call_logs_updated"));
    } catch (_e) {}
  };

  // Helper to create and configure a native RTCPeerConnection
  const createPeerConnection = (targetUserId) => {
    if (pcRef.current) {
      try {
        pcRef.current.close();
      } catch (_e) {}
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;

    // Relay local ICE candidates to the remote peer
    pc.onicecandidate = (event) => {
      if (event.candidate && targetUserId) {
        socketAPI.emit("iceCandidate", {
          to: targetUserId,
          candidate: event.candidate,
          from: loggedInUser?._id,
        });
      }
    };

    // Receive and mount remote audio/video tracks
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteStream) {
        setRemoteStreams((prev) => ({
          ...prev,
          [targetUserId]: remoteStream,
        }));
        setCallState("active");
        stopRingtone();
      }
    };

    pc.onconnectionstatechange = () => {
      if (
        pc.connectionState === "disconnected" ||
        pc.connectionState === "failed" ||
        pc.connectionState === "closed"
      ) {
        // If peer disconnected, clean up
        endCall();
      }
    };

    // Attach local media stream tracks if already acquired
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    return pc;
  };

  // Process any queued ICE candidates once remote description is set
  const processQueuedCandidates = async (pc) => {
    if (!pc || !pc.remoteDescription) return;
    while (queuedIceCandidatesRef.current.length > 0) {
      const candidate = queuedIceCandidatesRef.current.shift();
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn("Error adding queued ICE candidate:", err);
      }
    }
  };

  // Main Socket.IO signaling event listeners
  useEffect(() => {
    if (!loggedInUser) return;

    // 1. Incoming Call Ring Notification
    const handleIncomingRing = (data) => {
      // data: { from, callType, name, avatar, roomId, isGroup, groupName }
      if (callState !== "idle") {
        // Line busy - reject automatically
        socketAPI.emit("rejectCall", { to: data.from });
        return;
      }
      setIncomingCall(data);
      setCallState("ringing");
      setCallType(data.callType || "video");
      setActiveRoomId(data.roomId);
      targetPeerIdRef.current = data.from;
    };

    // 2. Outgoing Ringing / Calling Status Updates
    const handleRingStatus = (data) => {
      setOutgoingCallStatus(data.status); // 'calling' | 'ringing'
    };

    // 3. Incoming WebRTC Offer (Signaling)
    const handleIncomingCall = async (payload) => {
      // payload: { signal, from, roomId }
      pendingOfferRef.current = payload.signal;
      targetPeerIdRef.current = payload.from;
      if (payload.roomId) setActiveRoomId(payload.roomId);

      // If call is already answering or active, apply offer immediately
      if (pcRef.current && pcRef.current.signalingState !== "closed") {
        try {
          await pcRef.current.setRemoteDescription(
            new RTCSessionDescription(payload.signal),
          );
          await processQueuedCandidates(pcRef.current);
        } catch (err) {
          console.warn("Failed to set remote offer:", err);
        }
      }
    };

    // 4. Remote Callee Accepted Call (Answer SDP received on caller side)
    const handleCallAccepted = async (payload) => {
      // payload: { signal, from, roomId }
      stopRingtone();
      setCallState("active");
      if (pcRef.current) {
        try {
          await pcRef.current.setRemoteDescription(
            new RTCSessionDescription(payload.signal),
          );
          await processQueuedCandidates(pcRef.current);
        } catch (err) {
          console.warn("Failed to set remote answer:", err);
        }
      }
    };

    // 5. Remote ICE Candidate received
    const handleIceCandidate = async ({ candidate }) => {
      if (!candidate) return;
      const pc = pcRef.current;
      if (pc && pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn("Failed to add ICE candidate:", err);
        }
      } else {
        queuedIceCandidatesRef.current.push(candidate);
      }
    };

    // 6. Call Rejected by Callee
    const handleCallRejected = () => {
      toast("Call was declined", { icon: "📵" });
      endCall();
    };

    // 7. Call Ended by other user
    const handleCallEnded = () => {
      toast("Call ended", { icon: "📞" });
      endCall();
    };

    const handleUserLeftCall = () => {
      toast("User left the call", { icon: "👋" });
      endCall();
    };

    socketAPI.on("incomingRing", handleIncomingRing);
    socketAPI.on("ringStatus", handleRingStatus);
    socketAPI.on("incomingCall", handleIncomingCall);
    socketAPI.on("callAccepted", handleCallAccepted);
    socketAPI.on("iceCandidate", handleIceCandidate);
    socketAPI.on("callRejected", handleCallRejected);
    socketAPI.on("callEnded", handleCallEnded);
    socketAPI.on("userLeftCall", handleUserLeftCall);

    return () => {
      socketAPI.off("incomingRing", handleIncomingRing);
      socketAPI.off("ringStatus", handleRingStatus);
      socketAPI.off("incomingCall", handleIncomingCall);
      socketAPI.off("callAccepted", handleCallAccepted);
      socketAPI.off("iceCandidate", handleIceCandidate);
      socketAPI.off("callRejected", handleCallRejected);
      socketAPI.off("callEnded", handleCallEnded);
      socketAPI.off("userLeftCall", handleUserLeftCall);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedInUser, callState]);

  /**
   * Initiate an outgoing voice or video call
   */
  const startCall = async (target, type = "voice") => {
    const targetId = extractTargetId(target);
    const targetName = extractTargetName(target);
    const targetAvatar = extractTargetAvatar(target);

    if (!targetId || targetId === loggedInUser?._id) {
      toast.error("Invalid contact selected for calling");
      return;
    }

    setCallType(type);
    const roomId = `room-${Date.now()}`;
    setActiveRoomId(roomId);
    setCallState("outgoing");
    setOutgoingCallStatus("calling");
    targetPeerIdRef.current = targetId;

    recordCallLog({
      id: roomId,
      userId: targetId,
      name: targetName,
      avatar: targetAvatar,
      type: type,
      direction: "outgoing",
      status: "answered",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    });

    try {
      // 1. Acquire microphone and (optionally) camera media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === "video",
        audio: true,
      });
      setLocalStream(stream);
      localStreamRef.current = stream;

      // 2. Ring the target user via WebSocket
      socketAPI.emit("ringUser", {
        userToCall: targetId,
        from: loggedInUser?._id,
        callType: type,
        name: loggedInUser?.name,
        avatar: loggedInUser?.avatar || "",
        roomId,
      });

      // 3. Initialize native PeerConnection and generate SDP Offer
      const pc = createPeerConnection(targetId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // 4. Send SDP Offer through signaling channel
      socketAPI.emit("callUser", {
        userToCall: targetId,
        signalData: offer,
        from: loggedInUser?._id,
        roomId,
      });
    } catch (err) {
      console.error("Call initiation error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        toast.error("Camera/Microphone permission denied. Please allow access in browser settings.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        toast.error("No microphone or camera detected on your device.");
      } else {
        toast.error("Failed to access media devices for call.");
      }
      endCall();
    }
  };

  /**
   * Callee accepts the incoming call
   */
  const answerCall = async () => {
    stopRingtone();
    if (!incomingCall) return;

    const callerId = incomingCall.from;
    const roomId = incomingCall.roomId;
    targetPeerIdRef.current = callerId;

    recordCallLog({
      id: roomId || Date.now().toString(),
      userId: callerId,
      name: incomingCall.name || "Caller",
      avatar: incomingCall.avatar || "",
      type: incomingCall.callType || "voice",
      direction: "incoming",
      status: "answered",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    });

    setCallState("active");

    try {
      // 1. Acquire media stream for callee
      const stream = await navigator.mediaDevices.getUserMedia({
        video: incomingCall.callType === "video",
        audio: true,
      });
      setLocalStream(stream);
      localStreamRef.current = stream;

      // 2. Initialize PeerConnection
      const pc = createPeerConnection(callerId);

      // 3. Set remote description from caller's offer
      if (pendingOfferRef.current) {
        await pc.setRemoteDescription(
          new RTCSessionDescription(pendingOfferRef.current),
        );
        await processQueuedCandidates(pc);
      }

      // 4. Generate SDP Answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // 5. Send SDP Answer back to caller
      socketAPI.emit("answerCall", {
        to: callerId,
        signal: answer,
        from: loggedInUser?._id,
        roomId,
      });
    } catch (err) {
      console.error("Error answering call:", err);
      toast.error("Failed to open camera/microphone.");
      rejectCall();
    }
  };

  /**
   * Callee declines the incoming call
   */
  const rejectCall = () => {
    stopRingtone();
    if (incomingCall) {
      recordCallLog({
        id: incomingCall.roomId || Date.now().toString(),
        userId: incomingCall.from,
        name: incomingCall.name || "Caller",
        avatar: incomingCall.avatar || "",
        type: incomingCall.callType || "voice",
        direction: "incoming",
        status: "missed",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
      socketAPI.emit("rejectCall", { to: incomingCall.from });
    }
    setIncomingCall(null);
    setCallState("idle");
    targetPeerIdRef.current = null;
    pendingOfferRef.current = null;
  };

  /**
   * Terminate active or outgoing call
   */
  const endCall = () => {
    stopRingtone();

    const targetId = targetPeerIdRef.current;
    const roomId = activeRoomId;

    if (targetId) {
      socketAPI.emit("endCall", {
        to: targetId,
        roomId,
        userId: loggedInUser?._id,
      });
    }

    // Stop local media stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (_e) {}
      });
    }

    // Stop screen share track if any
    if (screenTrackRef.current) {
      try {
        screenTrackRef.current.stop();
      } catch (_e) {}
      screenTrackRef.current = null;
    }

    // Close PeerConnection
    if (pcRef.current) {
      try {
        pcRef.current.close();
      } catch (_e) {}
      pcRef.current = null;
    }

    localStreamRef.current = null;
    targetPeerIdRef.current = null;
    pendingOfferRef.current = null;
    queuedIceCandidatesRef.current = [];

    setLocalStream(null);
    setRemoteStreams({});
    setCallState("idle");
    setIncomingCall(null);
    setActiveRoomId(null);
    setIsScreenSharing(false);
    setOutgoingCallStatus("calling");
  };

  /**
   * Toggle screen share using native replaceTrack
   */
  const toggleScreenShare = async () => {
    if (!pcRef.current || !localStreamRef.current) return;

    if (isScreenSharing) {
      // Revert from screen share to webcam
      try {
        const camStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        const camVideoTrack = camStream.getVideoTracks()[0];

        // Replace video track in peer connection
        const senders = pcRef.current.getSenders();
        const videoSender = senders.find(
          (s) => s.track && s.track.kind === "video",
        );
        if (videoSender && camVideoTrack) {
          await videoSender.replaceTrack(camVideoTrack);
        }

        if (screenTrackRef.current) {
          screenTrackRef.current.stop();
          screenTrackRef.current = null;
        }

        // Update localStream
        const updatedStream = new MediaStream([
          ...localStreamRef.current.getAudioTracks(),
          camVideoTrack,
        ]);
        localStreamRef.current = updatedStream;
        setLocalStream(updatedStream);
        setIsScreenSharing(false);
      } catch (err) {
        toast.error("Could not switch back to camera");
        console.error(err);
      }
    } else {
      // Switch from camera to screen share
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: "always" },
          audio: false,
        });
        const screenVideoTrack = screenStream.getVideoTracks()[0];
        screenTrackRef.current = screenVideoTrack;

        const senders = pcRef.current.getSenders();
        const videoSender = senders.find(
          (s) => s.track && s.track.kind === "video",
        );
        if (videoSender && screenVideoTrack) {
          await videoSender.replaceTrack(screenVideoTrack);
        }

        // When user stops sharing from browser toolbar
        screenVideoTrack.onended = () => {
          toggleScreenShare();
        };

        const updatedStream = new MediaStream([
          ...localStreamRef.current.getAudioTracks(),
          screenVideoTrack,
        ]);
        localStreamRef.current = updatedStream;
        setLocalStream(updatedStream);
        setIsScreenSharing(true);
      } catch (err) {
        if (err.name !== "NotAllowedError") {
          toast.error("Could not start screen sharing");
        }
      }
    }
  };

  return {
    callState,
    incomingCall,
    outgoingCallStatus,
    localStream,
    remoteStreams,
    isScreenSharing,
    callType,
    startCall,
    answerCall,
    rejectCall,
    endCall,
    toggleScreenShare,
  };
};

export default useWebRTC;
