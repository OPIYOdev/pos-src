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

export async function createSaleItem(itemData: {
  saleId: number;
  productId: number;
  batchId: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(saleItems).values({
    saleId: itemData.saleId,
    productId: itemData.productId,
    batchId: itemData.batchId,
    quantity: itemData.quantity as any,
    unitPrice: itemData.unitPrice as any,
    totalPrice: itemData.totalPrice as any,
  } as any);
}

export async function deductInventoryBatch(
  batchId: number,
  quantityToDeduct: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .update(inventoryBatches)
    .set({
      quantityAvailable: sql`${inventoryBatches.quantityAvailable} - ${quantityToDeduct}`,
      updatedAt: new Date(),
    })
    .where(eq(inventoryBatches.id, batchId));
}

// ============================================================================
// AUDIT LOG QUERIES
// ============================================================================

export async function createPaymentMethod(paymentData: {
  saleId: number;
  methodType: "Cash" | "M-Pesa" | "Card" | "Insurance";
  amount: number;
  reference?: string;
  status: "pending" | "completed" | "failed";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(paymentMethods).values({
    saleId: paymentData.saleId,
    methodType: paymentData.methodType,
    amount: paymentData.amount as any,
    reference: paymentData.reference,
    status: paymentData.status,
  } as any);
}

export async function updateSaleStatus(saleId: number, status: "pending" | "completed" | "failed" | "refunded") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.update(sales).set({ paymentStatus: status, updatedAt: new Date() }).where(eq(sales.id, saleId));
}

export async function createGrn(grnData: {
  grnNumber: string;
  branchId: number;
  supplierId: number;
  invoiceNumber?: string;
  status: "pending" | "verified" | "rejected";
  verifiedBy?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(grn).values({
    grnNumber: grnData.grnNumber,
    branchId: grnData.branchId,
    supplierId: grnData.supplierId,
    invoiceNumber: grnData.invoiceNumber,
    status: grnData.status,
    verifiedBy: grnData.verifiedBy,
  } as any);
}

export async function createGrnItem(itemData: {
  grnId: number;
  productId: number;
  batchNumber: string;
  quantityOrdered: number;
  quantityReceived: number;
  expiryDate: string;
  costPrice: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(grnItems).values({
    grnId: itemData.grnId,
    productId: itemData.productId,
    batchNumber: itemData.batchNumber,
    quantityOrdered: itemData.quantityOrdered as any,
    quantityReceived: itemData.quantityReceived as any,
    expiryDate: itemData.expiryDate,
    costPrice: itemData.costPrice as any,
  } as any);
}

export async function createInventoryBatch(batchData: {
  branchId: number;
  productId: number;
  batchNumber: string;
  quantityAvailable: number;
  expiryDate: string;
  costPrice: number;
  sellingPrice: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(inventoryBatches).values({
    branchId: batchData.branchId,
    productId: batchData.productId,
    batchNumber: batchData.batchNumber,
    quantityAvailable: batchData.quantityAvailable as any,
    expiryDate: batchData.expiryDate,
    costPrice: batchData.costPrice as any,
    sellingPrice: batchData.sellingPrice as any,
  } as any);
}

export async function updateInventoryBatchQuantity(
  batchId: number,
  quantityChange: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .update(inventoryBatches)
    .set({
      quantityAvailable: sql`${inventoryBatches.quantityAvailable} + ${quantityChange}`,
      updatedAt: new Date(),
    })
    .where(eq(inventoryBatches.id, batchId));
}

export async function createInventoryTransaction(transactionData: {
  batchId: number;
  productId: number;
  branchId: number;
  transactionType: "GRN" | "SALE" | "ADJUSTMENT" | "TRANSFER_IN" | "TRANSFER_OUT";
  quantity: number;
  currentQuantity: number;
  reason?: string;
  referenceId?: number;
  userId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(inventoryTransactions).values({
    batchId: transactionData.batchId,
    productId: transactionData.productId,
    branchId: transactionData.branchId,
    transactionType: transactionData.transactionType,
    quantity: transactionData.quantity as any,
    currentQuantity: transactionData.currentQuantity as any,
    reason: transactionData.reason,
    referenceId: transactionData.referenceId,
    userId: transactionData.userId,
  } as any);
}

export async function getProductsBelowReorderLevel(branchId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({ product: products, totalAvailable: sql<number>`sum(${inventoryBatches.quantityAvailable})` })
    .from(products)
    .leftJoin(inventoryBatches, eq(products.id, inventoryBatches.productId))
    .where(eq(inventoryBatches.branchId, branchId))
    .groupBy(products.id)
    .having(sql`sum(${inventoryBatches.quantityAvailable}) < ${products.reorderLevel}`);
}

export async function getExpiringBatches(branchId: number, daysUntilExpiry: number) {
  const db = await getDb();
  if (!db) return [];

  const expiryDateThreshold = new Date();
  expiryDateThreshold.setDate(expiryDateThreshold.getDate() + daysUntilExpiry);

  return db
    .select()
    .from(inventoryBatches)
    .where(
      and(
        eq(inventoryBatches.branchId, branchId),
        lte(inventoryBatches.expiryDate, expiryDateThreshold),
        gte(inventoryBatches.quantityAvailable, 0)
      )
    )
    .orderBy(asc(inventoryBatches.expiryDate));
}

export async function getInventoryValuationData(branchId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      productId: products.id,
      productName: products.genericName,
      batchNumber: inventoryBatches.batchNumber,
      quantity: inventoryBatches.quantityAvailable,
      costPrice: inventoryBatches.costPrice,
      expiryDate: inventoryBatches.expiryDate,
    })
    .from(inventoryBatches)
    .innerJoin(products, eq(inventoryBatches.productId, products.id))
    .where(eq(inventoryBatches.branchId, branchId));
}

export async function getInventoryBatchById(batchId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(inventoryBatches)
    .where(eq(inventoryBatches.id, batchId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function createTransferRequest(requestData: {
  requestId: string;
  sourceBranchId: number;
  destinationBranchId: number;
  requestedBy: number;
  priority: "urgent" | "normal" | "low";
  reason: string;
  requiredByDate?: string;
  status: "pending_approval" | "approved" | "rejected" | "dispatched" | "received" | "completed" | "cancelled";
  totalEstimatedValue: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(transferRequests).values({
    requestId: requestData.requestId,
    sourceBranchId: requestData.sourceBranchId,
    destinationBranchId: requestData.destinationBranchId,
    requestedBy: requestData.requestedBy,
    priority: requestData.priority,
    reason: requestData.reason,
    requiredByDate: requestData.requiredByDate,
    status: requestData.status,
    totalEstimatedValue: requestData.totalEstimatedValue as any,
  } as any);
}

export async function createTransferRequestItem(itemData: {
  transferRequestId: number;
  productId: number;
  quantityRequested: number;
  quantityApproved: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(transferRequestItems).values({
    transferRequestId: itemData.transferRequestId,
    productId: itemData.productId,
    quantityRequested: itemData.quantityRequested as any,
    quantityApproved: itemData.quantityApproved as any,
  } as any);
}

export async function createTransferOrder(orderData: {
  transferRequestId: number;
  orderNumber: string;
  sourceBranchId: number;
  destinationBranchId: number;
  approvedBy: number;
  status: "created" | "dispatched" | "received" | "cancelled";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(transferOrders).values({
    transferRequestId: orderData.transferRequestId,
    orderNumber: orderData.orderNumber,
    sourceBranchId: orderData.sourceBranchId,
    destinationBranchId: orderData.destinationBranchId,
    approvedBy: orderData.approvedBy,
    status: orderData.status,
  } as any);
}

export async function createTransferOrderItem(itemData: {
  transferOrderId: number;
  productId: number;
  batchId: number;
  quantity: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(transferOrderItems).values({
    transferOrderId: itemData.transferOrderId,
    productId: itemData.productId,
    batchId: itemData.batchId,
    quantity: itemData.quantity as any,
  } as any);
}

export async function updateTransferRequestStatus(
  requestId: number,
  status: "pending_approval" | "approved" | "rejected" | "dispatched" | "received" | "completed" | "cancelled"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .update(transferRequests)
    .set({ status, updatedAt: new Date() })
    .where(eq(transferRequests.id, requestId));
}

export async function updateInventoryBatchReserved(
  batchId: number,
  quantityChange: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .update(inventoryBatches)
    .set({
      quantityReserved: sql`${inventoryBatches.quantityReserved} + ${quantityChange}`,
      updatedAt: new Date(),
    })
    .where(eq(inventoryBatches.id, batchId));
}

export async function updateTransferOrderStatus(
  orderId: number,
  status: "created" | "dispatched" | "received" | "cancelled"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .update(transferOrders)
    .set({ status, updatedAt: new Date() })
    .where(eq(transferOrders.id, orderId));
}

export async function createTransferCost(costData: {
  transferOrderId: number;
  transportCost: number;
  handlingFee: number;
  insuranceCost: number;
  totalCost: number;
  sourcePortion: number;
  destinationPortion: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(transferCosts).values({
    transferOrderId: costData.transferOrderId,
    transportCost: costData.transportCost as any,
    handlingFee: costData.handlingFee as any,
    insuranceCost: costData.insuranceCost as any,
    totalCost: costData.totalCost as any,
    sourcePortion: costData.sourcePortion as any,
    destinationPortion: costData.destinationPortion as any,
  } as any);
}

export async function getTransferOrderItemById(itemId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(transferOrderItems)
    .where(eq(transferOrderItems.id, itemId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function getTransferOrderDetails(orderId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(transferOrders)
    .leftJoin(transferOrderItems, eq(transferOrders.id, transferOrderItems.transferOrderId))
    .leftJoin(products, eq(transferOrderItems.productId, products.id))
    .where(eq(transferOrders.id, orderId));

  if (result.length === 0) return null;

  const order = result[0].transfer_orders;
  const items = result.map(row => ({
    ...row.transfer_order_items,
    product: row.products,
  }));

  return { ...order, items };
}

export async function getCompletedTransfersAsSource(branchId: number, month: number, year: number) {
  const db = await getDb();
  if (!db) return [];

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  return db
    .select()
    .from(transferOrders)
    .where(
      and(
        eq(transferOrders.sourceBranchId, branchId),
        eq(transferOrders.status, "completed"),
        gte(transferOrders.createdAt, startDate),
        lte(transferOrders.createdAt, endDate)
      )
    );
}

export async function getCompletedTransfersAsDestination(branchId: number, month: number, year: number) {
  const db = await getDb();
  if (!db) return [];

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  return db
    .select()
    .from(transferOrders)
    .where(
      and(
        eq(transferOrders.destinationBranchId, branchId),
        eq(transferOrders.status, "completed"),
        gte(transferOrders.createdAt, startDate),
        lte(transferOrders.createdAt, endDate)
      )
    );
}

export async function createInterBranchSettlement(settlementData: {
  branchId: number;
  settlementMonth: string;
  valueSent: number;
  valueReceived: number;
  netSettlement: number;
  status: "balanced" | "pending" | "settled";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(interBranchSettlements).values({
    branchId: settlementData.branchId,
    settlementMonth: settlementData.settlementMonth,
    valueSent: settlementData.valueSent as any,
    valueReceived: settlementData.valueReceived as any,
    netSettlement: settlementData.netSettlement as any,
    status: settlementData.status,
  } as any);
}

export async function createInsuranceClaim(claimData: {
  patientId: number;
  policyNumber: string;
  claimAmount: number;
  eligibleAmount: number;
  submittedBy: number;
  status: "pending" | "approved" | "rejected";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(insuranceClaims).values({
    patientId: claimData.patientId,
    policyNumber: claimData.policyNumber,
    claimAmount: claimData.claimAmount as any,
    eligibleAmount: claimData.eligibleAmount as any,
    submittedBy: claimData.submittedBy,
    status: claimData.status,
  } as any);
}

export async function updateInsuranceClaimStatus(
  claimId: number,
  status: "pending" | "approved" | "rejected"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .update(insuranceClaims)
    .set({ status, updatedAt: new Date() })
    .where(eq(insuranceClaims.id, claimId));
}

export async function createKRASubmission(submissionData: {
  invoiceId: number;
  branchId: number;
  amount: number;
  taxAmount: number;
  submittedBy: number;
  kraReference: string;
  status: "submitted" | "failed";
  message: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(kraSubmissions).values({
    invoiceId: submissionData.invoiceId,
    branchId: submissionData.branchId,
    amount: submissionData.amount as any,
    taxAmount: submissionData.taxAmount as any,
    submittedBy: submissionData.submittedBy,
    kraReference: submissionData.kraReference,
    status: submissionData.status,
    message: submissionData.message,
  } as any);
}

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
