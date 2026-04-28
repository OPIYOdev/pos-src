import {
  int,
  varchar,
  text,
  decimal,
  timestamp,
  boolean,
  mysqlEnum,
  mysqlTable,
  json,
  date,
  bigint,
  index,
  foreignKey,
  unique,
} from "drizzle-orm/mysql-core";

/**
 * CORE USER TABLE - Extended with pharmacy-specific roles
 */
export const users = mysqlTable(
  "users",
  {
    id: int("id").autoincrement().primaryKey(),
    openId: varchar("openId", { length: 64 }).notNull().unique(),
    name: text("name"),
    email: varchar("email", { length: 320 }).unique(),
    phone: varchar("phone", { length: 20 }),
    loginMethod: varchar("loginMethod", { length: 64 }),
    role: mysqlEnum("role", [
      "admin",
      "manager",
      "pharmacist",
      "cashier",
      "dispenser",
      "accountant",
      "claims_officer",
      "auditor",
    ])
      .default("cashier")
      .notNull(),
    branchId: int("branchId"),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  },
  (table) => ({
    roleIdx: index("idx_user_role").on(table.role),
    branchIdx: index("idx_user_branch").on(table.branchId),
  })
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * BRANCHES TABLE - Multi-branch support
 */
export const branches = mysqlTable(
  "branches",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull().unique(),
    region: varchar("region", { length: 100 }),
    managerId: int("managerId"),
    address: text("address"),
    phone: varchar("phone", { length: 20 }),
    email: varchar("email", { length: 320 }),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    managerIdx: index("idx_branch_manager").on(table.managerId),
  })
);

export type Branch = typeof branches.$inferSelect;
export type InsertBranch = typeof branches.$inferInsert;

/**
 * SUPPLIERS TABLE
 */
export const suppliers = mysqlTable(
  "suppliers",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    contactPerson: varchar("contactPerson", { length: 255 }),
    phone: varchar("phone", { length: 20 }),
    email: varchar("email", { length: 320 }),
    address: text("address"),
    paymentTerms: varchar("paymentTerms", { length: 100 }),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  }
);

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;

/**
 * PRODUCTS TABLE - Drugs and pharmacy items
 */
export const products = mysqlTable(
  "products",
  {
    id: int("id").autoincrement().primaryKey(),
    genericName: varchar("genericName", { length: 255 }).notNull().unique(),
    brandName: varchar("brandName", { length: 255 }),
    category: varchar("category", { length: 100 }),
    unitOfMeasure: varchar("unitOfMeasure", { length: 50 }),
    isControlled: boolean("isControlled").default(false).notNull(),
    requiresColdChain: boolean("requiresColdChain").default(false).notNull(),
    reorderLevel: int("reorderLevel").default(20).notNull(),
    reorderQuantity: int("reorderQuantity").default(100).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    categoryIdx: index("idx_product_category").on(table.category),
    controlledIdx: index("idx_product_controlled").on(table.isControlled),
  })
);

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * INVENTORY BATCHES TABLE - FEFO tracking
 */
export const inventoryBatches = mysqlTable(
  "inventory_batches",
  {
    id: int("id").autoincrement().primaryKey(),
    branchId: int("branchId").notNull(),
    productId: int("productId").notNull(),
    batchNumber: varchar("batchNumber", { length: 100 }).notNull(),
    quantityAvailable: decimal("quantityAvailable", { precision: 10, scale: 3 })
      .default("0")
      .notNull(),
    quantityReserved: decimal("quantityReserved", { precision: 10, scale: 3 })
      .default("0")
      .notNull(),
    expiryDate: date("expiryDate").notNull(),
    costPrice: decimal("costPrice", { precision: 12, scale: 2 }),
    sellingPrice: decimal("sellingPrice", { precision: 12, scale: 2 }),
    isQuarantined: boolean("isQuarantined").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    branchProductIdx: index("idx_batch_branch_product").on(
      table.branchId,
      table.productId
    ),
    expiryIdx: index("idx_batch_expiry").on(table.expiryDate),
    batchUnique: unique("unique_batch_per_branch").on(
      table.branchId,
      table.batchNumber
    ),
  })
);

export type InventoryBatch = typeof inventoryBatches.$inferSelect;
export type InsertInventoryBatch = typeof inventoryBatches.$inferInsert;

/**
 * CUSTOMERS TABLE - Credit and transaction management
 */
export const customers = mysqlTable(
  "customers",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 320 }),
    phone: varchar("phone", { length: 20 }),
    idNumber: varchar("idNumber", { length: 50 }).unique(),
    creditLimit: decimal("creditLimit", { precision: 15, scale: 2 })
      .default("0")
      .notNull(),
    creditUsed: decimal("creditUsed", { precision: 15, scale: 2 })
      .default("0")
      .notNull(),
    loyaltyPoints: int("loyaltyPoints").default(0).notNull(),
    allergies: text("allergies"),
    chronicConditions: text("chronicConditions"),
    status: mysqlEnum("status", ["active", "inactive", "suspended"])
      .default("active")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    emailIdx: index("idx_customer_email").on(table.email),
    phoneIdx: index("idx_customer_phone").on(table.phone),
  })
);

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

/**
 * SALES TABLE - POS transactions
 */
export const sales = mysqlTable(
  "sales",
  {
    id: int("id").autoincrement().primaryKey(),
    saleNumber: varchar("saleNumber", { length: 50 }).notNull().unique(),
    branchId: int("branchId").notNull(),
    customerId: int("customerId"),
    userId: int("userId").notNull(),
    totalAmount: decimal("totalAmount", { precision: 15, scale: 2 }).notNull(),
    discountAmount: decimal("discountAmount", { precision: 15, scale: 2 })
      .default("0")
      .notNull(),
    netAmount: decimal("netAmount", { precision: 15, scale: 2 }).notNull(),
    paymentStatus: mysqlEnum("paymentStatus", [
      "pending",
      "completed",
      "failed",
      "refunded",
    ])
      .default("pending")
      .notNull(),
    kraReceiptNumber: varchar("kraReceiptNumber", { length: 100 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    branchIdx: index("idx_sale_branch").on(table.branchId),
    customerIdx: index("idx_sale_customer").on(table.customerId),
    createdIdx: index("idx_sale_created").on(table.createdAt),
  })
);

export type Sale = typeof sales.$inferSelect;
export type InsertSale = typeof sales.$inferInsert;

/**
 * SALE ITEMS TABLE
 */
export const saleItems = mysqlTable(
  "sale_items",
  {
    id: int("id").autoincrement().primaryKey(),
    saleId: int("saleId").notNull(),
    productId: int("productId").notNull(),
    batchId: int("batchId").notNull(),
    quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
    unitPrice: decimal("unitPrice", { precision: 12, scale: 2 }).notNull(),
    totalPrice: decimal("totalPrice", { precision: 15, scale: 2 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    saleIdx: index("idx_saleitem_sale").on(table.saleId),
  })
);

export type SaleItem = typeof saleItems.$inferSelect;
export type InsertSaleItem = typeof saleItems.$inferInsert;

/**
 * PAYMENT METHODS TABLE - Split payment support
 */
export const paymentMethods = mysqlTable(
  "payment_methods",
  {
    id: int("id").autoincrement().primaryKey(),
    saleId: int("saleId").notNull(),
    methodType: mysqlEnum("methodType", ["Cash", "M-Pesa", "Card", "Insurance"])
      .notNull(),
    amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
    reference: varchar("reference", { length: 100 }),
    status: mysqlEnum("status", ["pending", "completed", "failed"])
      .default("pending")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    saleIdx: index("idx_payment_sale").on(table.saleId),
  })
);

export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertPaymentMethod = typeof paymentMethods.$inferInsert;

/**
 * GRN TABLE - Goods Received Notes
 */
export const grn = mysqlTable(
  "grn",
  {
    id: int("id").autoincrement().primaryKey(),
    grnNumber: varchar("grnNumber", { length: 50 }).notNull().unique(),
    branchId: int("branchId").notNull(),
    supplierId: int("supplierId").notNull(),
    invoiceNumber: varchar("invoiceNumber", { length: 100 }),
    status: mysqlEnum("status", ["pending", "verified", "rejected"])
      .default("pending")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    verifiedAt: timestamp("verifiedAt"),
    verifiedBy: int("verifiedBy"),
  },
  (table) => ({
    branchIdx: index("idx_grn_branch").on(table.branchId),
    createdIdx: index("idx_grn_created").on(table.createdAt),
  })
);

export type GRN = typeof grn.$inferSelect;
export type InsertGRN = typeof grn.$inferInsert;

/**
 * GRN ITEMS TABLE
 */
export const grnItems = mysqlTable(
  "grn_items",
  {
    id: int("id").autoincrement().primaryKey(),
    grnId: int("grnId").notNull(),
    productId: int("productId").notNull(),
    batchNumber: varchar("batchNumber", { length: 100 }).notNull(),
    quantityOrdered: decimal("quantityOrdered", { precision: 10, scale: 3 })
      .notNull(),
    quantityReceived: decimal("quantityReceived", { precision: 10, scale: 3 })
      .notNull(),
    expiryDate: date("expiryDate").notNull(),
    costPrice: decimal("costPrice", { precision: 12, scale: 2 }).notNull(),
    tolerancePercentage: decimal("tolerancePercentage", { precision: 5, scale: 2 })
      .default("5")
      .notNull(),
    discrepancyNotes: text("discrepancyNotes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    grnIdx: index("idx_grnitem_grn").on(table.grnId),
  })
);

export type GRNItem = typeof grnItems.$inferSelect;
export type InsertGRNItem = typeof grnItems.$inferInsert;

/**
 * PRESCRIPTIONS TABLE
 */
export const prescriptions = mysqlTable(
  "prescriptions",
  {
    id: int("id").autoincrement().primaryKey(),
    prescriptionNumber: varchar("prescriptionNumber", { length: 50 })
      .notNull()
      .unique(),
    patientId: int("patientId").notNull(),
    prescriberId: int("prescriberId").notNull(),
    status: mysqlEnum("status", [
      "active",
      "partially_dispensed",
      "dispensed",
      "expired",
      "cancelled",
    ])
      .default("active")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    expiryDate: date("expiryDate"),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    patientIdx: index("idx_prescription_patient").on(table.patientId),
    statusIdx: index("idx_prescription_status").on(table.status),
  })
);

export type Prescription = typeof prescriptions.$inferSelect;
export type InsertPrescription = typeof prescriptions.$inferInsert;

/**
 * PRESCRIPTION ITEMS TABLE
 */
export const prescriptionItems = mysqlTable(
  "prescription_items",
  {
    id: int("id").autoincrement().primaryKey(),
    prescriptionId: int("prescriptionId").notNull(),
    productId: int("productId").notNull(),
    quantityPrescribed: decimal("quantityPrescribed", { precision: 10, scale: 3 })
      .notNull(),
    quantityDispensed: decimal("quantityDispensed", { precision: 10, scale: 3 })
      .default("0")
      .notNull(),
    dosage: varchar("dosage", { length: 100 }),
    frequency: varchar("frequency", { length: 100 }),
    duration: varchar("duration", { length: 100 }),
    instructions: text("instructions"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    prescriptionIdx: index("idx_prescitem_prescription").on(table.prescriptionId),
  })
);

export type PrescriptionItem = typeof prescriptionItems.$inferSelect;
export type InsertPrescriptionItem = typeof prescriptionItems.$inferInsert;

/**
 * DRUG INTERACTIONS TABLE
 */
export const drugInteractions = mysqlTable(
  "drug_interactions",
  {
    id: int("id").autoincrement().primaryKey(),
    drug1Id: int("drug1Id").notNull(),
    drug2Id: int("drug2Id").notNull(),
    severity: mysqlEnum("severity", ["mild", "moderate", "severe"])
      .notNull(),
    description: text("description"),
    recommendation: text("recommendation"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    drug1Idx: index("idx_interaction_drug1").on(table.drug1Id),
    drug2Idx: index("idx_interaction_drug2").on(table.drug2Id),
  })
);

export type DrugInteraction = typeof drugInteractions.$inferSelect;
export type InsertDrugInteraction = typeof drugInteractions.$inferInsert;

/**
 * INSURANCE PROVIDERS TABLE
 */
export const insuranceProviders = mysqlTable(
  "insurance_providers",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    contactPerson: varchar("contactPerson", { length: 255 }),
    phone: varchar("phone", { length: 20 }),
    email: varchar("email", { length: 320 }),
    apiEndpoint: varchar("apiEndpoint", { length: 500 }),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  }
);

export type InsuranceProvider = typeof insuranceProviders.$inferSelect;
export type InsertInsuranceProvider = typeof insuranceProviders.$inferInsert;

/**
 * INSURANCE CLAIMS TABLE
 */
export const insuranceClaims = mysqlTable(
  "insurance_claims",
  {
    id: int("id").autoincrement().primaryKey(),
    claimNumber: varchar("claimNumber", { length: 50 }).notNull().unique(),
    patientId: int("patientId").notNull(),
    providerId: int("providerId").notNull(),
    saleId: int("saleId"),
    claimAmount: decimal("claimAmount", { precision: 15, scale: 2 }).notNull(),
    approvedAmount: decimal("approvedAmount", { precision: 15, scale: 2 })
      .default("0")
      .notNull(),
    copaymentAmount: decimal("copaymentAmount", { precision: 15, scale: 2 })
      .default("0")
      .notNull(),
    status: mysqlEnum("status", [
      "pending",
      "pre_authorized",
      "approved",
      "rejected",
      "paid",
    ])
      .default("pending")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    patientIdx: index("idx_claim_patient").on(table.patientId),
    statusIdx: index("idx_claim_status").on(table.status),
  })
);

export type InsuranceClaim = typeof insuranceClaims.$inferSelect;
export type InsertInsuranceClaim = typeof insuranceClaims.$inferInsert;

/**
 * TRANSFER REQUESTS TABLE
 */
export const transferRequests = mysqlTable(
  "transfer_requests",
  {
    id: int("id").autoincrement().primaryKey(),
    requestId: varchar("requestId", { length: 50 }).notNull().unique(),
    sourceBranchId: int("sourceBranchId").notNull(),
    destinationBranchId: int("destinationBranchId").notNull(),
    requestedBy: int("requestedBy").notNull(),
    approvedBy: int("approvedBy"),
    priority: mysqlEnum("priority", ["urgent", "normal", "low"])
      .default("normal")
      .notNull(),
    status: mysqlEnum("status", [
      "draft",
      "pending_approval",
      "approved",
      "rejected",
      "processing",
      "completed",
      "cancelled",
    ])
      .default("draft")
      .notNull(),
    totalItems: int("totalItems").notNull(),
    totalEstimatedValue: decimal("totalEstimatedValue", { precision: 15, scale: 2 })
      .notNull(),
    requiredByDate: date("requiredByDate"),
    reason: text("reason"),
    allowPartial: boolean("allowPartial").default(false).notNull(),
    rejectionReason: text("rejectionReason"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    approvedAt: timestamp("approvedAt"),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    sourceBranchIdx: index("idx_treq_source").on(table.sourceBranchId),
    destBranchIdx: index("idx_treq_dest").on(table.destinationBranchId),
    statusIdx: index("idx_treq_status").on(table.status),
  })
);

export type TransferRequest = typeof transferRequests.$inferSelect;
export type InsertTransferRequest = typeof transferRequests.$inferInsert;

/**
 * TRANSFER REQUEST ITEMS TABLE
 */
export const transferRequestItems = mysqlTable(
  "transfer_request_items",
  {
    id: int("id").autoincrement().primaryKey(),
    transferRequestId: int("transferRequestId").notNull(),
    productId: int("productId").notNull(),
    quantityRequested: decimal("quantityRequested", { precision: 10, scale: 3 })
      .notNull(),
    quantityApproved: decimal("quantityApproved", { precision: 10, scale: 3 })
      .default("0")
      .notNull(),
    batchPreference: mysqlEnum("batchPreference", ["FEFO", "LIFO", "any"])
      .default("FEFO")
      .notNull(),
    status: mysqlEnum("status", [
      "pending",
      "approved",
      "partially_approved",
      "rejected",
    ])
      .default("pending")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    transferReqIdx: index("idx_treqitem_treq").on(table.transferRequestId),
  })
);

export type TransferRequestItem = typeof transferRequestItems.$inferSelect;
export type InsertTransferRequestItem = typeof transferRequestItems.$inferInsert;

/**
 * TRANSFER ORDERS TABLE
 */
export const transferOrders = mysqlTable(
  "transfer_orders",
  {
    id: int("id").autoincrement().primaryKey(),
    orderNumber: varchar("orderNumber", { length: 50 }).notNull().unique(),
    transferRequestId: int("transferRequestId"),
    sourceBranchId: int("sourceBranchId").notNull(),
    destinationBranchId: int("destinationBranchId").notNull(),
    createdBy: int("createdBy").notNull(),
    status: mysqlEnum("status", [
      "created",
      "picking",
      "picked",
      "dispatched",
      "in_transit",
      "received",
      "verifying",
      "completed",
      "cancelled",
      "disputed",
    ])
      .default("created")
      .notNull(),
    priority: mysqlEnum("priority", ["urgent", "normal", "low"])
      .default("normal")
      .notNull(),
    expectedDeliveryDate: date("expectedDeliveryDate"),
    dispatchedAt: timestamp("dispatchedAt"),
    receivedAt: timestamp("receivedAt"),
    receivedBy: int("receivedBy"),
    completedAt: timestamp("completedAt"),
    waybillNumber: varchar("waybillNumber", { length: 100 }),
    transporterDetails: json("transporterDetails"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    sourceBranchIdx: index("idx_torder_source").on(table.sourceBranchId),
    destBranchIdx: index("idx_torder_dest").on(table.destinationBranchId),
    statusIdx: index("idx_torder_status").on(table.status),
  })
);

export type TransferOrder = typeof transferOrders.$inferSelect;
export type InsertTransferOrder = typeof transferOrders.$inferInsert;

/**
 * TRANSFER ORDER ITEMS TABLE
 */
export const transferOrderItems = mysqlTable(
  "transfer_order_items",
  {
    id: int("id").autoincrement().primaryKey(),
    transferOrderId: int("transferOrderId").notNull(),
    productId: int("productId").notNull(),
    batchId: int("batchId").notNull(),
    quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
    unitCost: decimal("unitCost", { precision: 12, scale: 2 }).notNull(),
    totalCost: decimal("totalCost", { precision: 15, scale: 2 }).notNull(),
    status: mysqlEnum("status", [
      "pending",
      "picked",
      "dispatched",
      "received",
      "verified",
    ])
      .default("pending")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    transferOrderIdx: index("idx_torderitem_torder").on(table.transferOrderId),
  })
);

export type TransferOrderItem = typeof transferOrderItems.$inferSelect;
export type InsertTransferOrderItem = typeof transferOrderItems.$inferInsert;

/**
 * TRANSFER COSTS TABLE
 */
export const transferCosts = mysqlTable(
  "transfer_costs",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    transferOrderId: int("transferOrderId").notNull(),
    costType: mysqlEnum("costType", [
      "transport",
      "handling",
      "insurance",
      "storage",
      "other",
    ]).notNull(),
    amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).default("KES").notNull(),
    paidByBranchId: int("paidByBranchId"),
    allocatedToBranchId: int("allocatedToBranchId"),
    invoiceNumber: varchar("invoiceNumber", { length: 100 }),
    description: text("description"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    transferOrderIdx: index("idx_tcost_torder").on(table.transferOrderId),
  })
);

export type TransferCost = typeof transferCosts.$inferSelect;
export type InsertTransferCost = typeof transferCosts.$inferInsert;

/**
 * TRANSFER DISPUTES TABLE
 */
export const transferDisputes = mysqlTable(
  "transfer_disputes",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    transferOrderId: int("transferOrderId").notNull(),
    transferItemId: int("transferItemId"),
    disputeType: mysqlEnum("disputeType", [
      "quantity_short",
      "quantity_excess",
      "damaged",
      "expired",
      "wrong_product",
    ]).notNull(),
    description: text("description"),
    expectedQuantity: decimal("expectedQuantity", { precision: 10, scale: 2 }),
    receivedQuantity: decimal("receivedQuantity", { precision: 10, scale: 2 }),
    damagedQuantity: decimal("damagedQuantity", { precision: 10, scale: 2 }),
    evidencePhotos: json("evidencePhotos"),
    resolutionStatus: mysqlEnum("resolutionStatus", [
      "open",
      "in_review",
      "resolved",
      "escalated",
      "closed",
    ])
      .default("open")
      .notNull(),
    resolutionAction: text("resolutionAction"),
    creditNoteIssued: boolean("creditNoteIssued").default(false).notNull(),
    creditNoteNumber: varchar("creditNoteNumber", { length: 100 }),
    resolvedBy: int("resolvedBy"),
    resolvedAt: timestamp("resolvedAt"),
    escalatedTo: int("escalatedTo"),
    escalatedAt: timestamp("escalatedAt"),
    createdBy: int("createdBy").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    transferOrderIdx: index("idx_tdispute_torder").on(table.transferOrderId),
  })
);

export type TransferDispute = typeof transferDisputes.$inferSelect;
export type InsertTransferDispute = typeof transferDisputes.$inferInsert;

/**
 * INTER-BRANCH SETTLEMENTS TABLE
 */
export const interBranchSettlements = mysqlTable(
  "inter_branch_settlements",
  {
    id: int("id").autoincrement().primaryKey(),
    branchId: int("branchId").notNull(),
    settlementMonth: date("settlementMonth").notNull(),
    valueSent: decimal("valueSent", { precision: 15, scale: 2 })
      .default("0")
      .notNull(),
    valueReceived: decimal("valueReceived", { precision: 15, scale: 2 })
      .default("0")
      .notNull(),
    netSettlement: decimal("netSettlement", { precision: 15, scale: 2 })
      .default("0")
      .notNull(),
    status: mysqlEnum("status", [
      "owed_to_corporate",
      "owed_from_corporate",
      "balanced",
    ])
      .default("balanced")
      .notNull(),
    generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  },
  (table) => ({
    branchMonthUnique: unique("unique_branch_month").on(
      table.branchId,
      table.settlementMonth
    ),
  })
);

export type InterBranchSettlement = typeof interBranchSettlements.$inferSelect;
export type InsertInterBranchSettlement =
  typeof interBranchSettlements.$inferInsert;

/**
 * CASH RECONCILIATION TABLE
 */
export const cashReconciliation = mysqlTable(
  "cash_reconciliation",
  {
    id: int("id").autoincrement().primaryKey(),
    branchId: int("branchId").notNull(),
    reconciliationDate: date("reconciliationDate").notNull(),
    expectedAmount: decimal("expectedAmount", { precision: 15, scale: 2 })
      .notNull(),
    actualAmount: decimal("actualAmount", { precision: 15, scale: 2 }).notNull(),
    variance: decimal("variance", { precision: 15, scale: 2 }).notNull(),
    variancePercentage: decimal("variancePercentage", { precision: 5, scale: 2 })
      .notNull(),
    status: mysqlEnum("status", ["balanced", "variance", "disputed"])
      .default("balanced")
      .notNull(),
    notes: text("notes"),
    reconciledBy: int("reconciledBy").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    branchDateIdx: index("idx_cashrecon_branch_date").on(
      table.branchId,
      table.reconciliationDate
    ),
  })
);

export type CashReconciliation = typeof cashReconciliation.$inferSelect;
export type InsertCashReconciliation = typeof cashReconciliation.$inferInsert;

/**
 * AUDIT LOG TABLE - Comprehensive audit trail
 */
export const auditLogs = mysqlTable(
  "audit_logs",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    action: varchar("action", { length: 100 }).notNull(),
    module: varchar("module", { length: 100 }).notNull(),
    entityType: varchar("entityType", { length: 100 }).notNull(),
    entityId: varchar("entityId", { length: 100 }).notNull(),
    oldValues: json("oldValues"),
    newValues: json("newValues"),
    ipAddress: varchar("ipAddress", { length: 45 }),
    userAgent: text("userAgent"),
    status: mysqlEnum("status", ["success", "failure"]).default("success").notNull(),
    errorMessage: text("errorMessage"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("idx_audit_user").on(table.userId),
    moduleIdx: index("idx_audit_module").on(table.module),
    createdIdx: index("idx_audit_created").on(table.createdAt),
  })
);

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/**
 * FINANCIAL REPORTS TABLE
 */
export const financialReports = mysqlTable(
  "financial_reports",
  {
    id: int("id").autoincrement().primaryKey(),
    branchId: int("branchId").notNull(),
    reportType: mysqlEnum("reportType", [
      "daily_sales",
      "monthly_pl",
      "kra_etims",
      "inventory_valuation",
      "cash_flow",
    ]).notNull(),
    reportPeriod: date("reportPeriod").notNull(),
    totalSales: decimal("totalSales", { precision: 15, scale: 2 })
      .default("0")
      .notNull(),
    totalCogs: decimal("totalCogs", { precision: 15, scale: 2 })
      .default("0")
      .notNull(),
    totalExpenses: decimal("totalExpenses", { precision: 15, scale: 2 })
      .default("0")
      .notNull(),
    netProfit: decimal("netProfit", { precision: 15, scale: 2 })
      .default("0")
      .notNull(),
    kraCompliant: boolean("kraCompliant").default(false).notNull(),
    reportData: json("reportData"),
    generatedBy: int("generatedBy").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    branchPeriodIdx: index("idx_report_branch_period").on(
      table.branchId,
      table.reportPeriod
    ),
  })
);

export type FinancialReport = typeof financialReports.$inferSelect;
export type InsertFinancialReport = typeof financialReports.$inferInsert;


/**
 * INVENTORY TRANSACTIONS TABLE - Track all inventory movements
 */
export const inventoryTransactions = mysqlTable(
  "inventory_transactions",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    branchId: int("branchId").notNull(),
    batchId: int("batchId").notNull(),
    transactionType: mysqlEnum("transactionType", [
      "received",
      "sold",
      "transferred_out",
      "transferred_in",
      "adjustment",
      "damaged",
      "expired",
    ]).notNull(),
    quantityChange: decimal("quantityChange", { precision: 10, scale: 3 })
      .notNull(),
    reference: varchar("reference", { length: 100 }),
    createdBy: int("createdBy").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    branchIdx: index("idx_invtrans_branch").on(table.branchId),
    batchIdx: index("idx_invtrans_batch").on(table.batchId),
    typeIdx: index("idx_invtrans_type").on(table.transactionType),
  })
);

export type InventoryTransaction = typeof inventoryTransactions.$inferSelect;
export type InsertInventoryTransaction =
  typeof inventoryTransactions.$inferInsert;

/**
 * INSURANCE CLAIM ITEMS TABLE - Line items for insurance claims
 */
export const insuranceClaimItems = mysqlTable(
  "insurance_claim_items",
  {
    id: int("id").autoincrement().primaryKey(),
    claimId: int("claimId").notNull(),
    productId: int("productId").notNull(),
    quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
    unitPrice: decimal("unitPrice", { precision: 12, scale: 2 }).notNull(),
    totalPrice: decimal("totalPrice", { precision: 15, scale: 2 }).notNull(),
    copaymentAmount: decimal("copaymentAmount", { precision: 15, scale: 2 })
      .default("0")
      .notNull(),
    approvedAmount: decimal("approvedAmount", { precision: 15, scale: 2 })
      .default("0")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    claimIdx: index("idx_claimitem_claim").on(table.claimId),
  })
);

export type InsuranceClaimItem = typeof insuranceClaimItems.$inferSelect;
export type InsertInsuranceClaimItem =
  typeof insuranceClaimItems.$inferInsert;
