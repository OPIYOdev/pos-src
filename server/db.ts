import { eq, and, gte, lte, desc, asc, between, sql, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  branches,
  products,
  inventoryBatches,
  customers,
  sales,
  saleItems,
  paymentMethods,
  grn,
  grnItems,
  prescriptions,
  prescriptionItems,
  drugInteractions,
  insuranceProviders,
  insuranceClaims,
  transferRequests,
  transferRequestItems,
  transferOrders,
  transferOrderItems,
  transferCosts,
  transferDisputes,
  interBranchSettlements,
  cashReconciliation,
  auditLogs,
  financialReports,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

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
// USER QUERIES
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

    const textFields = ["name", "email", "phone", "loginMethod"] as const;
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
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
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

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// INVENTORY QUERIES
// ============================================================================

export async function getInventoryByBranchAndProduct(
  branchId: number,
  productId: number
) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(inventoryBatches)
    .where(
      and(
        eq(inventoryBatches.branchId, branchId),
        eq(inventoryBatches.productId, productId),
        eq(inventoryBatches.isQuarantined, false)
      )
    )
    .orderBy(asc(inventoryBatches.expiryDate));
}

/**
 * Get available stock for a product at a branch (FEFO ordered)
 */
export async function getAvailableStock(branchId: number, productId: number) {
  const db = await getDb();
  if (!db) return 0;

  const batches = await db
    .select()
    .from(inventoryBatches)
    .where(
      and(
        eq(inventoryBatches.branchId, branchId),
        eq(inventoryBatches.productId, productId),
        eq(inventoryBatches.isQuarantined, false),
        gte(inventoryBatches.expiryDate, new Date())
      )
    )
    .orderBy(asc(inventoryBatches.expiryDate));

  return batches.reduce((sum, batch) => {
    const available = parseFloat(batch.quantityAvailable.toString());
    const reserved = parseFloat(batch.quantityReserved.toString());
    return sum + (available - reserved);
  }, 0);
}

/**
 * Select batches using FEFO (First Expiry First Out) logic
 */
export async function selectBatchesFEFO(
  branchId: number,
  productId: number,
  quantityNeeded: number
) {
  const db = await getDb();
  if (!db) return [];

  const batches = await db
    .select()
    .from(inventoryBatches)
    .where(
      and(
        eq(inventoryBatches.branchId, branchId),
        eq(inventoryBatches.productId, productId),
        eq(inventoryBatches.isQuarantined, false),
        gte(inventoryBatches.expiryDate, new Date())
      )
    )
    .orderBy(asc(inventoryBatches.expiryDate));

  const selectedBatches = [];
  let remainingQuantity = quantityNeeded;

  for (const batch of batches) {
    if (remainingQuantity <= 0) break;

    const available = parseFloat(batch.quantityAvailable.toString());
    const reserved = parseFloat(batch.quantityReserved.toString());
    const usable = available - reserved;

    if (usable > 0) {
      const takeQuantity = Math.min(usable, remainingQuantity);
      selectedBatches.push({
        batchId: batch.id,
        quantityToTake: takeQuantity,
        costPrice: batch.costPrice,
        expiryDate: batch.expiryDate,
      });
      remainingQuantity -= takeQuantity;
    }
  }

  return selectedBatches;
}

// ============================================================================
// SALES QUERIES
// ============================================================================

export async function createSale(saleData: {
  branchId: number;
  customerId?: number;
  userId: number;
  totalAmount: number;
  discountAmount: number;
  netAmount: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const saleNumber = `SAL-${Date.now()}-${Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0")}`;

  return db.insert(sales).values({
    saleNumber: saleNumber,
    branchId: saleData.branchId,
    customerId: saleData.customerId,
    userId: saleData.userId,
    totalAmount: saleData.totalAmount as any,
    discountAmount: saleData.discountAmount as any,
    netAmount: saleData.netAmount as any,
    paymentStatus: "pending",
  } as any);
}

export async function getSaleById(saleId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(sales)
    .where(eq(sales.id, saleId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function getSalesByBranch(
  branchId: number,
  limit: number = 50,
  offset: number = 0
) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(sales)
    .where(eq(sales.branchId, branchId))
    .orderBy(desc(sales.createdAt))
    .limit(limit)
    .offset(offset);
}

// ============================================================================
// CUSTOMER QUERIES
// ============================================================================

export async function getCustomerById(customerId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function checkCustomerCredit(
  customerId: number,
  amount: number
): Promise<boolean> {
  const customer = await getCustomerById(customerId);
  if (!customer) return false;

  const creditAvailable = parseFloat(customer.creditLimit.toString()) -
    parseFloat(customer.creditUsed.toString());

  return creditAvailable >= amount;
}

// ============================================================================
// TRANSFER QUERIES
// ============================================================================

export async function getTransferRequestById(requestId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(transferRequests)
    .where(eq(transferRequests.id, requestId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function getTransferOrderById(orderId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(transferOrders)
    .where(eq(transferOrders.id, orderId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

// ============================================================================
// AUDIT LOG QUERIES
// ============================================================================

export async function createAuditLog(auditData: {
  userId: number;
  action: string;
  module: string;
  entityType: string;
  entityId: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  status: "success" | "failure";
  errorMessage?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(auditLogs).values({
    userId: auditData.userId,
    action: auditData.action,
    module: auditData.module,
    entityType: auditData.entityType,
    entityId: auditData.entityId,
    oldValues: auditData.oldValues,
    newValues: auditData.newValues,
    ipAddress: auditData.ipAddress,
    userAgent: auditData.userAgent,
    status: auditData.status,
    errorMessage: auditData.errorMessage,
  });
}

export async function getAuditLogs(
  filters: {
    userId?: number;
    module?: string;
    entityType?: string;
    startDate?: Date;
    endDate?: Date;
  },
  limit: number = 100,
  offset: number = 0
) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];

  if (filters.userId) {
    conditions.push(eq(auditLogs.userId, filters.userId));
  }
  if (filters.module) {
    conditions.push(eq(auditLogs.module, filters.module));
  }
  if (filters.entityType) {
    conditions.push(eq(auditLogs.entityType, filters.entityType));
  }
  if (filters.startDate && filters.endDate) {
    conditions.push(
      between(auditLogs.createdAt, filters.startDate, filters.endDate)
    );
  }

  let query = db.select().from(auditLogs);

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  return (query as any).orderBy(desc(auditLogs.createdAt)).limit(limit).offset(offset);
}

// ============================================================================
// FINANCIAL QUERIES
// ============================================================================

export async function getFinancialReport(reportId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(financialReports)
    .where(eq(financialReports.id, reportId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function getFinancialReportsByBranch(
  branchId: number,
  reportType?: string,
  limit: number = 50,
  offset: number = 0
) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(financialReports.branchId, branchId)];

  if (reportType) {
    conditions.push(eq(financialReports.reportType, reportType as any));
  }

  return db
    .select()
    .from(financialReports)
    .where(and(...conditions))
    .orderBy(desc(financialReports.createdAt))
    .limit(limit)
    .offset(offset);
}

// ============================================================================
// PRESCRIPTION QUERIES
// ============================================================================

export async function getPrescriptionById(prescriptionId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(prescriptions)
    .where(eq(prescriptions.id, prescriptionId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function getPrescriptionsByPatient(patientId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(prescriptions)
    .where(eq(prescriptions.patientId, patientId))
    .orderBy(desc(prescriptions.createdAt));
}

// ============================================================================
// INSURANCE QUERIES
// ============================================================================

export async function getInsuranceClaimById(claimId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(insuranceClaims)
    .where(eq(insuranceClaims.id, claimId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function getInsuranceClaimsByPatient(patientId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(insuranceClaims)
    .where(eq(insuranceClaims.patientId, patientId))
    .orderBy(desc(insuranceClaims.createdAt));
}

// ============================================================================
// BRANCH QUERIES
// ============================================================================

export async function getBranchById(branchId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(branches)
    .where(eq(branches.id, branchId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function getAllActiveBranches() {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(branches)
    .where(eq(branches.isActive, true))
    .orderBy(asc(branches.name));
}

// ============================================================================
// PRODUCT QUERIES
// ============================================================================

export async function getProductById(productId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function searchProducts(
  searchTerm: string,
  limit: number = 20,
  offset: number = 0
) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(products)
    .where(
      sql`${products.genericName} LIKE ${`%${searchTerm}%`} OR ${products.brandName} LIKE ${`%${searchTerm}%`}`
    )
    .limit(limit)
    .offset(offset);
}
