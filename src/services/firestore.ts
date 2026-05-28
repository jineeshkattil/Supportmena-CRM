import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  onSnapshot,
  QueryConstraint,
  DocumentData,
  QuerySnapshot,
  writeBatch,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ─── Generic helpers ─────────────────────────────────────────────────────────

export async function getDocument<T>(
  collectionName: string,
  id: string
): Promise<T | null> {
  const docRef = doc(db, collectionName, id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as T;
}

export async function getCollection<T>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  const q = query(collection(db, collectionName), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
}

export async function createDocument<T extends DocumentData>(
  collectionName: string,
  data: Omit<T, "id">
): Promise<string> {
  const ref = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateDocument<T extends DocumentData>(
  collectionName: string,
  id: string,
  data: Partial<T>
): Promise<void> {
  const ref = doc(db, collectionName, id);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

export async function deleteDocument(
  collectionName: string,
  id: string
): Promise<void> {
  await deleteDoc(doc(db, collectionName, id));
}

// ─── Counter for auto-numbering ───────────────────────────────────────────────

export async function getNextSequence(counterName: string): Promise<number> {
  const ref = doc(db, "counters", counterName);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await updateDoc(ref, { value: 1 }).catch(() =>
      addDoc(collection(db, "counters"), { name: counterName, value: 1 })
    );
    return 1;
  }
  const batch = writeBatch(db);
  batch.update(ref, { value: increment(1) });
  await batch.commit();
  return (snap.data().value as number) + 1;
}

// ─── Users ───────────────────────────────────────────────────────────────────

export const usersCol = "users";
export const employeesCol = "employees";
export const clientsCol = "clients";
export const clientContactsCol = "clientContacts";
export const quotationsCol = "quotations";
export const invoicesCol = "invoices";
export const paymentsCol = "payments";
export const projectsCol = "projects";
export const tasksCol = "tasks";
export const inventoryCol = "inventory";
export const stockMovementsCol = "stockMovements";
export const purchaseRequestsCol = "purchaseRequests";
export const suppliersCol = "suppliers";
export const leaveRequestsCol = "leaveRequests";
export const leaveBalancesCol = "leaveBalances";
export const attendanceCol = "attendance";
export const pettyCashCol = "pettyCash";
export const expensesCol = "expenses";
export const amcContractsCol = "amcContracts";
export const notificationsCol = "notifications";
export const auditLogsCol = "auditLogs";
export const departmentsCol = "departments";
export const designationsCol = "designations";
export const inventoryCategoriesCol = "inventoryCategories";
export const companySettingsCol = "companySettings";

// ─── Audit helper ─────────────────────────────────────────────────────────────

export async function createAuditLog(
  userId: string,
  userName: string,
  action: string,
  module: string,
  recordId: string,
  oldValue?: Record<string, unknown>,
  newValue?: Record<string, unknown>
): Promise<void> {
  await addDoc(collection(db, auditLogsCol), {
    userId,
    userName,
    action,
    module,
    recordId,
    oldValue: oldValue || null,
    newValue: newValue || null,
    createdAt: serverTimestamp(),
  });
}

// ─── Notification helper ──────────────────────────────────────────────────────

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: string,
  relatedId?: string,
  relatedModule?: string,
  priority: string = "medium"
): Promise<void> {
  await addDoc(collection(db, notificationsCol), {
    userId,
    title,
    message,
    type,
    priority,
    relatedId: relatedId || null,
    relatedModule: relatedModule || null,
    isRead: false,
    createdAt: serverTimestamp(),
  });
}
