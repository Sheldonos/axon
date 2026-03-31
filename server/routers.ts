import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

// Middleware for trader/admin only access
const traderProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'trader' && ctx.user.role !== 'admin') {
    throw new TRPCError({ 
      code: 'FORBIDDEN',
      message: 'Trader or admin access required'
    });
  }
  return next({ ctx });
});

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ 
      code: 'FORBIDDEN',
      message: 'Admin access required'
    });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============================================================================
  // Counterparty Management
  // ============================================================================
  counterparties: router({
    list: traderProcedure
      .input(z.object({
        status: z.enum(['active', 'inactive', 'suspended']).optional(),
        search: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.getAllCounterparties(input);
      }),
    
    getById: traderProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const counterparty = await db.getCounterpartyById(input.id);
        if (!counterparty) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Counterparty not found' });
        }
        return counterparty;
      }),
    
    create: traderProcedure
      .input(z.object({
        name: z.string().min(1),
        legalEntity: z.string().min(1),
        jurisdiction: z.string().min(1),
        creditRating: z.string().optional(),
        contactEmail: z.string().email().optional(),
        contactPhone: z.string().optional(),
        address: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.createCounterparty({
          ...input,
          createdById: ctx.user.id,
        });
        return { success: true };
      }),
    
    update: traderProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        legalEntity: z.string().min(1).optional(),
        jurisdiction: z.string().min(1).optional(),
        creditRating: z.string().optional(),
        contactEmail: z.string().email().optional(),
        contactPhone: z.string().optional(),
        address: z.string().optional(),
        status: z.enum(['active', 'inactive', 'suspended']).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateCounterparty(id, data);
        return { success: true };
      }),
    
    getTradeCount: traderProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getCounterpartyTradeCount(input.id);
      }),
  }),

  // ============================================================================
  // Term Sheet Management
  // ============================================================================
  termSheets: router({
    list: traderProcedure
      .input(z.object({
        status: z.enum(['draft', 'pending_approval', 'approved', 'rejected']).optional(),
      }).optional())
      .query(async ({ input, ctx }) => {
        return db.getAllTermSheets(input);
      }),
    
    getById: traderProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const termSheet = await db.getTermSheetById(input.id);
        if (!termSheet) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Term sheet not found' });
        }
        return termSheet;
      }),
    
    create: traderProcedure
      .input(z.object({
        instrumentType: z.enum([
          'interest_rate_swap',
          'currency_swap',
          'credit_default_swap',
          'equity_option',
          'commodity_forward',
          'fx_forward',
          'variance_swap',
          'total_return_swap'
        ]),
        notionalAmount: z.number().int().positive(),
        currency: z.string().length(3).default('USD'),
        strikePrice: z.number().int().optional(),
        fixedRate: z.number().int().optional(),
        tradeDate: z.date(),
        effectiveDate: z.date(),
        maturityDate: z.date(),
        counterpartyAId: z.number().int().positive(),
        counterpartyBId: z.number().int().positive(),
        collateralRequired: z.boolean().default(true),
        collateralType: z.string().optional(),
        collateralAmount: z.number().int().optional(),
        marginCallThreshold: z.number().int().optional(),
        paymentFrequency: z.enum(['monthly', 'quarterly', 'semi_annual', 'annual', 'at_maturity']).optional(),
        dayCountConvention: z.string().optional(),
        underlyingAsset: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await db.createTermSheet({
          ...input,
          createdById: ctx.user.id,
          status: 'draft',
        });
        const insertId = (result as any).insertId;
        return { success: true, id: Number(insertId) };
      }),
    
    update: traderProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['draft', 'pending_approval', 'approved', 'rejected']).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateTermSheet(id, data);
        return { success: true };
      }),
  }),

  // ============================================================================
  // Risk Calculation
  // ============================================================================
  risk: router({
    calculate: traderProcedure
      .input(z.object({ termSheetId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const termSheet = await db.getTermSheetById(input.termSheetId);
        if (!termSheet) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Term sheet not found' });
        }

        // Risk calculation logic
        const notional = termSheet.notionalAmount;
        const maturityDays = Math.ceil(
          (new Date(termSheet.maturityDate).getTime() - new Date(termSheet.effectiveDate).getTime()) / 
          (1000 * 60 * 60 * 24)
        );
        
        // Simplified risk calculations (in production, these would be much more sophisticated)
        const exposureAmount = Math.floor(notional * 0.15); // 15% of notional
        const potentialExposure = Math.floor(notional * 0.30); // 30% of notional
        const collateralRequired = termSheet.collateralRequired 
          ? Math.floor(notional * 0.10) 
          : 0;
        
        // P&L scenarios based on instrument type and market conditions
        const volatilityFactor = maturityDays / 365;
        const baseScenarioPnL = 0;
        const bullScenarioPnL = Math.floor(notional * 0.05 * volatilityFactor);
        const bearScenarioPnL = Math.floor(notional * -0.05 * volatilityFactor);
        const stressScenarioPnL = Math.floor(notional * -0.15 * volatilityFactor);
        
        // Risk indicators based on exposure levels
        const exposureRatio = exposureAmount / notional;
        const creditRisk = exposureRatio > 0.20 ? 'high' : exposureRatio > 0.10 ? 'medium' : 'low';
        const marketRisk = volatilityFactor > 2 ? 'high' : volatilityFactor > 1 ? 'medium' : 'low';
        const liquidityRisk = maturityDays > 1825 ? 'high' : maturityDays > 730 ? 'medium' : 'low';
        
        // Value at Risk calculations (simplified)
        const valueAtRisk95 = Math.floor(notional * 0.03 * volatilityFactor);
        const valueAtRisk99 = Math.floor(notional * 0.05 * volatilityFactor);
        
        await db.createRiskCalculation({
          termSheetId: input.termSheetId,
          exposureAmount,
          potentialExposure,
          collateralRequired,
          baseScenarioPnL,
          bullScenarioPnL,
          bearScenarioPnL,
          stressScenarioPnL,
          creditRisk,
          marketRisk,
          liquidityRisk,
          valueAtRisk95,
          valueAtRisk99,
          calculatedById: ctx.user.id,
        });
        
        return {
          exposureAmount,
          potentialExposure,
          collateralRequired,
          baseScenarioPnL,
          bullScenarioPnL,
          bearScenarioPnL,
          stressScenarioPnL,
          creditRisk,
          marketRisk,
          liquidityRisk,
          valueAtRisk95,
          valueAtRisk99,
        };
      }),
    
    getByTermSheetId: traderProcedure
      .input(z.object({ termSheetId: z.number() }))
      .query(async ({ input }) => {
        return db.getRiskCalculationByTermSheetId(input.termSheetId);
      }),
  }),

  // ============================================================================
  // Trade Management
  // ============================================================================
  trades: router({
    list: traderProcedure
      .input(z.object({
        status: z.string().optional(),
        search: z.string().optional(),
      }).optional())
      .query(async ({ input, ctx }) => {
        return db.getAllTrades(input);
      }),
    
    getById: traderProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const trade = await db.getTradeWithDetails(input.id);
        if (!trade) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Trade not found' });
        }
        return trade;
      }),
    
    create: traderProcedure
      .input(z.object({
        termSheetId: z.number(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const termSheet = await db.getTermSheetById(input.termSheetId);
        if (!termSheet) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Term sheet not found' });
        }
        
        if (termSheet.status !== 'approved') {
          throw new TRPCError({ 
            code: 'BAD_REQUEST', 
            message: 'Term sheet must be approved before creating trade' 
          });
        }
        
        const result = await db.createTrade({
          termSheetId: input.termSheetId,
          tradeStatus: 'negotiating',
          initiatedById: ctx.user.id,
          notes: input.notes,
          counterpartyAConfirmed: false,
          counterpartyBConfirmed: false,
        });
        
        const tradeId = Number((result as any).insertId);
        
        await db.createTradeEvent({
          tradeId,
          eventType: 'created',
          performedById: ctx.user.id,
        });
        
        return { success: true, id: tradeId };
      }),
    
    updateStatus: traderProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum([
          'negotiating',
          'pending_approval',
          'approved',
          'executing',
          'executed',
          'settling',
          'settled',
          'cancelled',
          'failed'
        ]),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const updateData: any = { tradeStatus: input.status };
        
        if (input.status === 'approved') {
          updateData.approvedById = ctx.user.id;
          updateData.approvedAt = new Date();
        } else if (input.status === 'executed') {
          updateData.executionTimestamp = new Date();
        } else if (input.status === 'settled') {
          updateData.settlementTimestamp = new Date();
        }
        
        if (input.notes) {
          updateData.notes = input.notes;
        }
        
        await db.updateTrade(input.id, updateData);
        
        await db.createTradeEvent({
          tradeId: input.id,
          eventType: 'status_changed',
          eventData: JSON.stringify({ newStatus: input.status }),
          performedById: ctx.user.id,
        });
        
        return { success: true };
      }),
    
    confirmCounterparty: traderProcedure
      .input(z.object({
        id: z.number(),
        counterparty: z.enum(['A', 'B']),
      }))
      .mutation(async ({ input, ctx }) => {
        const field = input.counterparty === 'A' 
          ? 'counterpartyAConfirmed' 
          : 'counterpartyBConfirmed';
        const timestampField = input.counterparty === 'A'
          ? 'counterpartyAConfirmedAt'
          : 'counterpartyBConfirmedAt';
        
        await db.updateTrade(input.id, {
          [field]: true,
          [timestampField]: new Date(),
        });
        
        await db.createTradeEvent({
          tradeId: input.id,
          eventType: 'counterparty_confirmed',
          eventData: JSON.stringify({ counterparty: input.counterparty }),
          performedById: ctx.user.id,
        });
        
        return { success: true };
      }),
    
    getEvents: traderProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getTradeEvents(input.id);
      }),
  }),
});

export type AppRouter = typeof appRouter;
