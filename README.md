# TransitOps

TransitOps is a professional-grade Transport Management System designed for modern logistics, dispatcher coordination, and fleet analytics. Built with a scalable monorepo architecture, it segregates clean React presentation layers from decoupled Node.js and Express business logic boundaries.

## Features

- **Fleet Telemetry Overview**: Operations dashboard highlighting real-time KPI metrics, active trips, and driver statuses.
- **Dynamic Routing & Dispatch**: Modular trip coordinator with origin, destination, and assignment tracking.
- **Driver Registry & Performance**: Centralized index for driver license tracking, availability, and assignment monitoring.
- **Service & Maintenance Scheduling**: Predictive maintenance scheduling, mechanical logs, and active repair tracking to minimize downtime.
- **Expenses & Financial Reports**: Granular cost logs tracking fuel transactions, toll fees, maintenance, and administrative overhead.
- **Interactive Analytics**: Graphical charts detailing monthly expenses and trip performance metrics.

---

## Project Architecture & Structure

```
TransitOps/
├── Frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── Cards/
│   │   │   ├── Charts/
│   │   │   ├── EmptyState/
│   │   │   ├── Forms/
│   │   │   ├── Loader/
│   │   │   ├── Modal/
│   │   │   ├── Navbar/
│   │   │   ├── Sidebar/
│   │   │   └── Tables/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   │   └── DashboardLayout/
│   │   ├── pages/
│   │   │   ├── Dashboard/
│   │   │   ├── Drivers/
│   │   │   ├── Expenses/
│   │   │   ├── Login/
│   │   │   ├── Maintenance/
│   │   │   ├── Reports/
│   │   │   ├── Trips/
│   │   │   └── Vehicles/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── vite.config.ts
│
├── Backend/
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
│   │   ├── prisma/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── sockets/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── validators/
│   │   ├── app.ts
│   │   └── server.ts
│   ├── uploads/
│   ├── temp/
│   ├── logs/
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── docs/
├── .gitignore
├── LICENSE
└── README.md
```

---

## Tech Stack

### Frontend Technologies
- **Core Library**: React (v19) with TypeScript
- **Bundler**: Vite
- **Styling**: Tailwind CSS (v3.4) with PostCSS
- **Navigation**: React Router (v6)
- **Icons**: React Icons (Fi Icons pack)
- **Data Visualizations**: Recharts

### Backend Technologies
- **Runtime Environment**: Node.js
- **Server Framework**: Express.js
- **Database Engine**: PostgreSQL
- **ORM Interface**: Prisma ORM
- **Authentication Protocol**: JWT (JSON Web Tokens)

---

## Installation

### Prerequisites
- Node.js (v18.x or above)
- npm (v9.x or above)
- PostgreSQL (v14.x or above)
- Git installed on your system

### Clone Project
```bash
git clone <repo-url>
cd TransitOps
```

---

## Workspace Setup

### Frontend Setup
1. Navigate to the client directory:
   ```bash
   cd Frontend
   ```
2. Install local dependency trees:
   ```bash
   npm install
   ```
3. Run the hot-reloading development server:
   ```bash
   npm run dev
   ```
*The frontend development server spins up on:* **[http://localhost:5173](http://localhost:5173)**

---

### Backend Setup
1. Navigate to the server directory:
   ```bash
   cd Backend
   ```
2. Install node dependencies:
   ```bash
   npm install
   ```
3. Create your local environment variable file from the example:
   ```bash
   cp .env.example .env
   ```
4. Configure `.env` values (e.g. setting database ports, passwords, JWT secrets).
5. Start development hot-reloading (nodemon):
   ```bash
   npm run dev
   ```
*The backend API server spins up on:* **[http://localhost:5000](http://localhost:5000)**

---

## Available Scripts

### Frontend Scripts
- `npm run dev`: Runs Vite local web development server.
- `npm run build`: Compiles TypeScript and packages assets for production.
- `npm run preview`: Previews production build packages locally.

### Backend Scripts
- `npm run dev`: Starts Express development server using Nodemon.
- `npm run build`: Compiles TypeScript sources into JavaScript `/dist` folder.
- `npm run start`: Runs compiled production builds using standard node.

---

## Environment Variables

The backend utilizes environment parameters to secure connections and control variables. Set these in `Backend/.env`:

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | Listening port for the Express Server | `5000` |
| `DATABASE_URL` | PostgreSQL connection URI for Prisma client integrations | `postgresql://user:pass@localhost:5432/transitops` |
| `JWT_SECRET` | Secret hash key used to sign and authenticate user payloads | `super-secret-transitops-key-change-in-production` |
| `NODE_ENV` | Target project context state | `development` |

---

## Gitignore Layout

- **Root `.gitignore`**: Masks root dependencies (`node_modules`), workspace builds (`dist`), test report coverage (`coverage`), telemetry folders (`logs`), mock file upload caches (`uploads`), and temp workspaces (`temp`).
- **Frontend `.gitignore`**: Ignores `node_modules` and local production bundles (`dist`).
- **Backend `.gitignore`**: Ignores local node modules (`node_modules`), build folder (`dist`), server key credentials (`.env`), and upload file stores (`uploads`, `temp`).

---

## Developer Guide

### How to add a page
1. Create a component directory under `Frontend/src/pages/<PageName>/`.
2. Implement `<PageName>.tsx` using standard modular layout elements.
3. Configure the routes definition mapping in `Frontend/src/routes/index.tsx` under the layout child nodes:
   ```typescript
   {
     path: 'page-path',
     element: <PageName />
   }
   ```
4. Append an entry to the `menuItems` list inside `Frontend/src/components/Sidebar/Sidebar.tsx` for automatic navbar rendering.

### How to add an API & Route
1. Create your endpoint router configuration in `Backend/src/routes/<module>Route.ts` (e.g. `vehicleRoute.ts`).
2. Mount the express router inside `Backend/src/app.ts` under API prefixes:
   ```typescript
   import moduleRoute from './routes/moduleRoute';
   app.use('/api/modules', moduleRoute);
   ```

### How to add a controller
1. Declare your control logic in `Backend/src/controllers/<module>Controller.ts`.
2. Define functions responding with `(req: Request, res: Response)` parameters and export them.
3. Reference these controllers directly in the routing middleware handlers.

### How to add a service
1. Create service utilities inside `Backend/src/services/<module>Service.ts`.
2. Declare functions encapsulating core operations logic (e.g., interfacing with database prisma instance).
3. Import and call service logic functions in controllers.

### How to add middleware
1. Write express handlers in `Backend/src/middleware/<middleware>Middleware.ts`.
2. Structure functions utilizing `(req, res, next)` signatures and execute `next()` on verification checks.
3. Intercept endpoints by declaring them in routes, e.g. `router.post('/', authMiddleware, controller)`.

### How to add a database model
1. Define model schemas inside the Prisma schema `Backend/prisma/schema.prisma`.
2. Transpile models running prisma CLI triggers:
   ```bash
   npx prisma generate
   ```

---

## Roadmap

- [x] Authentication Configuration Skeletal Setup
- [ ] Role-Based Access Controls (RBAC)
- [ ] Vehicle Module Data Sync
- [ ] Driver Module Registry Details
- [ ] Trip Dispatch Workflow & Map Telemetry
- [ ] Maintenance Scheduling
- [ ] Fuel Transaction Integrations
- [ ] Expenses Approvals
- [ ] Reports Compilation & Exports
- [ ] System Notifications (Websockets)
- [ ] Analytical Performance Charts
