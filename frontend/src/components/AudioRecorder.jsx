import { useState, useRef, useEffect } from "react";
import { Mic, Square, Play, Pause } from "lucide-react";

const AudioRecorder = ({ onRecordingComplete, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      // Update duration every second
      intervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  };

  const handlePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSend = () => {
    if (audioBlob) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Audio = reader.result;
        onRecordingComplete({
          url: base64Audio,
          duration: duration,
          blob: audioBlob,
        });
        // Cleanup
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioBlob(null);
        setAudioUrl(null);
        setDuration(0);
      };
      reader.readAsDataURL(audioBlob);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  return (
    <div className="p-4 bg-base-200 rounded-lg space-y-3">
      {!audioBlob ? (
        <>
          <div className="flex items-center justify-center gap-4">
            {isRecording ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Recording...</span>
                </div>
                <span className="text-lg font-mono">{formatTime(duration)}</span>
                <button
                  onClick={stopRecording}
                  className="btn btn-sm btn-error"
                >
                  <Square className="w-4 h-4" />
                  Stop
                </button>
              </>
            ) : (
              <button
                onClick={startRecording}
                className="btn btn-primary"
              >
                <Mic className="w-5 h-5" />
                Start Recording
              </button>
            )}
          </div>
          {onCancel && (
            <button onClick={onCancel} className="btn btn-sm btn-ghost w-full">
              Cancel
            </button>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center gap-4">
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
            <button
              onClick={handlePlay}
              className="btn btn-circle btn-sm"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </button>
            <div className="flex-1">
              <div className="text-sm font-medium">Voice Message</div>
              <div className="text-xs text-base-content/60">{formatTime(duration)}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSend}
              className="btn btn-sm btn-primary flex-1"
            >
              Send
            </button>
            <button
              onClick={() => {
                if (audioUrl) URL.revokeObjectURL(audioUrl);
                setAudioBlob(null);
                setAudioUrl(null);
                setDuration(0);
              }}
              className="btn btn-sm btn-ghost"
            >
              Record Again
            </button>
            {onCancel && (
              <button onClick={onCancel} className="btn btn-sm btn-ghost">
                Cancel
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AudioRecorder;

