# Urban Spice — Backend API

A production-ready REST API for the Urban Spice restaurant website: reservations, contact messages, menu, gallery, testimonials, admin authentication, and a dashboard — built with Node.js, Express, and MongoDB Atlas.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Environment Setup](#environment-setup)
- [MongoDB Atlas Setup](#mongodb-atlas-setup)
- [Installation](#installation)
- [Seeding Sample Data](#seeding-sample-data)
- [API Documentation](#api-documentation)
- [Connecting the Frontend](#connecting-the-frontend)
- [Deployment Guide](#deployment-guide)
- [Security Notes](#security-notes)

---

## Tech Stack

| Concern | Library |
|---|---|
| Server framework | Express.js |
| Database / ODM | MongoDB Atlas + Mongoose |
| Auth | JWT (jsonwebtoken) + bcrypt.js |
| File uploads | Multer |
| Email | Nodemailer |
| Validation | express-validator |
| Security | Helmet, CORS, express-rate-limit, express-mongo-sanitize, xss-clean |
| Logging | Morgan |
| Config | dotenv |

---

## Project Structure

```
urban-spice-backend/
│
├── config/
│      db.js                  # MongoDB connection
│
├── controllers/               # Request handlers (business logic)
│      authController.js
│      reservationController.js
│      contactController.js
│      menuController.js
│      galleryController.js
│      testimonialController.js
│      dashboardController.js
│
├── middleware/
│      auth.js                 # JWT protect / role-based authorize
│      errorHandler.js         # Centralized error handling + 404
│      upload.js                # Multer image upload configs
│      validate.js              # express-validator result handler
│
├── models/
│      User.js                  # Admin accounts
│      Reservation.js
│      Contact.js
│      Menu.js
│      Gallery.js
│      Testimonial.js
│
├── routes/                     # Route definitions, split public / admin
│      authRoutes.js
│      reservationRoutes.js
│      contactRoutes.js
│      menuRoutes.js
│      galleryRoutes.js
│      testimonialRoutes.js
│      dashboardRoutes.js
│      healthRoutes.js
│
├── services/
│      emailService.js          # Nodemailer transporter + templates
│
├── utils/
│      ApiError.js
│      ApiResponse.js
│      asyncHandler.js
│      generateToken.js
│      validators.js            # express-validator chains
│      seedData.js              # sample-data seed script
│
├── uploads/                    # Uploaded images (served at /uploads/*)
│      menu/
│      gallery/
│      testimonials/
│
├── .env.example
├── .gitignore
├── server.js
└── package.json
```

---

## Environment Setup

Copy the example file and fill in real values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `NODE_ENV` | `development` or `production` |
| `PORT` | Port the API listens on (default `5000`) |
| `CLIENT_URL` | Comma-separated list of allowed frontend origins for CORS (e.g. `http://127.0.0.1:5500,https://yoursite.com`) |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Long random string used to sign tokens |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `7d` |
| `JWT_COOKIE_EXPIRES_IN` | Cookie lifetime in days |
| `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Used **only** by the seed script to create the first admin |
| `EMAIL_HOST` / `EMAIL_PORT` / `EMAIL_SECURE` / `EMAIL_USER` / `EMAIL_PASSWORD` | SMTP credentials for Nodemailer |
| `EMAIL_FROM_NAME` / `EMAIL_FROM_ADDRESS` | Sender identity on outgoing mail |
| `RESTAURANT_ADMIN_EMAIL` | Where reservation/contact notifications are sent |
| `RATE_LIMIT_WINDOW_MINUTES` / `RATE_LIMIT_MAX_REQUESTS` | API rate limiting |

---

## MongoDB Atlas Setup

1. Create a free account at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Create a new **Project** → **Build a Database** → choose the free M0 tier.
3. Under **Database Access**, create a database user with a username/password (not your Atlas login).
4. Under **Network Access**, add your IP address, or `0.0.0.0/0` to allow access from anywhere (needed for Render/Railway, which have dynamic egress IPs unless you use a static-IP add-on).
5. Click **Connect** → **Drivers** → copy the connection string. It looks like:
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
   ```
6. Paste it into `.env` as `MONGO_URI`, adding a database name before the `?`, e.g.:
   ```
   mongodb+srv://user:pass@cluster0.abcde.mongodb.net/urban-spice?retryWrites=true&w=majority
   ```

---

## Installation

```bash
cd urban-spice-backend
npm install
cp .env.example .env   # then fill in your real values
npm run seed            # creates the first admin + sample menu/gallery/testimonial data
npm run dev              # starts the server with nodemon on http://localhost:5000
```

Verify it's running:

```bash
curl http://localhost:5000/health
```

---

## Seeding Sample Data

```bash
npm run seed            # insert admin user + sample menu, gallery, testimonials
npm run seed:destroy    # wipe every collection (careful — irreversible)
```

The admin credentials used are whatever is set in `.env` (`ADMIN_EMAIL` / `ADMIN_PASSWORD`). Change the password immediately after first login via `PUT /api/auth/change-password`.

> Gallery seed rows point at placeholder filenames (`/uploads/gallery/placeholder-*.jpg`) that don't physically exist — replace them via the admin gallery-upload endpoint, or upload real files under those names.

---

## API Documentation

All responses follow one of these two shapes:

```json
{ "success": true, "message": "...", "data": { } }
```
```json
{ "success": false, "message": "...", "errors": [ { "field": "email", "message": "..." } ] }
```

Protected routes require a JWT, either as an `Authorization: Bearer <token>` header or the `token` httpOnly cookie set on login.

### Health

| Method | Route | Access |
|---|---|---|
| GET | `/health` | Public |

### Auth

| Method | Route | Access | Body |
|---|---|---|---|
| POST | `/api/auth/login` | Public | `{ email, password }` |
| GET | `/api/auth/me` | Private | — |
| POST | `/api/auth/logout` | Private | — |
| PUT | `/api/auth/change-password` | Private | `{ currentPassword, newPassword }` |

### Reservations

| Method | Route | Access | Notes |
|---|---|---|---|
| POST | `/api/reservations` | Public | `{ customerName, email, phone, date, time, guests, specialRequest }` |
| GET | `/api/admin/reservations` | Private | Query: `search, status, date, page, limit, sort` |
| GET | `/api/admin/reservations/:id` | Private | |
| PATCH | `/api/admin/reservations/:id/status` | Private | `{ status }` — one of `pending/confirmed/cancelled/completed` |
| DELETE | `/api/admin/reservations/:id` | Private | |

### Contact

| Method | Route | Access | Notes |
|---|---|---|---|
| POST | `/api/contact` | Public | `{ name, email, phone, message }` |
| GET | `/api/admin/contacts` | Private | Query: `isRead, page, limit` |
| PATCH | `/api/admin/contacts/:id/read` | Private | |
| DELETE | `/api/admin/contacts/:id` | Private | |

### Menu

| Method | Route | Access | Notes |
|---|---|---|---|
| GET | `/api/menu` | Public | Query: `category` (starters/mains/desserts/drinks) |
| GET | `/api/admin/menu` | Private | Query: `category, page, limit` |
| POST | `/api/admin/menu` | Private | `multipart/form-data`: `name, description, category, price, badge, available, image` |
| PUT | `/api/admin/menu/:id` | Private | Same fields, all optional; `image` replaces the current photo |
| DELETE | `/api/admin/menu/:id` | Private | |

### Gallery

| Method | Route | Access | Notes |
|---|---|---|---|
| GET | `/api/gallery` | Public | |
| GET | `/api/admin/gallery` | Private | Query: `page, limit` |
| POST | `/api/admin/gallery` | Private | `multipart/form-data`: `title, image` (required file) |
| DELETE | `/api/admin/gallery/:id` | Private | |

### Testimonials

| Method | Route | Access | Notes |
|---|---|---|---|
| GET | `/api/testimonials` | Public | Only `approved: true` testimonials |
| GET | `/api/admin/testimonials` | Private | Query: `approved, page, limit` |
| POST | `/api/admin/testimonials` | Private | `multipart/form-data`: `customerName, profession, review, rating, approved, image` |
| PUT | `/api/admin/testimonials/:id` | Private | |
| PATCH | `/api/admin/testimonials/:id/approve` | Private | |
| DELETE | `/api/admin/testimonials/:id` | Private | |

### Dashboard

| Method | Route | Access | Notes |
|---|---|---|---|
| GET | `/api/admin/dashboard/stats` | Private | Reservation/contact/menu/gallery/testimonial counts |
| GET | `/api/admin/dashboard/recent-activity` | Private | Last 10 reservations + contact messages, merged and sorted |

---

## Connecting the Frontend

The Urban Spice frontend (`Urban-Spice/js/script.js`) points at an `API_BASE_URL` constant:

```js
const API_BASE_URL = 'http://localhost:5000/api';
```

Update that value to your deployed API URL before going live. With the backend running locally on port 5000 and the frontend served (e.g. via Live Server on port 5500), the two already talk to each other:

- The **reservation form** posts to `POST /api/reservations`.
- The **contact form** posts to `POST /api/contact`.
- The **menu, gallery, and testimonials sections** fetch from their public `GET` endpoints on page load, and fall back to the original static content if the API is unreachable — so the site still looks complete even with the backend offline.

Make sure `CLIENT_URL` in the backend `.env` matches the exact origin the frontend is served from (protocol + host + port), since CORS is enforced.

---

## Deployment Guide

### Render

1. Push this backend to its own GitHub repository.
2. In Render, create a **New Web Service** from that repo.
3. Build command: `npm install`. Start command: `npm start`.
4. Add all variables from `.env` under **Environment**.
5. Once deployed, note the public URL (e.g. `https://urban-spice-api.onrender.com`) and update `API_BASE_URL` in the frontend, and `CLIENT_URL` in the backend env to match your deployed frontend origin.

### Railway

1. Push this backend to GitHub.
2. In Railway, **New Project** → **Deploy from GitHub repo**.
3. Add the same environment variables as above under **Variables**.
4. Railway auto-detects `npm start`. Confirm the generated public domain and update the frontend `API_BASE_URL` accordingly.

### Both platforms

- MongoDB Atlas Network Access must allow the platform's IPs — using `0.0.0.0/0` is the simplest option for a small deployment.
- Set `NODE_ENV=production` in the platform's environment variables.
- Uploaded images are stored on local disk (`uploads/`), which is **ephemeral** on most free hosting tiers (files can be wiped on redeploy). For production use, swap `middleware/upload.js`'s disk storage for a persistent object store (e.g. Cloudinary, AWS S3, or a Render/Railway persistent volume) — the controller logic only needs the resulting URL, so the change is isolated to that one file.

---

## Security Notes

- Passwords are hashed with bcrypt (12 salt rounds) and never returned in API responses.
- JWTs are issued on login and can be used via header or httpOnly cookie.
- `helmet()` sets secure HTTP headers; `cors()` restricts allowed origins; `express-rate-limit` throttles all `/api` traffic.
- `express-mongo-sanitize` and `xss-clean` strip NoSQL-injection operators and basic XSS payloads from incoming request data.
- All public write endpoints (`reservations`, `contact`) are fully validated with `express-validator` before touching the database.
- Never commit `.env` — it's already excluded via `.gitignore`.
