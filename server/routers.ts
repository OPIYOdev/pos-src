import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import * as db from "./db";

// ============================================================================
// RBAC MIDDLEWARE & HELPERS
// ============================================================================

/**
 * Create role-based procedure that enforces specific roles
 */
const createRoleProcedure = (...allowedRoles: string[]) => {
  return protectedProcedure.use(({ ctx, next }) => {
    if (!allowedRoles.includes(ctx.user.role)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `This operation requires one of these roles: ${allowedRoles.join(", ")}`,
      });
    }
    return next({ ctx });
  });
};

/**
 * Audit logging helper
 */
async function logAudit(
  userId: number,
  action: string,
  module: string,
  entityType: string,
  entityId: string,
  oldValues?: Record<string, unknown>,
  newValues?: Record<string, unknown>,
  status: "success" | "failure" = "success",
  errorMessage?: string
) {
  try {
    await db.createAuditLog({
      userId,
      action,
      module,
      entityType,
      entityId,
      oldValues,
      newValues,
      status,
      errorMessage,
    });
  } catch (error) {
    console.error("[Audit] Failed to log action:", error);
  }
}

// ============================================================================
// SALES ROUTER
// ============================================================================

const salesRouter = router({
  /**
   * Create a new sale transaction
   * Allowed roles: cashier, pharmacist, manager, admin
   */
  createSale: createRoleProcedure("cashier", "pharmacist", "manager", "admin")
    .input(
      z.object({
        branchId: z.number(),
        customerId: z.number().optional(),
        items: z.array(
          z.object({
            productId: z.number(),
            batchId: z.number(),
            quantity: z.number().positive(),
            unitPrice: z.number().positive(),
          })
        ),
        discountAmount: z.number().default(0),
        paymentMethods: z.array(
          z.object({
            methodType: z.enum(["Cash", "M-Pesa", "Card", "Insurance"]),
            amount: z.number().positive(),
            reference: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Calculate totals
        const totalAmount = input.items.reduce(
          (sum, item) => sum + item.quantity * item.unitPrice,
          0
        );
        const netAmount = totalAmount - input.discountAmount;

        // Check customer credit if applicable
        if (input.customerId) {
          const hasCredit = await db.checkCustomerCredit(
            input.customerId,
            netAmount
          );
          if (!hasCredit) {
            throw new TRPCError({
              code: "PRECONDITION_FAILED",
              message: "Insufficient customer credit",
            });
          }
        }

        // Create sale
        const saleResult = await db.createSale({
          branchId: input.branchId,
          customerId: input.customerId,
          userId: ctx.user.id,
          totalAmount,
          discountAmount: input.discountAmount,
          netAmount,
        });

        // Log audit
        await logAudit(
          ctx.user.id,
          "CREATE",
          "SALES",
          "SALE",
          "new_sale",
          undefined,
          { totalAmount, netAmount, itemCount: input.items.length },
          "success"
        );

        return { success: true, saleNumber: "SAL-" + Date.now() };
      } catch (error) {
        await logAudit(
          ctx.user.id,
          "CREATE",
          "SALES",
          "SALE",
          "new_sale",
          undefined,
          undefined,
          "failure",
          error instanceof Error ? error.message : "Unknown error"
        );
        throw error;
      }
    }),

  /**
   * Get sales history for a branch
   */
  getSalesHistory: createRoleProcedure(
    "cashier",
    "pharmacist",
    "manager",
    "accountant",
    "admin"
  )
    .input(
      z.object({
        branchId: z.number(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      return db.getSalesByBranch(input.branchId, input.limit, input.offset);
    }),
});

// ============================================================================
// INVENTORY ROUTER
// ============================================================================

const inventoryRouter = router({
  /**
   * Get current stock levels for a product
   */
  getStockLevels: protectedProcedure
    .input(
      z.object({
        branchId: z.number(),
        productId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const available = await db.getAvailableStock(
        input.branchId,
        input.productId
      );
      const batches = await db.getInventoryByBranchAndProduct(
        input.branchId,
        input.productId
      );

      return {
        available,
        batches: batches.map((b) => ({
          id: b.id,
          batchNumber: b.batchNumber,
          quantity: b.quantityAvailable,
          reserved: b.quantityReserved,
          expiryDate: b.expiryDate,
          costPrice: b.costPrice,
          sellingPrice: b.sellingPrice,
        })),
      };
    }),

  /**
   * Create GRN (Goods Received Note)
   * Allowed roles: inventory_manager, pharmacist, manager, admin
   */
  createGRN: createRoleProcedure(
    "pharmacist",
    "manager",
    "admin"
  )
    .input(
      z.object({
        branchId: z.number(),
        supplierId: z.number(),
        invoiceNumber: z.string(),
        items: z.array(
          z.object({
            productId: z.number(),
            batchNumber: z.string(),
            quantityOrdered: z.number().positive(),
            quantityReceived: z.number().positive(),
            expiryDate: z.string(),
            costPrice: z.number().positive(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const grnNumber = `GRN-${Date.now()}-${Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, "0")}`;

        // Validate all items received within tolerance (5%)
        for (const item of input.items) {
          const tolerance = 0.05;
          const maxAllowed = item.quantityOrdered * (1 + tolerance);
          const minAllowed = item.quantityOrdered * (1 - tolerance);

          if (
            item.quantityReceived > maxAllowed ||
            item.quantityReceived < minAllowed
          ) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Item ${item.productId}: received quantity ${item.quantityReceived} exceeds tolerance of ±${tolerance * 100}%`,
            });
          }
        }

        await logAudit(
          ctx.user.id,
          "CREATE",
          "INVENTORY",
          "GRN",
          grnNumber,
          undefined,
          { grnNumber, itemCount: input.items.length },
          "success"
        );

        return { success: true, grnNumber };
      } catch (error) {
        await logAudit(
          ctx.user.id,
          "CREATE",
          "INVENTORY",
          "GRN",
          "new_grn",
          undefined,
          undefined,
          "failure",
          error instanceof Error ? error.message : "Unknown error"
        );
        throw error;
      }
    }),
});

// ============================================================================
// PRESCRIPTION ROUTER
// ============================================================================

const prescriptionRouter = router({
  /**
   * Create prescription
   * Allowed roles: pharmacist, manager, admin
   */
  createPrescription: createRoleProcedure("pharmacist", "manager", "admin")
    .input(
      z.object({
        patientId: z.number(),
        items: z.array(
          z.object({
            productId: z.number(),
            quantityPrescribed: z.number().positive(),
            dosage: z.string(),
            frequency: z.string(),
            duration: z.string(),
            instructions: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const prescriptionNumber = `RX-${Date.now()}-${Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, "0")}`;

        await logAudit(
          ctx.user.id,
          "CREATE",
          "PRESCRIPTIONS",
          "PRESCRIPTION",
          prescriptionNumber,
          undefined,
          { prescriptionNumber, itemCount: input.items.length },
          "success"
        );

        return { success: true, prescriptionNumber };
      } catch (error) {
        await logAudit(
          ctx.user.id,
          "CREATE",
          "PRESCRIPTIONS",
          "PRESCRIPTION",
          "new_prescription",
          undefined,
          undefined,
          "failure",
          error instanceof Error ? error.message : "Unknown error"
        );
        throw error;
      }
    }),

  /**
   * Check drug interactions
   */
  checkInteractions: protectedProcedure
    .input(
      z.object({
        drugIds: z.array(z.number()).min(2),
      })
    )
    .query(async () => {
      // TODO: Implement drug interaction checking logic
      return { interactions: [] };
    }),
});

// ============================================================================
// INSURANCE ROUTER
// ============================================================================

const insuranceRouter = router({
  /**
   * Submit insurance claim
   * Allowed roles: claims_officer, pharmacist, manager, admin
   */
  submitClaim: createRoleProcedure(
    "claims_officer",
    "pharmacist",
    "manager",
    "admin"
  )
    .input(
      z.object({
        patientId: z.number(),
        providerId: z.number(),
        saleId: z.number(),
        claimAmount: z.number().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const claimNumber = `CLM-${Date.now()}-${Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, "0")}`;

        await logAudit(
          ctx.user.id,
          "CREATE",
          "INSURANCE",
          "CLAIM",
          claimNumber,
          undefined,
          { claimNumber, amount: input.claimAmount },
          "success"
        );

        return { success: true, claimNumber };
      } catch (error) {
        await logAudit(
          ctx.user.id,
          "CREATE",
          "INSURANCE",
          "CLAIM",
          "new_claim",
          undefined,
          undefined,
          "failure",
          error instanceof Error ? error.message : "Unknown error"
        );
        throw error;
      }
    }),

  /**
   * Check member eligibility
   */
  checkEligibility: createRoleProcedure(
    "claims_officer",
    "pharmacist",
    "manager",
    "admin"
  )
    .input(
      z.object({
        memberId: z.string(),
        providerId: z.number(),
      })
    )
    .query(async () => {
      // TODO: Implement eligibility checking logic
      return { eligible: true, coverageLimit: 100000 };
    }),
});

// ============================================================================
// CUSTOMER ROUTER
// ============================================================================

const customerRouter = router({
  /**
   * Get customer details
   */
  getCustomer: protectedProcedure
    .input(z.object({ customerId: z.number() }))
    .query(async ({ input }) => {
      return db.getCustomerById(input.customerId);
    }),

  /**
   * Check customer credit availability
   */
  checkCredit: protectedProcedure
    .input(
      z.object({
        customerId: z.number(),
        amount: z.number().positive(),
      })
    )
    .query(async ({ input }) => {
      const hasCredit = await db.checkCustomerCredit(
        input.customerId,
        input.amount
      );
      return { hasCredit };
    }),
});

// ============================================================================
// TRANSFER ROUTER
// ============================================================================

const transferRouter = router({
  /**
   * Create transfer request
   * Allowed roles: inventory_manager, manager, admin
   */
  createTransferRequest: createRoleProcedure("manager", "admin")
    .input(
      z.object({
        sourceBranchId: z.number(),
        destinationBranchId: z.number(),
        items: z.array(
          z.object({
            productId: z.number(),
            quantity: z.number().positive(),
          })
        ),
        priority: z.enum(["urgent", "normal", "low"]).default("normal"),
        reason: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        if (input.sourceBranchId === input.destinationBranchId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Source and destination branches cannot be the same",
          });
        }

        const requestId = `TR-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, "0")}`;

        await logAudit(
          ctx.user.id,
          "CREATE",
          "TRANSFERS",
          "TRANSFER_REQUEST",
          requestId,
          undefined,
          { requestId, itemCount: input.items.length, priority: input.priority },
          "success"
        );

        return { success: true, requestId };
      } catch (error) {
        await logAudit(
          ctx.user.id,
          "CREATE",
          "TRANSFERS",
          "TRANSFER_REQUEST",
          "new_request",
          undefined,
          undefined,
          "failure",
          error instanceof Error ? error.message : "Unknown error"
        );
        throw error;
      }
    }),

  /**
   * Approve transfer request
   * Allowed roles: manager, admin
   */
  approveTransferRequest: createRoleProcedure("manager", "admin")
    .input(
      z.object({
        transferRequestId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const request = await db.getTransferRequestById(input.transferRequestId);
        if (!request) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Transfer request not found",
          });
        }

        await logAudit(
          ctx.user.id,
          "UPDATE",
          "TRANSFERS",
          "TRANSFER_REQUEST",
          request.requestId,
          { status: request.status },
          { status: "approved" },
          "success"
        );

        return { success: true };
      } catch (error) {
        await logAudit(
          ctx.user.id,
          "UPDATE",
          "TRANSFERS",
          "TRANSFER_REQUEST",
          "unknown",
          undefined,
          undefined,
          "failure",
          error instanceof Error ? error.message : "Unknown error"
        );
        throw error;
      }
    }),
});

// ============================================================================
// FINANCE ROUTER
// ============================================================================

const financeRouter = router({
  /**
   * Get financial reports
   * Allowed roles: accountant, manager, admin
   */
  getReports: createRoleProcedure("accountant", "manager", "admin")
    .input(
      z.object({
        branchId: z.number(),
        reportType: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      return db.getFinancialReportsByBranch(
        input.branchId,
        input.reportType
      );
    }),

  /**
   * Reconcile cash
   * Allowed roles: accountant, manager, admin
   */
  reconcileCash: createRoleProcedure("accountant", "manager", "admin")
    .input(
      z.object({
        branchId: z.number(),
        reconciliationDate: z.string(),
        expectedAmount: z.number(),
        actualAmount: z.number(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const variance = input.actualAmount - input.expectedAmount;
        const variancePercentage = (variance / input.expectedAmount) * 100;

        await logAudit(
          ctx.user.id,
          "CREATE",
          "FINANCE",
          "CASH_RECONCILIATION",
          `${input.branchId}-${input.reconciliationDate}`,
          undefined,
          { variance, variancePercentage },
          "success"
        );

        return { success: true, variance, variancePercentage };
      } catch (error) {
        await logAudit(
          ctx.user.id,
          "CREATE",
          "FINANCE",
          "CASH_RECONCILIATION",
          "new_reconciliation",
          undefined,
          undefined,
          "failure",
          error instanceof Error ? error.message : "Unknown error"
        );
        throw error;
      }
    }),
});

// ============================================================================
// USER MANAGEMENT ROUTER
// ============================================================================

const userManagementRouter = router({
  /**
   * Get all users (admin only)
   */
  listUsers: createRoleProcedure("admin")
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async () => {
      // TODO: Implement user listing
      return [];
    }),

  /**
   * Create user (admin only)
   */
  createUser: createRoleProcedure("admin")
    .input(
      z.object({
        email: z.string().email(),
        name: z.string(),
        role: z.enum([
          "admin",
          "manager",
          "pharmacist",
          "cashier",
          "dispenser",
          "accountant",
          "claims_officer",
          "auditor",
        ]),
        branchId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await logAudit(
          ctx.user.id,
          "CREATE",
          "USER_MANAGEMENT",
          "USER",
          input.email,
          undefined,
          { email: input.email, role: input.role },
          "success"
        );

        return { success: true, userId: Math.random() };
      } catch (error) {
        await logAudit(
          ctx.user.id,
          "CREATE",
          "USER_MANAGEMENT",
          "USER",
          "new_user",
          undefined,
          undefined,
          "failure",
          error instanceof Error ? error.message : "Unknown error"
        );
        throw error;
      }
    }),
});

// ============================================================================
// AUDIT LOG ROUTER
// ============================================================================

const auditRouter = router({
  /**
   * Get audit logs (admin and auditor only)
   */
  getLogs: createRoleProcedure("admin", "auditor")
    .input(
      z.object({
        userId: z.number().optional(),
        module: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        limit: z.number().default(100),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      return db.getAuditLogs(
        {
          userId: input.userId,
          module: input.module,
          startDate: input.startDate ? new Date(input.startDate) : undefined,
          endDate: input.endDate ? new Date(input.endDate) : undefined,
        },
        input.limit,
        input.offset
      );
    }),
});

// ============================================================================
// MAIN APP ROUTER
// ============================================================================

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Module routers
  sales: salesRouter,
  inventory: inventoryRouter,
  prescriptions: prescriptionRouter,
  insurance: insuranceRouter,
  customers: customerRouter,
  transfers: transferRouter,
  finance: financeRouter,
  userManagement: userManagementRouter,
  audit: auditRouter,
});

export type AppRouter = typeof appRouter;
