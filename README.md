# 🚚 TransitOps

<div align="center">

**Smart Transport Operations Platform**

A modern Transport Management System (TMS) built to streamline fleet operations, driver management, trip planning, maintenance scheduling, expense tracking, and analytics.

Built with **React**, **TypeScript**, **Node.js**, **Express**, **PostgreSQL**, and **Prisma ORM**.

</div>

---

# 📌 Features



- 🔐 JWT Authentication
- 👥 User Management
- 🚛 Vehicle Management
- 👨‍✈️ Driver Management
- 🗺️ Trip Management
- 🔧 Maintenance Tracking
- ⛽ Fuel Logging
- 💰 Expense Management
- 📊 Dashboard Analytics
- 📈 Reports & Statistics
- 📱 Fully Responsive UI
- ⚡ Modern Enterprise Dashboard

---

# 🏗️ Tech Stack

## Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router DOM
- React Icons
- Recharts
- Axios

---

## Backend

- Node.js
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT Authentication
- bcrypt

---

# 📁 Project Structure

```text
TransitOps/

├── Frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── Backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   │
│   ├── src/
│   │   ├── config/
│   │   ├── constants/
│   │   ├── controllers/
│   │   ├── database/
│   │   ├── docs/
│   │   ├── events/
│   │   ├── helpers/
│   │   ├── interfaces/
│   │   ├── jobs/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── sockets/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── validators/
│   │   ├── app.ts
│   │   └── server.ts
│   │
│   ├── uploads/
│   ├── temp/
│   ├── logs/
│   ├── package.json
│   └── .env.example
│
├── docs/
├── LICENSE
├── README.md
└── .gitignore
```

---

# 🚀 Quick Start

## Clone Repository

```bash
git clone <repository-url>
cd TransitOps
```

---

# ⚙️ Prerequisites

Install:

- Node.js (v18+)
- npm
- PostgreSQL
- Git

---

# 💻 Frontend Setup

```bash
cd Frontend

npm install

npm run dev
```

Frontend runs on

```
http://localhost:5173
```

---

# ⚙️ Backend Setup

```bash
cd Backend

npm install
```

Create

```
.env
```

from

```
.env.example
```

Example

```env
PORT=5000

DATABASE_URL="postgresql://postgres:password@localhost:5432/transitops"

JWT_SECRET=your_super_secret_key

NODE_ENV=development
```

Run backend

```bash
npm run dev
```

Backend runs on

```
http://localhost:5000
```

---

# 🗄️ Database Setup

Generate Prisma Client

```bash
npx prisma generate
```

Run Migration

```bash
npx prisma migrate dev --name init
```

Seed Database

```bash
npx prisma db seed
```

Open Prisma Studio

```bash
npx prisma studio
```

---

# 🔑 Demo Login

After seeding the database

```json
{
  "email": "alex@transitops.com",
  "password": "managerpwd"
}
```

---

# 🌐 API Endpoints

## Authentication

| Method | Endpoint |
|----------|-------------------------|
| POST | /api/auth/register |
| POST | /api/auth/login |
| GET | /api/auth/profile |
| POST | /api/auth/logout |

---

## Vehicles

| Method | Endpoint |
|----------|----------------|
| GET | /api/vehicles |
| POST | /api/vehicles |
| PUT | /api/vehicles/:id |
| DELETE | /api/vehicles/:id |

---

## Drivers

| Method | Endpoint |
|----------|----------------|
| GET | /api/drivers |
| POST | /api/drivers |
| PUT | /api/drivers/:id |
| DELETE | /api/drivers/:id |

---

## Trips

| Method | Endpoint |
|----------|----------------|
| GET | /api/trips |
| POST | /api/trips |
| PUT | /api/trips/:id |
| DELETE | /api/trips/:id |

---

## Maintenance

| Method | Endpoint |
|----------|----------------|
| GET | /api/maintenance |
| POST | /api/maintenance |

---

## Expenses

| Method | Endpoint |
|----------|----------------|
| GET | /api/expenses |
| POST | /api/expenses |

---

## Reports

| Method | Endpoint |
|----------|----------------|
| GET | /api/reports |

---

# 🔄 System Architecture

```text
                React Frontend

                      │

                Axios Requests

                      │

              Express REST API

                      │

                Prisma ORM

                      │

                PostgreSQL
```

---

# 🔐 Authentication Flow

```text
User Login

↓

Verify Email

↓

Compare Password (bcrypt)

↓

Generate JWT

↓

Authenticate User

↓

Access Protected Routes
```

---

# 📜 Available Scripts

## Frontend

```bash
npm run dev
```

Runs Vite development server.

```bash
npm run build
```

Creates production build.

```bash
npm run preview
```

Preview production build.

---

## Backend

```bash
npm run dev
```

Runs Express development server.

```bash
npm run build
```

Compile TypeScript.

```bash
npm run start
```

Run production server.

---

# 🌱 Environment Variables

| Variable | Description |
|-----------|-------------|
| PORT | Backend Server Port |
| DATABASE_URL | PostgreSQL Connection URL |
| JWT_SECRET | Secret Key for JWT |
| NODE_ENV | development / production |

---

# 👨‍💻 Developer Guide

## Add a New Page

Create

```
Frontend/src/pages/PageName
```

Register the page inside

```
Frontend/src/routes
```

Add sidebar navigation.

---

## Add a New API

Create

```
Backend/src/routes/moduleRoute.ts
```

Register route inside

```
app.ts
```

---

## Add Controller

```
Backend/src/controllers/
```

---

## Add Service

```
Backend/src/services/
```

---

## Add Middleware

```
Backend/src/middleware/
```

---

## Update Database

Modify

```
Backend/prisma/schema.prisma
```

Generate

```bash
npx prisma generate
```

Run Migration

```bash
npx prisma migrate dev
```

---

# 📍 Project Status

| Module | Status |
|---------|--------|
| Frontend UI | ✅ Completed |
| PostgreSQL Setup | ✅ Completed |
| Prisma ORM | ✅ Completed |
| Database Schema | ✅ Completed |
| Database Seeding | ✅ Completed |
| JWT Authentication | ✅ Completed |
| Login System | ✅ Completed |
| Protected Routes | ✅ Completed |
| Dashboard Integration | ✅ Completed |
| Vehicle Module | ✅ Completed |
| Driver Module | ✅ Completed |
| Trip Module | ✅ Completed |
| Maintenance | ✅ Completed |
| Fuel Logs | ✅ Completed |
| Expense Module | ✅ Completed |
| Reports | ✅ Completed |
| Deployment | ⏳ Pending |

---

# 🎨 Premium Designer UI Theme

The TransitOps control console has been overhauled with a professional high-end theme:
- **Dark Glassmorphic Layout**: Built on a deep space background (`#080c14`) with glassmorphic cards (`bg-slate-900/60 border border-slate-800/80 backdrop-blur-md`).
- **Outfit Google Font**: Imported modern font geometry for elegant, readable typography weights.
- **Crimson Accents**: Replaced standard blues with vibrant Crimson/Rose and glowing status pills.
- **Logistics Graphics**: Features a gorgeous split-screen login view and welcome cards containing a custom generated evening logistics scene.

---

# 🚀 Deployment

## Frontend

- Vercel
- Netlify

## Backend

- Render
- Railway

## Database

- PostgreSQL
- Neon
- Supabase

---

# 📄 License

This project is licensed under the **MIT License**.

---

<div align="center">

Made with ❤️ using React, Express, PostgreSQL & Prisma.

</div>
