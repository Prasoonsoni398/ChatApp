import { useState, useRef, useCallback, useEffect } from "react";
import toast from "react-hot-toast";

export const useVoiceRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const recordingTimeRef = useRef(0);

  // Clean up stream & timer if component unmounts while recording
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        try {
          mediaRecorderRef.current.stop();
        } catch (_e) {}
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error("Audio recording is not supported on this browser");
        return false;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      let options = {};
      if (typeof MediaRecorder.isTypeSupported === "function") {
        if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
          options = { mimeType: "audio/webm;codecs=opus" };
        } else if (MediaRecorder.isTypeSupported("audio/webm")) {
          options = { mimeType: "audio/webm" };
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
          options = { mimeType: "audio/mp4" };
        }
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      recordingTimeRef.current = 0;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const next = prev + 1;
          recordingTimeRef.current = next;
          return next;
        });
      }, 1000);

      return true;
    } catch (err) {
      console.error("Microphone access error:", err);
      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      ) {
        toast.error(
          "Microphone permission denied. Please allow microphone access.",
        );
      } else {
        toast.error("Could not access microphone");
      }
      return false;
    }
  }, []);

  const stopRecording = useCallback(() => {
    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current;
      if (!mediaRecorder || mediaRecorder.state === "inactive") {
        resolve(null);
        return;
      }

      clearInterval(timerRef.current);
      const finalDuration = recordingTimeRef.current || recordingTime;

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mimeType,
        });

        // Clean up tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }

        setIsRecording(false);
        setRecordingTime(0);
        recordingTimeRef.current = 0;
        resolve({ blob: audioBlob, duration: finalDuration || 1 });
      };

      mediaRecorder.stop();
    });
  }, [recordingTime]);

  const cancelRecording = useCallback(() => {
    clearInterval(timerRef.current);
    const mediaRecorder = mediaRecorderRef.current;
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      try {
        mediaRecorder.stop();
      } catch (_e) {}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingTime(0);
    recordingTimeRef.current = 0;
  }, []);

  const formatRecordingTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return {
    isRecording,
    recordingTime,
    formattedTime: formatRecordingTime(recordingTime),
    startRecording,
    stopRecording,
    cancelRecording,
  };
};

export default useVoiceRecorder;
