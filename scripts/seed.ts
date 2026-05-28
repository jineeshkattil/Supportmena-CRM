/**
 * Seed script for SupportMENA OS demo data.
 * Run: npx ts-node scripts/seed.ts
 *
 * Prerequisites:
 * - Firebase project set up
 * - .env.local configured with Firebase credentials
 * - Firebase Admin SDK installed (npm install firebase-admin)
 */

console.log(`
╔═══════════════════════════════════════════════════════╗
║           SupportMENA OS — Seed Instructions          ║
╠═══════════════════════════════════════════════════════╣
║                                                       ║
║  To seed demo data:                                   ║
║                                                       ║
║  1. Create demo users in Firebase Console:            ║
║     Authentication → Add User:                        ║
║     • admin@supportmena.com   / Admin@123             ║
║     • finance@supportmena.com / Finance@123           ║
║     • hr@supportmena.com      / HR@123                ║
║     • pm@supportmena.com      / PM@123                ║
║     • tech@supportmena.com    / Tech@123              ║
║                                                       ║
║  2. After first login, set roles in Firestore:        ║
║     Collection: users                                 ║
║     Set role field to:                                ║
║     • super_admin, finance, hr_admin                  ║
║     • project_manager, technician                     ║
║                                                       ║
║  3. Run the app — demo data will appear in modules    ║
║     until you connect to live Firebase.               ║
║                                                       ║
║  Note: All pages gracefully fall back to demo data   ║
║  when Firebase is not fully configured.               ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
`);

// Sample Firestore data structure for manual import:

const SEED_DATA = {
  companySettings: {
    main: {
      name: "SupportMENA Technologies",
      trn: "100123456789001",
      email: "info@supportmena.ae",
      phone: "+971 4 123 4567",
      website: "www.supportmena.ae",
      address: "Office 412, Business Bay, Dubai, UAE",
      currency: "AED",
      vatPercentage: 5,
      invoicePrefix: "INV",
      quotationPrefix: "QT",
      poPrefix: "PO",
    },
  },

  clients: [
    {
      clientCode: "CL-0001",
      companyName: "Al Noor Technologies",
      clientType: "company",
      email: "info@alnoor.ae",
      phone: "+971 50 123 4567",
      billingAddress: "Al Quoz Industrial, Dubai",
      status: "active",
    },
    {
      clientCode: "CL-0002",
      companyName: "Gulf Smart Systems",
      clientType: "company",
      email: "info@gulfsmarts.ae",
      phone: "+971 55 987 6543",
      status: "active",
    },
    {
      clientCode: "CL-0003",
      companyName: "Skyline Properties",
      clientType: "company",
      email: "projects@skyline.ae",
      phone: "+971 4 234 5678",
      status: "active",
    },
  ],

  employees: [
    {
      employeeCode: "EMP-001",
      fullName: "Ahmed Al Rashid",
      gender: "male",
      email: "ahmed@supportmena.com",
      phone: "+971 50 111 2222",
      departmentName: "IT & Operations",
      designationName: "Senior Technician",
      employmentType: "full_time",
      joiningDate: "2022-01-15",
      status: "active",
      visaExpiry: "2026-06-30",
      passportExpiry: "2027-03-15",
      emiratesIdExpiry: "2026-06-30",
    },
    {
      employeeCode: "EMP-002",
      fullName: "Sarah Johnson",
      gender: "female",
      email: "sarah@supportmena.com",
      phone: "+971 55 333 4444",
      departmentName: "Finance",
      designationName: "Finance Manager",
      employmentType: "full_time",
      joiningDate: "2021-03-01",
      status: "active",
      visaExpiry: "2026-02-28",
    },
  ],

  inventory: [
    {
      itemCode: "INV-001",
      itemName: "Hikvision DS-2CD2143G2-I 4MP Dome Camera",
      categoryName: "CCTV Cameras",
      brand: "Hikvision",
      model: "DS-2CD2143G2-I",
      sku: "HK-DS2143",
      unitCost: 280,
      sellingPrice: 420,
      currentStock: 25,
      reservedStock: 5,
      availableStock: 20,
      minimumStockLevel: 10,
      warrantyPeriod: "2 years",
      status: "active",
    },
    {
      itemCode: "INV-002",
      itemName: "Cat6 UTP Cable 305m Box",
      categoryName: "Cables",
      brand: "Panduit",
      sku: "CAT6-305M",
      unitCost: 180,
      sellingPrice: 280,
      currentStock: 3,
      reservedStock: 1,
      availableStock: 2,
      minimumStockLevel: 5,
      status: "active",
    },
  ],
};

console.log("Seed data structure defined. Import manually to Firestore or use Firebase CLI.");
console.log(JSON.stringify(SEED_DATA, null, 2));
