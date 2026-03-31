import { eq, desc, and, or, like, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users,
  counterparties,
  termSheets,
  riskCalculations,
  trades,
  tradeEvents,
  type InsertCounterparty,
  type InsertTermSheet,
  type InsertRiskCalculation,
  type InsertTrade,
  type InsertTradeEvent
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================================================
// User Management
// ============================================================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "passwordHash"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// Counterparty Management
// ============================================================================

export async function createCounterparty(data: InsertCounterparty) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(counterparties).values(data);
  return result;
}

export async function getCounterpartyById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(counterparties).where(eq(counterparties.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllCounterparties(filters?: { status?: string; search?: string }) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(counterparties);
  
  const conditions = [];
  if (filters?.status) {
    conditions.push(eq(counterparties.status, filters.status as any));
  }
  if (filters?.search) {
    conditions.push(
      or(
        like(counterparties.name, `%${filters.search}%`),
        like(counterparties.legalEntity, `%${filters.search}%`)
      )
    );
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  return query.orderBy(desc(counterparties.createdAt));
}

export async function updateCounterparty(id: number, data: Partial<InsertCounterparty>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(counterparties).set(data).where(eq(counterparties.id, id));
}

export async function getCounterpartyTradeCount(counterpartyId: number) {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(trades)
    .innerJoin(termSheets, eq(trades.termSheetId, termSheets.id))
    .where(
      or(
        eq(termSheets.counterpartyAId, counterpartyId),
        eq(termSheets.counterpartyBId, counterpartyId)
      )
    );
  
  return result[0]?.count || 0;
}

// ============================================================================
// Term Sheet Management
// ============================================================================

export async function createTermSheet(data: InsertTermSheet) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(termSheets).values(data);
  return result;
}

export async function getTermSheetById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(termSheets).where(eq(termSheets.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllTermSheets(filters?: { status?: string; createdById?: number }) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(termSheets);
  
  const conditions = [];
  if (filters?.status) {
    conditions.push(eq(termSheets.status, filters.status as any));
  }
  if (filters?.createdById) {
    conditions.push(eq(termSheets.createdById, filters.createdById));
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  return query.orderBy(desc(termSheets.createdAt));
}

export async function updateTermSheet(id: number, data: Partial<InsertTermSheet>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(termSheets).set(data).where(eq(termSheets.id, id));
}

// ============================================================================
// Risk Calculation Management
// ============================================================================

export async function createRiskCalculation(data: InsertRiskCalculation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(riskCalculations).values(data);
  return result;
}

export async function getRiskCalculationByTermSheetId(termSheetId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db
    .select()
    .from(riskCalculations)
    .where(eq(riskCalculations.termSheetId, termSheetId))
    .orderBy(desc(riskCalculations.calculatedAt))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// Trade Management
// ============================================================================

export async function createTrade(data: InsertTrade) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(trades).values(data);
  return result;
}

export async function getTradeById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(trades).where(eq(trades.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllTrades(filters?: { 
  status?: string; 
  initiatedById?: number;
  search?: string;
}) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db
    .select({
      trade: trades,
      termSheet: termSheets,
      counterpartyA: counterparties,
      counterpartyB: counterparties,
    })
    .from(trades)
    .innerJoin(termSheets, eq(trades.termSheetId, termSheets.id))
    .leftJoin(counterparties, eq(termSheets.counterpartyAId, counterparties.id));
  
  const conditions = [];
  if (filters?.status) {
    conditions.push(eq(trades.tradeStatus, filters.status as any));
  }
  if (filters?.initiatedById) {
    conditions.push(eq(trades.initiatedById, filters.initiatedById));
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  return query.orderBy(desc(trades.createdAt));
}

export async function updateTrade(id: number, data: Partial<InsertTrade>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(trades).set(data).where(eq(trades.id, id));
}

export async function getTradeWithDetails(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db
    .select({
      trade: trades,
      termSheet: termSheets,
    })
    .from(trades)
    .innerJoin(termSheets, eq(trades.termSheetId, termSheets.id))
    .where(eq(trades.id, id))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// Trade Event Management
// ============================================================================

export async function createTradeEvent(data: InsertTradeEvent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(tradeEvents).values(data);
  return result;
}

export async function getTradeEvents(tradeId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(tradeEvents)
    .where(eq(tradeEvents.tradeId, tradeId))
    .orderBy(desc(tradeEvents.createdAt));
}
