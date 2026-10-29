# QNDX USDT Staking Platform

MERN stack staking platform (Phase 1: authentication + member dashboard).

> 📋 **Comprehensive Backend Audit & Security Report:**  
> For side-by-side comparison with your business plan PDF, full backend function catalog, and security fault audit, see **[`BACKEND_AUDIT_AND_SECURITY_REPORT.md`](BACKEND_AUDIT_AND_SECURITY_REPORT.md)**.

## Stack

- **Frontend:** React (Vite), Tailwind CSS v4, React Router, Axios, Lucide Icons
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT + bcryptjs

## Folder Structure

```
qxdn/
├── server/          # Express + Mongoose API
│   ├── server.js    # entry point
│   ├── .env         # local config (see .env.example)
│   └── src/
│       ├── config/        # MongoDB connection
│       ├── models/        # User model
│       ├── controllers/   # auth controllers
│       ├── middleware/    # JWT protect + error handling
│       ├── routes/        # /api/auth routes
│       └── app.js         # Express app
└── client/          # Vite + React frontend
    ├── .env         # VITE_API_URL
    └── src/
        ├── context/       # AuthContext (global auth state)
        ├── components/    # PrivateRoute
        ├── pages/         # Login.jsx, Dashboard.jsx
        └── lib/api.js     # Axios instance (auto Bearer token)
```

## Prerequisites

- Node.js >= 18
- A running MongoDB instance (local or Atlas)

## Start the Server (API)

```bash
cd server
npm install
npm run dev
```

- API runs at `http://localhost:5000`
- `dev` uses Node watch mode; `npm start` runs production mode
- Configure `server/.env` before starting:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/qndx
JWT_SECRET=replace_with_a_long_random_string
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
DISABLE_INVITE_REQUIREMENT=true     # set false in production
MASTER_INVITE_CODE=QNDX-FOUNDER
```

## Start the Client

In a second terminal:

```bash
cd client
npm install
npm run dev
```

- App runs at `http://localhost:5173`
- `client/.env` must point at the API: `VITE_API_URL=http://localhost:5000`

## Test the Auth Flow

Register (invite-based, use the master code in dev):

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@qndx.io","password":"StakePass123","inviteCode":"QNDX-FOUNDER"}'
```

Then log in via the UI at `http://localhost:5173/login` — you will be redirected to `/dashboard`.

## API Endpoints

| Method | Route          | Auth | Description                        |
|--------|----------------|------|------------------------------------|
| POST   | /api/auth/register | No | Invite-based registration         |
| POST   | /api/auth/login    | No | Returns user + JWT                |
| GET    | /api/auth/me       | Yes (Bearer token) | Current logged-in user |

## Production Checklist

- Set `DISABLE_INVITE_REQUIREMENT=false`
- Replace `JWT_SECRET` with a strong random value
- Flip `isEmailVerified` default to `false` once email verification ships
- Serve the built client (`npm run build`) behind HTTPS
