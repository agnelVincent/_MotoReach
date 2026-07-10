# MotoReach 🏍️

MotoReach is a comprehensive, real-time web platform designed to seamlessly connect vehicle owners with nearby professional workshops and independent mechanics. By streamlining service requests, real-time chat, estimates, escrow payments, and service tracking, MotoReach provides a transparent and frictionless experience for automotive repairs and roadside assistance.

---

## 🔑 Key Features

### For Users
- **Location-Based Discovery**: Automatically route service requests to verified nearby workshops.
- **Service Flow & Tracking**: Real-time status updates on vehicle service execution.
- **Integrated Payments**: Secure checkout with Stripe integration and in-platform wallet mechanisms (top-ups and escrow handling).
- **Real-Time Communication**: Built-in WebSocket-based chat to converse directly with workshops and assigned mechanics securely.

### For Workshops
- **Job Management Dashboard**: Filter, accept, or reject incoming nearby service requests based on bandwidth and capabilities.
- **Mechanic Dispatch**: Assign dedicated mechanics to specific jobs directly from the dashboard.
- **Estimate & Billing**: Issue repair estimates for users to approve, holding funds securely in escrow until job completion.
- **Team & Subscription Management**: Organize mechanic rosters and manage platform subscription status.

### For Mechanics
- **Direct Job Tracking**: Dedicated mechanic dashboard displaying assigned requests and active tickets.
- **Centralized Live Notifications**: Live WebSocket-powered bell notifications keeping them updated on message drops and service state changes.
- **Earning Visibility**: Built-in wallet displaying service shares, platform bonuses, and historical payout structures.

### For Platform Admins
- **Workshop Verification Workflow**: Thorough verification UI to approve or reject workshops joining the network (with customizable rejection feedback).
- **Global Overview**: Monitor platform metrics, service flow success rates, and resolve platform-level ecosystem events.

---

## 🛠️ Technology Stack

### Frontend
- **React.js & Vite** — Fast Single Page Application (SPA)
- **Redux & Hooks** — State management for auth, notifications, and UI
- **Tailwind CSS** — Utility-first responsive UI framework
- **Leaflet / React-Leaflet** — Interactive map for geo-location based workshop discovery
- **Lucide React** — Consistent vector icon library

### Backend
- **Django & Django REST Framework (DRF)** — Robust RESTful API backend
- **Django Channels + Daphne** — Async WebSocket support for live chat, service-flow sync, and notifications
- **PostgreSQL** — Relational database for users, workshops, wallets, service states, and more
- **Redis** — Channel layer backend powering Django Channels WebSocket groups
- **Stripe** — Secure payment gateway handling escrow, top-ups, and webhook-driven state transitions
- **Cloudinary** — Media storage for profile pictures and assets
- **JWT + Google OAuth** — Authentication and authorization

### Infrastructure
- **Docker & Docker Compose** — Containerized services (backend, PostgreSQL, Redis)
- **AWS EC2 + Nginx** — Backend deployed on EC2 behind an Nginx reverse proxy with SSL
- **Vercel** — Frontend deployed and served via Vercel

---

## 🚀 Local Setup (Docker)

> **Prerequisites:** [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) must be installed on your machine.

### 1. Clone the Repository

```bash
git clone https://github.com/agnelVincent/_MotoReach.git
cd _MotoReach
```

### 2. Configure Environment Variables

Create a `.env` file in the **project root** (alongside `docker-compose.yml`) with the following variables:

```env
# Django
SECRET_KEY=your_django_secret_key
DEBUG=True

# Database (Docker service name as host)
DB_NAME=motoreach_db
DB_USER=postgres
DB_PASSWORD=your_db_password
DB_HOST=db
DB_PORT=5432

# Redis (Docker service name as host)
REDIS_HOST=redis

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=your_email@gmail.com

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id

# Cloudinary
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name

# Stripe
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
STRIPE_CURRENCY=inr
STRIPE_PLATFORM_FEE_AMOUNT=200.00

# Frontend URL (used in email links etc.)
FRONTEND_URL=http://localhost:3000
```

> **Note:** `DB_HOST=db` and `REDIS_HOST=redis` refer to the Docker Compose service names — do **not** use `localhost` here.

### 3. Configure the Frontend

Create a `.env` file inside the `frontend/` directory:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_BASE=ws://localhost:8000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### 4. Start All Services

From the project root, run:

```bash
docker compose up --build
```

This will spin up:
| Service | Description | Port |
|---------|-------------|------|
| `db` | PostgreSQL 16 database | `5432` |
| `redis` | Redis 7 (WebSocket channel layer) | `6379` |
| `backend` | Django + Daphne ASGI server | `8000` |

Migrations are applied automatically on startup.

### 5. Run the Frontend (Dev Server)

The frontend is **not** included in Docker Compose (it's deployed on Vercel in production). To run it locally:

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server will start at `http://localhost:5173`.

### 6. Access the App

| Interface | URL |
|-----------|-----|
| Frontend | `http://localhost:5173` |
| Backend API | `http://localhost:8000/api/` |
| Django Admin | `http://localhost:8000/admin/` |

### Stopping Services

```bash
docker compose down
```

To also remove volumes (wipes the database):

```bash
docker compose down -v
```

---

## 📁 Project Structure

```
MotoReach/
├── backend/                  # Django application
│   ├── accounts/             # Auth, roles, OTP, Google OAuth
│   ├── service_request/      # Core service flow, WebSocket consumers
│   ├── payments/             # Stripe, escrow, wallets
│   ├── chat/                 # Real-time chat (WebSockets)
│   ├── admin_panel/          # Super admin APIs
│   ├── backend/              # Django settings, ASGI, URLs
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                 # React + Vite SPA
│   ├── src/
│   └── package.json
├── docker-compose.yml
└── .env                      # Root-level env (used by Docker Compose)
```

---

## 📝 Contribution Guidelines

This repository maintains a strict branching strategy. For feature implementations and bug fixes, please submit Pull Requests targeting testing branches first before converging to the `main` branch. Code should pass standard linting checks, and backend endpoints must retain thorough exception handling.

### License
Developed and maintained as a proprietary platform. All rights reserved.
