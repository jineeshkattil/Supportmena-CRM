# SupportMENA OS

> The operating system for technical service businesses.

SupportMENA OS is a modern, full-stack internal ERP/business operations platform built for technical service companies — IT support, CCTV, networking, ELV contractors, AMC providers, and field service teams.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS + ShadCN UI |
| Backend | Firebase (Firestore + Auth + Storage) |
| Forms | React Hook Form + Zod |
| Tables | TanStack Table v8 |
| Charts | Recharts |
| Icons | Lucide React |
| Hosting | Vercel |

---

## Modules

| Module | Features |
|--------|----------|
| Dashboard | KPI cards, revenue charts, project status, quick actions |
| CRM / Clients | Client management, contacts, lead tracking |
| Quotations | Quotation builder with inventory, labour costs, VAT, margin |
| Invoices | Tax invoices, partial payments, payment tracking |
| Projects | Project lifecycle, team assignment, status tracking |
| Tasks | Kanban-style task management, technician view |
| AMC | Contract management, service visits, renewal alerts |
| Inventory | Stock management, movements, low-stock alerts |
| Purchase | Purchase requests, approval workflow |
| Suppliers | Supplier database |
| HRMS | Employee profiles, documents, expiry alerts |
| Leave | Leave requests, approval workflow, balance tracking |
| Attendance | Daily attendance marking, reports |
| Petty Cash | Cash assignment, expense tracking, settlement |
| Expenses | Company expense management |
| Reports | Finance, HR, operations, inventory reports |
| Settings | Company config, users, billing prefixes |

---

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repo-url>
cd supportmena-os
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Firebase

1. Create a project at [Firebase Console](https://console.firebase.google.com)
2. Enable **Authentication** → Email/Password
3. Enable **Firestore Database** (start in test mode)
4. Enable **Storage**
5. Copy your web app config

### 4. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Firebase config:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 5. Seed demo data

```bash
npm run seed
```

This creates:
- A Super Admin user (admin@supportmena.com / Admin@123)
- Sample employees, clients, inventory items
- Sample quotation, invoice, project

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Default Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@supportmena.com | Admin@123 |
| Finance | finance@supportmena.com | Finance@123 |
| HR Admin | hr@supportmena.com | HR@123 |
| Project Manager | pm@supportmena.com | PM@123 |
| Technician | tech@supportmena.com | Tech@123 |

---

## Firebase Security Rules

For production, set Firestore rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## Deployment (Vercel)

1. Push to GitHub
2. Connect repo on [vercel.com](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/login       # Login page
│   └── (dashboard)/       # All protected pages
│       ├── dashboard/
│       ├── crm/
│       ├── quotations/
│       ├── invoices/
│       ├── projects/
│       ├── tasks/
│       ├── inventory/
│       ├── hrms/
│       ├── leave/
│       ├── petty-cash/
│       └── ...
├── components/
│   ├── ui/                # ShadCN components
│   ├── layout/            # Sidebar, Header
│   ├── dashboard/         # KPI cards, charts
│   └── tables/            # DataTable
├── contexts/              # Auth context
├── lib/
│   ├── firebase.ts        # Firebase init
│   ├── permissions.ts     # RBAC
│   ├── utils.ts           # Helpers
│   └── constants.ts       # App constants
├── services/              # Firestore helpers
└── types/                 # TypeScript interfaces
```

---

## License

Internal use — SupportMENA Technologies © 2024
