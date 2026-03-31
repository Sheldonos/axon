# Axon — OTC Derivatives Trading Platform

**Axon** is an open-source platform for structuring, negotiating, and executing Over-the-Counter (OTC) derivative trades. It replaces the opaque, phone-and-chat-based workflow that still dominates the multi-trillion dollar OTC market with a structured, machine-readable protocol that both counterparties build together in real time.

> "Axon me a price on that swap."

---

## The Problem

A shocking volume of the global OTC derivatives market — interest rate swaps, credit default swaps, FX forwards, variance swaps — still runs on Bloomberg terminals, phone calls, and chat messages. Traders agree to complex terms verbally, which are then manually entered into risk systems. The result is an opaque, slow, and error-prone process where a single fat-finger mistake can cost hundreds of millions of dollars.

## The Solution

Axon provides three core capabilities:

| Capability | Description |
|---|---|
| **Smart Term Sheet** | A digital, standardized framework for defining any derivative. Replaces ambiguous chat messages with a structured, machine-readable contract both parties build together. |
| **Pre-Trade Risk Engine** | Before execution, both parties run the term sheet through a universal risk simulator to see exact financial exposure, collateral requirements, and P&L scenarios. |
| **Atomic Settlement** | Once both parties agree, the platform executes the trade, registers it, and handles collateral management automatically — turning a multi-hour process into a secure, instantaneous event. |

---

## Features

- **Smart Term Sheet Builder** — Interactive form for structuring any OTC derivative: interest rate swaps, currency swaps, credit default swaps, equity options, FX forwards, variance swaps, total return swaps, and commodity forwards.
- **Pre-Trade Risk Engine** — Real-time calculation of mark-to-market exposure, potential future exposure (PFE), Value at Risk (VaR at 95% and 99%), collateral requirements, and four-scenario P&L analysis (base, bull, bear, stress).
- **Trade Execution Workflow** — Multi-step process with counterparty confirmation tracking, approval gates, atomic settlement, and full audit trail.
- **Counterparty Management** — Register and manage trading relationships, view bilateral trade history, track credit ratings and jurisdictions.
- **Trade Dashboard** — Unified view of active negotiations, pending approvals, and executed trades with filtering, search, and status tracking.
- **Role-Based Access Control** — Trader and admin roles with protected procedures and audit logging.
- **Local Email/Password Auth** — Self-contained JWT-based authentication with bcrypt password hashing. No external OAuth provider required.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Tailwind CSS 4, shadcn/ui, Recharts, Framer Motion |
| API Layer | tRPC 11 (end-to-end type safety) |
| Backend | Node.js, Express 4 |
| Database ORM | Drizzle ORM |
| Database | MySQL / TiDB / PlanetScale |
| Auth | JWT (jose), bcryptjs |
| Build | Vite 7, esbuild |
| Testing | Vitest |
| Language | TypeScript (strict) |

---

## Getting Started

### Prerequisites

- **Node.js** 20 or later
- **pnpm** 10 or later (`npm install -g pnpm`)
- **MySQL** 8.0+ (or a compatible service: TiDB, PlanetScale, Railway MySQL)

### 1. Clone the repository

```bash
git clone https://github.com/Sheldonos/axon.git
cd axon
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

Copy the template and fill in your values:

```bash
cp env-template.txt .env
```

Edit `.env`:

```env
APP_ID=axon
NODE_ENV=development
PORT=3000

# MySQL connection string
DATABASE_URL=mysql://root:password@localhost:3306/axon

# JWT secret — generate a strong value:
#   openssl rand -hex 32
JWT_SECRET=your-secret-here
```

### 4. Create the database

```bash
# Create the database in MySQL
mysql -u root -p -e "CREATE DATABASE axon;"
```

### 5. Push the schema

```bash
pnpm db:push
```

This runs `drizzle-kit generate && drizzle-kit migrate` to apply all table definitions.

### 6. Start the development server

```bash
pnpm dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

---

## Available Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start the development server with hot reload |
| `pnpm build` | Build the frontend and bundle the server for production |
| `pnpm start` | Run the production build |
| `pnpm db:push` | Generate and apply database migrations |
| `pnpm test` | Run the Vitest test suite |
| `pnpm check` | TypeScript type checking |
| `pnpm format` | Format code with Prettier |

---

## Project Structure

```
axon/
├── client/
│   ├── src/
│   │   ├── pages/          # Route-level page components
│   │   │   ├── Home.tsx         # Landing page
│   │   │   ├── Login.tsx        # Auth (sign in / register)
│   │   │   ├── Dashboard.tsx    # Trade dashboard
│   │   │   ├── TermSheets.tsx   # Term sheet list
│   │   │   ├── TermSheetBuilder.tsx  # Smart term sheet form
│   │   │   ├── RiskAnalysis.tsx # Pre-trade risk engine
│   │   │   ├── Counterparties.tsx    # Counterparty management
│   │   │   └── TradeExecution.tsx    # Trade execution workflow
│   │   ├── components/     # Reusable UI components (shadcn/ui)
│   │   ├── _core/hooks/    # useAuth and other core hooks
│   │   ├── lib/trpc.ts     # tRPC client binding
│   │   ├── App.tsx         # Route definitions
│   │   └── index.css       # Global theme (Tailwind CSS variables)
├── server/
│   ├── _core/
│   │   ├── index.ts        # Express server entry point
│   │   ├── oauth.ts        # Auth routes (login / register)
│   │   ├── sdk.ts          # JWT session management
│   │   ├── context.ts      # tRPC request context
│   │   ├── trpc.ts         # Procedure definitions (public / protected / admin)
│   │   └── notification.ts # Notification stub (wire up your provider)
│   ├── db.ts               # Database query helpers
│   └── routers.ts          # tRPC router definitions
├── drizzle/
│   └── schema.ts           # Database schema (tables & types)
├── shared/
│   └── const.ts            # Shared constants
├── env-template.txt        # Environment variable reference
├── drizzle.config.ts       # Drizzle Kit configuration
├── vite.config.ts          # Vite build configuration
└── tsconfig.json           # TypeScript configuration
```

---

## Authentication

Axon uses a self-contained email/password authentication system:

- **Registration**: `POST /api/auth/register` — creates a new user with a bcrypt-hashed password.
- **Login**: `POST /api/auth/login` — validates credentials and issues a signed JWT session cookie.
- **Session**: JWT is verified on every request via the tRPC context. Protected procedures require a valid session.
- **Roles**: Users can have `user`, `trader`, or `admin` roles. Promote a user to admin by updating the `role` field directly in the database.

---

## Database Schema

The core tables are:

| Table | Purpose |
|---|---|
| `users` | User accounts with roles and hashed passwords |
| `counterparties` | Trading partners with legal entity and credit details |
| `termSheets` | Smart term sheet contracts with all derivative parameters |
| `riskCalculations` | Pre-trade risk analysis results (VaR, exposure, P&L scenarios) |
| `trades` | Trade lifecycle from negotiation to settlement |
| `tradeEvents` | Immutable audit log of all trade lifecycle events |

All monetary values are stored as integers (cents/basis points) to avoid floating-point precision errors.

---

## Notifications

The `server/_core/notification.ts` file contains a stub for owner notifications. To activate it, replace the stub with your preferred provider:

```ts
// nodemailer example
import nodemailer from "nodemailer";

export async function notifyOwner(payload: NotificationPayload): Promise<boolean> {
  const transporter = nodemailer.createTransport({ /* your config */ });
  await transporter.sendMail({
    to: process.env.ADMIN_EMAIL,
    subject: payload.title,
    text: payload.content,
  });
  return true;
}
```

---

## Deployment

Axon is a standard Node.js application and can be deployed to any platform that supports Node.js:

```bash
# Build for production
pnpm build

# Start the production server
pnpm start
```

Recommended platforms: **Railway**, **Render**, **Fly.io**, **AWS EC2**, **DigitalOcean App Platform**.

For the database, any MySQL-compatible managed service works: **PlanetScale**, **TiDB Cloud**, **Railway MySQL**, **AWS RDS**.

---

## Contributing

Contributions are welcome. Please open an issue to discuss proposed changes before submitting a pull request.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "feat: add my feature"`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a pull request

---

## License

MIT License. See [LICENSE](LICENSE) for details.
