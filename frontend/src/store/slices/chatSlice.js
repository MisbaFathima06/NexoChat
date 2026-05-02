import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../lib/axios";

// Async thunks
export const getUsers = createAsyncThunk("chat/getUsers", async (search = "") => {
  const res = await axiosInstance.get(`/messages/users?search=${search}`);
  return res.data;
});

export const getMessages = createAsyncThunk("chat/getMessages", async ({ id, groupId, page = 1 }) => {
  const url = groupId ? `/messages/group/${groupId}?page=${page}` : `/messages/chat/${id}?page=${page}`;
  const res = await axiosInstance.get(url);
  return res.data;
});

export const sendMessage = createAsyncThunk("chat/sendMessage", async ({ id, groupId, messageData }) => {
  const url = groupId ? `/messages/send-group/${groupId}` : `/messages/send/${id}`;
  const res = await axiosInstance.post(url, messageData);
  return res.data;
});

export const markAsRead = createAsyncThunk("chat/markAsRead", async (messageIds) => {
  await axiosInstance.put("/messages/read", { messageIds });
  return messageIds;
});

export const addReaction = createAsyncThunk("chat/addReaction", async ({ messageId, emoji }) => {
  const res = await axiosInstance.post(`/messages/reaction/${messageId}`, { emoji });
  return res.data;
});

export const removeReaction = createAsyncThunk("chat/removeReaction", async (messageId) => {
  const res = await axiosInstance.delete(`/messages/reaction/${messageId}`);
  return res.data;
});

export const deleteMessage = createAsyncThunk("chat/deleteMessage", async (messageId) => {
  const res = await axiosInstance.delete(`/messages/${messageId}`);
  return res.data;
});

export const editMessage = createAsyncThunk("chat/editMessage", async ({ messageId, text }) => {
  const res = await axiosInstance.put(`/messages/edit/${messageId}`, { text });
  return res.data;
});

export const exportChat = createAsyncThunk("chat/exportChat", async ({ id, groupId }) => {
  const url = groupId ? `/messages/export-group/${groupId}` : `/messages/export/${id}`;
  const res = await axiosInstance.get(url, { responseType: "blob" });
  return { data: res.data, id, groupId };
});

const initialState = {
  users: [],
  selectedUser: null,
  selectedGroup: null,
  messages: [],
  typingUsers: {},
  unreadCounts: {}, // { userId: count }
  lastMessages: {}, // { userId: { message, timestamp } }
  pagination: {
    page: 1,
    hasMore: false,
  },
  isLoading: false,
  isSending: false,
  error: null,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setSelectedUser: (state, action) => {
      state.selectedUser = action.payload;
      state.messages = [];
    },
    addMessage: (state, action) => {
      const message = action.payload;
      const exists = state.messages.some((m) => m._id === message._id);
      if (!exists) {
        state.messages.push(message);
      }
      
      // Update last message and unread count
      const chatId = message.groupId || message.receiverId || message.senderId;
      const currentUserId = state.selectedUser?._id || state.selectedGroup?._id;
      const isFromCurrentChat = chatId === currentUserId || 
        (message.senderId?._id || message.senderId) === currentUserId ||
        (message.receiverId?._id || message.receiverId) === currentUserId;
      
      if (!isFromCurrentChat && message.senderId) {
        const senderId = typeof message.senderId === "string" 
          ? message.senderId 
          : message.senderId._id || message.senderId;
        
        // Update last message
        state.lastMessages[senderId] = {
          message: message.text || "Attachment",
          timestamp: message.createdAt || new Date(),
        };
        
        // Increment unread count if not from current chat
        if (!state.unreadCounts[senderId]) {
          state.unreadCounts[senderId] = 0;
        }
        state.unreadCounts[senderId] += 1;
      }
    },
    incrementUnread: (state, action) => {
      const { userId } = action.payload;
      if (!state.unreadCounts[userId]) {
        state.unreadCounts[userId] = 0;
      }
      state.unreadCounts[userId] += 1;
    },
    clearUnread: (state, action) => {
      const userId = action.payload;
      state.unreadCounts[userId] = 0;
    },
    updateLastMessage: (state, action) => {
      const { userId, preview, timestamp, message = null, isFromMe = false } = action.payload;
      state.lastMessages[userId] = { message: preview, timestamp, isFromMe };

      const userIndex = state.users.findIndex((u) => u._id === userId);
      if (userIndex !== -1) {
        const existingUser = state.users[userIndex];
        const nextLastMessage = {
          ...(existingUser.lastMessage || {}),
          text: preview,
          isFromMe,
          messageType: message?.messageType || existingUser.lastMessage?.messageType || "text",
          callLog: message?.callLog || null,
        };
        state.users[userIndex] = { ...existingUser, lastMessage: nextLastMessage };
      }
    },
    updateMessage: (state, action) => {
      const { messageId, updates } = action.payload;
      const index = state.messages.findIndex((m) => m._id === messageId);
      if (index !== -1) {
        state.messages[index] = { ...state.messages[index], ...updates };
      }
    },
    addMessageReader: (state, action) => {
      const { messageId, reader } = action.payload;
      const message = state.messages.find((m) => m._id === messageId);
      if (!message) return;

      if (!message.readReceipts) {
        message.readReceipts = {};
      }
      if (!Array.isArray(message.readReceipts.readers)) {
        message.readReceipts.readers = [];
      }

      const exists = message.readReceipts.readers.some((r) => {
        const readerId = typeof r.userId === "object" ? r.userId._id : r.userId;
        const newReaderId = typeof reader.userId === "object" ? reader.userId._id : reader.userId;
        return readerId?.toString() === newReaderId?.toString();
      });

      if (!exists) {
        message.readReceipts.readers.push(reader);
      }
    },
    removeMessage: (state, action) => {
      state.messages = state.messages.filter((m) => m._id !== action.payload);
    },
    markMessageDeleted: (state, action) => {
      const { messageId, deletedBy, deletedAt } = action.payload;
      const message = state.messages.find((m) => m._id === messageId);
      if (!message) return;

      message.text = "";
      message.image = null;
      message.video = null;
      message.audio = null;
      message.document = null;
      message.voice = null;
      message.isDeleted = true;
      message.deletedBy = deletedBy;
      message.deletedAt = deletedAt;
    },
    removeMessageLocally: (state, action) => {
      // Delete for me only - just remove from local state
      state.messages = state.messages.filter((m) => m._id !== action.payload);
      message.isDeleted = true;
      message.deletedAt = deletedAt || new Date().toISOString();
      message.deletedBy = deletedBy;
    },
    setTyping: (state, action) => {
      const { userId, isTyping, chatId } = action.payload;
      if (!state.typingUsers[chatId]) {
        state.typingUsers[chatId] = {};
      }
      if (isTyping) {
        state.typingUsers[chatId][userId] = true;
      } else {
        delete state.typingUsers[chatId][userId];
      }
    },
    markMessagesRead: (state, action) => {
      const messageIds = Array.isArray(action.payload?.messageIds)
        ? action.payload.messageIds
        : [];
      if (messageIds.length === 0) return;
      state.messages.forEach((msg) => {
        if (messageIds.includes(msg._id)) {
          msg.readReceipts.read = true;
          msg.readReceipts.readAt = new Date();
        }
      });
    },
    clearChat: (state) => {
      state.selectedUser = null;
      state.messages = [];
      state.typingUsers = {};
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getUsers.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getUsers.fulfilled, (state, action) => {
        const users = action.payload;
        users.forEach((user) => {
          if (user.unreadCount !== undefined) {
            state.unreadCounts[user._id] = user.unreadCount;
          }

          const backendLast = user.lastMessage;
          if (backendLast) {
            state.lastMessages[user._id] = {
              message: backendLast.text,
              timestamp: backendLast.timestamp,
              isFromMe: backendLast.isFromMe,
            };
          }

          const cached = state.lastMessages[user._id];
          if (cached) {
            const cachedTime = cached.timestamp ? new Date(cached.timestamp).getTime() : 0;
            const backendTime = backendLast?.timestamp ? new Date(backendLast.timestamp).getTime() : 0;
            if (!backendTime || cachedTime >= backendTime) {
              user.lastMessage = {
                ...(user.lastMessage || {}),
                text: cached.message,
                timestamp: cached.timestamp,
                isFromMe: cached.isFromMe,
              };
            }
          }
        });
        state.users = users;
        state.isLoading = false;
      })
      .addCase(getMessages.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getMessages.fulfilled, (state, action) => {
        const { messages, pagination } = action.payload;
        if (pagination.page === 1) {
          state.messages = messages;
        } else {
          // Prepend older messages
          state.messages = [...messages, ...state.messages];
        }
        state.pagination = pagination;
        state.isLoading = false;
        
        // Clear unread count for current chat
        const chatId = state.selectedUser?._id || state.selectedGroup?._id;
        if (chatId) {
          state.unreadCounts[chatId] = 0;
        }
      })
      .addCase(getMessages.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(sendMessage.pending, (state) => {
        state.isSending = true;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isSending = false;

        const isGroupMessage = Boolean(action.meta?.arg?.groupId);
        if (isGroupMessage) {
          // Wait for socket event to add to list to avoid duplicates
          return;
        }

        const existingIndex = state.messages.findIndex((m) => m._id === action.payload._id);
        if (existingIndex !== -1) {
          state.messages[existingIndex] = action.payload;
        } else {
          state.messages.push(action.payload);
        }
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        const messageIds = Array.isArray(action.payload) ? action.payload : [];
        if (messageIds.length === 0) return;
        state.messages.forEach((msg) => {
          if (messageIds.includes(msg._id)) {
            msg.readReceipts.read = true;
            msg.readReceipts.readAt = new Date();
          }
        });
      })
      .addCase(addReaction.fulfilled, (state, action) => {
        const index = state.messages.findIndex((m) => m._id === action.payload._id);
        if (index !== -1) {
          state.messages[index] = action.payload;
        }
      })
      .addCase(removeReaction.fulfilled, (state, action) => {
        const index = state.messages.findIndex((m) => m._id === action.payload._id);
        if (index !== -1) {
          state.messages[index] = action.payload;
        }
      })
      .addCase(deleteMessage.fulfilled, (state, action) => {
        const { messageId, deletedBy, deletedAt } = action.payload;
        const message = state.messages.find((m) => m._id === messageId);
        if (message) {
          message.text = "";
          message.image = null;
          message.video = null;
          message.audio = null;
          message.document = null;
          message.voice = null;
          message.isDeleted = true;
          message.deletedAt = deletedAt;
          message.deletedBy = deletedBy;
        }
      });
  },
});

export const {
  setSelectedUser,
  setSelectedGroup,
  addMessage,
  updateMessage,
  addMessageReader,
  removeMessage,
  markMessageDeleted,
  removeMessageLocally,
  setTyping,
  markMessagesRead,
  clearChat,
  incrementUnread,
  clearUnread,
  updateLastMessage,
} = chatSlice.actions;
export default chatSlice.reducer;

