import { Timestamp } from "firebase/firestore";

// ─── Auth & Roles ────────────────────────────────────────────────────────────

export type UserRole =
  | "super_admin"
  | "management"
  | "hr_admin"
  | "finance"
  | "project_manager"
  | "storekeeper"
  | "technician"
  | "sales";

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  employeeId?: string;
  isActive: boolean;
  // Optional explicit allow-list of module ids the user can access. When
  // present (even as an empty array), this overrides the role-based defaults
  // in canViewModule. When null/undefined, the role's defaults apply.
  pagePermissions?: string[] | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Company ─────────────────────────────────────────────────────────────────

export interface CompanySettings {
  id: string;
  name: string;
  logo?: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  trn: string;
  currency: string;
  vatPercentage: number;
  invoicePrefix: string;
  quotationPrefix: string;
  poPrefix: string;
  financialYearStart: string;
  updatedAt: Timestamp;
}

// ─── Employee ────────────────────────────────────────────────────────────────

export type EmploymentType = "full_time" | "part_time" | "contract" | "intern";
export type EmployeeStatus = "active" | "inactive" | "on_leave" | "terminated";
export type Gender = "male" | "female" | "other";

export interface Employee {
  id: string;
  employeeCode: string;
  fullName: string;
  profileImage?: string;
  gender: Gender;
  dateOfBirth?: string;
  nationality?: string;
  maritalStatus?: string;
  phone: string;
  email: string;
  address?: string;
  departmentId?: string;
  departmentName?: string;
  designationId?: string;
  designationName?: string;
  reportingManagerId?: string;
  employmentType: EmploymentType;
  joiningDate: string;
  probationEndDate?: string;
  workLocation?: string;
  status: EmployeeStatus;
  basicSalary?: number;
  allowances?: number;
  overtimeEligible?: boolean;
  bankName?: string;
  iban?: string;
  accountNumber?: string;
  passportNumber?: string;
  passportExpiry?: string;
  visaNumber?: string;
  visaExpiry?: string;
  emiratesIdNumber?: string;
  emiratesIdExpiry?: string;
  labourCardNumber?: string;
  labourCardExpiry?: string;
  insuranceExpiry?: string;
  drivingLicenseNumber?: string;
  drivingLicenseExpiry?: string;
  userId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Leave ───────────────────────────────────────────────────────────────────

export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";
export type LeaveType = "annual" | "sick" | "emergency" | "unpaid" | "half_day";

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  attachment?: string;
  status: LeaveStatus;
  approverId?: string;
  approverName?: string;
  approvalComments?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface LeaveBalance {
  id: string;
  employeeId: string;
  year: number;
  annual: number;
  sick: number;
  emergency: number;
  unpaid: number;
  annualUsed: number;
  sickUsed: number;
  emergencyUsed: number;
  unpaidUsed: number;
}

// ─── Attendance ───────────────────────────────────────────────────────────────

export type AttendanceStatus =
  | "present"
  | "absent"
  | "late"
  | "half_day"
  | "on_leave"
  | "weekend"
  | "holiday";

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: AttendanceStatus;
  overtimeHours?: number;
  notes?: string;
  locationLat?: number;
  locationLng?: number;
  createdAt: Timestamp;
}

// ─── CRM ─────────────────────────────────────────────────────────────────────

export type ClientType = "company" | "individual" | "government";
export type ClientStatus = "active" | "inactive" | "prospect";
export type LeadStage =
  | "new"
  | "contacted"
  | "site_survey"
  | "proposal_sent"
  | "negotiation"
  | "won"
  | "lost";

export interface Client {
  id: string;
  clientCode: string;
  companyName: string;
  clientType: ClientType;
  trn?: string;
  email?: string;
  phone?: string;
  website?: string;
  billingAddress?: string;
  siteAddress?: string;
  paymentTerms?: string;
  status: ClientStatus;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ClientContact {
  id: string;
  clientId: string;
  name: string;
  designation?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  isPrimaryContact: boolean;
  createdAt: Timestamp;
}

// ─── Quotation ────────────────────────────────────────────────────────────────

export type QuotationStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "sent"
  | "accepted"
  | "declined"
  | "expired"
  | "cancelled";

export type ItemType = "inventory" | "service" | "labour" | "custom";

export interface QuotationItem {
  id: string;
  itemType: ItemType;
  inventoryItemId?: string;
  itemName: string;
  description?: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  costPrice?: number;
  discount?: number;
  vatPercentage: number;
  total: number;
  marginAmount?: number;
  marginPercentage?: number;
}

export interface QuotationResourceItem {
  id: string;
  resourceType: string;
  description?: string;
  quantity: number;
  unitCost: number;
  sellingPrice: number;
  total: number;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  clientId: string;
  clientName: string;
  quotationDate: string;
  validUntil: string;
  items: QuotationItem[];
  resourceItems: QuotationResourceItem[];
  subtotal: number;
  materialTotal: number;
  resourceCostTotal: number;
  discount: number;
  vatAmount: number;
  grandTotal: number;
  estimatedProfit?: number;
  marginPercentage?: number;
  status: QuotationStatus;
  notes?: string;
  terms?: string;
  createdBy: string;
  approvedBy?: string;
  projectId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Invoice ──────────────────────────────────────────────────────────────────

export type InvoiceStatus =
  | "draft"
  | "sent"
  | "partially_paid"
  | "paid"
  | "overdue"
  | "cancelled";

export type InvoiceType =
  | "tax_invoice"
  | "proforma"
  | "advance"
  | "final"
  | "credit_note";

export type PaymentMethod =
  | "bank_transfer"
  | "cash"
  | "cheque"
  | "card"
  | "online";

export interface InvoiceItem {
  id: string;
  itemName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  vatPercentage: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  invoiceDate: string;
  dueDate: string;
  invoiceType: InvoiceType;
  relatedQuotationId?: string;
  relatedProjectId?: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  vatAmount: number;
  grandTotal: number;
  paidAmount: number;
  balanceAmount: number;
  status: InvoiceStatus;
  notes?: string;
  terms?: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Payment {
  id: string;
  invoiceId: string;
  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
  attachment?: string;
  createdBy: string;
  createdAt: Timestamp;
}

// ─── Project ──────────────────────────────────────────────────────────────────

export type ProjectStatus =
  | "new"
  | "scheduled"
  | "material_assigned"
  | "in_progress"
  | "on_hold"
  | "completed"
  | "invoiced"
  | "closed";

export type ProjectType =
  | "cctv"
  | "it_support"
  | "networking"
  | "wifi"
  | "amc"
  | "smart_home"
  | "server_rack"
  | "access_control"
  | "maintenance"
  | "other";

export interface Project {
  id: string;
  projectCode: string;
  projectName: string;
  projectType: ProjectType;
  clientId: string;
  clientName: string;
  siteAddress?: string;
  contactPerson?: string;
  projectManagerId?: string;
  projectManagerName?: string;
  assignedTechnicians: string[];
  startDate?: string;
  expectedEndDate?: string;
  actualEndDate?: string;
  quotationId?: string;
  invoiceId?: string;
  projectValue?: number;
  status: ProjectStatus;
  notes?: string;
  materialCost?: number;
  labourCost?: number;
  expenses?: number;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Task ─────────────────────────────────────────────────────────────────────

export type TaskStatus =
  | "pending"
  | "assigned"
  | "in_progress"
  | "completed"
  | "approved"
  | "rework_required";

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  taskTitle: string;
  projectId?: string;
  projectName?: string;
  assignedTo?: string;
  assignedToName?: string;
  priority: TaskPriority;
  dueDate?: string;
  description?: string;
  status: TaskStatus;
  completionNotes?: string;
  approvedBy?: string;
  checklistItems?: ChecklistItem[];
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

// ─── Inventory ────────────────────────────────────────────────────────────────

export type StockMovementType =
  | "purchase_received"
  | "issued_to_project"
  | "returned_from_project"
  | "damaged"
  | "lost"
  | "adjustment";

export type InventoryItemStatus = "active" | "inactive" | "discontinued";

export interface InventoryItem {
  id: string;
  itemCode: string;
  itemName: string;
  categoryId?: string;
  categoryName?: string;
  brand?: string;
  model?: string;
  sku?: string;
  barcode?: string;
  serialNumberRequired?: boolean;
  supplierId?: string;
  supplierName?: string;
  unitCost: number;
  sellingPrice: number;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  minimumStockLevel: number;
  warrantyPeriod?: string;
  status: InventoryItemStatus;
  description?: string;
  imageUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface StockMovement {
  id: string;
  itemId: string;
  itemName: string;
  movementType: StockMovementType;
  quantity: number;
  fromLocation?: string;
  toLocation?: string;
  relatedProjectId?: string;
  relatedProjectName?: string;
  relatedPurchaseOrderId?: string;
  notes?: string;
  createdBy: string;
  createdAt: Timestamp;
}

// ─── Purchase ─────────────────────────────────────────────────────────────────

export type PurchaseRequestStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "ordered"
  | "received";
export type PurchaseOrderStatus =
  | "draft"
  | "sent"
  | "confirmed"
  | "partially_received"
  | "received"
  | "cancelled";

export interface PurchaseRequestItem {
  id: string;
  itemName: string;
  description?: string;
  quantity: number;
  unit?: string;
  estimatedPrice?: number;
}

export interface PurchaseRequest {
  id: string;
  requestNumber: string;
  requestedBy: string;
  requestedByName: string;
  departmentId?: string;
  projectId?: string;
  projectName?: string;
  items: PurchaseRequestItem[];
  priority: "low" | "medium" | "high" | "urgent";
  reason?: string;
  status: PurchaseRequestStatus;
  approverId?: string;
  approverName?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Supplier ────────────────────────────────────────────────────────────────

export interface Supplier {
  id: string;
  supplierCode: string;
  companyName: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  trn?: string;
  paymentTerms?: string;
  productCategories?: string[];
  status: "active" | "inactive";
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Petty Cash ───────────────────────────────────────────────────────────────

export type PettyCashStatus =
  | "given"
  | "pending_settlement"
  | "submitted"
  | "approved"
  | "settled"
  | "rejected";

export interface PettyCashTransaction {
  id: string;
  transactionNumber: string;
  employeeId: string;
  employeeName: string;
  projectId?: string;
  projectName?: string;
  taskId?: string;
  amountGiven: number;
  amountSpent?: number;
  amountReturned?: number;
  expenseCategory: string;
  receipt?: string;
  notes?: string;
  status: PettyCashStatus;
  approvedBy?: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Expense ─────────────────────────────────────────────────────────────────

export type ExpenseStatus = "draft" | "pending" | "approved" | "rejected" | "paid";

export interface Expense {
  id: string;
  expenseNumber: string;
  description: string;
  category: string;
  vendorId?: string;
  vendorName?: string;
  projectId?: string;
  projectName?: string;
  amount: number;
  vatAmount?: number;
  totalAmount: number;
  paymentMethod?: PaymentMethod;
  expenseDate: string;
  receipt?: string;
  status: ExpenseStatus;
  approvedBy?: string;
  notes?: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── AMC ─────────────────────────────────────────────────────────────────────

export type AMCStatus = "active" | "expired" | "cancelled" | "pending_renewal";
export type ServiceFrequency = "monthly" | "quarterly" | "bi_annual" | "annual";

export interface AMCContract {
  id: string;
  contractNumber: string;
  clientId: string;
  clientName: string;
  projectId?: string;
  siteAddress?: string;
  contractStartDate: string;
  contractEndDate: string;
  contractValue: number;
  serviceFrequency: ServiceFrequency;
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  renewalStatus?: string;
  status: AMCStatus;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Notification ────────────────────────────────────────────────────────────

export type NotificationPriority = "low" | "medium" | "high";
export type NotificationType =
  | "leave_request"
  | "leave_decision"
  | "quotation_approval"
  | "invoice_overdue"
  | "low_stock"
  | "purchase_request"
  | "project_update"
  | "task_assigned"
  | "task_completed"
  | "petty_cash_approval"
  | "amc_expiring"
  | "document_expiring"
  | "general";

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  relatedId?: string;
  relatedModule?: string;
  isRead: boolean;
  createdAt: Timestamp;
}

// ─── Audit Log ───────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  recordId: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: Timestamp;
}

// ─── Department / Designation ────────────────────────────────────────────────

export interface Department {
  id: string;
  name: string;
  description?: string;
  managerId?: string;
  isActive: boolean;
  createdAt: Timestamp;
}

export interface Designation {
  id: string;
  name: string;
  departmentId?: string;
  level?: number;
  isActive: boolean;
  createdAt: Timestamp;
}

export interface InventoryCategory {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Timestamp;
}
