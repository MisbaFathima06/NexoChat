# 🚀 How to Run the Application

## Prerequisites

Make sure you have installed:
- ✅ Node.js (v18 or higher) - You have v22.13.0 ✅
- ✅ MongoDB - You have v8.0.4 ✅
- ✅ npm - You have v10.9.2 ✅

---

## Step 1: Setup Environment Variables

1. Navigate to the `backend` folder
2. Create a `.env` file (I've created a template for you)
3. Update the `.env` file with your actual values:

```env
# Required - Update these!
MONGODB_URI=mongodb://localhost:27017/chat-app
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
ENCRYPTION_KEY=your-encryption-key-change-in-production

# Optional - For media uploads (you can use Cloudinary free tier)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**Note:** For now, you can use placeholder values for JWT_SECRET, JWT_REFRESH_SECRET, and ENCRYPTION_KEY. Just make sure they're at least 32 characters long.

---

## Step 2: Start MongoDB

Make sure MongoDB is running on your system:

```bash
# If MongoDB is installed as a service, it should already be running
# Check if it's running:
mongosh --eval "db.version()"

# If not running, start it:
mongod
```

Or use MongoDB Atlas (cloud) - just update the `MONGODB_URI` in `.env`.

---

## Step 3: Install Dependencies

### Backend Dependencies
```bash
cd backend
npm install
```

### Frontend Dependencies
```bash
cd frontend
npm install
```

---

## Step 4: Run the Application

You need **TWO terminal windows** - one for backend, one for frontend.

### Terminal 1 - Backend Server

```bash
cd backend
npm run dev
```

You should see:
```
server is running on PORT: 5001
MongoDB connected: localhost
GridFS initialized
Cron jobs initialized
```

### Terminal 2 - Frontend Development Server

```bash
cd frontend
npm run dev
```

You should see:
```
VITE v6.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

---

## Step 5: Open the Application

Open your browser and go to:
```
http://localhost:5173
```

---

## 🎉 You're Ready!

1. **Sign Up** - Create a new account (email or phone)
2. **Login** - Sign in with your credentials
3. **Start Chatting** - Select a user from the sidebar and start messaging!

---

## Troubleshooting

### MongoDB Connection Error
```
MongoDB connection error: ...
```

**Solution:**
- Make sure MongoDB is running: `mongod` or check MongoDB service
- Check your `MONGODB_URI` in `.env` file
- For MongoDB Atlas, make sure your IP is whitelisted

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5001
```

**Solution:**
- Change `PORT=5001` to another port in `.env` (e.g., `PORT=5002`)
- Or kill the process using port 5001

### Frontend Can't Connect to Backend
```
Network Error: Failed to fetch
```

**Solution:**
- Make sure backend is running on port 5001
- Check `CLIENT_URL` in backend `.env` matches frontend URL
- Check CORS settings in `backend/src/index.js`

### Module Not Found Errors
```
Error: Cannot find module '...'
```

**Solution:**
- Run `npm install` in both `backend` and `frontend` folders
- Delete `node_modules` and `package-lock.json`, then run `npm install` again

### Cloudinary Errors (Optional)
If you see Cloudinary errors, you can:
1. Sign up for free Cloudinary account: https://cloudinary.com/
2. Get your credentials and add them to `.env`
3. Or comment out Cloudinary code temporarily (media uploads won't work)

---

## Quick Start Commands

```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm install
npm run dev
```

---

## Production Build

To build for production:

```bash
# Build frontend
cd frontend
npm run build

# Start production server
cd backend
npm start
```

The production server will serve the frontend from `backend/../frontend/dist`.

---

## Need Help?

Check the documentation:
- `README.md` - General information
- `API_DOCUMENTATION.md` - API endpoints
- `SOCKET_EVENTS.md` - Socket.io events
- `IMPLEMENTATION_SUMMARY.md` - Feature checklist

