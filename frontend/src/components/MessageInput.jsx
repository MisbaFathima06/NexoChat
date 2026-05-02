import { useRef, useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { sendMessage, updateLastMessage } from "../store/slices/chatSlice";
import { Image, Send, Mic, Paperclip, Clock, Lock, X, MapPin } from "lucide-react";
import toast from "react-hot-toast";
import MediaUpload from "./MediaUpload";
import { getSocket } from "../lib/socket";

const getCallPreviewText = (message, currentUserId) => {
  const senderId =
    typeof message.senderId === "object" ? message.senderId?._id : message.senderId;
  const isOwnMessage = senderId?.toString() === currentUserId?.toString();
  const callTypeLabel = message.callLog?.callType === "video" ? "Video" : "Voice";
  const status = message.callLog?.status || "ended";

  switch (status) {
    case "ringing":
      return `${callTypeLabel} call · ringing`;
    case "in-progress":
      return `${callTypeLabel} call · in call`;
    case "missed":
      return isOwnMessage ? `Unanswered ${callTypeLabel.toLowerCase()} call` : `Missed ${callTypeLabel.toLowerCase()} call`;
    case "cancelled":
      return isOwnMessage ? `Cancelled ${callTypeLabel.toLowerCase()} call` : `Missed ${callTypeLabel.toLowerCase()} call`;
    case "rejected":
      return isOwnMessage ? "Call declined" : "You declined the call";
    case "unavailable":
      return "User unavailable";
    default:
      return `${callTypeLabel} call`;
  }
};

const getPreviewTextForMessage = (message, currentUserId) => {
  if (!message) return "";

  const isCallMessage =
    message.messageType === "call" ||
    message.isCallLog === true ||
    (message.callLog && message.callLog.callId);

  if (isCallMessage) {
    return getCallPreviewText(message, currentUserId);
  }

  if (message.text) return message.text;
  if (message.image) return "📷 Photo";
  if (message.video) return "🎥 Video";
  if (message.audio) return "🎵 Audio";
  if (message.voice) return "🎤 Voice message";
  if (message.document) return "📄 Document";
  if (message.location) return "📍 Location";
  return "Message";
};

const MessageInput = () => {
  const [text, setText] = useState("");
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduledTime, setScheduledTime] = useState("");
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [disappearingDuration, setDisappearingDuration] = useState(0);
  const [mediaData, setMediaData] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const dispatch = useAppDispatch();
  const { selectedUser, isSending } = useAppSelector((state) => state.chat);
  const { selectedGroup } = useAppSelector((state) => state.groups);
  const { theme } = useAppSelector((state) => state.theme);
  const { user } = useAppSelector((state) => state.auth);
  const socket = getSocket();

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);
  const audioStreamRef = useRef(null);
  const shouldSendRecordingRef = useRef(false);
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const chatId = selectedGroup?._id || selectedUser?._id;
  const isGroup = !!selectedGroup;

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !mediaData) return;
    if (!chatId) return;

    try {
      // Debug: Log media data
      if (mediaData) {
        console.log("Sending media:", mediaData.type, mediaData.data ? "Has data" : "No data", mediaData.url ? "Has url" : "No url");
      }
      
      const messageData = {
        text: text.trim() || undefined,
        messageType: mediaData?.type || "text",
        isEncrypted,
        ...(mediaData?.type === "image" && { image: mediaData.data || mediaData.url }),
        ...(mediaData?.type === "video" && { video: mediaData.data || mediaData.url }),
        ...(mediaData?.type === "document" && {
          document: {
            url: mediaData.url,
            fileName: mediaData.fileName,
            fileSize: mediaData.fileSize,
            mimeType: mediaData.mimeType,
          },
        }),
        ...(mediaData?.type === "location" && {
          location: {
            latitude: mediaData.latitude,
            longitude: mediaData.longitude,
            address: mediaData.address || "",
            name: mediaData.name || "",
          },
        }),
        ...(showSchedule && scheduledTime && {
          scheduledFor: new Date(scheduledTime).toISOString(),
        }),
        ...(disappearingDuration > 0 && {
          disappearingMessage: {
            enabled: true,
            duration: disappearingDuration,
          },
        }),
      };

      const sentMessage = await dispatch(
        sendMessage({
          id: isGroup ? undefined : chatId,
          groupId: isGroup ? chatId : undefined,
          messageData,
        })
      ).unwrap();

      if (!isGroup && sentMessage) {
        dispatch(
          updateLastMessage({
            userId: chatId,
            preview: getPreviewTextForMessage(sentMessage, user?._id),
            timestamp: sentMessage.createdAt || new Date(),
            message: sentMessage,
            isFromMe: true,
          })
        );
      }

      // Clear form
      setText("");
      setMediaData(null);
      setShowMediaUpload(false);
      setShowSchedule(false);
      setScheduledTime("");
      setIsEncrypted(false);
      setDisappearingDuration(0);

      toast.success("Message sent");
    } catch (error) {
      toast.error(error.message || "Failed to send message");
    }
  };

  const handleTyping = (isTyping) => {
    if (socket && chatId) {
      socket.emit("typing", {
        receiverId: isGroup ? undefined : chatId,
        groupId: isGroup ? chatId : undefined,
        isTyping,
      });
    }
  };

  const handleMediaSelect = (data) => {
    setMediaData(data);
    setShowMediaUpload(false);
  };

  const handleShareLocation = () => {
    if (!chatId) {
      toast.error("Select a chat before sharing location");
      return;
    }

    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Try to get address using reverse geocoding (optional)
          let address = "";
          let name = "";
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
            );
            const data = await response.json();
            if (data.display_name) {
              address = data.display_name;
              name = data.address?.name || data.address?.road || "";
            }
          } catch (error) {
            console.log("Could not fetch address:", error);
          }

          const locationData = {
            type: "location",
            latitude,
            longitude,
            address,
            name,
          };

          setMediaData(locationData);
          setIsGettingLocation(false);
        } catch (error) {
          console.error("Error getting location:", error);
          toast.error("Failed to get location");
          setIsGettingLocation(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast.error("Failed to get your location. Please check your permissions.");
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const blobToBase64 = (blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const sendVoiceMessage = async (audioData, duration) => {
    if (!chatId) return;
    try {
      await dispatch(
        sendMessage({
          id: isGroup ? undefined : chatId,
          groupId: isGroup ? chatId : undefined,
          messageData: {
            messageType: "voice",
            voice: {
              url: audioData,
              duration,
            },
          },
        })
      ).unwrap();
      toast.success("Voice message sent");
    } catch (error) {
      toast.error(error.message || "Failed to send voice message");
    }
  };

  const startRecording = async () => {
    if (isRecording) return;
    if (!chatId) {
      toast.error("Select a chat before recording");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      shouldSendRecordingRef.current = false;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        audioStreamRef.current = null;
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
          recordingIntervalRef.current = null;
        }
        const shouldSend = shouldSendRecordingRef.current;
        shouldSendRecordingRef.current = false;
        setIsRecording(false);

        if (!shouldSend || audioChunksRef.current.length === 0) {
          audioChunksRef.current = [];
          setRecordingDuration(0);
          return;
        }

        try {
          const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          audioChunksRef.current = [];
          const base64Audio = await blobToBase64(blob);
          await sendVoiceMessage(base64Audio, recordingDuration || 1);
        } catch (error) {
          console.error("Failed to process voice message", error);
          toast.error("Failed to send voice message");
        } finally {
          setRecordingDuration(0);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = (shouldSend) => {
    if (!isRecording || !mediaRecorderRef.current) return;
    shouldSendRecordingRef.current = shouldSend;
    mediaRecorderRef.current.stop();
  };

  const handleMicPress = (event) => {
    event?.preventDefault();
    startRecording();
  };

  const handleMicRelease = () => {
    if (isRecording) {
      stopRecording(true);
    }
  };

  const handleMicCancel = () => {
    if (isRecording) {
      stopRecording(false);
      toast("Recording cancelled", { icon: "✋" });
    }
  };

  const isDarkTheme = theme === "whatsapp-dark";
  const panelBgClass = isDarkTheme
    ? "bg-[#111b21] border-[#1f2a32]"
    : "bg-gradient-to-t from-[#e9edef] via-[#f4f5f5] to-[#f8fafb] border-transparent";
  const optionTextClass = isDarkTheme ? "text-[#aebac1]" : "text-[#54656f]";
  const chipBgClass = isDarkTheme ? "bg-[#202c33]" : "bg-white";
  const chipBorderClass = isDarkTheme ? "border-[#2a3942]" : "border-[#d1d7db]";

  return (
    <div className={`px-4 py-4 w-full border-t ${panelBgClass}`}>
      {/* Options Bar */}
      <div
        className={`flex items-center gap-3 mb-3 text-xs sm:text-sm px-3 py-2 rounded-full ${
          isDarkTheme ? "bg-[#1f2a32] text-[#aebac1]" : "bg-white/80 text-[#54656f] shadow-sm border border-[#d1d7db]/70"
        }`}
      >
        <label className="flex items-center gap-1 cursor-pointer">
          <input
            type="checkbox"
            checked={isEncrypted}
            onChange={(e) => setIsEncrypted(e.target.checked)}
            className="checkbox checkbox-xs"
          />
          <Lock className="w-3 h-3" />
          <span className="text-xs">Encrypt</span>
        </label>
        <button
          onClick={() => setShowSchedule(!showSchedule)}
          className={`btn btn-xs ${showSchedule ? "btn-primary" : isDarkTheme ? "btn-neutral btn-outline" : "btn-ghost"}`}
        >
          <Clock className="w-3 h-3" />
          Schedule
        </button>
        <select
          value={disappearingDuration}
          onChange={(e) => setDisappearingDuration(Number(e.target.value))}
          className={`select select-xs ${isDarkTheme ? "select-bordered select-neutral" : "select-bordered"}`}
        >
          <option value={0}>No expiry</option>
          <option value={24}>24 hours</option>
          <option value={168}>7 days</option>
        </select>
      </div>

      {/* Schedule Input */}
      {showSchedule && (
        <div className="mb-2">
          <input
            type="datetime-local"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            className="input input-sm input-bordered w-full"
            min={new Date().toISOString().slice(0, 16)}
          />
        </div>
      )}

      {isRecording && (
        <div className="mb-2 flex items-center gap-2 text-error">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          <span className="text-sm font-medium">
            Recording... {formatDuration(recordingDuration)} • release to send
          </span>
        </div>
      )}

      {/* Media Preview */}
      {mediaData && mediaData.type !== "voice" && (
        <div className="mb-2 flex items-center gap-2">
          {mediaData.type === "image" && (
            <img
              src={mediaData.data}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg"
            />
          )}
          {mediaData.type === "document" && (
            <div className="p-2 bg-base-200 rounded-lg">
              <div className="text-xs font-medium">{mediaData.fileName}</div>
            </div>
          )}
          {mediaData.type === "location" && (
            <div className="p-2 bg-base-200 rounded-lg flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <div className="text-xs">
                <div className="font-medium">Location</div>
                {mediaData.address && (
                  <div className="text-base-content/60 truncate max-w-[200px]">
                    {mediaData.address}
                  </div>
                )}
              </div>
            </div>
          )}
            <button
            onClick={() => setMediaData(null)}
            className="btn btn-xs btn-circle"
            >
            <X className="w-3 h-3" />
            </button>
          </div>
      )}

      {/* Media Upload */}
      {showMediaUpload && (
        <div className="mb-2">
          <MediaUpload
            onFileSelect={handleMediaSelect}
            onClose={() => setShowMediaUpload(false)}
          />
        </div>
      )}

      {/* Main Input */}
      <form onSubmit={handleSendMessage} className="flex items-center gap-3">
        <div
          className={`flex items-center gap-2 flex-1 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 border ${chipBorderClass} ${chipBgClass} shadow-sm`}
        >
          <button
            type="button"
            onClick={() => setShowMediaUpload(!showMediaUpload)}
            className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
              showMediaUpload
                ? "bg-[#25d366] text-white"
                : isDarkTheme
                  ? "text-[#aebac1] hover:bg-[#2a3942]"
                  : "text-[#54656f] hover:bg-[#f5f6f6]"
            }`}
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleShareLocation}
            disabled={isGettingLocation}
            className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
              isGettingLocation
                ? "opacity-50 cursor-not-allowed"
                : isDarkTheme
                  ? "text-[#aebac1] hover:bg-[#2a3942]"
                  : "text-[#54656f] hover:bg-[#f5f6f6]"
            }`}
            title="Share location"
          >
            {isGettingLocation ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <MapPin className="w-4 h-4" />
            )}
          </button>

          <input
            type="text"
            className={`flex-1 bg-transparent border-none outline-none text-[15px] ${isDarkTheme ? "text-white placeholder:text-[#aebac1]" : "text-[#111b21] placeholder:text-[#8696a0]"}`}
            placeholder="Type a message"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              handleTyping(true);
            }}
            onBlur={() => handleTyping(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
          />

          <button
            type="button"
            onMouseDown={handleMicPress}
            onMouseUp={handleMicRelease}
            onMouseLeave={handleMicCancel}
            onTouchStart={(e) => {
              e.preventDefault();
              handleMicPress(e);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleMicRelease();
            }}
            onTouchCancel={(e) => {
              e.preventDefault();
              handleMicCancel();
            }}
            className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
              isRecording
                ? "bg-error text-white animate-pulse"
                : isDarkTheme
                  ? "text-[#aebac1] hover:bg-[#2a3942]"
                  : "text-[#54656f] hover:bg-[#f5f6f6]"
            }`}
            title="Hold to record"
          >
            <Mic className="w-4 h-4" />
          </button>
        </div>

        <button
          type="submit"
          className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-all ${
            (!text.trim() && !mediaData) || isSending
              ? "bg-[#94c2a8] cursor-not-allowed"
              : "bg-[#25d366] hover:bg-[#1abc5b]"
          }`}
          disabled={(!text.trim() && !mediaData) || isSending}
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
