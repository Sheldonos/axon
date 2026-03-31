import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTraderContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-trader",
    email: "trader@axon.test",
    name: "Test Trader",
    loginMethod: "email",
    role: "trader",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("risk.calculate", () => {
  let termSheetId: number;
  let counterpartyAId: number;
  let counterpartyBId: number;

  beforeAll(async () => {
    // Create test counterparties
    const cpAResult = await db.createCounterparty({
      name: "Test Bank A",
      legalEntity: "Test Bank A LLC",
      jurisdiction: "United States",
      creditRating: "AAA",
      createdById: 1,
    });
    const cpAId = (cpAResult as any).insertId;
    counterpartyAId = cpAId ? Number(cpAId) : 1;

    const cpBResult = await db.createCounterparty({
      name: "Test Bank B",
      legalEntity: "Test Bank B LLC",
      jurisdiction: "United Kingdom",
      creditRating: "AA+",
      createdById: 1,
    });
    const cpBId = (cpBResult as any).insertId;
    counterpartyBId = cpBId ? Number(cpBId) : 2;

    // Create test term sheet
    const tsResult = await db.createTermSheet({
      instrumentType: "interest_rate_swap",
      notionalAmount: 1000000000, // $10M in cents
      currency: "USD",
      fixedRate: 250, // 2.50% in basis points
      tradeDate: new Date(),
      effectiveDate: new Date(),
      maturityDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      counterpartyAId: counterpartyAId,
      counterpartyBId: counterpartyBId,
      collateralRequired: true,
      collateralType: "Cash",
      collateralAmount: 100000000, // $1M in cents
      paymentFrequency: "quarterly",
      createdById: 1,
      status: "approved",
    });
    const tsId = (tsResult as any).insertId;
    termSheetId = tsId ? Number(tsId) : 1;
  });

  it("calculates risk metrics for a term sheet", async () => {
    const ctx = createTraderContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.risk.calculate({ termSheetId });

    // Verify risk calculation results
    expect(result).toBeDefined();
    expect(result.exposureAmount).toBeGreaterThan(0);
    expect(result.potentialExposure).toBeGreaterThan(result.exposureAmount);
    expect(result.collateralRequired).toBeGreaterThan(0);

    // Verify P&L scenarios
    expect(result.baseScenarioPnL).toBe(0);
    expect(result.bullScenarioPnL).toBeGreaterThan(0);
    expect(result.bearScenarioPnL).toBeLessThan(0);
    expect(result.stressScenarioPnL).toBeLessThan(result.bearScenarioPnL);

    // Verify risk indicators
    expect(['low', 'medium', 'high', 'critical']).toContain(result.creditRisk);
    expect(['low', 'medium', 'high', 'critical']).toContain(result.marketRisk);
    expect(['low', 'medium', 'high', 'critical']).toContain(result.liquidityRisk);

    // Verify VaR calculations
    expect(result.valueAtRisk95).toBeGreaterThan(0);
    expect(result.valueAtRisk99).toBeGreaterThan(result.valueAtRisk95);
  });

  it("stores risk calculation in database", async () => {
    const ctx = createTraderContext();
    const caller = appRouter.createCaller(ctx);

    await caller.risk.calculate({ termSheetId });

    // Verify risk calculation was stored
    const storedRisk = await db.getRiskCalculationByTermSheetId(termSheetId);
    expect(storedRisk).toBeDefined();
    expect(storedRisk?.termSheetId).toBe(termSheetId);
    expect(storedRisk?.exposureAmount).toBeGreaterThan(0);
  });

  it("requires trader role to calculate risk", async () => {
    const userCtx: TrpcContext = {
      user: {
        id: 2,
        openId: "test-user",
        email: "user@axon.test",
        name: "Test User",
        loginMethod: "email",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {
        clearCookie: () => {},
      } as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(userCtx);

    await expect(
      caller.risk.calculate({ termSheetId })
    ).rejects.toThrow();
  });
});
