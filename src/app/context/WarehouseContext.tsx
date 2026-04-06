import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Product, Debt, DebtHistoryEntry, AuditLogEntry, WorkerKPI } from '../data/mockData';
import { deriveProductStatus } from '../lib/warehouseUtils';

const STORAGE_KEY = 'warehouse-app-data-v2';

export type WarehousePersisted = {
  products: Product[];
  debts: Debt[];
  workerKpis: WorkerKPI[];
  auditLog: AuditLogEntry[];
  /** id записей аудита, отмеченных как прочитанные в уведомлениях */
  readAuditIds: string[];
};

const empty = (): WarehousePersisted => ({
  products: [],
  debts: [],
  workerKpis: [],
  auditLog: [],
  readAuditIds: [],
});

function normalizeDebt(d: Debt): Debt {
  return {
    ...d,
    debtHistory: Array.isArray(d.debtHistory) ? d.debtHistory : [],
    paymentHistory: Array.isArray(d.paymentHistory) ? d.paymentHistory : [],
    createdByRole: d.createdByRole ?? 'director',
  };
}

function load(): WarehousePersisted {
  if (typeof window === 'undefined') return empty();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty();
    const p = JSON.parse(raw) as Partial<WarehousePersisted>;
    return {
      products: Array.isArray(p.products) ? p.products : [],
      debts: Array.isArray(p.debts) ? p.debts.map((x) => normalizeDebt(x as Debt)) : [],
      workerKpis: Array.isArray(p.workerKpis) ? p.workerKpis : [],
      auditLog: Array.isArray(p.auditLog) ? p.auditLog : [],
      readAuditIds: Array.isArray(p.readAuditIds) ? p.readAuditIds : [],
    };
  } catch {
    return empty();
  }
}

function save(data: WarehousePersisted) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function uid() {
  return crypto.randomUUID();
}

function nowStamp() {
  const d = new Date();
  return d.toISOString().slice(0, 16).replace('T', ' ');
}

function debtStatusAfterPayment(remaining: number, paid: number, dueDate: string): Debt['status'] {
  if (remaining <= 0) return 'paid';
  if (paid > 0) return 'partial';
  const today = new Date().toISOString().slice(0, 10);
  return dueDate < today ? 'overdue' : 'active';
}

export type AddProductInput = Omit<Product, 'id' | 'history' | 'status'> & {
  createdBy?: string;
};

export type UpdateProductInput = Partial<
  Pick<
    Product,
    | 'name'
    | 'category'
    | 'quantity'
    | 'unit'
    | 'price'
    | 'supplier'
    | 'expirationDate'
    | 'notes'
    | 'shipmentRecipient'
    | 'imageUrl'
    | 'nameUz'
    | 'categoryUz'
  >
>;

export type DebtPaymentInput = {
  personName: string;
  company: string;
  amount: number;
  productId: string;
  productName: string;
};

type WarehouseContextValue = WarehousePersisted & {
  addProduct: (input: AddProductInput) => Product;
  updateProduct: (productId: string, input: UpdateProductInput) => boolean;
  deleteProduct: (productId: string) => boolean;
  addProductInbound: (productId: string, quantity: number, userName: string) => boolean;
  addDebt: (debt: Omit<Debt, 'id'>) => Debt;
  applyDebtPayment: (debtId: string, input: DebtPaymentInput) => { ok: true } | { ok: false; error: string };
  appendAudit: (entry: Omit<AuditLogEntry, 'id' | 'at'>) => void;
  markAuditRead: (auditId: string) => void;
};

const WarehouseContext = createContext<WarehouseContextValue | null>(null);

export function WarehouseProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<WarehousePersisted>(() => load());
  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const commit = useCallback((next: WarehousePersisted) => {
    dataRef.current = next;
    save(next);
    setData(next);
  }, []);

  const appendAudit = useCallback(
    (entry: Omit<AuditLogEntry, 'id' | 'at'>) => {
      const row: AuditLogEntry = {
        id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        at: nowStamp(),
        ...entry,
      };
      const prev = dataRef.current;
      commit({ ...prev, auditLog: [row, ...prev.auditLog] });
    },
    [commit]
  );

  const addProduct = useCallback(
    (input: AddProductInput): Product => {
      const id = uid();
      const userLabel = input.createdBy?.trim() || 'Система';
      const product: Product = {
        id,
        name: input.name,
        nameUz: input.nameUz,
        imageUrl: input.imageUrl,
        category: input.category,
        categoryUz: input.categoryUz,
        quantity: input.quantity,
        unit: input.unit,
        price: input.price,
        supplier: input.supplier,
        expirationDate: input.expirationDate,
        notes: input.notes,
        shipmentRecipient: input.shipmentRecipient,
        status: deriveProductStatus(input.quantity),
        history: [
          {
            date: new Date().toISOString().slice(0, 10),
            action: 'Added',
            quantity: input.quantity,
            user: userLabel,
          },
        ],
      };
      const prev = dataRef.current;
      commit({ ...prev, products: [...prev.products, product] });
      return product;
    },
    [commit]
  );

  const addProductInbound = useCallback(
    (productId: string, quantity: number, userName: string): boolean => {
      if (quantity <= 0) return false;
      const prev = dataRef.current;
      const p = prev.products.find((x) => x.id === productId);
      if (!p) return false;
      const newQty = p.quantity + quantity;
      const entry = {
        date: new Date().toISOString().slice(0, 10),
        action: 'Added',
        quantity,
        user: userName,
      };
      const updated: Product = {
        ...p,
        quantity: newQty,
        status: deriveProductStatus(newQty),
        history: [entry, ...p.history],
      };
      commit({
        ...prev,
        products: prev.products.map((x) => (x.id === productId ? updated : x)),
      });
      return true;
    },
    [commit]
  );

  const updateProduct = useCallback(
    (productId: string, input: UpdateProductInput): boolean => {
      const prev = dataRef.current;
      const p = prev.products.find((x) => x.id === productId);
      if (!p) return false;
      const quantity = input.quantity ?? p.quantity;
      const updated: Product = {
        ...p,
        name: input.name ?? p.name,
        nameUz: input.nameUz !== undefined ? input.nameUz : p.nameUz,
        imageUrl: input.imageUrl !== undefined ? input.imageUrl : p.imageUrl,
        category: input.category ?? p.category,
        categoryUz: input.categoryUz !== undefined ? input.categoryUz : p.categoryUz,
        quantity,
        unit: input.unit ?? p.unit,
        price: input.price ?? p.price,
        supplier: input.supplier ?? p.supplier,
        expirationDate: input.expirationDate ?? p.expirationDate,
        notes: input.notes !== undefined ? input.notes : p.notes,
        shipmentRecipient:
          input.shipmentRecipient !== undefined ? input.shipmentRecipient : p.shipmentRecipient,
        status: deriveProductStatus(quantity),
      };
      commit({
        ...prev,
        products: prev.products.map((x) => (x.id === productId ? updated : x)),
      });
      return true;
    },
    [commit]
  );

  const deleteProduct = useCallback(
    (productId: string): boolean => {
      const prev = dataRef.current;
      if (!prev.products.some((x) => x.id === productId)) return false;
      commit({
        ...prev,
        products: prev.products.filter((x) => x.id !== productId),
      });
      return true;
    },
    [commit]
  );

  const addDebt = useCallback(
    (input: Omit<Debt, 'id'>): Debt => {
      const debt: Debt = {
        ...input,
        debtHistory: input.debtHistory ?? [],
        paymentHistory: input.paymentHistory ?? [],
        id: uid(),
      };
      const prev = dataRef.current;
      commit({ ...prev, debts: [...prev.debts, debt] });
      return debt;
    },
    [commit]
  );

  const applyDebtPayment = useCallback(
    (debtId: string, input: DebtPaymentInput): { ok: true } | { ok: false; error: string } => {
      const amount = input.amount;
      if (!Number.isFinite(amount) || amount <= 0) {
        return { ok: false, error: 'Укажите сумму больше 0' };
      }
      const prev = dataRef.current;
      const d = prev.debts.find((x) => x.id === debtId);
      if (!d) return { ok: false, error: 'Долг не найден' };
      if (amount > d.remainingAmount + 0.0001) {
        return { ok: false, error: 'Сумма больше остатка долга' };
      }
      const newPaid = d.paidAmount + amount;
      const newRemaining = Math.max(0, d.remainingAmount - amount);
      const paidPercent = d.totalAmount > 0 ? (newPaid / d.totalAmount) * 100 : 0;
      const dateStr = new Date().toISOString().slice(0, 10);
      const entry: DebtHistoryEntry = {
        id: uid(),
        date: dateStr,
        personName: input.personName.trim() || '—',
        company: input.company.trim() || '—',
        amount,
        productId: input.productId,
        productName: input.productName.trim() || '—',
        remainingAfter: newRemaining,
        fullyPaid: newRemaining <= 0,
        paidPercentOfTotal: Math.min(100, Math.round(paidPercent * 10) / 10),
      };
      const methodParts = [input.company.trim(), input.productName.trim()].filter(Boolean);
      const updated: Debt = {
        ...d,
        paidAmount: newPaid,
        remainingAmount: newRemaining,
        status: debtStatusAfterPayment(newRemaining, newPaid, d.dueDate),
        debtHistory: [entry, ...(d.debtHistory ?? [])],
        paymentHistory: [
          ...d.paymentHistory,
          {
            date: dateStr,
            amount,
            method: methodParts.length ? methodParts.join(' · ') : 'Оплата',
          },
        ],
      };
      commit({
        ...prev,
        debts: prev.debts.map((x) => (x.id === debtId ? updated : x)),
      });
      return { ok: true };
    },
    [commit]
  );

  const markAuditRead = useCallback(
    (auditId: string) => {
      const prev = dataRef.current;
      if (prev.readAuditIds.includes(auditId)) return;
      commit({ ...prev, readAuditIds: [...prev.readAuditIds, auditId] });
    },
    [commit]
  );

  const value = useMemo(
    () => ({
      ...data,
      addProduct,
      updateProduct,
      deleteProduct,
      addProductInbound,
      addDebt,
      applyDebtPayment,
      appendAudit,
      markAuditRead,
    }),
    [data, addProduct, updateProduct, deleteProduct, addProductInbound, addDebt, applyDebtPayment, appendAudit, markAuditRead]
  );

  return <WarehouseContext.Provider value={value}>{children}</WarehouseContext.Provider>;
}

export function useWarehouse(): WarehouseContextValue {
  const ctx = useContext(WarehouseContext);
  if (!ctx) throw new Error('useWarehouse must be used within WarehouseProvider');
  return ctx;
}
