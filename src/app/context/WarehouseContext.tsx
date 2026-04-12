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
import type { Product, Debt, DebtHistoryEntry, AuditLogEntry, ClientSale } from '../data/mockData';
import { deriveProductStatus } from '../lib/warehouseUtils';
import { getSessionUserIdFromCookie } from '../lib/sessionCookie';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

function logSupabaseError(scope: string, error: unknown) {
  if (error) console.error(`[WarehouseContext] ${scope}:`, error);
}

export type WarehousePersisted = {
  products: Product[];
  debts: Debt[];
  clientSales: ClientSale[];
  auditLog: AuditLogEntry[];
  readAuditIds: string[];
};

const empty = (): WarehousePersisted => ({
  products: [],
  debts: [],
  clientSales: [],
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

function sortDebtHistoryChronological(h: DebtHistoryEntry[]): DebtHistoryEntry[] {
  return [...h].sort((a, b) => {
    const c = a.date.localeCompare(b.date);
    if (c !== 0) return c;
    return a.id.localeCompare(b.id);
  });
}

function rebuildDebtFromHistoryEntries(d: Debt, entries: DebtHistoryEntry[]): Debt {
  const sorted = sortDebtHistoryChronological(entries);
  let runningPaid = 0;
  const rebuiltChrono: DebtHistoryEntry[] = [];
  for (const e of sorted) {
    const amt = Number(e.amount);
    if (!Number.isFinite(amt) || amt < 0) {
      rebuiltChrono.push(e);
      continue;
    }
    runningPaid += amt;
    const remainingAfter = Math.max(0, d.totalAmount - runningPaid);
    const paidPercent =
      d.totalAmount > 0 ? Math.min(100, Math.round((runningPaid / d.totalAmount) * 1000) / 10) : 0;
    rebuiltChrono.push({
      ...e,
      amount: amt,
      remainingAfter,
      fullyPaid: remainingAfter <= 0,
      paidPercentOfTotal: paidPercent,
    });
  }
  const paidAmount = runningPaid;
  const remainingAmount = Math.max(0, d.totalAmount - paidAmount);
  const status = debtStatusAfterPayment(remainingAmount, paidAmount, d.dueDate);
  const newestFirst = [...rebuiltChrono].reverse();
  const paymentHistory = rebuiltChrono.map((e) => ({
    date: e.date,
    amount: e.amount,
    method: [e.company?.trim(), e.productName?.trim()].filter(Boolean).join(' · ') || 'Оплата',
  }));
  return {
    ...d,
    paidAmount,
    remainingAmount,
    status,
    debtHistory: newestFirst,
    paymentHistory,
  };
}

type ProductRow = {
  id: string;
  name: string;
  name_uz: string | null;
  image_url: string | null;
  category: string;
  category_uz: string | null;
  quantity: number;
  unit: string;
  price: string | number;
  supplier: string;
  expiration_date: string;
  status: string;
  notes: string | null;
  shipment_recipient: Product['shipmentRecipient'] | null;
  history: Product['history'] | null;
};

type DebtRow = {
  id: string;
  full_name: string;
  phone: string;
  company: string | null;
  created_by_role: Debt['createdByRole'] | null;
  created_by_user_id: string | null;
  total_amount: string | number;
  paid_amount: string | number;
  remaining_amount: string | number;
  issue_date: string;
  due_date: string;
  status: Debt['status'];
  products: Debt['products'] | null;
  notes: string | null;
  debt_history: Debt['debtHistory'] | null;
  payment_history: Debt['paymentHistory'] | null;
};

type ClientSaleRow = {
  id: string;
  full_name: string;
  phone: string;
  company: string | null;
  product_id: string;
  product_name: string;
  quantity: number;
  amount_uzs: string | number;
  date: string;
  created_by_user_id: string | null;
  created_by_role: ClientSale['createdByRole'] | null;
};

type AuditLogRow = {
  id: string;
  at: string;
  user_name: string;
  user_role: 'director' | 'assistant' | 'worker';
  action: string;
  entity: string;
  details: string;
  ip: string;
};

async function loadFromDb(): Promise<WarehousePersisted> {
  if (!isSupabaseConfigured) return empty();

  const userId = getSessionUserIdFromCookie();

  const [
    productsRes,
    debtsRes,
    salesRes,
    auditRes,
    readsRes,
  ] = await Promise.all([
    supabase.from('products').select('*'),
    supabase.from('debts').select('*'),
    supabase.from('client_sales').select('*'),
    supabase.from('audit_log').select('*').order('at', { ascending: false }),
    userId ? supabase.from('audit_reads').select('audit_id').eq('user_id', userId) : Promise.resolve({ data: [], error: null }),
  ]);

  logSupabaseError('products select failed', productsRes.error);
  logSupabaseError('debts select failed', debtsRes.error);
  logSupabaseError('client_sales select failed', salesRes.error);
  logSupabaseError('audit_log select failed', auditRes.error);
  logSupabaseError('audit_reads select failed', (readsRes as any).error);

  const products = ((productsRes.data as ProductRow[] | null) ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    imageUrl: r.image_url ?? undefined,
    category: r.category,
    categoryUz: r.category_uz ?? undefined,
    quantity: Number(r.quantity ?? 0),
    unit: r.unit,
    price: Number(r.price ?? 0),
    supplier: r.supplier,
    expirationDate: r.expiration_date,
    status: (r.status as Product['status']) ?? 'in-stock',
    notes: r.notes ?? undefined,
    shipmentRecipient: r.shipment_recipient ?? undefined,
    history: Array.isArray(r.history) ? r.history : [],
  }));

  const debts = ((debtsRes.data as DebtRow[] | null) ?? []).map((r) =>
    normalizeDebt({
      id: r.id,
      fullName: r.full_name,
      phone: r.phone,
      company: r.company ?? undefined,
      createdByRole: r.created_by_role ?? undefined,
      createdByUserId: r.created_by_user_id ?? undefined,
      totalAmount: Number(r.total_amount ?? 0),
      paidAmount: Number(r.paid_amount ?? 0),
      remainingAmount: Number(r.remaining_amount ?? 0),
      issueDate: r.issue_date,
      dueDate: r.due_date,
      status: r.status,
      products: Array.isArray(r.products) ? r.products : [],
      notes: r.notes ?? undefined,
      debtHistory: Array.isArray(r.debt_history) ? r.debt_history : [],
      paymentHistory: Array.isArray(r.payment_history) ? r.payment_history : [],
    })
  );

  const clientSales = ((salesRes.data as ClientSaleRow[] | null) ?? []).map((r) => ({
    id: r.id,
    fullName: r.full_name,
    phone: r.phone,
    company: r.company ?? undefined,
    productId: r.product_id,
    productName: r.product_name,
    quantity: Number(r.quantity ?? 0),
    amountUzs: Number(r.amount_uzs ?? 0),
    date: r.date,
    createdByUserId: r.created_by_user_id ?? undefined,
    createdByRole: r.created_by_role ?? undefined,
  }));

  const auditLog = ((auditRes.data as AuditLogRow[] | null) ?? []).map((r) => ({
    id: r.id,
    at: r.at,
    userName: r.user_name,
    userRole: r.user_role,
    action: r.action,
    entity: r.entity,
    details: r.details,
    ip: r.ip,
  }));

  const readAuditIds = (((readsRes as any).data as Array<{ audit_id: string }> | null) ?? []).map((r) => r.audit_id);

  return { products, debts, clientSales, auditLog, readAuditIds };
}

function toProductRows(products: Product[]): ProductRow[] {
  return products.map((p) => ({
    id: p.id,
    name: p.name,
    name_uz: null,
    image_url: p.imageUrl ?? null,
    category: p.category,
    category_uz: p.categoryUz ?? null,
    quantity: p.quantity,
    unit: p.unit,
    price: p.price,
    supplier: p.supplier,
    expiration_date: p.expirationDate,
    status: p.status,
    notes: p.notes ?? null,
    shipment_recipient: p.shipmentRecipient ?? null,
    history: p.history,
  }));
}

function toDebtRows(debts: Debt[]): DebtRow[] {
  return debts.map((d) => ({
    id: d.id,
    full_name: d.fullName,
    phone: d.phone,
    company: d.company ?? null,
    created_by_role: d.createdByRole ?? null,
    created_by_user_id: d.createdByUserId ?? null,
    total_amount: d.totalAmount,
    paid_amount: d.paidAmount,
    remaining_amount: d.remainingAmount,
    issue_date: d.issueDate,
    due_date: d.dueDate,
    status: d.status,
    products: d.products,
    notes: d.notes ?? null,
    debt_history: d.debtHistory,
    payment_history: d.paymentHistory,
  }));
}

function toClientSaleRows(rows: ClientSale[]): ClientSaleRow[] {
  return rows.map((r) => ({
    id: r.id,
    full_name: r.fullName,
    phone: r.phone,
    company: r.company ?? null,
    product_id: r.productId,
    product_name: r.productName,
    quantity: r.quantity,
    amount_uzs: r.amountUzs,
    date: r.date,
    created_by_user_id: r.createdByUserId ?? null,
    created_by_role: r.createdByRole ?? null,
  }));
}

function toAuditRows(rows: AuditLogEntry[]): AuditLogRow[] {
  return rows.map((r) => ({
    id: r.id,
    at: r.at,
    user_name: r.userName,
    user_role: r.userRole,
    action: r.action,
    entity: r.entity,
    details: r.details,
    ip: r.ip,
  }));
}

async function syncRemote(prev: WarehousePersisted, next: WarehousePersisted) {
  if (!isSupabaseConfigured) return;

  const deleteMissing = async (table: string, prevIds: string[], nextIds: string[]) => {
    const removed = prevIds.filter((id) => !nextIds.includes(id));
    if (removed.length > 0) {
      const { error } = await supabase.from(table).delete().in('id', removed);
      logSupabaseError(`${table} delete missing failed`, error);
    }
  };

  await deleteMissing('products', prev.products.map((x) => x.id), next.products.map((x) => x.id));
  await deleteMissing('debts', prev.debts.map((x) => x.id), next.debts.map((x) => x.id));
  await deleteMissing('client_sales', prev.clientSales.map((x) => x.id), next.clientSales.map((x) => x.id));
  await deleteMissing('audit_log', prev.auditLog.map((x) => x.id), next.auditLog.map((x) => x.id));

  if (next.products.length > 0) {
    const { error } = await supabase.from('products').upsert(toProductRows(next.products), { onConflict: 'id' });
    logSupabaseError('products upsert failed', error);
  }
  if (next.debts.length > 0) {
    const { error } = await supabase.from('debts').upsert(toDebtRows(next.debts), { onConflict: 'id' });
    logSupabaseError('debts upsert failed', error);
  }
  if (next.clientSales.length > 0) {
    const { error } = await supabase.from('client_sales').upsert(toClientSaleRows(next.clientSales), { onConflict: 'id' });
    logSupabaseError('client_sales upsert failed', error);
  }
  if (next.auditLog.length > 0) {
    const { error } = await supabase.from('audit_log').upsert(toAuditRows(next.auditLog), { onConflict: 'id' });
    logSupabaseError('audit_log upsert failed', error);
  }

  const userId = getSessionUserIdFromCookie();
  if (userId) {
    const { error: deleteReadsError } = await supabase.from('audit_reads').delete().eq('user_id', userId);
    logSupabaseError('audit_reads delete failed', deleteReadsError);
    if (next.readAuditIds.length > 0) {
      const { error: insertReadsError } = await supabase.from('audit_reads').insert(next.readAuditIds.map((auditId) => ({ user_id: userId, audit_id: auditId })));
      logSupabaseError('audit_reads insert failed', insertReadsError);
    }
  }
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

export type UpdateDebtorProfileInput = {
  fullName?: string;
  phone?: string;
  company?: string;
};

export type UpdateDebtScheduleInput = {
  issueDate?: string;
  dueDate?: string;
};

export type UpdateDebtHistoryInput = {
  date?: string;
  personName?: string;
  company?: string;
  amount?: number;
  productId?: string;
  productName?: string;
  repaymentMode?: 'partial' | 'full';
};

export type RecordClientSaleInput = {
  productId: string;
  quantity: number;
  fullName: string;
  phone?: string;
  company?: string;
  createdByUserId?: string;
  createdByRole: 'director' | 'assistant' | 'worker';
};

type WarehouseContextValue = WarehousePersisted & {
  addProduct: (input: AddProductInput) => Product;
  updateProduct: (productId: string, input: UpdateProductInput) => boolean;
  deleteProduct: (productId: string) => boolean;
  addProductInbound: (productId: string, quantity: number, userName: string) => boolean;
  addDebt: (debt: Omit<Debt, 'id'>) => { ok: true; debt: Debt } | { ok: false; error: string };
  applyDebtPayment: (debtId: string, input: DebtPaymentInput) => { ok: true } | { ok: false; error: string };
  updateDebtorProfile: (debtId: string, input: UpdateDebtorProfileInput) => { ok: true } | { ok: false; error: string };
  updateDebtSchedule: (debtId: string, input: UpdateDebtScheduleInput) => { ok: true } | { ok: false; error: string };
  updateDebtHistoryEntry: (
    debtId: string,
    entryId: string,
    input: UpdateDebtHistoryInput
  ) => { ok: true } | { ok: false; error: string };
  recordClientSale: (input: RecordClientSaleInput) => { ok: true } | { ok: false; error: string };
  appendAudit: (entry: Omit<AuditLogEntry, 'id' | 'at'>) => void;
  markAuditRead: (auditId: string) => void;
  markAllAuditRead: () => void;
};

const WarehouseContext = createContext<WarehouseContextValue | null>(null);

export function WarehouseProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<WarehousePersisted>(() => empty());
  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    let active = true;
    (async () => {
      const loaded = await loadFromDb();
      if (!active) return;
      dataRef.current = loaded;
      setData(loaded);
    })();

    if (!isSupabaseConfigured) {
      return () => {
        active = false;
      };
    }

    const channel = supabase
      .channel('warehouse-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, async () => {
        const loaded = await loadFromDb();
        if (!active) return;
        dataRef.current = loaded;
        setData(loaded);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'debts' }, async () => {
        const loaded = await loadFromDb();
        if (!active) return;
        dataRef.current = loaded;
        setData(loaded);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'client_sales' }, async () => {
        const loaded = await loadFromDb();
        if (!active) return;
        dataRef.current = loaded;
        setData(loaded);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_log' }, async () => {
        const loaded = await loadFromDb();
        if (!active) return;
        dataRef.current = loaded;
        setData(loaded);
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const commit = useCallback((next: WarehousePersisted) => {
    const prev = dataRef.current;
    dataRef.current = next;
    setData(next);
    void syncRemote(prev, next);
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
        imageUrl: 'imageUrl' in input ? input.imageUrl : p.imageUrl,
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
    (input: Omit<Debt, 'id'>): { ok: true; debt: Debt } | { ok: false; error: string } => {
      const prev = dataRef.current;
      const stockByProductId = new Map(prev.products.map((product) => [product.id, product]));
      const requestedByProductId = new Map<string, number>();

      for (const row of input.products) {
        const qty = Number(row.quantity);
        if (!Number.isInteger(qty) || qty <= 0) {
          return { ok: false, error: 'Количество товара должно быть целым числом больше 0' };
        }
        const product = stockByProductId.get(row.productId);
        if (!product) {
          return { ok: false, error: `Товар не найден: ${row.productName}` };
        }
        requestedByProductId.set(row.productId, (requestedByProductId.get(row.productId) ?? 0) + qty);
      }

      for (const [productId, requestedQty] of requestedByProductId) {
        const product = stockByProductId.get(productId);
        if (!product) continue;
        if (requestedQty > product.quantity) {
          return { ok: false, error: `Недостаточно товара на складе: ${product.name}` };
        }
      }

      const debt: Debt = {
        ...input,
        debtHistory: input.debtHistory ?? [],
        paymentHistory: input.paymentHistory ?? [],
        id: uid(),
      };

      const today = new Date().toISOString().slice(0, 10);
      const updatedProducts = prev.products.map((product) => {
        const requestedQty = requestedByProductId.get(product.id);
        if (!requestedQty) return product;
        const nextQty = product.quantity - requestedQty;
        return {
          ...product,
          quantity: nextQty,
          status: deriveProductStatus(nextQty),
          history: [
            {
              date: today,
              action: 'Removed',
              quantity: -requestedQty,
              user: input.fullName.trim() || '—',
            },
            ...product.history,
          ],
        };
      });

      commit({ ...prev, products: updatedProducts, debts: [...prev.debts, debt] });
      return { ok: true, debt };
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

  const updateDebtorProfile = useCallback(
    (debtId: string, input: UpdateDebtorProfileInput): { ok: true } | { ok: false; error: string } => {
      const prev = dataRef.current;
      const d = prev.debts.find((x) => x.id === debtId);
      if (!d) return { ok: false, error: 'Долг не найден' };
      const next: Debt = {
        ...d,
        ...(input.fullName !== undefined && { fullName: input.fullName.trim() }),
        ...(input.phone !== undefined && { phone: input.phone.trim() }),
        ...(input.company !== undefined && { company: input.company.trim() || undefined }),
      };
      commit({
        ...prev,
        debts: prev.debts.map((x) => (x.id === debtId ? next : x)),
      });
      return { ok: true };
    },
    [commit]
  );

  const updateDebtSchedule = useCallback(
    (debtId: string, input: UpdateDebtScheduleInput): { ok: true } | { ok: false; error: string } => {
      const prev = dataRef.current;
      const d = prev.debts.find((x) => x.id === debtId);
      if (!d) return { ok: false, error: 'Долг не найден' };
      const issueDate = (input.issueDate ?? d.issueDate).trim().slice(0, 10);
      const dueDate = (input.dueDate ?? d.dueDate).trim().slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(issueDate) || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
        return { ok: false, error: 'Укажите даты в формате ГГГГ-ММ-ДД' };
      }
      if (dueDate < issueDate) {
        return { ok: false, error: 'Срок оплаты не может быть раньше даты выдачи' };
      }
      const status = debtStatusAfterPayment(d.remainingAmount, d.paidAmount, dueDate);
      const next: Debt = { ...d, issueDate, dueDate, status };
      commit({
        ...prev,
        debts: prev.debts.map((x) => (x.id === debtId ? next : x)),
      });
      return { ok: true };
    },
    [commit]
  );

  const updateDebtHistoryEntry = useCallback(
    (
      debtId: string,
      entryId: string,
      input: UpdateDebtHistoryInput
    ): { ok: true } | { ok: false; error: string } => {
      const prev = dataRef.current;
      const d = prev.debts.find((x) => x.id === debtId);
      if (!d) return { ok: false, error: 'Долг не найден' };
      const list = d.debtHistory ?? [];
      if (!list.some((e) => e.id === entryId)) return { ok: false, error: 'Запись не найдена' };

      let merged = list.map((e) => {
        if (e.id !== entryId) return e;
        return {
          ...e,
          ...(input.date !== undefined && { date: input.date }),
          ...(input.personName !== undefined && { personName: input.personName }),
          ...(input.company !== undefined && { company: input.company }),
          ...(input.productId !== undefined && { productId: input.productId }),
          ...(input.productName !== undefined && { productName: input.productName }),
        };
      });

      const sorted = sortDebtHistoryChronological(merged);
      const pos = sorted.findIndex((e) => e.id === entryId);
      if (pos === -1) return { ok: false, error: 'Запись не найдена' };

      const paidBefore = sorted.slice(0, pos).reduce((sum, e) => sum + Number(e.amount), 0);
      const remainingBefore = Math.max(0, d.totalAmount - paidBefore);

      let nextAmount = Number(sorted[pos].amount);
      if (input.repaymentMode === 'full') {
        nextAmount = remainingBefore;
      } else if (input.amount !== undefined) {
        nextAmount = input.amount;
      }

      if (!Number.isFinite(nextAmount) || nextAmount < 0) {
        return { ok: false, error: 'Некорректная сумма' };
      }
      if (nextAmount > remainingBefore + 0.01) {
        return { ok: false, error: 'Сумма больше остатка на момент этой операции' };
      }

      merged = merged.map((e) => (e.id === entryId ? { ...e, amount: nextAmount } : e));

      const totalPaid = sortDebtHistoryChronological(merged).reduce((sum, e) => sum + Number(e.amount), 0);
      if (totalPaid > d.totalAmount + 0.01) {
        return { ok: false, error: 'Сумма оплат не может превышать сумму долга' };
      }

      const updated = rebuildDebtFromHistoryEntries(d, merged);
      commit({
        ...prev,
        debts: prev.debts.map((x) => (x.id === debtId ? updated : x)),
      });
      return { ok: true };
    },
    [commit]
  );

  const recordClientSale = useCallback(
    (input: RecordClientSaleInput): { ok: true } | { ok: false; error: string } => {
      const qty = Number(input.quantity);
      if (!Number.isInteger(qty) || qty <= 0) {
        return { ok: false, error: 'Количество должно быть целым числом больше 0' };
      }
      const prev = dataRef.current;
      const p = prev.products.find((x) => x.id === input.productId);
      if (!p) return { ok: false, error: 'Товар не найден' };
      if (qty > p.quantity) {
        return { ok: false, error: `Недостаточно товара на складе: ${p.name}` };
      }
      const amountUzs = qty * p.price;
      const today = new Date().toISOString().slice(0, 10);
      const sale: ClientSale = {
        id: uid(),
        fullName: input.fullName.trim(),
        phone: (input.phone ?? '').trim() || '—',
        company: input.company?.trim() || undefined,
        productId: p.id,
        productName: p.name,
        quantity: qty,
        amountUzs,
        date: today,
        createdByUserId: input.createdByUserId,
        createdByRole: input.createdByRole,
      };
      const nextQty = p.quantity - qty;
      const updated: Product = {
        ...p,
        quantity: nextQty,
        status: deriveProductStatus(nextQty),
        history: [
          {
            date: today,
            action: 'Removed',
            quantity: -qty,
            user: input.fullName.trim() || '—',
          },
          ...p.history,
        ],
      };
      commit({
        ...prev,
        products: prev.products.map((x) => (x.id === input.productId ? updated : x)),
        clientSales: [sale, ...(prev.clientSales ?? [])],
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

  const markAllAuditRead = useCallback(() => {
    const prev = dataRef.current;
    const allIds = prev.auditLog.map((row) => row.id);
    if (allIds.length === 0) return;
    commit({ ...prev, readAuditIds: allIds });
  }, [commit]);

  const value = useMemo(
    () => ({
      ...data,
      addProduct,
      updateProduct,
      deleteProduct,
      addProductInbound,
      addDebt,
      applyDebtPayment,
      updateDebtorProfile,
      updateDebtSchedule,
      updateDebtHistoryEntry,
      recordClientSale,
      appendAudit,
      markAuditRead,
      markAllAuditRead,
    }),
    [
      data,
      addProduct,
      updateProduct,
      deleteProduct,
      addProductInbound,
      addDebt,
      applyDebtPayment,
      updateDebtorProfile,
      updateDebtSchedule,
      updateDebtHistoryEntry,
      recordClientSale,
      appendAudit,
      markAuditRead,
      markAllAuditRead,
    ]
  );

  return <WarehouseContext.Provider value={value}>{children}</WarehouseContext.Provider>;
}

export function useWarehouse(): WarehouseContextValue {
  const ctx = useContext(WarehouseContext);
  if (!ctx) throw new Error('useWarehouse must be used within WarehouseProvider');
  return ctx;
}
