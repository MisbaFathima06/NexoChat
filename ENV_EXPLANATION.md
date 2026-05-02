# 📝 Environment Variables (.env) Explanation

## What is a .env file?

A `.env` file stores **environment variables** - configuration settings that your application needs to run. These are kept separate from your code for security and flexibility.

---

## File Location

Create this file in: `backend/.env`

**Important:** Never commit `.env` to Git! It contains sensitive information.

---

## Variable Breakdown

### 1. `PORT=5001`
**What it does:** Sets the port number where your backend server will run.

**Explanation:**
- Your backend server listens on this port
- Frontend connects to `http://localhost:5001` to talk to backend
- You can change it to any available port (e.g., 5002, 3000, 8000)

**Example:**
```
PORT=5001  → Server runs on http://localhost:5001
PORT=3000  → Server runs on http://localhost:3000
```

---

### 2. `NODE_ENV=development`
**What it does:** Tells Node.js what environment you're running in.

**Possible values:**
- `development` - For local development (shows detailed errors, uses dev settings)
- `production` - For live/production server (optimized, secure settings)

**What it affects:**
- Error messages (detailed in dev, minimal in production)
- Cookie security (HTTP-only in production)
- CORS settings
- Logging level

**Example:**
```
NODE_ENV=development  → Development mode (what you use now)
NODE_ENV=production   → Production mode (when you deploy)
```

---

### 3. `CLIENT_URL=http://localhost:5173`
**What it does:** Tells the backend where your frontend is running.

**Explanation:**
- Used for CORS (Cross-Origin Resource Sharing)
- Backend allows requests from this URL
- Must match your frontend URL exactly

**Why it's needed:**
- Browser security prevents frontend from accessing backend on different ports
- This tells backend: "It's OK to accept requests from http://localhost:5173"

**Example:**
```
CLIENT_URL=http://localhost:5173     → Frontend on port 5173 (Vite default)
CLIENT_URL=http://localhost:3000    → Frontend on port 3000
CLIENT_URL=https://yourdomain.com    → Production frontend URL
```

---

### 4. `MONGODB_URI=mongodb://localhost:27017/chat-app`
**What it does:** Connection string to your MongoDB database.

**Breaking it down:**
- `mongodb://` - Protocol (how to connect)
- `localhost` - Database server location (your computer)
- `27017` - MongoDB default port
- `chat-app` - Database name (will be created automatically)

**Local MongoDB:**
```
MONGODB_URI=mongodb://localhost:27017/chat-app
```

**MongoDB Atlas (Cloud - Optional):**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chat-app
```

**What it stores:**
- User accounts
- Messages
- Groups
- Media files (via GridFS)

---

### 5. `JWT_SECRET=your-random-32-char-string-here`
**What it does:** Secret key used to sign JWT (JSON Web Tokens) for authentication.

**Why it's important:**
- Used to create login tokens
- Must be kept secret (never share!)
- Should be random and long (32+ characters)

**What happens if it's weak:**
- Hackers could create fake tokens
- They could log in as any user
- Your app would be insecure

**How to generate a secure one:**
```bash
# Linux/Mac:
openssl rand -base64 32

# Windows PowerShell:
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})

# Or use online generator (for development only)
```

**Example:**
```
JWT_SECRET=aB3xK9mP2qR7vT1wY5zA8bC4dE6fG0hI2jK4lM6nO8pQ0rS2tU4vW6xY8zA0
```

---

### 6. `JWT_REFRESH_SECRET=your-random-32-char-string-here`
**What it does:** Secret key for refresh tokens (longer-lived tokens).

**Explanation:**
- Access tokens expire quickly (15 minutes)
- Refresh tokens last longer (7 days)
- Used to get new access tokens without logging in again

**Should be different from JWT_SECRET:**
- Use a different random string
- Same length (32+ characters)
- Also keep it secret

**Example:**
```
JWT_REFRESH_SECRET=xY9zA2bC4dE6fG8hI0jK2lM4nO6pQ8rS0tU2vW4xY6zA8bC0dE2fG4
```

---

### 7. `ENCRYPTION_KEY=your-random-32-char-string-here`
**What it does:** Key used to encrypt/decrypt messages when encryption is enabled.

**Explanation:**
- When user enables "Encrypt" option, messages are encrypted
- This key is used to encrypt and decrypt
- Must be the same for encryption/decryption to work

**Security:**
- Must be kept secret
- Should be random (32+ characters)
- Different from JWT secrets

**Example:**
```
ENCRYPTION_KEY=mN8oP2qR4sT6uV8wX0yZ2aB4cD6eF8gH0iJ2kL4mN6oP8qR0sT2uV4wX6
```

---

## Complete Example .env File

```env
# Server Configuration
PORT=5001
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017/chat-app

# Security Keys (CHANGE THESE IN PRODUCTION!)
JWT_SECRET=mySuperSecretJWTKey12345678901234567890
JWT_REFRESH_SECRET=mySuperSecretRefreshKey12345678901234567890
ENCRYPTION_KEY=mySuperSecretEncryptionKey12345678901234567890
```

---

## ⚠️ Important Security Notes

### For Development (Now):
- ✅ You can use simple placeholder values
- ✅ Just make sure they're 32+ characters
- ✅ Example: `JWT_SECRET=development-secret-key-12345678901234567890`

### For Production (When You Deploy):
- ❌ **NEVER** use simple values
- ✅ Generate truly random strings
- ✅ Use different values for each secret
- ✅ Never commit `.env` to Git
- ✅ Store securely on your server

---

## How to Create the File

### Option 1: Manual Creation
1. Open `backend/` folder
2. Create new file named `.env` (with the dot at the start)
3. Copy the content from above
4. Save

### Option 2: Using Command Line
```bash
cd backend
# Copy the example file
copy .env.example .env
# Then edit .env with your values
```

---

## Testing Your .env File

After creating the file, start your backend:

```bash
cd backend
npm run dev
```

If you see:
```
server is running on PORT: 5001
MongoDB connected: localhost
```

✅ Your `.env` file is working!

If you see errors:
- Check that file is named exactly `.env` (not `.env.txt`)
- Check that all values are on separate lines
- Check that there are no extra spaces

---

## Summary

| Variable | Purpose | Example |
|----------|---------|---------|
| `PORT` | Backend server port | `5001` |
| `NODE_ENV` | Environment mode | `development` |
| `CLIENT_URL` | Frontend URL | `http://localhost:5173` |
| `MONGODB_URI` | Database connection | `mongodb://localhost:27017/chat-app` |
| `JWT_SECRET` | Token signing key | Random 32+ chars |
| `JWT_REFRESH_SECRET` | Refresh token key | Random 32+ chars |
| `ENCRYPTION_KEY` | Message encryption | Random 32+ chars |

---

## Need Help?

If you're having issues:
1. Make sure file is in `backend/.env` (not `backend/.env.txt`)
2. Each variable should be on its own line
3. No spaces around the `=` sign
4. No quotes needed (unless value has spaces)

