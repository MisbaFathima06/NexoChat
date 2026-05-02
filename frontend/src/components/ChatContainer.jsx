import { useAppDispatch, useAppSelector } from "../store/hooks";
import { useEffect, useRef, useState, useMemo } from "react";
import {
  getMessages,
  addMessage,
  updateMessage,
  deleteMessage,
  editMessage,
  setTyping,
  markMessagesRead,
  addReaction,
  addMessageReader,
  markMessageDeleted,
  markAsRead,
  incrementUnread,
  updateLastMessage,
} from "../store/slices/chatSlice";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { formatMessageTime } from "../lib/utils";
import { Check, CheckCheck, Smile, Video, Phone, File, Mic, Image as ImageIcon, X, Trash2, PhoneIncoming, PhoneOutgoing, PhoneMissed, Copy, Reply, Forward, Info, MoreVertical, MapPin, ExternalLink, Edit } from "lucide-react";
import toast from "react-hot-toast";
import { playNotificationSound, showBrowserNotification } from "../lib/notifications";
import { getGroupDetails } from "../store/slices/groupSlice";
import ImageModal from "./ImageModal";
import { getSocket } from "../lib/socket";

const REACTIONS = ["❤️", "👍", "😂", "😮", "😢", "🙏"];
const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

const ChatContainer = () => {
  const dispatch = useAppDispatch();
  const { messages, selectedUser, typingUsers, isLoading, unreadCounts } = useAppSelector(
    (state) => state.chat
  );
  const { selectedGroup } = useAppSelector((state) => state.groups);
  const { user } = useAppSelector((state) => state.auth);
  const socket = getSocket();
  const [page, setPage] = useState(1);
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [deletingMessageId, setDeletingMessageId] = useState(null);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, messageId: null });
  const [showDeleteModal, setShowDeleteModal] = useState({ visible: false, messageId: null, canDeleteForEveryone: false });
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState("");
  const messageEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const { pagination } = useAppSelector((state) => state.chat);

  // Get all image messages for modal navigation
  const imageMessages = useMemo(() => {
    return messages.filter((msg) => msg.image);
  }, [messages]);

  const formatCallDuration = (seconds = 0) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) {
      return `${secs}s`;
    }
    return `${mins}m ${secs.toString().padStart(2, "0")}s`;
  };

  const getCallCopy = (status = "ended", callType = "audio", isOwnMessage = false, durationLabel = "") => {
    const normalizedType = callType === "video" ? "video" : "voice";
    const label = normalizedType === "video" ? "Video" : "Voice";

    switch (status) {
      case "ringing":
        return { title: `${label} call`, subtitle: "Ringing…", accentClass: "" };
      case "in-progress":
        return { title: `${label} call`, subtitle: "Connected", accentClass: "" };
      case "ended":
        return {
          title: `${label} call`,
          subtitle: durationLabel || "Ended",
          accentClass: "",
        };
      case "missed":
        return {
          title: isOwnMessage ? `Unanswered ${normalizedType} call` : `Missed ${normalizedType} call`,
          subtitle: null,
          accentClass: isOwnMessage ? "" : "text-error",
        };
      case "cancelled":
        return {
          title: isOwnMessage ? `Cancelled ${normalizedType} call` : `Missed ${normalizedType} call`,
          subtitle: null,
          accentClass: isOwnMessage ? "" : "text-error",
        };
      case "rejected":
        return {
          title: isOwnMessage ? "Call declined" : "You declined the call",
          subtitle: label,
          accentClass: "",
        };
      case "busy":
        return { title: "User busy", subtitle: "Try again later", accentClass: "" };
      case "unavailable":
        return { title: "User unavailable", subtitle: "Call could not connect", accentClass: "" };
      default:
        return { title: `${label} call`, subtitle: "", accentClass: "" };
    }
  };

  const getCallPreviewText = (message) => {
    const senderId =
      typeof message.senderId === "object" ? message.senderId?._id : message.senderId;
    const isOwnMessage = senderId?.toString() === user?._id;
    const callType = message.callLog?.callType || (message.messageType === "call" ? "audio" : "audio");
    const status = message.callLog?.status || "ended";
    const durationLabel =
      status === "ended" && message.callLog?.durationSeconds
        ? formatCallDuration(message.callLog.durationSeconds)
        : "";
    const { title, subtitle } = getCallCopy(status, callType, isOwnMessage, durationLabel);
    return subtitle ? `${title}${durationLabel ? " · " : " "}${subtitle}` : title;
  };

  const getMessagePreviewText = (message) => {
    if (!message) return "";
    // Check if this is actually a call log message
    const isCallLog = message.messageType === "call" || 
                     message.isCallLog === true || 
                     (message.callLog && message.callLog.callId);
    if (isCallLog) {
      return getCallPreviewText(message);
    }
    if (message.text) return message.text;
    if (message.image) return "📷 Image";
    if (message.video) return "🎥 Video";
    if (message.audio) return "🎵 Audio";
    if (message.document) return "📄 Document";
    if (message.voice) return "🎤 Voice";
    if (message.location) return "📍 Location";
    return "Message";
  };

  const chatId = selectedGroup?._id || selectedUser?._id;
  const isGroup = !!selectedGroup;
  const currentChatId = isGroup ? `group:${chatId}` : chatId;

  // Load messages
  useEffect(() => {
    if (chatId) {
      setPage(1);
      dispatch(
        getMessages({
          id: isGroup ? undefined : chatId,
          groupId: isGroup ? chatId : undefined,
          page: 1,
        })
      ).catch((error) => {
        console.error("Failed to load messages:", error);
        toast.error("Failed to load messages. Please try again.");
      });
    } else {
      console.log("No chatId, cannot load messages");
    }
  }, [chatId, isGroup, selectedGroup, selectedUser, dispatch]);

  // Infinite scroll handler
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = async () => {
      if (container.scrollTop === 0 && pagination.hasMore && !isLoadingMore) {
        setIsLoadingMore(true);
        const nextPage = page + 1;
        try {
          await dispatch(
            getMessages({
              id: isGroup ? undefined : chatId,
              groupId: isGroup ? chatId : undefined,
              page: nextPage,
            })
          ).unwrap();
          setPage(nextPage);
        } catch (error) {
          console.error("Failed to load more messages:", error);
        } finally {
          setIsLoadingMore(false);
        }
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [chatId, isGroup, page, pagination.hasMore, isLoadingMore, dispatch]);

    // Refresh group details when group is selected
    useEffect(() => {
      if (selectedGroup?._id) {
        dispatch(getGroupDetails(selectedGroup._id));
      }
    }, [selectedGroup?._id, dispatch]);

    // Socket listeners
    useEffect(() => {
      if (!chatId) return;
      
      if (!socket) {
        console.warn("Socket not connected. Messages may not update in real-time.");
        return;
      }

    const handleNewMessage = (message) => {
        const msgSenderId = typeof message.senderId === "string" 
          ? message.senderId 
          : message.senderId._id || message.senderId;
        const msgReceiverId = typeof message.receiverId === "string" 
          ? message.receiverId 
          : message.receiverId?._id || message.receiverId;
        const msgGroupId = typeof message.groupId === "string"
          ? message.groupId
          : (message.groupId?._id || message.groupId);
        const isFromCurrentChat = (isGroup && msgGroupId && msgGroupId.toString() === chatId.toString()) ||
          (!isGroup && (msgSenderId === chatId || msgReceiverId === chatId));
        const previewText = getMessagePreviewText(message);
        
        if (isFromCurrentChat) {
          dispatch(addMessage(message));
          // Mark as delivered
          if (socket && msgSenderId !== user._id) {
            socket.emit("messageDelivered", {
              messageId: message._id,
              receiverId: user._id,
            });
          }
        } else if (msgSenderId !== user._id) {
          // New message from another chat
          dispatch(incrementUnread({ userId: msgSenderId }));
          dispatch(updateLastMessage({
            userId: msgSenderId,
            preview: previewText,
            timestamp: message.createdAt || new Date(),
            message,
            isFromMe: false,
          }));
          
          // Play sound and show notification
          playNotificationSound();
          const senderName = typeof message.senderId === "object" && message.senderId?.fullName
            ? message.senderId.fullName
            : "Someone";
          showBrowserNotification(
            senderName,
            message.text || "New message",
            typeof message.senderId === "object" && message.senderId?.profilePic
              ? message.senderId.profilePic
              : "/avatar.png"
          );
          
          // Refresh users list to update order
          dispatch({ type: "chat/getUsers" });
        }
    };

    const handleTyping = ({ userId, isTyping }) => {
      dispatch(setTyping({ userId, isTyping, chatId: currentChatId }));
    };

    const handleMessagesRead = ({ messageIds }) => {
      dispatch(markMessagesRead({ messageIds }));
    };

    const handleGroupMessageRead = ({ messageId, reader }) => {
      if (!messageId || !reader) return;
      dispatch(addMessageReader({ messageId, reader }));
    };

    const handleMessageDeleted = ({ messageId, deletedBy, deletedAt }) => {
      dispatch(markMessageDeleted({ messageId, deletedBy, deletedAt }));
    };

    const handleMessageReaction = ({ messageId, reaction }) => {
      dispatch(updateMessage({ messageId, updates: { reactions: [reaction] } }));
    };

    const handleMessageUpdated = (updatedMessage) => {
      if (!updatedMessage?._id) return;
      dispatch(updateMessage({ messageId: updatedMessage._id, updates: updatedMessage }));

      const msgSenderId =
        typeof updatedMessage.senderId === "string"
          ? updatedMessage.senderId
          : updatedMessage.senderId?._id || updatedMessage.senderId;

      if (msgSenderId && msgSenderId !== user._id) {
        dispatch(
          updateLastMessage({
            userId: msgSenderId,
            preview: getMessagePreviewText(updatedMessage),
            timestamp: updatedMessage.updatedAt || updatedMessage.createdAt || new Date(),
            message: updatedMessage,
            isFromMe: false,
          })
        );
      }
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("typing", handleTyping);
    socket.on("messagesRead", handleMessagesRead);
    socket.on("groupMessageRead", handleGroupMessageRead);
    socket.on("messageDeleted", handleMessageDeleted);
    socket.on("messageReaction", handleMessageReaction);
    socket.on("messageUpdated", handleMessageUpdated);

    // Join group room if group chat
    if (isGroup) {
      socket.emit("joinGroup", chatId);
    }

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("typing", handleTyping);
      socket.off("messagesRead", handleMessagesRead);
      socket.off("groupMessageRead", handleGroupMessageRead);
      socket.off("messageDeleted", handleMessageDeleted);
      socket.off("messageReaction", handleMessageReaction);
      socket.off("messageUpdated", handleMessageUpdated);
      if (isGroup) {
        socket.emit("leaveGroup", chatId);
      }
    };
  }, [socket, chatId, isGroup, user, dispatch, currentChatId]);

  // Scroll to bottom
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Mark messages as read when visible
  useEffect(() => {
    if (!chatId || !user) return;

    const unreadMessages = messages.filter((msg) => {
      if (msg.isSystemMessage) return false;

      const msgSenderId =
        typeof msg.senderId === "string"
          ? msg.senderId
          : msg.senderId?._id || msg.senderId;

      if (msgSenderId === user._id) return false;

      if (isGroup) {
        const readers = msg.readReceipts?.readers || [];
        const hasRead = readers.some((reader) => {
          const readerId =
            typeof reader.userId === "object"
              ? reader.userId._id
              : reader.userId;
          return readerId?.toString() === user._id;
        });
        return !hasRead;
      }

      return !msg.readReceipts?.read && msgSenderId === chatId;
    });

    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map((m) => m._id);
      dispatch(markMessagesRead({ messageIds }));
      dispatch(markAsRead(messageIds));

      if (isGroup) {
        unreadMessages.forEach((msg) => {
          dispatch(
            addMessageReader({
              messageId: msg._id,
              reader: {
                userId: user._id,
                fullName: user.fullName,
                profilePic: user.profilePic,
                readAt: new Date().toISOString(),
              },
            })
          );
        });
      }

      if (socket && !isGroup) {
        socket.emit("messageRead", {
          messageIds,
          receiverId: chatId,
        });
      }
    }
  }, [messages, chatId, user, isGroup, socket, dispatch]);

  const handleReaction = async (messageId, emoji) => {
    try {
      await dispatch(addReaction({ messageId, emoji })).unwrap();
      setShowReactionPicker(null);
    } catch (error) {
      toast.error("Failed to add reaction");
    }
  };

  const handleDeleteMessage = async (messageId, deleteForEveryone = false) => {
    if (!messageId) return;

    setDeletingMessageId(messageId);
    setShowDeleteModal({ visible: false, messageId: null, canDeleteForEveryone: false });
    
    try {
      if (deleteForEveryone) {
        await dispatch(deleteMessage(messageId)).unwrap();
        toast.success("Message deleted for everyone");
      } else {
        // Delete for me only - just remove from local state
        // In a real app, you'd call an API to hide this message for the current user
        dispatch({ type: "chat/removeMessageLocally", payload: messageId });
        toast.success("Message deleted for you");
      }
    } catch (error) {
      toast.error(error?.message || "Failed to delete message");
    } finally {
      setDeletingMessageId(null);
    }
  };

  const openDeleteModal = (message) => {
    const withinWindow = Date.now() - new Date(message.createdAt).getTime() <= FIFTEEN_MINUTES_MS;
    const senderId = typeof message.senderId === "object" ? message.senderId?._id : message.senderId;
    const isOwnMessage = senderId?.toString() === user?._id;
    
    setShowDeleteModal({
      visible: true,
      messageId: message._id,
      canDeleteForEveryone: isOwnMessage && withinWindow,
    });
    setContextMenu({ visible: false, x: 0, y: 0, messageId: null });
  };

  const canEditMessage = (message) => {
    const senderId = typeof message.senderId === "object" ? message.senderId?._id : message.senderId;
    const isOwnMessage = senderId?.toString() === user?._id;
    const isTextMessage = message.messageType === "text" && (message.text || message.encryptedContent);
    const withinWindow = Date.now() - new Date(message.createdAt).getTime() <= FIFTEEN_MINUTES_MS;
    return isOwnMessage && isTextMessage && withinWindow && !message.isDeleted;
  };

  const handleEditMessage = (message) => {
    setEditingMessage(message._id);
    // Use decrypted text if available (for encrypted messages)
    setEditText(message.text || "");
    setContextMenu({ visible: false, x: 0, y: 0, messageId: null });
  };

  const handleSaveEdit = async () => {
    if (!editingMessage || !editText.trim()) {
      setEditingMessage(null);
      setEditText("");
      return;
    }

    try {
      await dispatch(editMessage({ messageId: editingMessage, text: editText.trim() })).unwrap();
      setEditingMessage(null);
      setEditText("");
      toast.success("Message edited");
    } catch (error) {
      toast.error(error.message || "Failed to edit message");
    }
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setEditText("");
  };

  const handleContextMenu = (e, message) => {
    e.preventDefault();
    const senderId = typeof message.senderId === "object" ? message.senderId?._id : message.senderId;
    const isOwnMessage = senderId?.toString() === user?._id;
    
    // Don't show context menu for system messages or deleted messages
    if (message.isSystemMessage || message.isDeleted) return;
    
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      messageId: message._id,
      message: message,
      isOwnMessage,
    });
    setShowReactionPicker(null);
  };

  const handleCopyMessage = (message) => {
    if (message.text) {
      navigator.clipboard.writeText(message.text);
      toast.success("Message copied");
    }
    setContextMenu({ visible: false, x: 0, y: 0, messageId: null });
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClick = () => {
      if (contextMenu.visible) {
        setContextMenu({ visible: false, x: 0, y: 0, messageId: null });
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [contextMenu.visible]);

  const getReadReceiptIcon = (message) => {
    if (!message.readReceipts) return null;
    if (message.readReceipts.read) {
      return <CheckCheck className="w-4 h-4 text-blue-500" />;
    }
    if (message.readReceipts.delivered) {
      return <CheckCheck className="w-4 h-4 text-gray-400" />;
    }
    return <Check className="w-4 h-4 text-gray-400" />;
  };

  const renderSeenByAvatars = (message, isOwnMessage) => {
    if (!isGroup || !isOwnMessage) return null;
    const readers = message.readReceipts?.readers || [];
    if (readers.length === 0) return null;

    const uniqueReaders = readers.filter((reader, index, arr) => {
      const readerId =
        typeof reader.userId === "object" ? reader.userId._id : reader.userId;
      return (
        readerId &&
        arr.findIndex((r) => {
          const id =
            typeof r.userId === "object" ? r.userId._id : r.userId;
          return id?.toString() === readerId?.toString();
        }) === index
      );
    });

    const readersToShow = uniqueReaders.slice(0, 5);

    return (
      <div className="flex items-center gap-2 mt-1 justify-end">
        <div className="flex -space-x-2">
          {readersToShow.map((reader) => {
            const readerUser =
              typeof reader.userId === "object"
                ? reader.userId
                : { _id: reader.userId };
            return (
              <img
                key={`${message._id}-${readerUser._id}`}
                src={readerUser.profilePic || "/avatar.png"}
                alt={readerUser.fullName || "Seen"}
                className="w-6 h-6 rounded-full border border-base-100 object-cover"
                title={readerUser.fullName || "Seen"}
              />
            );
          })}
        </div>
        <span className="text-xs text-base-content/60">
          {uniqueReaders.length === 1
            ? (uniqueReaders[0]?.userId?.fullName?.split(" ")[0] || "Seen")
            : `${uniqueReaders.length} seen`}
        </span>
      </div>
    );
  };

  const renderCallLogCard = (message) => {
    const senderId =
      typeof message.senderId === "object" ? message.senderId?._id : message.senderId;
    const isOwnMessage = senderId?.toString() === user?._id;
    const callType = message.callLog?.callType || (message.messageType === "call" ? "audio" : "audio");
    const status = message.callLog?.status || "ended";
    const durationLabel =
      status === "ended" && message.callLog?.durationSeconds
        ? formatCallDuration(message.callLog.durationSeconds)
        : "";
    
    const isVideo = callType === "video";
    const callLabel = isVideo ? "Video call" : "Voice call";
    
    // Determine if this is a missed/cancelled call
    const isMissed = status === "missed" || status === "cancelled" || status === "unavailable";
    const isRejected = status === "rejected";
    const isRinging = status === "ringing";
    const isInProgress = status === "in-progress";
    const isEnded = status === "ended";
    
    // Icon colors - red for missed, green for others
    const isRedIcon = isMissed || isRejected;
    const iconBgColor = isRedIcon ? "bg-[#f8d7da]" : "bg-transparent";
    const iconColor = isRedIcon ? "text-[#dc3545]" : "text-[#25D366]";
    
    // Build subtitle text
    let subtitleText = "";
    if (isRinging) {
      subtitleText = "Ringing";
    } else if (isInProgress) {
      subtitleText = "In call • Click to return";
    } else if (isMissed && !isOwnMessage) {
      subtitleText = "Click to call back";
    } else if (isEnded && durationLabel) {
      subtitleText = durationLabel;
    } else if (isRejected) {
      subtitleText = isOwnMessage ? "Declined" : "You declined";
    }
    
    // Determine title text
    let titleText = callLabel;
    if (isMissed && !isOwnMessage) {
      titleText = `Missed ${callLabel.toLowerCase()}`;
    }

    // Don't wrap in bubble - return just the call card content
    // The parent will handle the bubble styling
    return null;
  };
  
  // Special renderer for call log messages (full width card style like WhatsApp)
  const renderCallLogMessage = (message) => {
    const senderId =
      typeof message.senderId === "object" ? message.senderId?._id : message.senderId;
    const isOwnMessage = senderId?.toString() === user?._id;
    const callType = message.callLog?.callType || (message.messageType === "call" ? "audio" : "audio");
    const status = message.callLog?.status || "ended";
    const durationLabel =
      status === "ended" && message.callLog?.durationSeconds
        ? formatCallDuration(message.callLog.durationSeconds)
        : "";
    
    const isVideo = callType === "video";
    const callLabel = isVideo ? "Video call" : "Voice call";
    
    // Determine if this is a missed/cancelled call
    const isMissed = status === "missed" || status === "cancelled" || status === "unavailable";
    const isRejected = status === "rejected";
    const isRinging = status === "ringing";
    const isInProgress = status === "in-progress";
    const isEnded = status === "ended";
    
    // Icon colors - red for missed, green for others
    const isRedIcon = isMissed || isRejected;
    const iconColor = isRedIcon ? "#dc3545" : "#25D366";
    
    // Build subtitle text
    let subtitleText = "";
    if (isRinging) {
      subtitleText = "Ringing";
    } else if (isInProgress) {
      subtitleText = "In call • Click to return";
    } else if (isMissed && !isOwnMessage) {
      subtitleText = "Click to call back";
    } else if (isEnded && durationLabel) {
      subtitleText = durationLabel;
    } else if (isRejected) {
      subtitleText = isOwnMessage ? "Declined" : "You declined";
    }
    
    // Determine title text
    let titleText = callLabel;
    if (isMissed && !isOwnMessage) {
      titleText = `Missed ${callLabel.toLowerCase()}`;
    }
    
    const time = formatMessageTime(message.createdAt);

    return (
      <div key={message._id} className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} mb-2`}>
        <div 
          className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-sm max-w-[85%] ${
            isOwnMessage ? "bg-[#d9fdd3]" : "bg-white"
          }`}
          style={{ minWidth: "240px" }}
        >
          {/* Phone icon with arrow */}
          <div className="relative flex-shrink-0">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: isRedIcon ? "#fce4e4" : "#e7f8e9" }}
            >
              {isVideo ? (
                <Video className="w-5 h-5" style={{ color: iconColor }} />
              ) : (
                <Phone className="w-5 h-5" style={{ color: iconColor }} />
              )}
            </div>
            {/* Arrow indicator */}
            <div 
              className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-white flex items-center justify-center"
            >
              {isRedIcon ? (
                <PhoneMissed className="w-3 h-3" style={{ color: iconColor }} />
              ) : isOwnMessage ? (
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="3">
                  <path d="M7 17L17 7M17 7H7M17 7V17" />
                </svg>
              ) : (
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="3">
                  <path d="M17 7L7 17M7 17H17M7 17V7" />
                </svg>
              )}
            </div>
          </div>
          
          {/* Call info */}
          <div className="flex flex-col flex-grow min-w-0">
            <span 
              className="font-medium text-[15px] leading-tight"
              style={{ color: isRedIcon ? "#dc3545" : "#111b21" }}
            >
              {titleText}
            </span>
            {subtitleText && (
              <span className="text-[13px] text-[#667781]">{subtitleText}</span>
            )}
          </div>
          
          {/* Time */}
          <span className="text-[11px] text-[#667781] self-end flex-shrink-0 ml-2">
            {time}
          </span>
        </div>
      </div>
    );
  };

  const renderMessageContent = (message) => {
    if (message.image) {
      const imageUrl = message.image.startsWith("http") || message.image.startsWith("/api/files")
        ? message.image.startsWith("http")
          ? message.image
          : `${import.meta.env.MODE === "development" ? "http://localhost:5001" : ""}${message.image}`
        : message.image;
      
      return (
        <button
          type="button"
          className="w-full text-left"
          onClick={() => {
            const imageIndex = imageMessages.findIndex((msg) => msg._id === message._id);
            setSelectedImageIndex(imageIndex);
          }}
        >
          <div className="overflow-hidden rounded-lg">
            <img
              src={imageUrl}
              alt="Attachment"
              className="w-full max-w-[280px] max-h-[320px] object-cover rounded-lg"
              onError={(e) => {
                console.error("Failed to load image:", imageUrl);
                e.currentTarget.replaceWith(
                  Object.assign(document.createElement("div"), {
                    className: "text-sm text-error p-2 bg-base-200 rounded",
                    innerText: "Failed to load image",
                  })
                );
              }}
            />
          </div>
          {message.text && <p className="mt-2 text-[14.5px] text-[#111b21]">{message.text}</p>}
        </button>
      );
    }
    if (message.video) {
      const videoUrl = message.video.startsWith("http") || message.video.startsWith("/api/files")
        ? message.video.startsWith("http")
          ? message.video
          : `${import.meta.env.MODE === "development" ? "http://localhost:5001" : ""}${message.video}`
        : message.video;
      return (
        <div>
          <video src={videoUrl} controls className="max-w-[300px] rounded-md mb-2" />
          {message.text && <p className="mt-2">{message.text}</p>}
        </div>
      );
    }
    if (message.audio) {
      const audioUrl = message.audio.startsWith("http") || message.audio.startsWith("/api/files")
        ? message.audio.startsWith("http")
          ? message.audio
          : `${import.meta.env.MODE === "development" ? "http://localhost:5001" : ""}${message.audio}`
        : message.audio;
      return (
        <div>
          <audio src={audioUrl} controls className="mb-2" />
          {message.text && <p className="mt-2">{message.text}</p>}
        </div>
      );
    }
    if (message.voice) {
      const voiceUrl = message.voice.url?.startsWith("http") || message.voice.url?.startsWith("/api/files")
        ? message.voice.url.startsWith("http")
          ? message.voice.url
          : `${import.meta.env.MODE === "development" ? "http://localhost:5001" : ""}${message.voice.url}`
        : message.voice.url;
      return (
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4" />
          <audio src={voiceUrl} controls />
          <span className="text-xs text-base-content/60">{message.voice.duration}s</span>
        </div>
      );
    }
    if (message.document) {
      const docUrl = message.document.url?.startsWith("http") || message.document.url?.startsWith("/api/files")
        ? message.document.url.startsWith("http")
          ? message.document.url
          : `${import.meta.env.MODE === "development" ? "http://localhost:5001" : ""}${message.document.url}`
        : message.document.url;
      return (
        <div className="flex items-center gap-2 p-2 bg-base-200 rounded">
          <File className="w-5 h-5" />
          <div>
            <div className="font-medium text-sm">{message.document.fileName || "Document"}</div>
            <div className="text-xs text-base-content/60">
              {message.document.fileSize ? `${(message.document.fileSize / 1024).toFixed(1)} KB` : ""}
            </div>
          </div>
          <a
            href={docUrl}
            download
            className="btn btn-xs btn-primary"
          >
            Download
          </a>
        </div>
      );
    }
    if (message.location) {
      const { latitude, longitude, address, name } = message.location;
      const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
      
      // Use OpenStreetMap static image (no API key needed)
      const osmStaticMapUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${latitude},${longitude}&zoom=15&size=300x200&markers=${latitude},${longitude},red-pushpin`;
      
      return (
        <div className="w-full max-w-[280px]">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <div className="relative w-full h-40 rounded-lg overflow-hidden border border-gray-200">
              <img
                src={osmStaticMapUrl}
                alt="Location map"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback if image fails to load
                  e.currentTarget.style.display = "none";
                  e.currentTarget.nextSibling.style.display = "flex";
                }}
              />
              <div
                className="hidden absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 items-center justify-center text-white"
                style={{ display: "none" }}
              >
                <MapPin className="w-8 h-8" />
              </div>
            </div>
          </a>
          <div className="mt-2 space-y-1">
            {name && (
              <div className="font-medium text-sm text-[#111b21] flex items-center gap-1">
                <MapPin className="w-4 h-4 text-[#25d366]" />
                {name}
              </div>
            )}
            {address && (
              <div className="text-xs text-[#667781] line-clamp-2">
                {address}
              </div>
            )}
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#008069] hover:underline flex items-center gap-1"
            >
              Open in Maps
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      );
    }
    // Check if this is actually a call log message
    const isCallLogMsg = message.messageType === "call" || 
                        message.isCallLog === true || 
                        (message.callLog && message.callLog.callId);
    if (isCallLogMsg) {
      return renderCallLogCard(message);
    }
    // Fallback: if message has no content, show placeholder
    if (!message.text && !message.image && !message.video && !message.audio && !message.document && !message.voice && !message.location) {
      return <p className="text-[#667781] italic text-sm">Empty message</p>;
    }
    return <p className="text-[14.5px] text-[#111b21] whitespace-pre-wrap break-words">{message.text || ""}</p>;
  };

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  if (!selectedUser && !selectedGroup) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-base-content/60">
          <p>Select a chat to start messaging</p>
        </div>
      </div>
    );
  }

  const typingUsersList = typingUsers[currentChatId] || {};

  const currentImage = selectedImageIndex !== null ? imageMessages[selectedImageIndex] : null;
  const currentImageUrl = currentImage?.image
    ? (currentImage.image.startsWith("http") || currentImage.image.startsWith("/api/files")
        ? currentImage.image.startsWith("http")
          ? currentImage.image
          : `${import.meta.env.MODE === "development" ? "http://localhost:5001" : ""}${currentImage.image}`
        : currentImage.image)
    : null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#dfe3d7]">
      <ChatHeader />

      {/* Context Menu */}
      {contextMenu.visible && (
        <div
          className="fixed bg-white rounded-lg shadow-xl z-50 py-2 min-w-[200px] border border-gray-100"
          style={{ 
            top: Math.min(contextMenu.y, window.innerHeight - 350),
            left: Math.min(contextMenu.x, window.innerWidth - 220),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Reaction bar */}
          <div className="flex items-center justify-around px-3 py-2 border-b border-gray-100">
            {REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  handleReaction(contextMenu.messageId, emoji);
                  setContextMenu({ visible: false, x: 0, y: 0, messageId: null });
                }}
                className="w-10 h-10 flex items-center justify-center text-2xl hover:bg-gray-100 rounded-full transition-all hover:scale-110"
              >
                {emoji}
              </button>
            ))}
          </div>
          
          {/* Menu options */}
          <div className="py-1">
            {contextMenu.message?.text && (
              <button
                onClick={() => handleCopyMessage(contextMenu.message)}
                className="w-full px-4 py-3 text-left flex items-center gap-4 hover:bg-gray-50 text-[#111b21]"
              >
                <Copy className="w-5 h-5 text-[#8696a0]" />
                <span>Copy</span>
              </button>
            )}
            
            {contextMenu.message && canEditMessage(contextMenu.message) && (
              <button
                onClick={() => handleEditMessage(contextMenu.message)}
                className="w-full px-4 py-3 text-left flex items-center gap-4 hover:bg-gray-50 text-[#111b21]"
              >
                <Edit className="w-5 h-5 text-[#8696a0]" />
                <span>Edit</span>
              </button>
            )}
            
            <button
              onClick={() => {
                openDeleteModal(contextMenu.message);
              }}
              className="w-full px-4 py-3 text-left flex items-center gap-4 hover:bg-gray-50 text-[#111b21]"
            >
              <Trash2 className="w-5 h-5 text-[#8696a0]" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal.visible && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[320px] overflow-hidden">
            <div className="p-5">
              <h3 className="text-lg font-medium text-[#111b21] mb-2">Delete message?</h3>
              {showDeleteModal.canDeleteForEveryone ? (
                <p className="text-sm text-[#667781]">
                  You can delete this message for everyone or just for yourself.
                </p>
              ) : (
                <p className="text-sm text-[#667781]">
                  This message can only be deleted for you. Messages can only be deleted for everyone within 15 minutes of sending.
                </p>
              )}
            </div>
            
            <div className="border-t border-gray-100">
              {showDeleteModal.canDeleteForEveryone && (
                <button
                  onClick={() => handleDeleteMessage(showDeleteModal.messageId, true)}
                  disabled={deletingMessageId === showDeleteModal.messageId}
                  className="w-full px-5 py-3 text-left text-[#ea0000] hover:bg-gray-50 font-medium border-b border-gray-100 flex items-center justify-between"
                >
                  Delete for everyone
                  {deletingMessageId === showDeleteModal.messageId && (
                    <span className="loading loading-spinner loading-sm" />
                  )}
                </button>
              )}
              
              <button
                onClick={() => handleDeleteMessage(showDeleteModal.messageId, false)}
                disabled={deletingMessageId === showDeleteModal.messageId}
                className="w-full px-5 py-3 text-left text-[#008069] hover:bg-gray-50 font-medium border-b border-gray-100"
              >
                Delete for me
              </button>
              
              <button
                onClick={() => setShowDeleteModal({ visible: false, messageId: null, canDeleteForEveryone: false })}
                className="w-full px-5 py-3 text-left text-[#667781] hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {selectedImageIndex !== null && currentImageUrl && (
        <ImageModal
          imageUrl={currentImageUrl}
          fileName={`image-${currentImage._id}.jpg`}
          onClose={() => setSelectedImageIndex(null)}
          onNext={() => {
            if (selectedImageIndex < imageMessages.length - 1) {
              setSelectedImageIndex(selectedImageIndex + 1);
            }
          }}
          onPrevious={() => {
            if (selectedImageIndex > 0) {
              setSelectedImageIndex(selectedImageIndex - 1);
            }
          }}
          hasNext={selectedImageIndex < imageMessages.length - 1}
          hasPrevious={selectedImageIndex > 0}
        />
      )}

      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-6 lg:px-12 py-6 space-y-5 bg-[url('/wa-paper.png')] bg-repeat"
      >
        {isLoadingMore && (
          <div className="flex justify-center py-2">
            <span className="loading loading-spinner loading-sm"></span>
          </div>
        )}
        {messages.length === 0 && !isLoading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-base-content/60">
              <p>No messages yet. Start the conversation!</p>
            </div>
          </div>
        )}
        {messages.map((message) => {
          const senderId = typeof message.senderId === "string" 
            ? message.senderId 
            : message.senderId._id || message.senderId;
          const isOwnMessage = senderId === user._id;
          // For group messages, get sender from message.senderId; for 1-on-1, use selectedUser or message.senderId
          const sender = isOwnMessage 
            ? user 
            : (isGroup 
              ? (typeof message.senderId === "object" && message.senderId ? message.senderId : { fullName: "Unknown", profilePic: "/avatar.png" })
              : (selectedUser || (typeof message.senderId === "object" ? message.senderId : null)));

          const isDeleted = message.isDeleted;
          const isSystem = message.isSystemMessage;
          
          // Check if this is actually a call log message (must have callLog with callId or isCallLog flag)
          const isCallLog = message.messageType === "call" || 
                           message.isCallLog === true || 
                           (message.callLog && message.callLog.callId);

          // Render call log messages with special WhatsApp-style card
          if (isCallLog && !isDeleted) {
            return renderCallLogMessage(message);
          }

          const hasOnlyImage =
            !!message.image &&
            !message.text &&
            !message.video &&
            !message.audio &&
            !message.document &&
            !message.voice &&
            !message.location;

          const hasMedia = message.image || message.video || message.audio || message.document || message.voice || message.location;
          const time = formatMessageTime(message.createdAt);

          // Group reactions by emoji for count display
          const reactionGroups = {};
          if (message.reactions && message.reactions.length > 0) {
            message.reactions.forEach((r) => {
              if (!reactionGroups[r.emoji]) {
                reactionGroups[r.emoji] = [];
              }
              reactionGroups[r.emoji].push(r);
            });
          }
          const hasReactions = Object.keys(reactionGroups).length > 0;
          const totalReactions = message.reactions?.length || 0;

          return (
          <div
            key={message._id}
            className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} mb-2 px-3`}
          >
            {/* Avatar for received messages in groups */}
            {isGroup && !isOwnMessage && (
              <div className="flex-shrink-0 mr-2 self-end">
                <img 
                  src={sender?.profilePic || "/avatar.png"} 
                  alt={sender?.fullName || "User"}
                  className="w-8 h-8 rounded-full object-cover"
                />
              </div>
            )}
            
            <div className="relative max-w-[65%] min-w-[100px]">
              {/* Main message bubble */}
              <div
                onContextMenu={(e) => handleContextMenu(e, message)}
                className={`
                  relative group cursor-pointer select-none
                  ${hasOnlyImage ? "p-1" : "px-3 py-2"}
                  ${isOwnMessage 
                    ? "bg-[#d9fdd3] rounded-tl-lg rounded-tr-lg rounded-bl-lg rounded-br-sm" 
                    : "bg-white rounded-tl-sm rounded-tr-lg rounded-br-lg rounded-bl-lg"
                  }
                  ${isSystem || isDeleted ? "bg-[#fcf4cb] !rounded-lg" : ""}
                  shadow-sm
                  ${contextMenu.messageId === message._id ? "ring-2 ring-[#25D366]" : ""}
                `}
              >
                {isSystem ? (
                  <p className="text-sm text-[#54656f] text-center">{message.text}</p>
                ) : isDeleted ? (
                  <p className="text-sm text-[#667781] italic">
                    {isOwnMessage
                      ? "🚫 You deleted this message"
                      : `🚫 This message was deleted`}
                  </p>
                ) : (
                  <>
                    {/* Show sender name in groups */}
                    {isGroup && !isOwnMessage && sender && (
                      <p className="text-[13px] font-medium text-[#06cf9c] mb-0.5">
                        {sender.fullName}
                      </p>
                    )}
                    
                    {/* Edit mode */}
                    {editingMessage === message._id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full p-2 border border-[#25d366] rounded-lg resize-none text-[14.5px] text-[#111b21] focus:outline-none focus:ring-2 focus:ring-[#25d366]"
                          rows={3}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && e.ctrlKey) {
                              handleSaveEdit();
                            } else if (e.key === "Escape") {
                              handleCancelEdit();
                            }
                          }}
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleSaveEdit}
                            className="btn btn-xs btn-primary"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="btn btn-xs btn-ghost"
                          >
                            Cancel
                          </button>
                          <span className="text-xs text-[#667781]">Press Ctrl+Enter to save</span>
                        </div>
                      </div>
                    ) : (
                      renderMessageContent(message)
                    )}

                    {/* Reaction picker popup */}
                    {showReactionPicker === message._id && (
                      <div
                        className={`absolute -top-14 ${
                          isOwnMessage ? "right-0" : "left-0"
                        } flex gap-0.5 bg-white px-2 py-1.5 rounded-full shadow-lg z-20 border border-gray-100`}
                      >
                        {REACTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => handleReaction(message._id, emoji)}
                            className="w-9 h-9 flex items-center justify-center text-xl hover:bg-gray-100 rounded-full transition-all hover:scale-125"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {/* Hover action button - emoji reaction */}
                    {!isDeleted && (
                      <button
                        onClick={() => setShowReactionPicker(showReactionPicker === message._id ? null : message._id)}
                        className={`absolute top-1/2 -translate-y-1/2 ${
                          isOwnMessage ? "-left-10" : "-right-10"
                        } w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-gray-50`}
                      >
                        <Smile className="w-5 h-5 text-[#8696a0]" />
                      </button>
                    )}
                  </>
                )}
                
                {/* Time and read receipt - inside bubble, bottom right */}
                {!isSystem && (
                  <div className={`flex items-center justify-end gap-1 mt-0.5 ${hasMedia && !message.text ? "absolute bottom-2 right-2 bg-black/40 px-1.5 py-0.5 rounded" : ""}`}>
                    {message.edited && (
                      <span className={`text-[10px] italic ${hasMedia && !message.text ? "text-white/80" : "text-[#667781]"}`}>
                        edited
                      </span>
                    )}
                    <span className={`text-[11px] ${hasMedia && !message.text ? "text-white" : "text-[#667781]"}`}>
                      {time}
                    </span>
                    {isOwnMessage && !isDeleted && (
                      <span className={hasMedia && !message.text ? "text-white" : "text-[#53bdeb]"}>
                        {getReadReceiptIcon(message)}
                      </span>
                    )}
                  </div>
                )}
            </div>
              
              {/* Reactions display - WhatsApp style below message */}
              {hasReactions && (
                <div 
                  className={`absolute -bottom-3 ${isOwnMessage ? "left-2" : "right-2"} flex items-center gap-0.5 bg-white rounded-full px-1.5 py-0.5 shadow-md border border-gray-100 z-10`}
                >
                  {Object.entries(reactionGroups).slice(0, 3).map(([emoji, reactions]) => (
                    <span key={emoji} className="text-sm">{emoji}</span>
                  ))}
                  {totalReactions > 0 && (
                    <span className="text-xs text-[#667781] ml-0.5 font-medium">{totalReactions}</span>
                  )}
            </div>
              )}
            </div>
          </div>
          );
        })}


        {/* Typing Indicator */}
        {Object.keys(typingUsersList).length > 0 && (
          <div className="chat chat-start">
            <div className="chat-bubble">
              <span className="loading loading-dots loading-sm"></span>
            </div>
          </div>
        )}

        <div ref={messageEndRef} />
      </div>

      <MessageInput />
    </div>
  );
};

export default ChatContainer;
