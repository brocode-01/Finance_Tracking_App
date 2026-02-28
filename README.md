# 💰 FinTracker — Personal Finance Tracker

Full-stack Personal Finance Tracker built with React 18, Node.js/Express, PostgreSQL, and Redis.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Chart.js, Axios |
| Backend | Node.js 18+, Express.js |
| Database | PostgreSQL 14+ |
| Cache | Redis 6+ (ioredis) |
| Auth | JWT (jsonwebtoken + bcrypt) |
| Security | Helmet, express-rate-limit, express-validator, xss |
| API Docs | Swagger UI / OpenAPI 3.0 |

---

## 🚀 Features

### Authentication & RBAC
- JWT-based login & registration with bcrypt password hashing
- 3 roles: **admin**, **user**, **read-only**
- Backend middleware enforces permissions on every route
- Frontend conditionally hides/disables buttons based on role

| Role | Transactions | Analytics | Users |
|------|-------------|-----------|-------|
| admin | Full CRUD (all users' data) | ✅ All data | ✅ Manage all |
| user | CRUD (own data only) | ✅ Own data | ❌ |
| read-only | View only | ✅ Own data | ❌ |

### Transaction Management
- Add/Edit/Delete income & expense transactions
- 12 categories: Food, Transport, Entertainment, Housing, Healthcare, Shopping, Education, Utilities, Salary, Freelance, Investment, Other
- Search (description/category), filter (type, category, date range)
- Pagination: 10/25/50 per page, sort by any column

### Dashboard & Analytics
- KPI cards: Total income, expense, net balance, savings rate
- **Pie Chart** — expense by category
- **Line Chart** — monthly income vs expense trends
- **Bar Chart** — income vs expense monthly comparison
- Year selector, recent transactions list

### Performance & Caching
- **Redis cache** — analytics endpoints cached for 15 minutes
- **Cache invalidation** — auto-cleared when transactions are modified
- **Performance page** — live benchmark showing cache vs DB response times
- **React.lazy() + Suspense** — route-based code splitting
- **useMemo/useCallback** — memoized calculations and event handlers

### Security
- Helmet.js — HTTP security headers (CSP, HSTS, X-Frame-Options)
- Rate limiting: Auth 5/15min, Transactions 100/hr, Analytics 50/hr
- Parameterized SQL queries (prevents SQL injection)
- Input validation + XSS sanitization on all inputs
- Body size limit (10kb) to prevent DoS

---

## ⚙️ Local Development Setup

### Prerequisites

```bash
# Check versions
node --version    # needs 18+
psql --version    # needs 14+
redis-cli ping    # needs to reply PONG
```

### Step 1 — Install

```bash
# Unzip the project, then:

# Backend
cd finance-tracker/backend
npm install

# Frontend
cd ../frontend
npm install
```

### Step 2 — Configure Environment

```bash
cd finance-tracker/backend
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=finance_tracker
DB_USER=postgres
DB_PASSWORD=your_postgres_password

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

JWT_SECRET=your_long_random_secret_string_here
JWT_EXPIRES_IN=7d

CLIENT_URL=http://localhost:3000
```

### Step 3 — Database Setup

```bash
# Create the database
psql -U postgres -c "CREATE DATABASE finance_tracker;"

# Run migrations (creates users + transactions tables with indexes)
cd finance-tracker/backend
npm run migrate

# Seed demo users and sample data
npm run seed
```

### Step 4 — Start Services

```bash
# Terminal 1 — Backend (http://localhost:5000)
cd finance-tracker/backend
npm run dev

# Terminal 2 — Frontend (http://localhost:3000)
cd finance-tracker/frontend
npm start
```

You should see in the backend terminal:
```
✅ Finance Tracker API running on http://localhost:5000
📚 API Docs:     http://localhost:5000/api/docs
🔍 Cache Status: http://localhost:5000/api/cache/status
✅ Redis health check passed
```

---

## 🔑 Demo Credentials

| Role | Email | Password | Access |
|------|-------|----------|--------|
| **Admin** | admin@demo.com | password123 | Everything + user management |
| **User** | user@demo.com | password123 | Own transactions + analytics |
| **Read-Only** | readonly@demo.com | password123 | View only |

> These are available as one-click buttons on the Login page.

---

## 📚 API Documentation

### Swagger UI
**http://localhost:5000/api/docs**

Interactive docs — paste a JWT token in the Authorize button to test all endpoints directly in the browser.

### All Endpoints

#### Auth (Rate limit: 5 req / 15 min)
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | /api/auth/register | Public | Create account |
| POST | /api/auth/login | Public | Login → JWT token |
| GET | /api/auth/me | All | Get current user |
| PUT | /api/auth/change-password | All | Change password |

#### Transactions (Rate limit: 100 req / hour)
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | /api/transactions | All roles | List with pagination + filters |
| GET | /api/transactions/categories | All roles | Get distinct categories |
| GET | /api/transactions/:id | All roles | Get single transaction |
| POST | /api/transactions | admin, user | Create transaction |
| PUT | /api/transactions/:id | admin, user | Update transaction |
| DELETE | /api/transactions/:id | admin, user | Delete transaction |

#### Analytics (Rate limit: 50 req / hour, Redis cached 15 min)
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | /api/analytics/summary | All roles | Total income/expense/balance |
| GET | /api/analytics/category-breakdown | All roles | Pie chart data |
| GET | /api/analytics/monthly-trends | All roles | Line chart data |
| GET | /api/analytics/income-vs-expense | All roles | Bar chart data |
| GET | /api/analytics/recent | All roles | Last N transactions |

#### Users (Admin only)
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | /api/users | admin | List all users |
| PUT | /api/users/:id/role | admin | Change user role |
| DELETE | /api/users/:id | admin | Delete user |

#### Utilities
| Method | Route | Description |
|--------|-------|-------------|
| GET | /health | Server health check |
| GET | /api/cache/status | Show active Redis cache keys + TTL |

---

## ⚡ Performance Metrics

Visit the **Performance** page in the app (sidebar) to run a live benchmark.

### How Caching Works

```
Request → Check Redis cache
              │
         Cache HIT ──→ Return cached data (< 5ms)
              │
         Cache MISS ──→ Query PostgreSQL ──→ Store in Redis ──→ Return data
```

### Cache Configuration
| Data | TTL | Invalidated on |
|------|-----|---------------|
| Analytics summary | 15 minutes | Any transaction change |
| Category breakdown | 15 minutes | Any transaction change |
| Monthly trends | 15 minutes | Any transaction change |
| Income vs expense | 15 minutes | Any transaction change |

### Debug Cache
```bash
# See all active cache keys and TTL
curl http://localhost:5000/api/cache/status
```

---

## 📁 Project Structure

```
finance-tracker/
├── backend/
│   ├── .env.example
│   ├── package.json
│   ├── scripts/
│   │   ├── migrate.js      # Creates DB tables + indexes
│   │   └── seed.js         # Demo users + sample transactions
│   └── src/
│       ├── config/
│       │   ├── database.js # PostgreSQL connection pool
│       │   ├── redis.js    # Redis client + cache helpers
│       │   └── swagger.js  # OpenAPI spec + schemas
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── transactionController.js
│       │   ├── analyticsController.js
│       │   └── userController.js
│       ├── middleware/
│       │   ├── auth.js        # JWT verify + RBAC
│       │   ├── rateLimiter.js # Per-endpoint rate limits
│       │   └── validation.js  # Input validation + XSS
│       ├── routes/
│       │   ├── auth.js        # Full Swagger JSDoc
│       │   ├── transactions.js
│       │   ├── analytics.js
│       │   └── users.js
│       └── index.js
│
└── frontend/
    └── src/
        ├── App.jsx              # Routes + React.lazy() + Suspense
        ├── index.css            # Global styles + dark mode
        ├── components/
        │   ├── common/
        │   │   ├── LoadingSpinner.jsx
        │   │   └── Pagination.jsx
        │   ├── dashboard/
        │   │   └── Charts.jsx   # Pie, Line, Bar (Chart.js)
        │   ├── layout/
        │   │   └── Layout.jsx   # Sidebar nav
        │   └── transactions/
        │       └── TransactionForm.jsx
        ├── contexts/
        │   ├── AuthContext.jsx  # useContext — auth state
        │   └── ThemeContext.jsx # useContext — dark/light mode
        ├── hooks/
        │   ├── useTransactions.js  # useCallback + useMemo
        │   └── useAnalytics.js     # localStorage persistence
        ├── pages/
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   ├── Dashboard.jsx
        │   ├── Transactions.jsx
        │   ├── Analytics.jsx
        │   ├── Performance.jsx  # ← Cache benchmark page
        │   ├── Users.jsx
        │   └── Profile.jsx
        └── services/
            └── api.js           # Axios + all API calls
```

---

## 🎨 React Hooks Used

| Hook | Where | Purpose |
|------|-------|---------|
| `useContext` | AuthContext, ThemeContext | Global user/theme state |
| `useCallback` | TransactionForm, useTransactions | Stable event handlers |
| `useMemo` | Dashboard, Transactions, Analytics | Memoized totals/filtered lists |
| `useState` | All pages | Local UI state |
| `useEffect` | Custom hooks | Data fetching |
| `React.lazy()` | App.jsx | Code splitting per route |
| `React.Suspense` | App.jsx | Loading fallback |
