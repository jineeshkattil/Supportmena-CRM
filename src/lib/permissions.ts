import { UserRole } from "@/types";

type ModuleAction = "view" | "create" | "edit" | "delete" | "approve" | "export";

type PermissionMap = Record<string, Record<ModuleAction, UserRole[]>>;

const ALL_ROLES: UserRole[] = [
  "super_admin", "management", "hr_admin", "finance",
  "project_manager", "storekeeper", "technician", "sales",
];

const ADMIN_ROLES: UserRole[] = ["super_admin", "management"];
const FINANCE_ROLES: UserRole[] = ["super_admin", "management", "finance"];
const HR_ROLES: UserRole[] = ["super_admin", "management", "hr_admin"];
const OPS_ROLES: UserRole[] = ["super_admin", "management", "project_manager"];

export const PERMISSIONS: PermissionMap = {
  dashboard: {
    view: ALL_ROLES,
    create: ADMIN_ROLES,
    edit: ADMIN_ROLES,
    delete: ["super_admin"],
    approve: ADMIN_ROLES,
    export: ["super_admin", "management", "finance"],
  },
  hrms: {
    view: HR_ROLES,
    create: HR_ROLES,
    edit: HR_ROLES,
    delete: ["super_admin"],
    approve: HR_ROLES,
    export: HR_ROLES,
  },
  leave: {
    view: [...HR_ROLES, "technician", "sales", "project_manager", "storekeeper", "finance"],
    create: ALL_ROLES,
    edit: HR_ROLES,
    delete: HR_ROLES,
    approve: HR_ROLES,
    export: HR_ROLES,
  },
  attendance: {
    view: [...HR_ROLES, "technician"],
    create: HR_ROLES,
    edit: HR_ROLES,
    delete: ["super_admin"],
    approve: HR_ROLES,
    export: HR_ROLES,
  },
  crm: {
    view: ["super_admin", "management", "sales", "finance", "project_manager"],
    create: ["super_admin", "management", "sales"],
    edit: ["super_admin", "management", "sales"],
    delete: ["super_admin"],
    approve: ADMIN_ROLES,
    export: ["super_admin", "management", "sales", "finance"],
  },
  quotations: {
    view: [...FINANCE_ROLES, "sales", "project_manager"],
    create: [...FINANCE_ROLES, "sales"],
    edit: [...FINANCE_ROLES, "sales"],
    delete: ["super_admin"],
    approve: FINANCE_ROLES,
    export: FINANCE_ROLES,
  },
  invoices: {
    view: FINANCE_ROLES,
    create: FINANCE_ROLES,
    edit: FINANCE_ROLES,
    delete: ["super_admin"],
    approve: FINANCE_ROLES,
    export: FINANCE_ROLES,
  },
  projects: {
    view: ["super_admin", "management", "project_manager", "finance", "technician"],
    create: OPS_ROLES,
    edit: OPS_ROLES,
    delete: ["super_admin"],
    approve: OPS_ROLES,
    export: OPS_ROLES,
  },
  tasks: {
    view: ["super_admin", "management", "project_manager", "technician"],
    create: OPS_ROLES,
    edit: ["super_admin", "project_manager", "technician"],
    delete: OPS_ROLES,
    approve: OPS_ROLES,
    export: OPS_ROLES,
  },
  inventory: {
    view: ["super_admin", "management", "storekeeper", "project_manager", "finance"],
    create: ["super_admin", "storekeeper"],
    edit: ["super_admin", "storekeeper"],
    delete: ["super_admin"],
    approve: ["super_admin", "storekeeper"],
    export: ["super_admin", "storekeeper", "management"],
  },
  purchase: {
    view: ["super_admin", "management", "storekeeper", "finance", "project_manager"],
    create: ["super_admin", "storekeeper", "project_manager"],
    edit: ["super_admin", "storekeeper"],
    delete: ["super_admin"],
    approve: ["super_admin", "management", "finance"],
    export: ["super_admin", "storekeeper", "finance"],
  },
  suppliers: {
    view: ["super_admin", "management", "storekeeper", "finance"],
    create: ["super_admin", "storekeeper", "finance"],
    edit: ["super_admin", "storekeeper", "finance"],
    delete: ["super_admin"],
    approve: ADMIN_ROLES,
    export: ["super_admin", "storekeeper", "finance"],
  },
  petty_cash: {
    view: FINANCE_ROLES,
    create: ALL_ROLES,
    edit: FINANCE_ROLES,
    delete: ["super_admin"],
    approve: FINANCE_ROLES,
    export: FINANCE_ROLES,
  },
  expenses: {
    view: FINANCE_ROLES,
    create: [...FINANCE_ROLES, "project_manager"],
    edit: FINANCE_ROLES,
    delete: ["super_admin"],
    approve: FINANCE_ROLES,
    export: FINANCE_ROLES,
  },
  amc: {
    view: ["super_admin", "management", "project_manager", "finance", "technician"],
    create: OPS_ROLES,
    edit: OPS_ROLES,
    delete: ["super_admin"],
    approve: ADMIN_ROLES,
    export: OPS_ROLES,
  },
  reports: {
    view: ["super_admin", "management", "finance", "hr_admin", "project_manager"],
    create: ADMIN_ROLES,
    edit: ADMIN_ROLES,
    delete: ["super_admin"],
    approve: ADMIN_ROLES,
    export: ["super_admin", "management", "finance", "hr_admin"],
  },
  settings: {
    view: ["super_admin"],
    create: ["super_admin"],
    edit: ["super_admin"],
    delete: ["super_admin"],
    approve: ["super_admin"],
    export: ["super_admin"],
  },
  renewals: {
    view: ALL_ROLES,
    create: ["super_admin", "management", "finance", "sales"],
    edit: ["super_admin", "management", "finance", "sales"],
    delete: ["super_admin"],
    approve: ["super_admin", "management", "finance"],
    export: ["super_admin", "management", "finance"],
  },
  renewal_clients: {
    view: ALL_ROLES,
    create: ["super_admin", "management", "finance", "sales"],
    edit: ["super_admin", "management", "finance", "sales"],
    delete: ["super_admin"],
    approve: ADMIN_ROLES,
    export: ["super_admin", "management", "finance"],
  },
  renewal_providers: {
    view: ALL_ROLES,
    create: ["super_admin", "management", "finance"],
    edit: ["super_admin", "management", "finance"],
    delete: ["super_admin"],
    approve: ADMIN_ROLES,
    export: ["super_admin", "management"],
  },
  renewal_services: {
    view: ALL_ROLES,
    create: ["super_admin", "management", "finance", "sales"],
    edit: ["super_admin", "management", "finance", "sales"],
    delete: ["super_admin"],
    approve: ADMIN_ROLES,
    export: ["super_admin", "management", "finance"],
  },
  renewal_reminders: {
    view: ALL_ROLES,
    create: ["super_admin", "management", "finance"],
    edit: ["super_admin", "management", "finance", "sales"],
    delete: ["super_admin"],
    approve: ADMIN_ROLES,
    export: ["super_admin", "management", "finance"],
  },
  renewal_documents: {
    view: ["super_admin", "management", "finance", "sales"],
    create: ["super_admin", "management", "finance", "sales"],
    edit: ["super_admin", "management", "finance"],
    delete: ["super_admin"],
    approve: ["super_admin", "management", "finance"],
    export: ["super_admin", "management"],
  },
  renewal_reports: {
    view: ["super_admin", "management", "finance"],
    create: ADMIN_ROLES,
    edit: ADMIN_ROLES,
    delete: ["super_admin"],
    approve: ADMIN_ROLES,
    export: ["super_admin", "management", "finance"],
  },
  renewal_settings: {
    view: ["super_admin", "management"],
    create: ["super_admin"],
    edit: ["super_admin"],
    delete: ["super_admin"],
    approve: ["super_admin"],
    export: ["super_admin"],
  },
};

export function hasPermission(
  role: UserRole,
  module: string,
  action: ModuleAction
): boolean {
  const modulePerms = PERMISSIONS[module];
  if (!modulePerms) return false;
  const allowedRoles = modulePerms[action];
  if (!allowedRoles) return false;
  return allowedRoles.includes(role);
}

export function canViewModule(
  role: UserRole,
  module: string,
  pagePermissions?: string[] | null
): boolean {
  // super_admin always has access — never lock the owner out via overrides.
  if (role === "super_admin") return true;
  if (pagePermissions && Array.isArray(pagePermissions)) {
    return pagePermissions.includes(module);
  }
  return hasPermission(role, module, "view");
}

export const ALL_MODULES: { id: string; label: string; group: string }[] = [
  { id: "dashboard", label: "Dashboard", group: "Overview" },
  { id: "crm", label: "CRM / Clients", group: "Business" },
  { id: "quotations", label: "Quotations", group: "Business" },
  { id: "invoices", label: "Invoices", group: "Business" },
  { id: "projects", label: "Projects", group: "Operations" },
  { id: "tasks", label: "Tasks", group: "Operations" },
  { id: "amc", label: "AMC", group: "Operations" },
  { id: "inventory", label: "Inventory", group: "Inventory" },
  { id: "purchase", label: "Purchase", group: "Inventory" },
  { id: "suppliers", label: "Suppliers", group: "Inventory" },
  { id: "hrms", label: "HRMS", group: "HR & Finance" },
  { id: "attendance", label: "Attendance", group: "HR & Finance" },
  { id: "leave", label: "Leave", group: "HR & Finance" },
  { id: "petty_cash", label: "Petty Cash", group: "HR & Finance" },
  { id: "expenses", label: "Expenses", group: "HR & Finance" },
  { id: "reports", label: "Reports", group: "Analytics" },
  { id: "settings", label: "Settings", group: "Analytics" },
  { id: "renewals", label: "Renewal Dashboard", group: "Renewals" },
  { id: "renewal_clients", label: "Renewal Clients", group: "Renewals" },
  { id: "renewal_providers", label: "Providers", group: "Renewals" },
  { id: "renewal_services", label: "Services", group: "Renewals" },
  { id: "renewal_reminders", label: "Reminders", group: "Renewals" },
  { id: "renewal_documents", label: "Documents", group: "Renewals" },
  { id: "renewal_reports", label: "Renewal Reports", group: "Renewals" },
  { id: "renewal_settings", label: "Renewal Settings", group: "Renewals" },
];

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin",
  management: "Management",
  hr_admin: "HR / Admin",
  finance: "Finance",
  project_manager: "Project Manager",
  storekeeper: "Storekeeper",
  technician: "Technician",
  sales: "Sales / User",
};

export const ROLE_COLORS: Record<UserRole, string> = {
  super_admin: "bg-purple-100 text-purple-800",
  management: "bg-blue-100 text-blue-800",
  hr_admin: "bg-green-100 text-green-800",
  finance: "bg-yellow-100 text-yellow-800",
  project_manager: "bg-orange-100 text-orange-800",
  storekeeper: "bg-cyan-100 text-cyan-800",
  technician: "bg-gray-100 text-gray-800",
  sales: "bg-pink-100 text-pink-800",
};
