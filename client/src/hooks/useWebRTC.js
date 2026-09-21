import { useState, useEffect, useRef, useCallback } from 'react';
import Peer from 'simple-peer';
import socketAPI from '../config/webSocket.js';
import toast from 'react-hot-toast';

const useWebRTC = (loggedInUser) => {
  const [callState, setCallState] = useState('idle'); // 'idle', 'ringing', 'outgoing', 'active'
  const [incomingCall, setIncomingCall] = useState(null);
  const [outgoingCallStatus, setOutgoingCallStatus] = useState('calling'); // 'calling', 'ringing'
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({}); // { userId: stream }
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callType, setCallType] = useState('video'); // 'video' | 'voice'
  const [activeRoomId, setActiveRoomId] = useState(null);

  const peersRef = useRef({}); // { userId: peerInstance }
  const myVideoRef = useRef(null);
  const audioContextRef = useRef(null);
  const ringtoneRef = useRef(null);

  // Initialize ringtone using Web Audio API
  useEffect(() => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext();
    } catch (e) {
      console.warn("Web Audio API not supported");
    }
  }, []);

  const playRingtone = useCallback(() => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    // Create a looping beep pattern
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.setValueAtTime(480, ctx.currentTime + 0.2);
    
    // Pulse volume
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.1);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.5);

    // Loop it every 2 seconds
    ringtoneRef.current = setInterval(() => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(440, ctx.currentTime);
      o.frequency.setValueAtTime(480, ctx.currentTime + 0.2);
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.1);
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.5);
    }, 2000);
  }, []);

  const stopRingtone = useCallback(() => {
    if (ringtoneRef.current) {
      clearInterval(ringtoneRef.current);
      ringtoneRef.current = null;
    }
  }, []);

  // Listeners for incoming calls
  useEffect(() => {
    if (!loggedInUser) return;

    socketAPI.on('incomingRing', (data) => {
      // data: { from, callType, name, roomId, isGroup, groupName }
      if (callState !== 'idle') return; // Busy
      setIncomingCall(data);
      setCallState('ringing');
      setCallType(data.callType);
      playRingtone();
    });

    socketAPI.on('callRejected', () => {
      endCall();
      toast('Call was rejected');
    });

    socketAPI.on('ringStatus', (data) => {
      setOutgoingCallStatus(data.status); // 'calling' or 'ringing'
    });

    socketAPI.on('userLeftCall', (userId) => {
      if (peersRef.current[userId]) {
        peersRef.current[userId].destroy();
        delete peersRef.current[userId];
      }
      setRemoteStreams(prev => {
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
      socketAPI.off('incomingRing');
      socketAPI.off('callRejected');
      socketAPI.off('userLeftCall');
    };
  }, [loggedInUser, callState]);

  // Transition to active when a stream is received
  useEffect(() => {
    if (callState === 'outgoing' && Object.keys(remoteStreams).length > 0) {
      setCallState('active');
    }
  }, [remoteStreams, callState]);

  // WebRTC mesh logic
  useEffect(() => {
    socketAPI.on('allCallUsers', (users) => {
      // Create an initiating peer for each user already in the room
      const currentStream = localStream; // Use a ref in reality if this changes
      users.forEach(userId => {
        const peer = createPeer(userId, socketAPI.id, currentStream, activeRoomId);
        peersRef.current[userId] = peer;
      });
    });

    socketAPI.on('incomingCall', (payload) => {
      // payload: { signal, from }
      // This is a signaling offer from someone joining the room
      const peer = addPeer(payload.signal, payload.from, localStream, activeRoomId);
      peersRef.current[payload.from] = peer;
    });

    socketAPI.on('callAccepted', (payload) => {
      // payload: { signal, from }
      // The other user answered our offer
      const peer = peersRef.current[payload.from];
      if (peer) {
        peer.signal(payload.signal);
      }
    });

    return () => {
      socketAPI.off('allCallUsers');
      socketAPI.off('incomingCall');
      socketAPI.off('callAccepted');
      socketAPI.off('ringStatus');
    };
  }, [localStream, activeRoomId]);

  const createPeer = (userToCall, callerId, stream, roomId) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on('signal', signal => {
      socketAPI.emit('callUser', {
        userToCall,
        signalData: signal,
        from: loggedInUser._id,
        roomId
      });
    });

    peer.on('stream', currentStream => {
      setRemoteStreams(prev => ({ ...prev, [userToCall]: currentStream }));
    });

    return peer;
  };

  const addPeer = (incomingSignal, callerId, stream, roomId) => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on('signal', signal => {
      socketAPI.emit('answerCall', { signal, to: callerId, from: loggedInUser._id, roomId });
    });

    peer.on('stream', currentStream => {
      setRemoteStreams(prev => ({ ...prev, [callerId]: currentStream }));
    });

    peer.signal(incomingSignal);

    return peer;
  };

  const startCall = async (chat, type) => {
    setCallType(type);
    const roomId = `room-${Date.now()}`;
    setActiveRoomId(roomId);
    setCallState('outgoing');
    setOutgoingCallStatus('calling');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === 'video',
        audio: true
      });
      setLocalStream(stream);

      // Ring the other user(s)
      if (chat.isGroup) {
        socketAPI.emit('ringGroup', {
          groupId: chat.id,
          from: loggedInUser._id,
          callType: type,
          name: loggedInUser.name,
          roomId
        });
      } else {
        socketAPI.emit('ringUser', {
          userToCall: chat.id,
          from: loggedInUser._id,
          callType: type,
          name: loggedInUser.name,
          roomId
        });
      }

      // Join the room ourselves to be ready
      socketAPI.emit('joinCall', { roomId, user: loggedInUser._id });
    } catch (err) {
      toast.error('Failed to access media devices');
      endCall();
    }
  };

  const answerCall = async () => {
    stopRingtone();
    if (!incomingCall) return;
    
    setCallState('active');
    setActiveRoomId(incomingCall.roomId);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: incomingCall.callType === 'video',
        audio: true
      });
      setLocalStream(stream);

      // Join the room
      socketAPI.emit('joinCall', { roomId: incomingCall.roomId, user: loggedInUser._id });
    } catch (err) {
      toast.error('Failed to access media devices');
      rejectCall();
    }
  };

  const rejectCall = () => {
    stopRingtone();
    if (incomingCall) {
      socketAPI.emit('rejectCall', { to: incomingCall.from });
    }
    setIncomingCall(null);
    setCallState('idle');
  };

  const endCall = () => {
    stopRingtone();
    
    if (activeRoomId) {
      socketAPI.emit('leaveCall', { roomId: activeRoomId, userId: loggedInUser._id });
    }

    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    Object.values(peersRef.current).forEach(peer => peer.destroy());
    peersRef.current = {};
    
    setLocalStream(null);
    setRemoteStreams({});
    setCallState('idle');
    setIncomingCall(null);
    setActiveRoomId(null);
    setIsScreenSharing(false);
    setOutgoingCallStatus('calling');
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Revert to camera
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const oldVideoTrack = localStream.getVideoTracks()[0];
        const newVideoTrack = newStream.getVideoTracks()[0];
        
        localStream.removeTrack(oldVideoTrack);
        localStream.addTrack(newVideoTrack);
        oldVideoTrack.stop();

        // Replace track in all peers
        Object.values(peersRef.current).forEach(peer => {
          peer.replaceTrack(oldVideoTrack, newVideoTrack, localStream);
        });
        
        setIsScreenSharing(false);
      } catch (err) {
        toast.error('Could not access camera');
      }
    } else {
      // Switch to screen
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ cursor: true });
        const oldVideoTrack = localStream.getVideoTracks()[0];
        const newVideoTrack = screenStream.getVideoTracks()[0];
        
        localStream.removeTrack(oldVideoTrack);
        localStream.addTrack(newVideoTrack);
        
        Object.values(peersRef.current).forEach(peer => {
          peer.replaceTrack(oldVideoTrack, newVideoTrack, localStream);
        });
        
        setIsScreenSharing(true);

        // When user clicks "Stop Sharing" on browser's native UI
        newVideoTrack.onended = () => {
          toggleScreenShare(); // Toggle back
        };
      } catch (err) {
        toast.error('Could not share screen');
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
