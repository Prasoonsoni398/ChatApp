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
  const [currentPeerInfo, setCurrentPeerInfo] = useState({
    name: "Contact",
    avatar: "",
  });

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const targetPeerIdRef = useRef(null);
  const activeRoomIdRef = useRef(null);
  const pendingOfferRef = useRef(null);
  const queuedIceCandidatesRef = useRef([]);
  const screenTrackRef = useRef(null);
  const camTrackRef = useRef(null);
  const isScreenSharingRef = useRef(false);
  const endCallRef = useRef(null);

  // Maintain reference to current callState so socket callbacks never drop or trigger re-binding
  const callStateRef = useRef(callState);
  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

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
        pcRef.current.onconnectionstatechange = null;
        pcRef.current.oniceconnectionstatechange = null;
        pcRef.current.ontrack = null;
        pcRef.current.onicecandidate = null;
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
      } else if (event.track) {
        const stream = new MediaStream([event.track]);
        setRemoteStreams((prev) => ({
          ...prev,
          [targetUserId]: stream,
        }));
        setCallState("active");
        stopRingtone();
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("WebRTC Connection State:", pc.connectionState);
      if (
        pc.connectionState === "disconnected" ||
        pc.connectionState === "failed" ||
        pc.connectionState === "closed"
      ) {
        if (endCallRef.current) endCallRef.current();
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("ICE Connection State:", pc.iceConnectionState);
      if (
        pc.iceConnectionState === "disconnected" ||
        pc.iceConnectionState === "failed" ||
        pc.iceConnectionState === "closed"
      ) {
        if (endCallRef.current) endCallRef.current();
      }
    };

    // Attach local media stream tracks if already acquired
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        try {
          pc.addTrack(track, localStreamRef.current);
        } catch (err) {
          console.warn("Track addition warning:", err);
        }
      });
    }

    return pc;
  };

  // Process any queued ICE candidates once remote description is set
  const processQueuedCandidates = async (pc) => {
    if (!pc || !pc.remoteDescription) return;
    const candidates = [...queuedIceCandidatesRef.current];
    queuedIceCandidatesRef.current = [];
    for (const candidate of candidates) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn("Error adding queued ICE candidate:", err);
      }
    }
  };

  // Stable Socket.IO signaling event listeners (only bound once per user session)
  useEffect(() => {
    if (!loggedInUser) return;

    // 1. Incoming Call Ring Notification
    const handleIncomingRing = (data) => {
      // data: { from, callType, name, avatar, roomId, isGroup, groupName }
      if (callStateRef.current !== "idle") {
        // If it's the exact same call (retry or duplicate packet), ignore gracefully
        if (
          data.roomId === activeRoomIdRef.current ||
          data.from === targetPeerIdRef.current
        ) {
          return;
        }
        // Truly busy on another call
        socketAPI.emit("rejectCall", { to: data.from });
        return;
      }
      setIncomingCall(data);
      setCallState("ringing");
      setCallType(data.callType || "video");
      setActiveRoomId(data.roomId);
      activeRoomIdRef.current = data.roomId;
      targetPeerIdRef.current = data.from;
      setCurrentPeerInfo({
        name: data.name || "Caller",
        avatar: data.avatar || "",
      });
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
      if (payload.roomId) {
        activeRoomIdRef.current = payload.roomId;
        setActiveRoomId(payload.roomId);
      }

      const pc = pcRef.current;
      // If callee already accepted and pc is awaiting remote offer
      if (pc && pc.signalingState === "stable" && !pc.remoteDescription) {
        try {
          await pc.setRemoteDescription(
            new RTCSessionDescription(payload.signal),
          );
          await processQueuedCandidates(pc);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socketAPI.emit("answerCall", {
            to: payload.from,
            signal: answer,
            from: loggedInUser?._id,
            roomId: payload.roomId,
          });
        } catch (err) {
          console.warn("Failed to process offer on answer state:", err);
        }
      }
    };

    // 4. Remote Callee Accepted Call (Answer SDP received on caller side)
    const handleCallAccepted = async (payload) => {
      // payload: { signal, from, roomId }
      stopRingtone();
      setCallState("active");
      const pc = pcRef.current;
      if (pc && pc.signalingState === "have-local-offer") {
        try {
          await pc.setRemoteDescription(
            new RTCSessionDescription(payload.signal),
          );
          await processQueuedCandidates(pc);
        } catch (err) {
          console.warn("Failed to set remote answer on caller:", err);
        }
      }
    };

    // 5. Remote ICE Candidate received
    const handleIceCandidate = async ({ candidate }) => {
      if (!candidate) return;
      const pc = pcRef.current;
      if (
        pc &&
        pc.remoteDescription &&
        pc.remoteDescription.type &&
        pc.signalingState !== "closed"
      ) {
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
      if (endCallRef.current) endCallRef.current();
    };

    const handleUserLeftCall = () => {
      toast("User left the call", { icon: "👋" });
      if (endCallRef.current) endCallRef.current();
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
  }, [loggedInUser?._id]);

  /**
   * Initiate an outgoing voice or video call
   */
  const startCall = async (target, type = "voice") => {
    if (target?.isGroup) {
      toast("Group voice/video calls are coming soon! Please call members individually.", {
        icon: "ℹ️",
      });
      return;
    }

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
    activeRoomIdRef.current = roomId;
    setCallState("outgoing");
    setOutgoingCallStatus("calling");
    targetPeerIdRef.current = targetId;
    setCurrentPeerInfo({
      name: targetName,
      avatar: targetAvatar,
    });

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
      const camTrack = stream.getVideoTracks()[0];
      if (camTrack) {
        camTrackRef.current = camTrack;
      }

      // 2. Join call room and ring the target user via WebSocket
      socketAPI.emit("joinCall", { roomId });
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
    activeRoomIdRef.current = roomId;

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
      const camTrack = stream.getVideoTracks()[0];
      if (camTrack) {
        camTrackRef.current = camTrack;
      }

      // 2. Join call room on callee
      socketAPI.emit("joinCall", { roomId });

      // 3. Initialize PeerConnection
      const pc = createPeerConnection(callerId);

      // 3. Wait for offer if not yet received
      let offer = pendingOfferRef.current;
      if (!offer) {
        offer = await new Promise((resolve) => {
          const interval = setInterval(() => {
            if (pendingOfferRef.current) {
              clearInterval(interval);
              resolve(pendingOfferRef.current);
            }
          }, 100);
          setTimeout(() => {
            clearInterval(interval);
            resolve(null);
          }, 3500);
        });
      }

      if (!offer) {
        throw new Error("Call offer was not received from caller in time.");
      }

      // 4. Set remote description from caller's offer
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      await processQueuedCandidates(pc);

      // 5. Generate SDP Answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // 6. Send SDP Answer back to caller
      socketAPI.emit("answerCall", {
        to: callerId,
        signal: answer,
        from: loggedInUser?._id,
        roomId,
      });
    } catch (err) {
      console.error("Error answering call:", err);
      toast.error(err.message || "Failed to establish call connection.");
      endCall();
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
    activeRoomIdRef.current = null;
    pendingOfferRef.current = null;
  };

  /**
   * Terminate active or outgoing call
   */
  const endCall = () => {
    stopRingtone();

    const targetId = targetPeerIdRef.current;
    const roomId = activeRoomIdRef.current;

    // Detach all listeners before closing to prevent recursive teardown
    if (pcRef.current) {
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.oniceconnectionstatechange = null;
      pcRef.current.ontrack = null;
      pcRef.current.onicecandidate = null;
      try {
        pcRef.current.close();
      } catch (_e) {}
      pcRef.current = null;
    }

    // Notify both peer and room subscribers
    if (targetId) {
      socketAPI.emit("endCall", {
        to: targetId,
        roomId,
        userId: loggedInUser?._id,
      });
      socketAPI.emit("leaveCall", {
        to: targetId,
        roomId,
        userId: loggedInUser?._id,
      });
    } else if (roomId) {
      socketAPI.emit("leaveCall", {
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
        screenTrackRef.current.onended = null;
        screenTrackRef.current.stop();
      } catch (_e) {}
      screenTrackRef.current = null;
    }

    // Stop preserved camera track if any
    if (camTrackRef.current) {
      try {
        camTrackRef.current.stop();
      } catch (_e) {}
      camTrackRef.current = null;
    }

    isScreenSharingRef.current = false;

    localStreamRef.current = null;
    targetPeerIdRef.current = null;
    activeRoomIdRef.current = null;
    pendingOfferRef.current = null;
    queuedIceCandidatesRef.current = [];

    setLocalStream(null);
    setRemoteStreams({});
    setCallState("idle");
    setIncomingCall(null);
    setActiveRoomId(null);
    setIsScreenSharing(false);
    setOutgoingCallStatus("calling");
    setCurrentPeerInfo({ name: "Contact", avatar: "" });
  };

  // Keep endCallRef in sync with latest endCall instance
  endCallRef.current = endCall;

  /**
   * Toggle screen share using native replaceTrack
   */
  /**
   * Stop screen sharing and cleanly restore camera video track
   */
  const stopScreenShare = async () => {
    if (!isScreenSharingRef.current) return;
    isScreenSharingRef.current = false;
    setIsScreenSharing(false);

    // 1. Terminate screen track
    if (screenTrackRef.current) {
      try {
        screenTrackRef.current.onended = null;
        screenTrackRef.current.stop();
      } catch (_e) {}
      screenTrackRef.current = null;
    }

    // 2. Restore or re-acquire camera video track
    let camTrack = camTrackRef.current;
    if (!camTrack || camTrack.readyState === "ended") {
      try {
        // Request CAMERA ONLY (never request audio, audio is already active and running!)
        const newCamStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        camTrack = newCamStream.getVideoTracks()[0];
        camTrackRef.current = camTrack;
      } catch (err) {
        console.error("Could not re-acquire camera after screen share:", err);
        toast.error("Could not reopen camera. Please check camera permissions.");
      }
    } else {
      camTrack.enabled = true;
    }

    // 3. Hot-swap back to camera track on RTCPeerConnection sender
    if (pcRef.current && pcRef.current.signalingState !== "closed") {
      const senders = pcRef.current.getSenders();
      const videoSender = senders.find(
        (s) => s.track && s.track.kind === "video",
      );
      if (videoSender) {
        try {
          await videoSender.replaceTrack(camTrack || null);
        } catch (e) {
          console.error("replaceTrack back to camera failed:", e);
        }
      }
    }

    // 4. Update localStream state
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      const tracks = [...audioTracks];
      if (camTrack && camTrack.readyState === "live") {
        tracks.push(camTrack);
      }
      const updatedStream = new MediaStream(tracks);
      localStreamRef.current = updatedStream;
      setLocalStream(updatedStream);
    }
  };

  /**
   * Start screen sharing by acquiring display media and hot-swapping peer track
   */
  const startScreenShare = async () => {
    if (!pcRef.current || !localStreamRef.current) return;

    try {
      // 1. Preserve active camera track before replacing
      const currentCamTrack = localStreamRef.current.getVideoTracks()[0];
      if (currentCamTrack && currentCamTrack !== screenTrackRef.current) {
        camTrackRef.current = currentCamTrack;
        currentCamTrack.enabled = false;
      }

      // 2. Request screen capture from browser
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" },
        audio: false,
      });

      const screenVideoTrack = screenStream.getVideoTracks()[0];
      if (!screenVideoTrack) return;

      screenTrackRef.current = screenVideoTrack;
      isScreenSharingRef.current = true;
      setIsScreenSharing(true);

      // 3. Hot-swap video track on RTCPeerConnection
      const senders = pcRef.current.getSenders();
      const videoSender = senders.find(
        (s) => s.track && s.track.kind === "video",
      );
      if (videoSender) {
        await videoSender.replaceTrack(screenVideoTrack);
      }

      // 4. Handle user stopping share via browser's native banner ("Stop sharing")
      screenVideoTrack.onended = () => {
        stopScreenShare();
      };

      // 5. Update localStream so caller's active stream includes the screen track
      const audioTracks = localStreamRef.current.getAudioTracks();
      const updatedStream = new MediaStream([
        ...audioTracks,
        screenVideoTrack,
      ]);
      localStreamRef.current = updatedStream;
      setLocalStream(updatedStream);
    } catch (err) {
      if (err.name !== "NotAllowedError") {
        console.error("Screen share error:", err);
        toast.error("Failed to start screen sharing");
      }
    }
  };

  /**
   * Toggle between screen share and webcam
   */
  const toggleScreenShare = async () => {
    if (isScreenSharingRef.current) {
      await stopScreenShare();
    } else {
      await startScreenShare();
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
    currentPeerInfo,
    startCall,
    answerCall,
    rejectCall,
    endCall,
    toggleScreenShare,
  };
};

export default useWebRTC;
