# Architecture Strategy: "The Modular Trinity"

Welcome to the Rustic Bakery application. To ensure a robust, modular, and "future-proof" system, we follow the **Feature-Slice Architecture** combined with a **Decoupled Backend/Frontend**. 

*Note: The structure below correctly implements the exact same logic layers using Node.js, Express, and React to be natively compatible with this development environment.*

## The Layers

| Layer | Technology | Purpose |
| --- | --- | --- |
| **Data Layer** | SQLite Models (via Prisma) | The "Truth." Defines Models for User, Product, Category, Order, OrderItem, SupportTicket, and Reservation. |
| **Logic Layer** | Express.js / Node APIs | The "Brain." Handles roles, stock calculations, payments, order updates, discounts, item additions, and secure state resolution. |
| **Presentation Layer** | React + Tailwind | The "Face." Handles the "Warm & Rustic" look and user interaction across three distinct portals. |

---

## Current Implemented Features

### 1. Storefront (Customer Experience)
- **Product Browsing**: Shows categorized products with images and stock alerts. Periodic background fetching (every 10s) keeps product availability live.
- **Cart & Checkout**: Supports complex orders with reservations. Customers can specify if the order is for takeaway/dine-in. The cart automatically audits items against live inventory and removes out-of-stock items dynamically.
- **Order Tracking & Support**: Customers can view past and active orders, check the status (Pending, Preparing, Ready, Delivered), see applied discounts, and file **Support Tickets** specific to individual orders.
- **Multi-Tab Synchronization**: Cart (`rustic_cart`) and User session (`rustic_user`) contexts are synchronized automatically across browser tabs using DOM `storage` events, ensuring uniform state.

### 2. Fulfillment Dashboard (Staff / Kitchen)
- **Order Pipeline Tracking**: Active board for taking orders through `PENDING -> PREPARING -> READY -> DELIVERED` states. Allows filtering by active/completed status.
- **On-the-fly Additions**: Staff can append extra products to an active customer order before payment.
- **Payment Collection & Discounts**: Support for applying custom discounts, selecting the payment method (CASH vs ONLINE / Transaction ID), and finalizing the order completion.
- **Inventory Management**: Easy toggle to track stock or instantly add new products to the menu.

### 3. Admin Dashboard (Management)
- **Revenue Analytics**: Summarizes daily totals, cash vs online revenue, and tracks the best-selling products. Automatically considers applied order discounts in revenue counts.
- **Customer Support Hub**: Centralized ticket management system where admins can filter by status (Open, In Progress, Resolved), sort by newest/oldest, view associated order details, and resolve customer issues.
- **User & Access Management**: Overview of active customers and staff, with specialized login routing for Admin vs. Kitchen Staff vs. Customers.

### 4. Authentication Architecture
- **Dual-Method Login**: Supports seamless login using both Phone Numbers (via Firebase Auth with OTP and Recaptcha) and Email/Password.
- **Session Mapping**: Firebase Auth provides secure verification which is immediately converted to local JWT-secured API routes for fast, independent token management within the database schema.
- **Profile Multi-Device Sync**: Cross-device profile editing ensures user accounts stay fresh via dedicated profile retrieval endpoints.

---

## Future-Proofing Rules

1. **The "Single Source of Truth":** Never hardcode a price or role validation solely in the frontend. It should always be validated or fetched via the Express API.
2. **Environment Variables:** Keep secret keys and Database URLs in `.env`. The frontend reads safe `VITE_*` keys, but the backend reads server-only variables.
3. **The "Context File":** You are looking at it. Always reference `ARCHITECTURE.md` to keep AI interactions and developers aligned on the structure.

## Folder Structure

```text
/server        -> Logic & Data Layers (Express API: routes, controllers)
/src           -> Presentation Layer (React SPA, UI components, Tailwind)
  /components  -> Reusable UI blocks (Modals, ProductCards, Layouts)
  /pages       -> The specific Route views (Storefront, AdminDashboard, Fulfillment)
  /hooks       -> Custom React Hooks (useAuth, useBakery) for state logic
/prisma        -> SQLite Database, dev.db, Database schemas
/dist          -> Production Build artifacts
```
