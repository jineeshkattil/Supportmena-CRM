export const APP_NAME = "SupportMENA OS";
export const APP_TAGLINE = "The operating system for technical service businesses.";
export const DEFAULT_CURRENCY = "AED";
export const DEFAULT_VAT = 5;

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard", module: "dashboard" },
  { href: "/crm", label: "CRM / Clients", icon: "Users", module: "crm" },
  { href: "/quotations", label: "Quotations", icon: "FileText", module: "quotations" },
  { href: "/invoices", label: "Invoices", icon: "Receipt", module: "invoices" },
  { href: "/projects", label: "Projects", icon: "Briefcase", module: "projects" },
  { href: "/tasks", label: "Tasks", icon: "CheckSquare", module: "tasks" },
  { href: "/amc", label: "AMC", icon: "RefreshCw", module: "amc" },
  { href: "/inventory", label: "Inventory", icon: "Package", module: "inventory" },
  { href: "/purchase", label: "Purchase", icon: "ShoppingCart", module: "purchase" },
  { href: "/suppliers", label: "Suppliers", icon: "Truck", module: "suppliers" },
  { href: "/hrms", label: "HRMS", icon: "UserCircle", module: "hrms" },
  { href: "/attendance", label: "Attendance", icon: "Clock", module: "attendance" },
  { href: "/leave", label: "Leave", icon: "CalendarDays", module: "leave" },
  { href: "/petty-cash", label: "Petty Cash", icon: "Wallet", module: "petty_cash" },
  { href: "/expenses", label: "Expenses", icon: "CreditCard", module: "expenses" },
  { href: "/reports", label: "Reports", icon: "BarChart2", module: "reports" },
  { href: "/settings", label: "Settings", icon: "Settings", module: "settings" },
] as const;

export const LEAVE_TYPES = [
  { value: "annual", label: "Annual Leave" },
  { value: "sick", label: "Sick Leave" },
  { value: "emergency", label: "Emergency Leave" },
  { value: "unpaid", label: "Unpaid Leave" },
  { value: "half_day", label: "Half Day" },
];

export const PROJECT_TYPES = [
  { value: "cctv", label: "CCTV Installation" },
  { value: "it_support", label: "IT Support" },
  { value: "networking", label: "Networking" },
  { value: "wifi", label: "WiFi Setup" },
  { value: "amc", label: "AMC" },
  { value: "smart_home", label: "Smart Home" },
  { value: "server_rack", label: "Server/Rack Setup" },
  { value: "access_control", label: "Access Control" },
  { value: "maintenance", label: "Maintenance" },
  { value: "other", label: "Other" },
];

export const PROJECT_STATUSES = [
  { value: "new", label: "New", color: "bg-gray-100 text-gray-700" },
  { value: "scheduled", label: "Scheduled", color: "bg-blue-100 text-blue-700" },
  { value: "material_assigned", label: "Material Assigned", color: "bg-yellow-100 text-yellow-700" },
  { value: "in_progress", label: "In Progress", color: "bg-orange-100 text-orange-700" },
  { value: "on_hold", label: "On Hold", color: "bg-red-100 text-red-700" },
  { value: "completed", label: "Completed", color: "bg-green-100 text-green-700" },
  { value: "invoiced", label: "Invoiced", color: "bg-purple-100 text-purple-700" },
  { value: "closed", label: "Closed", color: "bg-gray-200 text-gray-600" },
];

export const QUOTATION_STATUSES = [
  { value: "draft", label: "Draft", color: "bg-gray-100 text-gray-700" },
  { value: "pending_approval", label: "Pending Approval", color: "bg-yellow-100 text-yellow-700" },
  { value: "approved", label: "Approved", color: "bg-green-100 text-green-700" },
  { value: "rejected", label: "Rejected", color: "bg-red-100 text-red-700" },
  { value: "sent", label: "Sent", color: "bg-blue-100 text-blue-700" },
  { value: "accepted", label: "Accepted", color: "bg-emerald-100 text-emerald-700" },
  { value: "declined", label: "Declined", color: "bg-red-100 text-red-700" },
  { value: "expired", label: "Expired", color: "bg-gray-200 text-gray-600" },
];

export const INVOICE_STATUSES = [
  { value: "draft", label: "Draft", color: "bg-gray-100 text-gray-700" },
  { value: "sent", label: "Sent", color: "bg-blue-100 text-blue-700" },
  { value: "partially_paid", label: "Partially Paid", color: "bg-yellow-100 text-yellow-700" },
  { value: "paid", label: "Paid", color: "bg-green-100 text-green-700" },
  { value: "overdue", label: "Overdue", color: "bg-red-100 text-red-700" },
  { value: "cancelled", label: "Cancelled", color: "bg-gray-200 text-gray-600" },
];

export const TASK_STATUSES = [
  { value: "pending", label: "Pending", color: "bg-gray-100 text-gray-700" },
  { value: "assigned", label: "Assigned", color: "bg-blue-100 text-blue-700" },
  { value: "in_progress", label: "In Progress", color: "bg-orange-100 text-orange-700" },
  { value: "completed", label: "Completed", color: "bg-green-100 text-green-700" },
  { value: "approved", label: "Approved", color: "bg-emerald-100 text-emerald-700" },
  { value: "rework_required", label: "Rework Required", color: "bg-red-100 text-red-700" },
];

export const EXPENSE_CATEGORIES = [
  "Rent", "Salary", "Fuel", "Telecom", "Utilities", "Software",
  "Vehicle", "Office Supplies", "Supplier Payments", "Miscellaneous",
];

export const PETTY_CASH_CATEGORIES = [
  "Fuel", "Parking", "Tools", "Site Materials", "Food/Water",
  "Emergency Purchase", "Courier", "Other",
];

export const PAYMENT_METHODS = [
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cash", label: "Cash" },
  { value: "cheque", label: "Cheque" },
  { value: "card", label: "Card" },
  { value: "online", label: "Online Transfer" },
];

export const RESOURCE_TYPES = [
  "Engineer",
  "Technician",
  "Helper",
  "Site Supervisor",
  "Project Manager",
  "Installation Team",
  "Transportation",
  "Site Survey",
  "Other",
];
