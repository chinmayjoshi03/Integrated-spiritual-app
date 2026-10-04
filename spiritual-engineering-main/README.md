# 🕉️ Spiritual Platform — Monorepo

A full-stack spiritual platform built with **React + TypeScript** (frontend) and **Node.js + Express + PostgreSQL** (backend), organised as an **npm workspace monorepo**.

---

## 📁 Project Structure

```
spiritual-platform/
├── frontend/                  # Vite + React 19 + TypeScript
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/        # Shared UI components
│   │   │   ├── DashboardHeader/
│   │   │   ├── DashboardSidebar/
│   │   │   ├── Input/
│   │   │   └── Navbar/
│   │   ├── context/           # React context providers
│   │   │   └── AuthContext.tsx
│   │   ├── features/          # Feature-sliced modules
│   │   │   ├── auth/          # Login, Register, OTP, Reset-password pages + service
│   │   │   └── dashboard/     # User / Admin / Mentor dashboards + widgets
│   │   ├── hooks/             # Custom React hooks
│   │   ├── layouts/           # Page layout wrappers
│   │   ├── pages/             # Top-level pages (Home, About, 404)
│   │   ├── routes/            # React Router config + ProtectedRoute
│   │   ├── services/          # Axios instance (shared HTTP client)
│   │   ├── types/             # TypeScript type definitions
│   │   └── utils/             # Client-side utilities
│   ├── .env.example           # Copy to .env.local and fill values
│   ├── vite.config.ts         # Vite + dev proxy config
│   ├── tsconfig.json
│   └── package.json
│
├── backend/                   # Node.js + Express 5 + PostgreSQL
│   ├── controllers/
│   │   ├── authController.js       # Register, Login, OTP, Password-reset
│   │   └── meditationController.js # Meditations, categories, progress, bookmarks
│   ├── middleware/
│   │   └── authMiddleware.js       # JWT auth + role guard
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── meditationRoutes.js
│   ├── utils/
│   │   ├── mailer.js        # Nodemailer (Gmail) - OTP and reset emails
│   │   ├── otp.js           # OTP + reset-token generators
│   │   ├── storage.js       # Multer disk storage
│   │   └── validators.js    # Email / password validators
│   ├── db.js                # PostgreSQL pool (pg)
│   ├── index.js             # Express app entry point
│   ├── .env.example         # Copy to .env and fill values
│   └── package.json
│
├── package.json             # Root workspace + concurrently scripts
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start

### 1. Install dependencies

```bash
# From the repo root
npm install
npm install --workspace=frontend
npm install --workspace=backend
```

### 2. Set up environment variables

**Backend** — copy and fill:
```bash
cp backend/.env.example backend/.env
```

| Variable | Description |
|---|---|
| `PORT` | Express server port (default 5000) |
| `DB_HOST` | PostgreSQL host |
| `DB_PORT` | PostgreSQL port (default 5432) |
| `DB_NAME` | Database name |
| `DB_USER` | Database user |
| `DB_PASSWORD` | Database password |
| `JWT_SECRET` | Secret key for signing JWTs |
| `GMAIL_USER` | Gmail address for sending emails |
| `GMAIL_APP_PASSWORD` | Gmail App Password |
| `BACKEND_URL` | Full backend URL e.g. http://localhost:5000 |
| `FRONTEND_URL` | Full frontend URL e.g. http://localhost:5173 |

**Frontend** — copy and fill:
```bash
cp frontend/.env.example frontend/.env.local
```

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Backend API base e.g. http://localhost:5000/api |

> In development the Vite proxy handles /api automatically — you can leave VITE_API_BASE_URL unset.

### 3. Set up the database

Run the following SQL in PostgreSQL:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE otp_codes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE meditation_categories (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE meditations (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category_id INTEGER REFERENCES meditation_categories(id) ON DELETE SET NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('audio', 'video')),
  media_url TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE meditation_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  meditation_id INTEGER REFERENCES meditations(id) ON DELETE CASCADE,
  progress_seconds INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  last_played_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, meditation_id)
);

CREATE TABLE meditation_bookmarks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  meditation_id INTEGER REFERENCES meditations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, meditation_id)
);
```

### 4. Run development servers

```bash
# Run both frontend (port 5173) and backend (port 5000) together:
npm run dev

# Or individually:
npm run dev:frontend
npm run dev:backend
```

---

## 🔌 API Endpoints

### Auth (/api/auth)
| Method | Path | Description |
|---|---|---|
| POST | /register | Register a new user |
| POST | /login | Login and receive JWT |
| POST | /verify-otp | Verify email OTP |
| POST | /resend-otp | Resend OTP code |
| POST | /forgot-password | Request password reset email |
| POST | /reset-password | Reset password with token |

### Meditation (/api/meditation)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /categories | - | List categories |
| POST | /categories | mentor/admin | Create category |
| GET | / | - | List meditations |
| GET | /:id | - | Get meditation |
| POST | / | mentor/admin | Upload meditation |
| GET | /:id/progress | user | Get progress |
| POST | /:id/progress | user | Update progress |
| GET | /:id/bookmark | user | Get bookmark status |
| POST | /:id/bookmark | user | Toggle bookmark |

---

## 🛡️ User Roles
| Role | Access |
|---|---|
| user | Personal dashboard, meditations |
| mentor | Mentor dashboard, upload meditations/categories |
| admin | Admin dashboard, all mentor permissions |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, React Router v7, Axios |
| Backend | Node.js, Express 5, JWT, Bcrypt |
| Database | PostgreSQL (via pg) |
| Email | Nodemailer (Gmail) |
| File uploads | Multer |
| Dev tooling | Nodemon, ESLint, concurrently |
