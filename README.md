# NexoChat

WhatsApp-like full stack real-time chat application built with the MERN stack.

## Overview

NexoChat supports one-to-one chat, group chat, media sharing, and live updates using Socket.io.
It is designed as a modern chat app with authentication, privacy settings, and message-level features.

## Main Features

### Authentication
- Signup/Login with email or phone number
- JWT auth with refresh token
- Password hashing using bcrypt
- OTP flow placeholder (email/SMS integration can be added)

### Messaging
- Real-time one-to-one messaging
- Read receipts (sent, delivered, read)
- Typing indicators
- Last seen and online/offline status
- Message reactions
- Message deletion
- Scheduled messages
- Disappearing messages
- Optional AES encryption support

### Media and Voice
- Image upload (with compression)
- Video, audio, and document sharing
- Voice message recording and sending
- Media storage via MongoDB GridFS

### Groups
- Create and manage groups
- Add/remove members
- Admin controls
- Group settings

### User Experience
- Contact search
- Theme system (DaisyUI)
- In-app notifications and sound alerts
- Chat export to JSON
- Auto-reply chatbot rules

## Tech Stack

### Frontend
- React 18 + Vite
- Redux Toolkit
- Tailwind CSS + DaisyUI
- React Router
- Socket.io Client
- React Hot Toast

### Backend
- Node.js + Express
- MongoDB + Mongoose
- Socket.io
- JWT + cookie-based auth
- bcryptjs
- node-cron
- crypto-js
- sharp

## Prerequisites

- Node.js 18 or above
- MongoDB (local or Atlas)
- npm

## Setup

### 1) Clone repository
```bash
git clone <your-repo-url>
cd NexoChat
```

### 2) Install dependencies
```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

### 3) Create backend env file
Create `backend/.env`:

```env
PORT=5001
NODE_ENV=development
CLIENT_URL=http://localhost:5173

MONGODB_URI=mongodb://localhost:27017/chat-app

JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
ENCRYPTION_KEY=your-encryption-key
```

### 4) Run app in development
Terminal 1:
```bash
cd backend
npm run dev
```

Terminal 2:
```bash
cd frontend
npm run dev
```

Frontend: `http://localhost:5173`  
Backend API: `http://localhost:5001`

## API Summary

### Auth
- `POST /api/auth/send-otp`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh-token`
- `GET /api/auth/check`
- `PUT /api/auth/update-profile`
- `PUT /api/auth/update-privacy`
- `PUT /api/auth/update-auto-reply`

### Messages
- `GET /api/messages/users?search=`
- `GET /api/messages/chat/:id?page=`
- `GET /api/messages/group/:groupId?page=`
- `POST /api/messages/send/:id`
- `POST /api/messages/send-group/:groupId`
- `PUT /api/messages/read`
- `POST /api/messages/reaction/:messageId`
- `DELETE /api/messages/reaction/:messageId`
- `DELETE /api/messages/:messageId`
- `GET /api/messages/export/:id`
- `GET /api/messages/export-group/:groupId`

### Groups
- `POST /api/groups`
- `GET /api/groups`
- `GET /api/groups/:groupId`
- `PUT /api/groups/:groupId`
- `POST /api/groups/:groupId/members`
- `DELETE /api/groups/:groupId/members/:memberId`
- `POST /api/groups/:groupId/leave`
- `POST /api/groups/:groupId/admin/:memberId`

## Socket Events

### Client -> Server
- `typing`
- `joinGroup`
- `leaveGroup`
- `messageDelivered`
- `messageRead`

### Server -> Client
- `getOnlineUsers`
- `newMessage`
- `messageDelivered`
- `messagesRead`
- `messageReaction`
- `messageDeleted`
- `typing`

## Important Notes

- OTP is currently placeholder logic.
- WebRTC voice/video calling is optional and not implemented yet.
- Push notifications (PWA) are not implemented yet.
- For production, use strong secrets and secure key management.

## Documentation

- `API_DOCUMENTATION.md`
- `SOCKET_EVENTS.md`
- `IMPLEMENTATION_SUMMARY.md`
- `RUN_INSTRUCTIONS.md`

## License

MIT
