# ✨ WhatsApp-like Full Stack Real-Time Chat Application ✨

A complete WhatsApp-style chat application with all modern features built using MERN stack.

## 🚀 Features

### ✅ Implemented Features

1. **User Authentication**
   - Register/Login with Email or Phone Number
   - OTP verification placeholder (ready for email/SMS integration)
   - JWT authentication with refresh tokens
   - Password hashing with bcrypt

2. **One-to-One Chat**
   - Real-time messaging with Socket.io
   - Text messages with emoji support
   - Message timestamps
   - Read receipts (Sent/Delivered/Read)

3. **Contact List**
   - List of all registered users
   - Search functionality
   - Online/Offline status indicators
   - Start chat with any user

4. **Media Sharing**
   - Send images (with compression)
   - Send videos
   - Send audio files
   - Send documents
   - MongoDB GridFS for media storage

5. **Read Receipts & User Status**
   - Sent / Delivered / Read indicators
   - Online/Offline status
   - Typing indicators
   - Last seen tracking

6. **Group Chat**
   - Create groups
   - Add/Remove members
   - Admin management
   - Group settings
   - Group notifications

7. **Voice Messages**
   - Record and send voice notes
   - Audio duration tracking
   - Backend API ready

8. **Message Features**
   - Message reactions (emoji reactions)
   - Disappearing messages (auto-delete after set duration)
   - Scheduled messages (send at specific time)
   - Message encryption (AES)
   - Delete messages

9. **Privacy & Security**
   - Hide last seen
   - Hide profile picture
   - Hide status
   - Toggle read receipts
   - Message encryption

10. **Chat Backup**
    - Export chats to JSON
    - Download chat history
    - Include media metadata

11. **Notifications**
    - In-app notifications
    - Sound alerts (configurable)
    - Real-time updates

12. **Chatbot Auto-Reply**
    - Rule-based auto-reply system
    - Customizable messages
    - Keyword-based responses

13. **Theme System**
    - Multiple themes (DaisyUI)
    - Theme persistence in database
    - Dark/Light mode support

## 🛠️ Tech Stack

### Frontend
- **React 18** with Vite
- **Redux Toolkit** for state management
- **Tailwind CSS** + **DaisyUI** for styling
- **Socket.io-client** for real-time communication
- **React Router** for navigation
- **React Hot Toast** for notifications

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose
- **Socket.io** for real-time communication
- **JWT** for authentication
- **bcryptjs** for password hashing
- **MongoDB GridFS** for media storage
- **node-cron** for scheduled tasks
- **crypto-js** for encryption
- **sharp** for image compression
- **GridFS** for file storage

## 📋 Prerequisites

- Node.js (v18+)
- MongoDB (local or Atlas)
- npm or yarn

## 🔧 Setup Instructions

### 1. Clone the repository

```bash
git clone <repository-url>
cd Chat-clone
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Server
PORT=5001
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017/chat-app
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chat-app

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production

# Encryption
ENCRYPTION_KEY=your-encryption-key-change-in-production

# Email/SMS (Optional - for OTP)
# EMAIL_SERVICE_API_KEY=...
# SMS_SERVICE_API_KEY=...
```

### 4. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# If using local MongoDB
mongod
```

Or use MongoDB Atlas (cloud).

### 5. Run the Application

#### Development Mode

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

#### Production Mode

```bash
# Build frontend
npm run build

# Start server
npm start
```

The app will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5001

## 📁 Project Structure

```
Chat-clone/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── models/          # MongoDB models
│   │   ├── routes/          # Express routes
│   │   ├── middleware/      # Auth middleware
│   │   ├── lib/             # Utilities (socket, db, encryption, etc.)
│   │   └── seeds/            # Database seeds
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── store/           # Redux store & slices
│   │   ├── lib/             # Utilities (axios, etc.)
│   │   └── constants/       # Constants
│   └── package.json
└── package.json
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP
- `POST /api/auth/signup` - Register user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh-token` - Refresh access token
- `GET /api/auth/check` - Check authentication
- `PUT /api/auth/update-profile` - Update profile
- `PUT /api/auth/update-privacy` - Update privacy settings
- `PUT /api/auth/update-auto-reply` - Update auto-reply settings

### Messages
- `GET /api/messages/users?search=` - Get users with search
- `GET /api/messages/chat/:id?page=` - Get messages (one-to-one)
- `GET /api/messages/group/:groupId?page=` - Get group messages
- `POST /api/messages/send/:id` - Send message
- `POST /api/messages/send-group/:groupId` - Send group message
- `PUT /api/messages/read` - Mark messages as read
- `POST /api/messages/reaction/:messageId` - Add reaction
- `DELETE /api/messages/reaction/:messageId` - Remove reaction
- `DELETE /api/messages/:messageId` - Delete message
- `GET /api/messages/export/:id` - Export chat
- `GET /api/messages/export-group/:groupId` - Export group chat

### Groups
- `POST /api/groups` - Create group
- `GET /api/groups` - Get user groups
- `GET /api/groups/:groupId` - Get group details
- `PUT /api/groups/:groupId` - Update group settings
- `POST /api/groups/:groupId/members` - Add members
- `DELETE /api/groups/:groupId/members/:memberId` - Remove member
- `POST /api/groups/:groupId/leave` - Leave group
- `POST /api/groups/:groupId/admin/:memberId` - Make admin

## 🔔 Socket Events

### Client → Server
- `typing` - Send typing indicator
- `joinGroup` - Join group room
- `leaveGroup` - Leave group room
- `messageDelivered` - Mark message as delivered
- `messageRead` - Mark message as read

### Server → Client
- `getOnlineUsers` - List of online user IDs
- `newMessage` - New message received
- `messageDelivered` - Message delivered confirmation
- `messagesRead` - Messages read confirmation
- `messageReaction` - Message reaction update
- `messageDeleted` - Message deleted notification
- `typing` - Typing indicator from other user

## 🎨 Frontend Components

### Core Components
- `ChatContainer` - Main chat window
- `ChatList` / `Sidebar` - Contact/group list
- `MessageInput` - Message input with media support
- `MessageBubble` - Individual message display
- `MediaUpload` - Media upload component
- `AudioRecorder` - Voice message recorder
- `GroupSettings` - Group management
- `PrivacySettings` - Privacy controls

## 🔐 Security Features

- JWT with refresh tokens
- HTTP-only cookies
- Password hashing (bcrypt)
- Message encryption (AES)
- CORS protection
- XSS protection
- CSRF protection

## 🚧 Optional Features (Not Yet Implemented)

- WebRTC Voice & Video Calling
- Push notifications (PWA)
- Message pagination UI (backend ready)
- Infinite scroll (backend ready)
- Audio waveform visualization

## 📝 Notes

- OTP system is placeholder - integrate with email/SMS service for production
- All media files are stored in MongoDB GridFS
- Message encryption keys should be stored securely in production
- Refresh tokens are stored in database - consider Redis for production
- Cron jobs run every minute - adjust as needed

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

Built with modern web technologies and best practices for a scalable, real-time chat application.
