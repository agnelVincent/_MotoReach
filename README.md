# MotoReach 🚗🔧

MotoReach is a comprehensive, real-time web platform designed to seamlessly connect vehicle owners with nearby professional workshops and independent mechanics. By streamlining service requests, real-time chat, estimates, escrow payments, and service tracking, MotoReach provides a transparent and frictionless experience for automotive repairs and roadside assistance.

---

## 🌟 Key Features

### For Users
- **Location-Based Discovery**: Automatically route service requests to verified nearby workshops.
- **Service Flow & Tracking**: Real-time status updates on vehicle service execution.
- **Integrated Payments**: Secure checkout with Stripe integration and in-platform wallet mechanisms (top-ups and escrow handling).
- **Real-Time Communication**: Built-in websocket-based chat to converse directly with workshops and assigned mechanics securely.

### For Workshops
- **Job Management Dashboard**: Filter, accept, or reject incoming nearby service requests based on bandwidth and capabilities.
- **Mechanic Dispatch**: Assign dedicated mechanics to specific jobs directly from the dashboard.
- **Estimate & Billing**: Issue repair estimates for users to approve, holding funds securely in escrow until job completion.
- **Team & Subscription Management**: Organize mechanic rosters and manage platform subscription status.

### For Mechanics
- **Direct Job Tracking**: Dedicated mechanic dashboard strictly displaying assigned requests and active tickets.
- **Centralized Live Notifications**: Live socket-powered bell notifications keeping them updated on message drops and service state changes.
- **Earning Visibility**: Built-in wallet displaying service shares, platform bonuses, and historical payout structures.

### For Platform Admins
- **Workshop Verification Workflow**: Thorough verification UI to approve or reject workshops joining the network (with customizable rejection feedback).
- **Global Overview**: Monitor platform metrics, service flow success rates, and resolve platform-level ecosystem events.

---

## 🛠️ Technology Stack

### Frontend Architecture
- **React.js & Vite**: Delivering a lightning-fast Single Page Application (SPA).
- **Redux & Hooks**: Deep state management tracking authentication, notifications, and dynamic UI conditions.
- **Tailwind CSS**: Modern utility-first framework for an adaptable, gorgeous, responsive UI.
- **Lucide React**: Clean vector icons emphasizing a consistent graphic style.

### Backend Architecture
- **Django & Django REST Framework (DRF)**: Reliable, robust, MVC-structured backend controlling heavily validated RESTful APIs.
- **Django Channels (WebSockets)**: Handling asynchronous protocols for the live chat instances, dynamic location polling, and global notification broadcasts.
- **PostgreSQL**: Hardened relational database mapping Users, Workshop connections, Wallets, execution states, and more.
- **Stripe API**: Secure payment gateways supporting user session payments, top-ups, and payout escrow pipelines.

---

## 🏗️ Local Setup Guide

Follow these instructions to get the MotoReach ecosystem running locally on your environment.

### 1. Backend Setup

1. **Navigate to the Backend Directory:**
   ```bash
   cd backend
   ```

2. **Create and Activate a Virtual Environment:**
   ```bash
   python -m venv venv
   # Windows
   .\venv\Scripts\activate
   # macOS/Linux
   source venv/bin/activate
   ```

3. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Variables:**
   Create a `.env` file in the root backend directory to contain required configuration (e.g., Stripe keys, Database URLs, Debug booleans). 

5. **Run Migrations and Server:**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   python manage.py runserver
   ```

### 2. Frontend Setup

1. **Navigate to the Frontend Directory:**
   ```bash
   cd frontend
   ```

2. **Install Node Packages:**
   ```bash
   npm install
   ```

3. **Start the Development Server:**
   ```bash
   npm run dev
   ```

*Ensure that both servers (typically `http://localhost:8000` for API and `http://localhost:5173` for Web) are actively running to establish the websocket pipeline properly!*

---

## 🤝 Contribution Guidelines
This repository maintains a strict branching strategy. For feature implementations and bug fixes, please submit Pull Requests targeting testing branches first before converging to the `main` architecture. Code should pass standard linting tests, and backend endpoints must retain thorough exception handling policies.

### License
Developed and maintained as a proprietary platform. All rights reserved. 
