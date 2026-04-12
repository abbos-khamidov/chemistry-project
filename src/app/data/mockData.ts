export interface Product {
  id: string;
  name: string;
  /** Опциональное фото (data URL или URL) */
  imageUrl?: string;
  category: string;
  /** Категория на узбекском */
  categoryUz?: string;
  quantity: number;
  unit: string;
  price: number;
  supplier: string;
  expirationDate: string;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  notes?: string;
  /** Кому отправляет — заполняет рабочий при оформлении */
  shipmentRecipient?: {
    firstName: string;
    lastName: string;
    phone: string;
    company: string;
  };
  history: Array<{
    date: string;
    action: string;
    quantity: number;
    user: string;
  }>;
}

/** Одна операция погашения в истории долга */
export interface DebtHistoryEntry {
  id: string;
  date: string;
  /** Фамилия и имя (кто внёс оплату / контакт) */
  personName: string;
  company: string;
  amount: number;
  productId: string;
  productName: string;
  /** Остаток долга после этой операции */
  remainingAfter: number;
  /** Долг закрыт полностью */
  fullyPaid: boolean;
  /** Доля оплачено от общей суммы долга, % (накопительно после операции) */
  paidPercentOfTotal: number;
}

/** Оформление продажи клиенту (полная оплата, не долг) — учёт на вкладке «Клиенты». */
export interface ClientSale {
  id: string;
  fullName: string;
  phone: string;
  company?: string;
  productId: string;
  productName: string;
  quantity: number;
  amountUzs: number;
  /** День продажи (учёт). */
  date: string;
  /** Время создания записи (сортировка «новые сверху», несколько сделок в один день). */
  createdAt?: string;
  createdByUserId?: string;
  createdByRole?: 'director' | 'assistant' | 'worker';
}

export interface Debt {
  id: string;
  fullName: string;
  phone: string;
  /** ISO время создания записи долга (сортировка: новые сверху). */
  createdAt?: string;
  /** Компания должника */
  company?: string;
  /** Кто оформил: рабочий не может менять долг после сохранения (только просмотр) */
  createdByRole?: 'director' | 'assistant' | 'worker';
  createdByUserId?: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  issueDate: string;
  dueDate: string;
  status: 'active' | 'overdue' | 'paid' | 'partial';
  products: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  notes?: string;
  /** Подробная история погашений */
  debtHistory: DebtHistoryEntry[];
  paymentHistory: Array<{
    date: string;
    amount: number;
    method: string;
  }>;
}

export interface User {
  id: string;
  fullName: string;
  phone: string;
  /** Логин для входа (символы, не email) */
  username: string;
  role: 'director' | 'assistant' | 'worker';
  /** Права ассистента директора (для роли assistant). Директор всегда имеет полный доступ. */
  permissions?: {
    analytics?: boolean;
    addProducts?: boolean;
    editProducts?: boolean;
    issueDebt?: boolean;
    manageStaff?: boolean;
    viewDebts?: boolean;
    /** Редактирование карточки должника и истории погашений (только директор или выданное право ассистенту). */
    editDebtRecords?: boolean;
  };
  status: 'active' | 'inactive';
  lastActivity: string;
}

/** Стартовые данные пустые — заполняйте через интерфейс и localStorage. */
export const mockProducts: Product[] = [];

export const mockDebts: Debt[] = [];

export const mockUsers: User[] = [];

export const dashboardStats = {
  totalProducts: 0,
  lowStockItems: 0,
  warehouseValue: 0,
  monthlyOperations: 0,
  activeDebts: 0,
  overdueDebts: 0,
  totalDebtAmount: 0,
  collectedThisMonth: 0,
};

export const recentActivity: Array<{
  id: string;
  action: string;
  item: string;
  user: string;
  time: string;
}> = [];

export interface AuditLogEntry {
  id: string;
  at: string;
  userName: string;
  userRole: 'director' | 'assistant' | 'worker';
  action: string;
  entity: string;
  details: string;
  ip: string;
}

export const mockAuditLog: AuditLogEntry[] = [];

