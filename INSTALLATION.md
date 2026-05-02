# Deploying Chatty on a New Machine

This guide walks through everything you need to spin up the Chatty project on a fresh computer—hardware requirements, software versions, environment configuration, and exact commands to run.

---

## 1. System Requirements

| Category | Requirement |
| --- | --- |
| CPU | Dual‑core 64‑bit processor (Intel i5/Ryzen 3 or better) |
| RAM | Minimum 8 GB (16 GB recommended for running DB + frontend + backend simultaneously) |
| Storage | ~5 GB free (repo, node_modules, MongoDB data) |
| OS | Windows 10/11, macOS 12+, or Ubuntu 20.04+ |
| Network | Stable broadband; WebRTC calls work best on <100 ms latency |

### Software Versions

| Tool | Version |
| --- | --- |
| Node.js | 18.18 LTS (or any active LTS ≥18) |
| npm | 9.x (ships with Node 18) |
| MongoDB | ≥ 6.0 Community/Atlas |
| Git | ≥ 2.35 |
| Optional | HTTPS reverse proxy (ngrok/Caddy) for WebRTC testing outside localhost |

---

## 2. Repository Setup

```bash
git clone https://github.com/<your-org>/Chat-clone.git
cd Chat-clone
```

> If cloning via SSH, ensure your SSH key is registered with the remote.

---

## 3. Backend Installation (Node/Express/Mongo)

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Environment file**
   ```bash
   cp .env.example .env
   ```
   Fill in the values:

   | Key | Description |
   | --- | --- |
   | `MONGO_URI` | MongoDB connection string (e.g. `mongodb://localhost:27017/chatty`) |
   | `JWT_SECRET` | Any random 32+ character secret |
   | `CLIENT_URL` | Frontend origin (`http://localhost:5173`) |
   | `PORT` | API port (default `5001`) |
   | `SOCKET_PORT` | If running socket server separately (defaults to `PORT`) |
   | `STUN_SERVERS` | Optional JSON override for WebRTC STUN/TURN |

3. **Prepare MongoDB**
   - Local: start `mongod` service.
   - Remote/Atlas: whitelist your IP and copy the SRV connection string.

4. **Run the API + Socket server**
   ```bash
   npm run dev
   ```
   The backend listens on `http://localhost:5001` by default and also mounts the Socket.io server used by messaging + calls.

---

## 4. Frontend Installation (React/Vite)

1. **Install dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

2. **Environment file**
   ```bash
   cp .env.example .env
   ```

   | Key | Description |
   | --- | --- |
   | `VITE_API_URL` | Backend base URL (`http://localhost:5001`) |
   | `VITE_SOCKET_URL` | Same as API unless sockets are proxied elsewhere |

3. **Lock Vite port (already configured to 5173)**  
   If you need another port, update `vite.config.js` and the backend CORS/`CLIENT_URL`.

4. **Run the dev server**
   ```bash
   npm run dev
   ```
   Vite serves the UI at `http://localhost:5173`.

5. **Build for production (optional)**
   ```bash
   npm run build
   npm run preview
   ```

---

## 5. Testing Messaging & Calls Locally

1. Open two browser profiles (e.g., Chrome + Edge) or two different browsers.
2. Sign up/Login with different accounts.
3. Start a 1:1 chat → send text, media, voice recording.
4. For calls:
   - Ensure both tabs stay authenticated (clearing cookies forces re-login).
   - Grant microphone/camera access when prompted.
   - For cross-network/WebRTC tests, tunnel the backend (ngrok) or deploy behind HTTPS.

---

## 6. Common Troubleshooting

| Symptom | Fix |
| --- | --- |
| **Frontend shows “Network Error”** | Ensure backend `PORT` matches `VITE_API_URL`. Kill stale node processes (port 5001). |
| **Cannot delete message for everyone** | Check system clock drift; deletion window is 15 min server-time. |
| **Call doesn’t ring** | Both clients must have stable auth + socket connection. Ensure backend logs show `call:incoming` reaching the target. |
| **Media uploads fail** | Verify `uploads/` has write permission if using local storage; for GridFS ensure MongoDB URI is correct. |

---

## 7. Deployment Notes

- **Production build**: host frontend (Vite build output) on any static host or behind Nginx.
- **Backend**: run via PM2 or systemd service; point `CLIENT_URL` to your deployed frontend.
- **Environment hardening**: rotate `JWT_SECRET`, configure CORS, and secure MongoDB with credentials.
- **SSL**: WebRTC requires HTTPS in production—use Let’s Encrypt or a managed certificate.

---

You can now replicate the Chatty environment on any machine by following the steps above. Keep this file in version control so the onboarding process stays consistent for the entire team. Happy chatting! 🎉

