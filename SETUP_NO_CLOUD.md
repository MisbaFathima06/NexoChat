# Setup Instructions (No Cloud Services)

This application uses **only local/self-hosted services**:
- ✅ MongoDB (local or self-hosted)
- ✅ Node.js + Express.js
- ✅ React.js + Tailwind CSS
- ✅ Socket.io
- ✅ JWT Authentication
- ✅ MongoDB GridFS for file storage

**No cloud services required!**

---

## Step 1: Install Dependencies

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd frontend
npm install
```

---

## Step 2: Setup Environment Variables

Create `.env` file in `backend/` folder:

```env
# Server Configuration
PORT=5001
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# MongoDB Database (Local)
MONGODB_URI=mongodb://localhost:27017/chat-app

# OR MongoDB Atlas (Self-hosted cloud)
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chat-app

# JWT Authentication (Generate random 32+ character strings)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-characters-long

# Encryption Key (Generate random 32+ character string)
ENCRYPTION_KEY=your-encryption-key-min-32-characters-long
```

**Generate secure keys:**
```bash
# On Linux/Mac
openssl rand -base64 32

# On Windows PowerShell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

---

## Step 3: Start MongoDB

### Local MongoDB
```bash
# Start MongoDB service
mongod

# Or if installed as Windows service, it should auto-start
```

### MongoDB Atlas (Optional)
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env`

---

## Step 4: Run the Application

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

Expected output:
```
server is running on PORT: 5001
MongoDB connected: localhost
GridFS initialized
Cron jobs initialized
```

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

Expected output:
```
VITE v6.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

---

## Step 5: Open Application

Open browser: **http://localhost:5173**

---

## How Media Storage Works

All media files (images, videos, audio, documents) are stored in **MongoDB GridFS**:

1. **Upload**: Files are uploaded as base64, converted to buffers, and stored in GridFS
2. **Retrieval**: Files are served via `/api/files/:fileId` endpoint
3. **Storage**: All files are stored in your MongoDB database
4. **No External Services**: Everything is self-hosted

### File URLs
- Profile pictures: `/api/files/{fileId}`
- Message images: `/api/files/{fileId}`
- Message videos: `/api/files/{fileId}`
- Message audio: `/api/files/{fileId}`
- Documents: `/api/files/{fileId}`

---

## Tech Stack (No Cloud)

✅ **Frontend:**
- React.js 18
- Tailwind CSS + DaisyUI
- Redux Toolkit
- Socket.io-client
- Vite

✅ **Backend:**
- Node.js
- Express.js
- MongoDB + Mongoose
- Socket.io
- JWT
- GridFS (for files)
- Sharp (for image compression)
- node-cron (for scheduled tasks)
- crypto-js (for encryption)

✅ **Database:**
- MongoDB (local or self-hosted)

✅ **No Cloud Services:**
- ❌ No Cloudinary
- ❌ No AWS S3
- ❌ No external file storage
- ✅ Everything stored in MongoDB GridFS

---

## Troubleshooting

### MongoDB Connection Error
```
Error: MongoDB connection error
```

**Solution:**
- Make sure MongoDB is running: `mongod`
- Check `MONGODB_URI` in `.env`
- For MongoDB Atlas, check network access settings

### GridFS Not Initialized
```
Error: GridFS not initialized
```

**Solution:**
- Make sure MongoDB connection is successful
- GridFS initializes automatically after DB connection
- Check MongoDB connection logs

### File Upload Errors
```
Error uploading file
```

**Solution:**
- Check MongoDB connection
- Ensure GridFS is initialized
- Check file size limits (default: 50MB)
- Verify base64 encoding is correct

---

## Production Deployment

For production, you can:
1. **Self-host MongoDB** on your server
2. **Use MongoDB Atlas** (free tier available)
3. **Deploy backend** to your server (VPS, DigitalOcean, etc.)
4. **Deploy frontend** to your server or use static hosting

**No cloud services needed!** Everything runs on your infrastructure.

---

## File Size Limits

- **Default limit**: 50MB per file
- **Image compression**: Automatic (max 800px width, 80% quality)
- **Storage**: Unlimited (depends on MongoDB storage)

---

## Security Notes

1. **JWT Secrets**: Use strong, random 32+ character strings
2. **Encryption Key**: Use strong, random 32+ character strings
3. **MongoDB**: Enable authentication in production
4. **CORS**: Configure properly for production domain
5. **File Access**: Files are served via API (add authentication if needed)

---

## That's It!

Your application is now running **completely self-hosted** with no cloud dependencies! 🎉

