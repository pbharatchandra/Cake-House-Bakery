# Architecture Overview

This document outlines the architecture, technology stack, and structure of the **Rustic Cake House** application.

## 1. High-Level Architecture
The application features a full-stack, single-repository architecture coupling a **React SPA frontend** using **Vite** and a **Node/Express REST API backend**. 

It uses a traditional client-server model where external requests hit the Node server (Express). In production, Express handles API requests AND serves the static frontend assets from the `dist` folder. In development, Vite middleware performs Hot Module Replacement (HMR). 

## 2. Frontend (React + Vite)
- **Framework**: React 18 with TypeScript.
- **Build Tool**: Vite (blazing fast dev server and bundler).
- **Styling**: Tailwind CSS for responsive, utility-first styling.
- **Routing**: `react-router-dom` for client-side navigation.
- **Icons**: `lucide-react` for consistent SVG iconography.
- **Key Modules**:
  - `src/pages/*`: Contains primary high-level views (e.g., `Storefront.tsx`, `AuthPage.tsx`, `AdminDashboard.tsx`, `FulfillmentDashboard.tsx`).
  - `src/components/*`: Reusable UI modules, separated into contexts like `/admin` or `/store`.
  - `src/hooks/*`: Custom hooks handling state and logic (e.g., `useAuth.tsx`, `useCart.tsx`).
  - `src/lib/*`: Utilities, helpers, and types.

## 3. Backend (Node.js + Express)
- **Server**: Express.js server bound to port 3000.
- **Language**: TypeScript (`tsx` in dev, `esbuild` for production bundling).
- **Routing**: Separated controller-router design pattern inside `/server`:
  - `routes/*`: Defines the mapping of URLs to controller functions (e.g., `auth.ts`, `products.ts`, `orders.ts`).
  - `controllers/*`: Holds the core business logic answering API calls.
- **Real-Time / Push**: VAPID details and basic abstractions prepared in `server/lib/webpush.ts`. Server-Sent Events (SSE) logic located in `server/lib/events.ts`.

## 4. Database & ORM (Prisma & SQLite)
- **ORM**: Prisma Client.
- **Database**: SQLite (`dev.db`). This makes the application easily portable.
- **Schema (`prisma/schema.prisma`)**:
  - `User`: Manages user profiles, role-based access (`ADMIN`, `CUSTOMER`, `EMPLOYEE_OPS`, etc.), and hashed passwords.
  - `Product` & `Category`: The core product catalog including prices and stock levels.
  - `Order` & `OrderItem`: E-commerce orders linking users, products, and prices asynchronously.
  - `SupportTicket` & `Reservation`: Customer service schemas and cart session reservations.
  - `Setting`: Global key-value app configurations.

## 5. Security & Authentication
Recent security hardening features were added to ensure the reliability and safety of the application:
- **Authentication Strategy (JWT)**: JSON Web Tokens are implemented in `server/lib/authMiddleware.ts`. For heightened security against Cross-Site Scripting (XSS), the JWT is stored inside an **`httpOnly`, `secure`, and `sameSite: strict` cookie**.
- **Password Hashing (bcrypt)**: All passwords are intentionally hashed securely using `bcryptjs` and a salt round configuration of 10 prior to being written into the SQLite database. Passwords are never stored in plain text.
- **Rate Limiting (DDoS / DoS Protection)**: `express-rate-limit` is actively applied globally to the `/api` route path, thwarting brute-force attacks and abuse.
- **Security Headers (Helmet)**: `helmet` sets hardened HTTP headers, automatically increasing the baseline network security posture and managing policies like XSS-Protection and strict transport layers.
- **Role-Based Access Control (RBAC)**: Validated using dedicated Express middleware (`requireAdmin`, `requireEmployee`) mapping directly to the JWT's embedded role.

## 6. Build & Deployment Flow
- **NPM Scripts**:
  - `dev`: Bootstraps the application via `tsx server.ts` dynamically injecting Vite in middleware mode.
  - `build`: Two-phase process — `vite build` translates the React SPA into static elements, then `esbuild` bundles Native Node Modules into a single executable `dist/server.cjs`.
  - `start`: Deploys via `node dist/server.cjs` allowing container orchestration platforms (like Cloud Run) to execute a single, isolated process without missing dependencies.
