import { useState, useEffect, useRef, useCallback } from "react";
import Peer from "simple-peer";
import socketAPI from "../config/webSocket.js";
import toast from "react-hot-toast";
import {
  startIncomingRingtone,
  startOutgoingCallRingtone,
  stopRingtone,
} from "../utils/notificationAudio.js";

const useWebRTC = (loggedInUser) => {
  const [callState, setCallState] = useState("idle"); // 'idle', 'ringing', 'outgoing', 'active'
  const [incomingCall, setIncomingCall] = useState(null);
  const [outgoingCallStatus, setOutgoingCallStatus] = useState("calling"); // 'calling', 'ringing'
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({}); // { userId: stream }
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callType, setCallType] = useState("video"); // 'video' | 'voice'
  const [activeRoomId, setActiveRoomId] = useState(null);

  const peersRef = useRef({}); // { userId: peerInstance }
  const myVideoRef = useRef(null);

  // Automatically trigger incoming and outgoing ringing sounds based on call state
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

  // Listeners for incoming calls
  useEffect(() => {
    if (!loggedInUser) return;

    socketAPI.on("incomingRing", (data) => {
      // data: { from, callType, name, roomId, isGroup, groupName }
      if (callState !== "idle") return; // Busy
      setIncomingCall(data);
      setCallState("ringing");
      setCallType(data.callType);
    });

    socketAPI.on("callRejected", () => {
      endCall();
      toast("Call was rejected");
    });

    socketAPI.on("ringStatus", (data) => {
      setOutgoingCallStatus(data.status); // 'calling' or 'ringing'
    });

    socketAPI.on("userLeftCall", (userId) => {
      if (peersRef.current[userId]) {
        peersRef.current[userId].destroy();
        delete peersRef.current[userId];
      }
      setRemoteStreams((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
      // If no peers left in a 1-on-1, end the call
      if (Object.keys(peersRef.current).length === 0) {
        endCall();
      }
    });

    return () => {
      socketAPI.off("incomingRing");
      socketAPI.off("callRejected");
      socketAPI.off("userLeftCall");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedInUser, callState]);

  // Transition to active when a stream is received
  useEffect(() => {
    if (callState === "outgoing" && Object.keys(remoteStreams).length > 0) {
      setTimeout(() => setCallState("active"), 0);
    }
  }, [remoteStreams, callState]);

  // WebRTC mesh logic
  useEffect(() => {
    socketAPI.on("allCallUsers", (users) => {
      // Create an initiating peer for each user already in the room
      const currentStream = localStream; // Use a ref in reality if this changes
      users.forEach((userId) => {
        const peer = createPeer(
          userId,
          socketAPI.id,
          currentStream,
          activeRoomId,
        );
        peersRef.current[userId] = peer;
      });
    });

    socketAPI.on("incomingCall", (payload) => {
      // payload: { signal, from }
      // This is a signaling offer from someone joining the room
      const peer = addPeer(
        payload.signal,
        payload.from,
        localStream,
        activeRoomId,
      );
      peersRef.current[payload.from] = peer;
    });

    socketAPI.on("callAccepted", (payload) => {
      // payload: { signal, from }
      // The other user answered our offer
      const peer = peersRef.current[payload.from];
      if (peer) {
        peer.signal(payload.signal);
      }
    });

    return () => {
      socketAPI.off("allCallUsers");
      socketAPI.off("incomingCall");
      socketAPI.off("callAccepted");
      socketAPI.off("ringStatus");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localStream, activeRoomId]);

  function createPeer(userToCall, callerId, stream, roomId) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socketAPI.emit("callUser", {
        userToCall,
        signalData: signal,
        from: loggedInUser._id,
        roomId,
      });
    });

    peer.on("stream", (currentStream) => {
      setRemoteStreams((prev) => ({ ...prev, [userToCall]: currentStream }));
    });

    return peer;
  }

  function addPeer(incomingSignal, callerId, stream, roomId) {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socketAPI.emit("answerCall", {
        signal,
        to: callerId,
        from: loggedInUser._id,
        roomId,
      });
    });

    peer.on("stream", (currentStream) => {
      setRemoteStreams((prev) => ({ ...prev, [callerId]: currentStream }));
    });

    peer.signal(incomingSignal);

    return peer;
  }

  const recordCallLog = (logEntry) => {
    try {
      const saved = JSON.parse(localStorage.getItem("chat_call_logs") || "[]");
      const updated = [logEntry, ...saved.slice(0, 49)];
      localStorage.setItem("chat_call_logs", JSON.stringify(updated));
      window.dispatchEvent(new Event("call_logs_updated"));
    } catch (_e) {}
  };

  const startCall = async (chat, type) => {
    setCallType(type);
    const roomId = `room-${Date.now()}`;
    setActiveRoomId(roomId);
    setCallState("outgoing");
    setOutgoingCallStatus("calling");

    recordCallLog({
      id: roomId,
      userId: chat.id || chat._id,
      name: chat.name || "Contact",
      avatar: chat.avatar,
      type: type,
      direction: "outgoing",
      status: "answered",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === "video",
        audio: true,
      });
      setLocalStream(stream);

      // Ring the other user(s)
      if (chat.isGroup) {
        socketAPI.emit("ringGroup", {
          groupId: chat.id,
          from: loggedInUser._id,
          callType: type,
          name: loggedInUser.name,
          roomId,
        });
      } else {
        socketAPI.emit("ringUser", {
          userToCall: chat.id,
          from: loggedInUser._id,
          callType: type,
          name: loggedInUser.name,
          roomId,
        });
      }

      // Join the room ourselves to be ready
      socketAPI.emit("joinCall", { roomId, user: loggedInUser._id });
    } catch {
      toast.error("Failed to access media devices");
      endCall();
    }
  };

  const answerCall = async () => {
    stopRingtone();
    if (!incomingCall) return;

    recordCallLog({
      id: incomingCall.roomId || Date.now().toString(),
      userId: incomingCall.from,
      name: incomingCall.name || "Caller",
      avatar: incomingCall.avatar,
      type: incomingCall.callType || "voice",
      direction: "incoming",
      status: "answered",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    });

    setCallState("active");
    setActiveRoomId(incomingCall.roomId);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: incomingCall.callType === "video",
        audio: true,
      });
      setLocalStream(stream);

      // Join the room
      socketAPI.emit("joinCall", {
        roomId: incomingCall.roomId,
        user: loggedInUser._id,
      });
    } catch {
      toast.error("Failed to access media devices");
      rejectCall();
    }
  };

  const rejectCall = () => {
    stopRingtone();
    if (incomingCall) {
      recordCallLog({
        id: incomingCall.roomId || Date.now().toString(),
        userId: incomingCall.from,
        name: incomingCall.name || "Caller",
        avatar: incomingCall.avatar,
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
  };

  function endCall() {
    stopRingtone();

    if (activeRoomId) {
      socketAPI.emit("leaveCall", {
        roomId: activeRoomId,
        userId: loggedInUser._id,
      });
    }

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    Object.values(peersRef.current).forEach((peer) => peer.destroy());
    peersRef.current = {};

    setLocalStream(null);
    setRemoteStreams({});
    setCallState("idle");
    setIncomingCall(null);
    setActiveRoomId(null);
    setIsScreenSharing(false);
    setOutgoingCallStatus("calling");
  }

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Revert to camera
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        const oldVideoTrack = localStream.getVideoTracks()[0];
        const newVideoTrack = newStream.getVideoTracks()[0];

        localStream.removeTrack(oldVideoTrack);
        localStream.addTrack(newVideoTrack);
        oldVideoTrack.stop();

        // Replace track in all peers
        Object.values(peersRef.current).forEach((peer) => {
          peer.replaceTrack(oldVideoTrack, newVideoTrack, localStream);
        });

        setIsScreenSharing(false);
      } catch {
        toast.error("Could not access camera");
      }
    } else {
      // Switch to screen
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          cursor: true,
        });
        const oldVideoTrack = localStream.getVideoTracks()[0];
        const newVideoTrack = screenStream.getVideoTracks()[0];

        localStream.removeTrack(oldVideoTrack);
        localStream.addTrack(newVideoTrack);

        Object.values(peersRef.current).forEach((peer) => {
          peer.replaceTrack(oldVideoTrack, newVideoTrack, localStream);
        });

        setIsScreenSharing(true);

        // When user clicks "Stop Sharing" on browser's native UI
        newVideoTrack.onended = () => {
          toggleScreenShare(); // Toggle back
        };
      } catch {
        toast.error("Could not share screen");
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
    myVideoRef, // If needed directly
  };
};

export default useWebRTC;
