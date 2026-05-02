# Socket.io Events Documentation

## Connection

### Connect to Socket
```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:5001", {
  query: {
    userId: "user_id"
  }
});
```

---

## Client → Server Events

### `typing`
Send typing indicator to other users.

**Payload:**
```javascript
{
  receiverId: "user_id", // For one-to-one chat (optional if groupId provided)
  groupId: "group_id", // For group chat (optional if receiverId provided)
  isTyping: true // true when typing, false when stopped
}
```

**Example:**
```javascript
socket.emit("typing", {
  receiverId: "user123",
  isTyping: true
});

// Stop typing
socket.emit("typing", {
  receiverId: "user123",
  isTyping: false
});
```

---

### `joinGroup`
Join a group room to receive group messages.

**Payload:**
```javascript
"group_id"
```

**Example:**
```javascript
socket.emit("joinGroup", "group123");
```

---

### `leaveGroup`
Leave a group room.

**Payload:**
```javascript
"group_id"
```

**Example:**
```javascript
socket.emit("leaveGroup", "group123");
```

---

### `messageDelivered`
Mark a message as delivered (optional - backend handles this automatically).

**Payload:**
```javascript
{
  messageId: "message_id",
  receiverId: "user_id"
}
```

**Example:**
```javascript
socket.emit("messageDelivered", {
  messageId: "msg123",
  receiverId: "user456"
});
```

---

### `messageRead`
Mark messages as read.

**Payload:**
```javascript
{
  messageIds: ["message_id1", "message_id2"],
  receiverId: "user_id" // Sender's user ID
}
```

**Example:**
```javascript
socket.emit("messageRead", {
  messageIds: ["msg1", "msg2", "msg3"],
  receiverId: "user456"
});
```

---

## Server → Client Events

### `getOnlineUsers`
Emitted when online users list changes (on connect/disconnect).

**Payload:**
```javascript
["user_id1", "user_id2", "user_id3", ...]
```

**Example:**
```javascript
socket.on("getOnlineUsers", (userIds) => {
  console.log("Online users:", userIds);
  // Update UI with online users
});
```

---

### `newMessage`
Emitted when a new message is received.

**Payload:**
```javascript
{
  _id: "message_id",
  senderId: {
    _id: "user_id",
    fullName: "John Doe",
    profilePic: "url"
  },
  receiverId: "user_id", // For one-to-one
  groupId: "group_id", // For group
  messageType: "text" | "image" | "video" | "audio" | "document" | "voice",
  text: "Message text",
  image: "url", // If image
  video: "url", // If video
  audio: "url", // If audio
  document: {
    url: "url",
    fileName: "file.pdf",
    fileSize: 1024,
    mimeType: "application/pdf"
  },
  voice: {
    url: "url",
    duration: 30
  },
  readReceipts: {
    sent: true,
    delivered: false,
    read: false
  },
  reactions: [],
  isEncrypted: false,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z"
}
```

**Example:**
```javascript
socket.on("newMessage", (message) => {
  // Add message to chat
  if (message.groupId) {
    // Handle group message
  } else {
    // Handle one-to-one message
  }
});
```

---

### `messageDelivered`
Emitted when a message is delivered to the recipient.

**Payload:**
```javascript
{
  messageId: "message_id"
}
```

**Example:**
```javascript
socket.on("messageDelivered", ({ messageId }) => {
  // Update message status to delivered
  updateMessageStatus(messageId, "delivered");
});
```

---

### `messagesRead`
Emitted when messages are read by the recipient.

**Payload:**
```javascript
{
  messageIds: ["message_id1", "message_id2"],
  receiverId: "user_id" // Your user ID
}
```

**Example:**
```javascript
socket.on("messagesRead", ({ messageIds, receiverId }) => {
  // Update messages as read
  messageIds.forEach(id => {
    updateMessageStatus(id, "read");
  });
});
```

---

### `messageReaction`
Emitted when a reaction is added to a message.

**Payload:**
```javascript
{
  messageId: "message_id",
  reaction: {
    userId: "user_id",
    emoji: "❤️",
    createdAt: "2024-01-01T00:00:00.000Z"
  }
}
```

**Example:**
```javascript
socket.on("messageReaction", ({ messageId, reaction }) => {
  // Add reaction to message
  addReactionToMessage(messageId, reaction);
});
```

---

### `messageDeleted`
Emitted when a message is deleted.

**Payload:**
```javascript
{
  messageId: "message_id"
}
```

**Example:**
```javascript
socket.on("messageDeleted", ({ messageId }) => {
  // Remove message from UI
  removeMessage(messageId);
});
```

---

### `typing`
Emitted when another user is typing.

**Payload:**
```javascript
{
  userId: "user_id",
  isTyping: true,
  receiverId: "user_id", // For one-to-one
  groupId: "group_id" // For group
}
```

**Example:**
```javascript
socket.on("typing", ({ userId, isTyping, receiverId, groupId }) => {
  if (isTyping) {
    // Show typing indicator
    showTypingIndicator(userId);
  } else {
    // Hide typing indicator
    hideTypingIndicator(userId);
  }
});
```

---

## Connection Events

### `connect`
Emitted when socket connects.

```javascript
socket.on("connect", () => {
  console.log("Connected to server");
});
```

### `disconnect`
Emitted when socket disconnects.

```javascript
socket.on("disconnect", () => {
  console.log("Disconnected from server");
});
```

---

## Error Handling

### Connection Errors
```javascript
socket.on("connect_error", (error) => {
  console.error("Connection error:", error);
});
```

---

## Best Practices

1. **Always check if socket is connected before emitting:**
   ```javascript
   if (socket.connected) {
     socket.emit("typing", {...});
   }
   ```

2. **Clean up listeners on component unmount:**
   ```javascript
   useEffect(() => {
     socket.on("newMessage", handleNewMessage);
     return () => {
       socket.off("newMessage", handleNewMessage);
     };
   }, []);
   ```

3. **Handle reconnection:**
   ```javascript
   socket.on("reconnect", () => {
     // Rejoin rooms, resubscribe to events
     socket.emit("joinGroup", groupId);
   });
   ```

4. **Use rooms for group chats:**
   ```javascript
   // Join when entering group chat
   socket.emit("joinGroup", groupId);
   
   // Leave when exiting group chat
   socket.emit("leaveGroup", groupId);
   ```

5. **Debounce typing indicators:**
   ```javascript
   let typingTimeout;
   const handleTyping = () => {
     socket.emit("typing", { receiverId, isTyping: true });
     clearTimeout(typingTimeout);
     typingTimeout = setTimeout(() => {
       socket.emit("typing", { receiverId, isTyping: false });
     }, 3000);
   };
   ```

---

## Event Flow Examples

### Sending a Message
1. Client sends message via REST API: `POST /messages/send/:id`
2. Server saves message and emits `newMessage` to receiver
3. Receiver's client receives `newMessage` event
4. Receiver's client emits `messageDelivered` (optional)
5. Server updates message status and emits `messageDelivered` to sender
6. When receiver views message, client emits `messageRead`
7. Server updates message status and emits `messagesRead` to sender

### Typing Indicator
1. User starts typing
2. Client emits `typing` with `isTyping: true`
3. Receiver's client receives `typing` event
4. Receiver's UI shows typing indicator
5. User stops typing
6. Client emits `typing` with `isTyping: false`
7. Receiver's UI hides typing indicator

### Group Chat
1. User joins group chat
2. Client emits `joinGroup` with group ID
3. Server adds socket to group room
4. When message is sent to group, server emits to all room members
5. User leaves group chat
6. Client emits `leaveGroup` with group ID
7. Server removes socket from group room

