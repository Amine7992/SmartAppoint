<div align="center">
  <img src="frontend/public/logo.png" alt="SmartAppoint official logo" width="520" />

  <h1>SmartAppoint</h1>
  <p><strong>Smart scheduling, appointment management, payments, notifications, and AI-assisted no-show risk detection.</strong></p>
</div>

---

## Overview

SmartAppoint is a full-stack appointment management platform designed for clients, professionals, and administrators. It helps users find the right service provider, book appointments, receive useful notifications, pay online, and manage their appointment history. For professionals, it centralizes planning, services, clients, statistics, revenue insights, and AI-based risk indicators. For administrators, it provides supervision tools for users, professionals, appointments, platform configuration, and reporting.

The project is organized into three main applications:

- `frontend`: React web application.
- `backend`: Express.js API connected to Supabase and Stripe.
- `machine-learning`: Flask AI service used to predict appointment attendance risk.

---

## For Users

### The Problem

Booking an appointment is often more complicated than it should be. Clients may need to compare several professionals, understand available services, check schedules, remember appointment times, and manage cancellations or changes manually. Professionals face another side of the same problem: scattered requests, missed appointments, unclear availability, manual follow-up, and limited visibility into their activity.

SmartAppoint solves this by bringing the complete appointment journey into one platform.

### Why SmartAppoint?

SmartAppoint makes appointment booking easier, clearer, and more reliable:

- Clients can explore specialties and professionals from a simple interface.
- Professionals can publish services, manage availability, and follow appointments.
- Notifications keep users informed about bookings, cancellations, reminders, payments, and schedule changes.
- Online payment support helps secure confirmed appointments.
- AI risk analysis helps professionals identify appointments that may require extra attention.
- Admin tools help maintain trust by validating professionals and supervising platform activity.

### What SmartAppoint Provides

For clients:

- Account registration and login.
- Browse specialties and professionals.
- View services, duration, and prices.
- Book appointments by selecting a professional, service, date, and time slot.
- View upcoming, past, cancelled, and paid appointments.
- Reschedule or cancel appointments.
- Pay for confirmed appointments through Stripe Checkout.
- Add professionals to favorites.
- Rate completed appointments.
- Receive appointment notifications and reminders.

For professionals:

- Professional dashboard with daily appointments and activity overview.
- Planning management with appointment confirmation, cancellation, completion, and reschedule handling.
- Service management with name, description, duration, and price.
- Client history and appointment follow-up.
- Statistics for appointments, revenue, ratings, services, and no-show rate.
- AI risk screen for upcoming appointments.
- Notifications for new bookings, changes, and account status.

For administrators:

- Admin dashboard and activity overview.
- User management, suspension, unsuspension, and deletion.
- Professional validation, rejection, reactivation, and verification control.
- Appointment supervision.
- Platform statistics and financial indicators.
- Configurable platform settings.
- PDF report generation.

---

## For Developers

### Architecture

```text
SmartAppoint/
+-- frontend/          React 18 client application
+-- backend/           Express.js REST API
+-- machine-learning/  Flask prediction service
+-- README.md          Project documentation
```

### Technology Stack

Frontend:

- React 18
- React Router DOM
- Axios
- Bootstrap
- Framer Motion
- Lucide React
- React Toastify
- Recharts

Backend:

- Node.js
- Express.js
- Supabase JavaScript client
- Stripe
- Helmet
- CORS
- Compression
- Express Rate Limit
- Node Cron
- Nodemailer
- Node Geocoder

Machine learning:

- Python
- Flask
- Pandas
- Scikit-learn
- Joblib

Data and services:

- Supabase Auth
- Supabase database tables such as `utilisateur`, `Service`, `Appointment`, `Notification`, and `Favorite`
- Supabase Storage for avatars, with local fallback
- Stripe Checkout for appointment payments
- Flask AI API for prediction

### Key Application Modules

Frontend routes:

- Public: landing page, client space, login, register.
- Client: dashboard, specialties, booking, appointments, profile, notifications, payment success.
- Professional: dashboard, planning, clients, services, statistics, AI risks, profile, notifications.
- Admin: dashboard, users, professionals, appointments, statistics, configuration, profile.

Backend API areas:

- `/api/auth`: registration, login, session refresh.
- `/api/pro`: professional appointments, planning, services, clients, statistics, AI risk analysis.
- `/api/appointments`: ratings and rescheduling workflows.
- `/api/admin`: admin statistics, users, professionals, appointments, configuration, reports.
- `/api/notifications`: notification listing and read states.
- `/api/specialites`: specialty listing and professionals by specialty.
- `/api/ai`: proxy route for AI prediction.

AI service:

- `GET /health`: checks model availability and expected feature columns.
- `POST /predict`: predicts attendance risk for one appointment.
- `POST /predict/batch`: predicts attendance risk for multiple appointments.

### Important Features in the Codebase

- Role-based routing for `client`, `professional`, and `admin`.
- Supabase Auth token validation in Express middleware.
- Automatic session refresh in the React Axios client.
- Smart frontend API caching with tag-based invalidation.
- Appointment lifecycle: pending, confirmed, reschedule requested, cancelled, completed.
- Automatic cron jobs for expired appointments and reminders.
- Stripe Checkout session creation and payment confirmation.
- Professional schedule persistence through JSON-backed storage.
- Admin configuration through JSON-backed storage.
- AI-powered no-show risk scoring based on booking delay, client reliability, ratings, account age, appointment history, distance, and loyalty weight.

---

## Getting Started

### Prerequisites

- Node.js and npm
- Python 3
- Supabase project
- Stripe account

### Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_or_service_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_AVATAR_BUCKET=avatars

STRIPE_SECRET_KEY=your_stripe_secret_key
AI_SERVICE_URL=http://127.0.0.1:5001/predict/batch

AUTH_RATE_LIMIT_MAX=40
ADMIN_RATE_LIMIT_MAX=120
```

Start the API:

```bash
node server.js
```

For development with auto-restart:

```bash
npx nodemon server.js
```

### Frontend Setup

```bash
cd frontend
npm install
```

Optional `frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

Start the React app:

```bash
npm start
```

The frontend runs at:

```text
http://localhost:3000
```

### Machine Learning Service Setup

```bash
cd machine-learning
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python app_ai.py
```

The AI service runs at:

```text
http://127.0.0.1:5001
```

Health check:

```text
GET http://127.0.0.1:5001/health
```

---

## Recommended Startup Order

1. Start the Flask AI service on port `5001`.
2. Start the Express API on port `5000`.
3. Start the React frontend on port `3000`.

---

## Project Strengths

- Clear separation between frontend, backend, and AI service.
- Real role-based product structure for clients, professionals, and admins.
- Practical appointment workflows including booking, rescheduling, payment, reminders, and ratings.
- AI integration that supports a real professional use case: reducing missed appointments.
- Admin supervision features that make the platform more trustworthy and manageable.
- Modern React interface with charts, motion, notifications, and reusable components.

---

## Future Improvements

- Add automated backend and frontend tests.
- Add database migration files for all required Supabase tables.
- Add Stripe webhook verification for production-grade payment confirmation.
- Add email delivery for selected notification types.
- Improve deployment documentation for production environments.
- Add API documentation with examples for each route group.

---

## License

This project is currently provided for academic and development purposes. Add a license file before public or commercial distribution.
