# NexoChat

- **What it is:** WhatsApp-style chat app (one-to-one + groups) with a **MERN** stack (**M**ongoDB, **E**xpress, **R**eact, **N**ode).
- **Real-time:** **Socket.io** (live messages, typing, online list, call signaling).
- **Not the same as:** A hosted product like WhatsApp Web — you run **MongoDB** + **backend** + **frontend** on your machine (or a server).

---

## What this repo contains

| Path | Role |
|------|------|
| `frontend/` | **React** app (**Vite** bundler), **Redux Toolkit** state, **Tailwind** + **DaisyUI** UI |
| `backend/` | **Express** REST API + **Socket.io** server, **Mongoose** models |
| `*.md` (root) | Extra docs: API, sockets, setup, academic report, etc. |
| `package.json` (root) | Convenience scripts to **build** frontend and **start** backend |

---

## Tech (names stay as-is)

**Frontend**

- React 18, Vite, React Router
- Redux Toolkit (auth, chat, groups, theme, calls, notifications)
- Axios (HTTP to `/api/...`)
- Socket.io client (parallel to HTTP)
- Tailwind CSS, DaisyUI, react-hot-toast

**Backend**

- Node.js, Express
- MongoDB + Mongoose
- Socket.io (same Node process as Express via `http.Server`)
- JWT access + refresh (cookies supported), bcrypt
- GridFS / file helpers for media; optional Cloudinary-style env (see `ENV_EXPLANATION.md`)
- node-cron (scheduled jobs), crypto-js / optional message encryption helpers

---

## End-to-end flow (how a message moves)

1. User opens **Vite** dev URL (default `http://localhost:5173`).
2. **React** loads; `App.jsx` runs **`checkAuth`** → hits **`GET /api/auth/check`** (cookie / token).
3. If logged in, **`connectSocket(userId)`** opens a **WebSocket** to the backend **Socket.io** server.
4. Sending a message: **Redux** / components call **`POST /api/messages/...`** → **Express** saves to **MongoDB** → server may **`emit('newMessage', ...)`** so both sides update without full page reload.
5. Sidebar refreshes user order / unread when **`newMessage`** fires (see `App.jsx`).

**Groups:** same idea, but routes under `/api/groups` and socket rooms (`joinGroup` / `leaveGroup` — see `SOCKET_EVENTS.md`).

---

## Local setup (short)

**Prerequisites**

- Node.js 18+
- MongoDB running (local URI or Atlas)

**Install**

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

**Backend env:** create `backend/.env` (see `ENV_EXPLANATION.md` / `QUICK_START.md` for full list). Minimum idea:

- `PORT`, `CLIENT_URL`, `MONGODB_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ENCRYPTION_KEY`

**Run (two terminals)**

```bash
cd backend && npm run dev
```

```bash
cd frontend && npm run dev
```

- Frontend: `http://localhost:5173`
- API: `http://localhost:5001` (or your `PORT`)

**Production-ish build (root)**

```bash
npm run build
npm start
```

---

## Main API areas (detail in `API_DOCUMENTATION.md`)

- **`/api/auth`** — signup, login, logout, refresh, profile, privacy, auto-reply
- **`/api/messages`** — users list, chat history, send, read receipts, reactions, delete, export
- **`/api/groups`** — CRUD groups, members, admins, leave
- **`/api/files`** — uploads tied to GridFS / file pipeline

---

## Sockets (detail in `SOCKET_EVENTS.md`)

- Client → server: typing, join/leave group, delivered/read acks
- Server → client: online users, new message, reactions, deletes, typing, call-related events (used with **WebRTC** UI)

---

## What is “done” vs “depends on you”

| Area | Status |
|------|--------|
| Auth (JWT, bcrypt, refresh) | Implemented |
| Email OTP signup | Works if **SMTP** / mail env is set (`emailService.js`); dev may expose OTP in JSON for testing |
| Real-time chat, groups, media, reactions, privacy toggles | Implemented (see `IMPLEMENTATION_SUMMARY.md`) |
| Voice/video (**WebRTC**) | **Code exists** (`CallManager.jsx`, socket handlers) — quality depends on network/STUN; treat as **advanced / beta** |
| Mobile push (FCM etc.) | Not in scope of this repo |
| Production hardening | You must set strong secrets, HTTPS, correct `CLIENT_URL`, rate limits, etc. |

---

## License

MIT
