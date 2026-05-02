# 🚀 Quick Start Guide (No Cloud Services)

## Prerequisites ✅
- Node.js v18+ (You have v22.13.0 ✅)
- MongoDB (You have v8.0.4 ✅)
- npm (You have v10.9.2 ✅)

---

## Step 1: Create Environment File

Create `backend/.env` file:

```env
PORT=5001
NODE_ENV=development
CLIENT_URL=http://localhost:5173

MONGODB_URI=mongodb://localhost:27017/chat-app

JWT_SECRET=change-this-to-random-32-char-string-in-production
JWT_REFRESH_SECRET=change-this-to-random-32-char-string-in-production
ENCRYPTION_KEY=change-this-to-random-32-char-string-in-production
```

---

## Step 2: Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend (new terminal)
cd frontend
npm install
```

---

## Step 3: Start MongoDB

```bash
# Check if running
mongosh --eval "db.version()"

# If not, start it
mongod
```

---

## Step 4: Run Application

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

---

## Step 5: Open Browser

Go to: **http://localhost:5173**

---

## ✅ That's It!

**No cloud services needed!** All files are stored in MongoDB GridFS.

---

## Tech Stack (Self-Hosted Only)

- ✅ React.js + Tailwind CSS
- ✅ Node.js + Express.js
- ✅ MongoDB + GridFS
- ✅ Socket.io
- ✅ JWT Authentication
- ❌ No Cloudinary
- ❌ No AWS
- ❌ No external services

---

## Troubleshooting

**MongoDB not running?**
```bash
mongod
```

**Port in use?**
Change `PORT=5002` in `.env`

**Module errors?**
```bash
npm install
```

