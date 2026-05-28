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

export function canViewModule(role: UserRole, module: string): boolean {
  return hasPermission(role, module, "view");
}

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
