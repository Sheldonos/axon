import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended with trader/admin roles for financial operations access control.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  role: mysqlEnum("role", ["user", "admin", "trader"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Counterparties - Trading partners in OTC derivatives transactions
 */
export const counterparties = mysqlTable("counterparties", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  legalEntity: varchar("legalEntity", { length: 255 }).notNull(),
  jurisdiction: varchar("jurisdiction", { length: 100 }).notNull(),
  creditRating: varchar("creditRating", { length: 50 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  contactPhone: varchar("contactPhone", { length: 50 }),
  address: text("address"),
  status: mysqlEnum("status", ["active", "inactive", "suspended"]).default("active").notNull(),
  createdById: int("createdById").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Counterparty = typeof counterparties.$inferSelect;
export type InsertCounterparty = typeof counterparties.$inferInsert;

/**
 * Term Sheets - Smart contracts defining OTC derivative terms
 * Stores structured, machine-readable contract specifications
 */
export const termSheets = mysqlTable("termSheets", {
  id: int("id").autoincrement().primaryKey(),
  
  // Instrument details
  instrumentType: mysqlEnum("instrumentType", [
    "interest_rate_swap",
    "currency_swap",
    "credit_default_swap",
    "equity_option",
    "commodity_forward",
    "fx_forward",
    "variance_swap",
    "total_return_swap"
  ]).notNull(),
  
  // Financial terms (stored as integers in cents/basis points for precision)
  notionalAmount: int("notionalAmount").notNull(), // Amount in cents
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  strikePrice: int("strikePrice"), // For options, in cents
  fixedRate: int("fixedRate"), // Interest rate in basis points (e.g., 250 = 2.50%)
  
  // Dates
  tradeDate: timestamp("tradeDate").notNull(),
  effectiveDate: timestamp("effectiveDate").notNull(),
  maturityDate: timestamp("maturityDate").notNull(),
  
  // Counterparties
  counterpartyAId: int("counterpartyAId").notNull(),
  counterpartyBId: int("counterpartyBId").notNull(),
  
  // Collateral terms
  collateralRequired: boolean("collateralRequired").default(true).notNull(),
  collateralType: varchar("collateralType", { length: 100 }),
  collateralAmount: int("collateralAmount"), // In cents
  marginCallThreshold: int("marginCallThreshold"), // In cents
  
  // Additional terms
  paymentFrequency: mysqlEnum("paymentFrequency", [
    "monthly",
    "quarterly",
    "semi_annual",
    "annual",
    "at_maturity"
  ]),
  dayCountConvention: varchar("dayCountConvention", { length: 50 }),
  underlyingAsset: varchar("underlyingAsset", { length: 255 }),
  
  // Metadata
  status: mysqlEnum("status", ["draft", "pending_approval", "approved", "rejected"]).default("draft").notNull(),
  createdById: int("createdById").notNull(),
  notes: text("notes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TermSheet = typeof termSheets.$inferSelect;
export type InsertTermSheet = typeof termSheets.$inferInsert;

/**
 * Risk Calculations - Pre-trade risk analysis results
 * Stores calculated exposure, collateral requirements, and P&L scenarios
 */
export const riskCalculations = mysqlTable("riskCalculations", {
  id: int("id").autoincrement().primaryKey(),
  termSheetId: int("termSheetId").notNull(),
  
  // Risk metrics (stored as integers in cents for precision)
  exposureAmount: int("exposureAmount").notNull(), // Current exposure in cents
  potentialExposure: int("potentialExposure").notNull(), // Maximum potential exposure
  collateralRequired: int("collateralRequired").notNull(), // Required collateral in cents
  
  // P&L scenarios (in cents)
  baseScenarioPnL: int("baseScenarioPnL").notNull(),
  bullScenarioPnL: int("bullScenarioPnL").notNull(),
  bearScenarioPnL: int("bearScenarioPnL").notNull(),
  stressScenarioPnL: int("stressScenarioPnL").notNull(),
  
  // Risk indicators
  creditRisk: varchar("creditRisk", { length: 50 }).notNull(), // low, medium, high, critical
  marketRisk: varchar("marketRisk", { length: 50 }).notNull(),
  liquidityRisk: varchar("liquidityRisk", { length: 50 }).notNull(),
  
  // Value at Risk metrics (in cents)
  valueAtRisk95: int("valueAtRisk95"), // 95% confidence VaR
  valueAtRisk99: int("valueAtRisk99"), // 99% confidence VaR
  
  calculatedAt: timestamp("calculatedAt").defaultNow().notNull(),
  calculatedById: int("calculatedById").notNull(),
});

export type RiskCalculation = typeof riskCalculations.$inferSelect;
export type InsertRiskCalculation = typeof riskCalculations.$inferInsert;

/**
 * Trades - Executed OTC derivative trades
 * Tracks the full lifecycle from negotiation to settlement
 */
export const trades = mysqlTable("trades", {
  id: int("id").autoincrement().primaryKey(),
  termSheetId: int("termSheetId").notNull(),
  
  // Trade execution details
  tradeStatus: mysqlEnum("tradeStatus", [
    "negotiating",
    "pending_approval",
    "approved",
    "executing",
    "executed",
    "settling",
    "settled",
    "cancelled",
    "failed"
  ]).default("negotiating").notNull(),
  
  // Execution details
  executionPrice: int("executionPrice"), // Final execution price in cents
  executionTimestamp: timestamp("executionTimestamp"),
  settlementTimestamp: timestamp("settlementTimestamp"),
  
  // Confirmation tracking
  counterpartyAConfirmed: boolean("counterpartyAConfirmed").default(false).notNull(),
  counterpartyBConfirmed: boolean("counterpartyBConfirmed").default(false).notNull(),
  counterpartyAConfirmedAt: timestamp("counterpartyAConfirmedAt"),
  counterpartyBConfirmedAt: timestamp("counterpartyBConfirmedAt"),
  
  // Settlement details
  clearinghouseRef: varchar("clearinghouseRef", { length: 255 }),
  settlementRef: varchar("settlementRef", { length: 255 }),
  
  // Audit trail
  initiatedById: int("initiatedById").notNull(),
  approvedById: int("approvedById"),
  approvedAt: timestamp("approvedAt"),
  
  notes: text("notes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Trade = typeof trades.$inferSelect;
export type InsertTrade = typeof trades.$inferInsert;

/**
 * Trade Events - Audit log for trade lifecycle events
 * Provides complete audit trail for compliance and tracking
 */
export const tradeEvents = mysqlTable("tradeEvents", {
  id: int("id").autoincrement().primaryKey(),
  tradeId: int("tradeId").notNull(),
  
  eventType: mysqlEnum("eventType", [
    "created",
    "status_changed",
    "counterparty_confirmed",
    "approved",
    "rejected",
    "executed",
    "settled",
    "cancelled",
    "note_added"
  ]).notNull(),
  
  eventData: text("eventData"), // JSON string for additional event details
  performedById: int("performedById").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TradeEvent = typeof tradeEvents.$inferSelect;
export type InsertTradeEvent = typeof tradeEvents.$inferInsert;
