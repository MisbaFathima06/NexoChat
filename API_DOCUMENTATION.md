# API Documentation

## Base URL
- Development: `http://localhost:5001/api`
- Production: `/api`

## Authentication

All protected routes require a JWT token in HTTP-only cookies. The token is automatically sent with requests when using `withCredentials: true`.

---

## Authentication Endpoints

### Send OTP
**POST** `/auth/send-otp`

Send OTP for phone/email verification (placeholder - returns OTP in development mode).

**Request Body:**
```json
{
  "email": "user@example.com",
  // OR
  "phoneNumber": "+1234567890"
}
```

**Response:**
```json
{
  "message": "OTP sent successfully",
  "otp": "123456", // Only in development
  "expiresIn": 600
}
```

---

### Sign Up
**POST** `/auth/signup`

Register a new user with email or phone number.

**Request Body:**
```json
{
  "fullName": "John Doe",
  "email": "user@example.com", // OR
  "phoneNumber": "+1234567890",
  "password": "password123",
  "otp": "123456" // Optional in development
}
```

**Response:**
```json
{
  "_id": "user_id",
  "fullName": "John Doe",
  "email": "user@example.com",
  "phoneNumber": "+1234567890",
  "profilePic": "",
  "status": "Hey there! I am using Chatty",
  "privacy": {
    "lastSeen": "everyone",
    "profilePic": "everyone",
    "status": "everyone",
    "readReceipts": true
  },
  "theme": "coffee"
}
```

---

### Login
**POST** `/auth/login`

Login with email or phone number.

**Request Body:**
```json
{
  "email": "user@example.com", // OR
  "phoneNumber": "+1234567890",
  "password": "password123"
}
```

**Response:**
```json
{
  "_id": "user_id",
  "fullName": "John Doe",
  "email": "user@example.com",
  "phoneNumber": "+1234567890",
  "profilePic": "",
  "status": "Hey there! I am using Chatty",
  "privacy": {...},
  "theme": "coffee",
  "lastSeen": "2024-01-01T00:00:00.000Z",
  "isOnline": true
}
```

---

### Refresh Token
**POST** `/auth/refresh-token`

Refresh access token using refresh token.

**Response:**
```json
{
  "message": "Token refreshed successfully"
}
```

---

### Logout
**POST** `/auth/logout` (Protected)

Logout user and clear tokens.

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

---

### Check Auth
**GET** `/auth/check` (Protected)

Check if user is authenticated and get user data.

**Response:**
```json
{
  "_id": "user_id",
  "fullName": "John Doe",
  "email": "user@example.com",
  ...
}
```

---

### Update Profile
**PUT** `/auth/update-profile` (Protected)

Update user profile.

**Request Body:**
```json
{
  "profilePic": "data:image/jpeg;base64,...", // Optional
  "fullName": "John Doe", // Optional
  "status": "New status", // Optional
  "theme": "dark" // Optional
}
```

**Response:**
```json
{
  "_id": "user_id",
  "fullName": "John Doe",
  ...
}
```

---

### Update Privacy Settings
**PUT** `/auth/update-privacy` (Protected)

Update privacy settings.

**Request Body:**
```json
{
  "privacy": {
    "lastSeen": "everyone" | "contacts" | "nobody",
    "profilePic": "everyone" | "contacts" | "nobody",
    "status": "everyone" | "contacts" | "nobody",
    "readReceipts": true | false
  }
}
```

**Response:**
```json
{
  "_id": "user_id",
  "privacy": {...},
  ...
}
```

---

### Update Auto-Reply Settings
**PUT** `/auth/update-auto-reply` (Protected)

Update auto-reply settings.

**Request Body:**
```json
{
  "enabled": true,
  "message": "I'm currently busy. I'll get back to you soon!"
}
```

**Response:**
```json
{
  "_id": "user_id",
  "autoReply": {
    "enabled": true,
    "message": "..."
  },
  ...
}
```

---

## Message Endpoints

### Get Users for Sidebar
**GET** `/messages/users?search=query` (Protected)

Get list of users with optional search.

**Query Parameters:**
- `search` (optional): Search query

**Response:**
```json
[
  {
    "_id": "user_id",
    "fullName": "John Doe",
    "email": "user@example.com",
    "phoneNumber": "+1234567890",
    "profilePic": "",
    "status": "...",
    "lastSeen": "2024-01-01T00:00:00.000Z",
    "isOnline": true
  },
  ...
]
```

---

### Get Messages
**GET** `/messages/chat/:id?page=1&limit=50` (Protected)
**GET** `/messages/group/:groupId?page=1&limit=50` (Protected)

Get messages for a chat or group.

**Path Parameters:**
- `id`: User ID (for one-to-one chat)
- `groupId`: Group ID (for group chat)

**Query Parameters:**
- `page` (default: 1): Page number
- `limit` (default: 50): Messages per page

**Response:**
```json
{
  "messages": [
    {
      "_id": "message_id",
      "senderId": {
        "_id": "user_id",
        "fullName": "John Doe",
        "profilePic": ""
      },
      "receiverId": "user_id",
      "groupId": "group_id", // If group message
      "messageType": "text" | "image" | "video" | "audio" | "document" | "voice",
      "text": "Message text",
      "image": "url", // If image
      "video": "url", // If video
      "audio": "url", // If audio
      "document": {
        "url": "url",
        "fileName": "file.pdf",
        "fileSize": 1024,
        "mimeType": "application/pdf"
      },
      "voice": {
        "url": "url",
        "duration": 30
      },
      "readReceipts": {
        "sent": true,
        "delivered": true,
        "read": true,
        "readAt": "2024-01-01T00:00:00.000Z"
      },
      "reactions": [
        {
          "userId": "user_id",
          "emoji": "❤️",
          "createdAt": "2024-01-01T00:00:00.000Z"
        }
      ],
      "disappearingMessage": {
        "enabled": true,
        "expiresAt": "2024-01-02T00:00:00.000Z"
      },
      "isEncrypted": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "hasMore": true
  }
}
```

---

### Send Message
**POST** `/messages/send/:id` (Protected)
**POST** `/messages/send-group/:groupId` (Protected)

Send a message to a user or group.

**Path Parameters:**
- `id`: Receiver user ID
- `groupId`: Group ID

**Request Body:**
```json
{
  "text": "Message text", // Optional
  "messageType": "text" | "image" | "video" | "audio" | "document" | "voice",
  "image": "data:image/jpeg;base64,...", // Optional
  "video": "data:video/mp4;base64,...", // Optional
  "audio": "data:audio/mp3;base64,...", // Optional
  "document": {
    "url": "data:application/pdf;base64,...",
    "fileName": "file.pdf",
    "fileSize": 1024,
    "mimeType": "application/pdf"
  },
  "voice": {
    "url": "data:audio/webm;base64,...",
    "duration": 30
  },
  "isEncrypted": false, // Optional
  "disappearingMessage": {
    "enabled": true,
    "duration": 24 // hours
  },
  "scheduledFor": "2024-01-01T12:00:00.000Z" // Optional
}
```

**Response:**
```json
{
  "_id": "message_id",
  "senderId": "user_id",
  "receiverId": "user_id",
  "text": "Message text",
  ...
}
```

---

### Mark Messages as Read
**PUT** `/messages/read` (Protected)

Mark messages as read.

**Request Body:**
```json
{
  "messageIds": ["message_id1", "message_id2"]
}
```

**Response:**
```json
{
  "message": "Messages marked as read"
}
```

---

### Add Reaction
**POST** `/messages/reaction/:messageId` (Protected)

Add reaction to a message.

**Path Parameters:**
- `messageId`: Message ID

**Request Body:**
```json
{
  "emoji": "❤️"
}
```

**Response:**
```json
{
  "_id": "message_id",
  "reactions": [
    {
      "userId": "user_id",
      "emoji": "❤️",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  ...
}
```

---

### Remove Reaction
**DELETE** `/messages/reaction/:messageId` (Protected)

Remove reaction from a message.

**Path Parameters:**
- `messageId`: Message ID

**Response:**
```json
{
  "_id": "message_id",
  "reactions": [],
  ...
}
```

---

### Delete Message
**DELETE** `/messages/:messageId` (Protected)

Delete a message (only sender can delete).

**Path Parameters:**
- `messageId`: Message ID

**Response:**
```json
{
  "message": "Message deleted successfully"
}
```

---

### Export Chat
**GET** `/messages/export/:id` (Protected)
**GET** `/messages/export-group/:groupId` (Protected)

Export chat history as JSON.

**Path Parameters:**
- `id`: User ID
- `groupId`: Group ID

**Response:**
```json
{
  "exportDate": "2024-01-01T00:00:00.000Z",
  "messages": [...],
  "metadata": {
    "totalMessages": 100,
    "dateRange": {
      "from": "2024-01-01T00:00:00.000Z",
      "to": "2024-01-31T00:00:00.000Z"
    }
  }
}
```

---

## Group Endpoints

### Create Group
**POST** `/groups` (Protected)

Create a new group.

**Request Body:**
```json
{
  "name": "My Group",
  "description": "Group description", // Optional
  "groupPic": "data:image/jpeg;base64,...", // Optional
  "memberIds": ["user_id1", "user_id2"] // Optional
}
```

**Response:**
```json
{
  "_id": "group_id",
  "name": "My Group",
  "description": "Group description",
  "groupPic": "",
  "createdBy": "user_id",
  "admins": ["user_id"],
  "members": [
    {
      "userId": "user_id",
      "joinedAt": "2024-01-01T00:00:00.000Z",
      "role": "admin"
    }
  ],
  "settings": {
    "onlyAdminsCanSendMessages": false,
    "onlyAdminsCanAddMembers": false
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### Get User Groups
**GET** `/groups` (Protected)

Get all groups user is member of.

**Response:**
```json
[
  {
    "_id": "group_id",
    "name": "My Group",
    ...
  },
  ...
]
```

---

### Get Group Details
**GET** `/groups/:groupId` (Protected)

Get group details.

**Path Parameters:**
- `groupId`: Group ID

**Response:**
```json
{
  "_id": "group_id",
  "name": "My Group",
  "members": [...],
  "admins": [...],
  ...
}
```

---

### Update Group Settings
**PUT** `/groups/:groupId` (Protected)

Update group settings (admin only).

**Path Parameters:**
- `groupId`: Group ID

**Request Body:**
```json
{
  "name": "Updated Name", // Optional
  "description": "Updated description", // Optional
  "groupPic": "data:image/jpeg;base64,...", // Optional
  "settings": {
    "onlyAdminsCanSendMessages": true,
    "onlyAdminsCanAddMembers": true
  }
}
```

**Response:**
```json
{
  "_id": "group_id",
  "name": "Updated Name",
  ...
}
```

---

### Add Members
**POST** `/groups/:groupId/members` (Protected)

Add members to group (admin only, or if settings allow).

**Path Parameters:**
- `groupId`: Group ID

**Request Body:**
```json
{
  "memberIds": ["user_id1", "user_id2"]
}
```

**Response:**
```json
{
  "_id": "group_id",
  "members": [...],
  ...
}
```

---

### Remove Member
**DELETE** `/groups/:groupId/members/:memberId` (Protected)

Remove member from group (admin only).

**Path Parameters:**
- `groupId`: Group ID
- `memberId`: Member user ID

**Response:**
```json
{
  "_id": "group_id",
  "members": [...],
  ...
}
```

---

### Leave Group
**POST** `/groups/:groupId/leave` (Protected)

Leave a group.

**Path Parameters:**
- `groupId`: Group ID

**Response:**
```json
{
  "message": "Left group successfully"
}
```

---

### Make Admin
**POST** `/groups/:groupId/admin/:memberId` (Protected)

Make a member admin (admin only).

**Path Parameters:**
- `groupId`: Group ID
- `memberId`: Member user ID

**Response:**
```json
{
  "_id": "group_id",
  "admins": [...],
  ...
}
```

---

## Socket Events

### Client → Server Events

#### `typing`
Send typing indicator.

```javascript
socket.emit("typing", {
  receiverId: "user_id", // For one-to-one
  groupId: "group_id", // For group
  isTyping: true
});
```

#### `joinGroup`
Join a group room.

```javascript
socket.emit("joinGroup", "group_id");
```

#### `leaveGroup`
Leave a group room.

```javascript
socket.emit("leaveGroup", "group_id");
```

#### `messageDelivered`
Mark message as delivered.

```javascript
socket.emit("messageDelivered", {
  messageId: "message_id",
  receiverId: "user_id"
});
```

#### `messageRead`
Mark messages as read.

```javascript
socket.emit("messageRead", {
  messageIds: ["message_id1", "message_id2"],
  receiverId: "user_id"
});
```

---

### Server → Client Events

#### `getOnlineUsers`
List of online user IDs.

```javascript
socket.on("getOnlineUsers", (userIds) => {
  // userIds: ["user_id1", "user_id2", ...]
});
```

#### `newMessage`
New message received.

```javascript
socket.on("newMessage", (message) => {
  // message object
});
```

#### `messageDelivered`
Message delivered confirmation.

```javascript
socket.on("messageDelivered", ({ messageId }) => {
  // Update message status
});
```

#### `messagesRead`
Messages read confirmation.

```javascript
socket.on("messagesRead", ({ messageIds, receiverId }) => {
  // Update messages as read
});
```

#### `messageReaction`
Message reaction update.

```javascript
socket.on("messageReaction", ({ messageId, reaction }) => {
  // Update message reactions
});
```

#### `messageDeleted`
Message deleted notification.

```javascript
socket.on("messageDeleted", ({ messageId }) => {
  // Remove message from UI
});
```

#### `typing`
Typing indicator from other user.

```javascript
socket.on("typing", ({ userId, isTyping, receiverId, groupId }) => {
  // Show/hide typing indicator
});
```

---

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "message": "Error message",
  "error": "Detailed error information"
}
```

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Notes

1. All timestamps are in ISO 8601 format (UTC).
2. File uploads should be sent as base64-encoded data URLs.
3. Pagination starts from page 1.
4. Messages are sorted by creation date (newest first).
5. Read receipts are automatically updated when messages are fetched.
6. Disappearing messages are automatically deleted by cron jobs.
7. Scheduled messages are sent automatically by cron jobs.

