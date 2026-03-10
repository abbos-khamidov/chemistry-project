export interface Product {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  price: number;
  supplier: string;
  expirationDate: string;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  notes?: string;
  history: Array<{
    date: string;
    action: string;
    quantity: number;
    user: string;
  }>;
}

export interface Debt {
  id: string;
  fullName: string;
  phone: string;
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
  email: string;
  role: 'owner' | 'manager' | 'worker';
  status: 'active' | 'inactive';
  lastActivity: string;
}

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Sulfuric Acid 98%',
    category: 'Chemicals',
    quantity: 150,
    unit: 'L',
    price: 45000,
    supplier: 'ChemSupply Co.',
    expirationDate: '2026-12-31',
    status: 'in-stock',
    notes: 'Handle with care, requires special storage',
    history: [
      { date: '2026-03-05', action: 'Added', quantity: 50, user: 'Admin' },
      { date: '2026-03-01', action: 'Removed', quantity: -20, user: 'Manager' },
      { date: '2026-02-28', action: 'Added', quantity: 120, user: 'Admin' },
    ],
  },
  {
    id: '2',
    name: 'Safety Gloves Industrial',
    category: 'Safety Equipment',
    quantity: 25,
    unit: 'pairs',
    price: 15000,
    supplier: 'SafetyFirst Ltd.',
    expirationDate: '2027-06-30',
    status: 'low-stock',
    history: [
      { date: '2026-03-06', action: 'Removed', quantity: -10, user: 'Worker' },
      { date: '2026-02-15', action: 'Added', quantity: 35, user: 'Manager' },
    ],
  },
  {
    id: '3',
    name: 'Ethanol 96%',
    category: 'Chemicals',
    quantity: 0,
    unit: 'L',
    price: 38000,
    supplier: 'ChemSupply Co.',
    expirationDate: '2026-09-30',
    status: 'out-of-stock',
    history: [
      { date: '2026-03-04', action: 'Removed', quantity: -50, user: 'Manager' },
      { date: '2026-02-20', action: 'Added', quantity: 50, user: 'Admin' },
    ],
  },
  {
    id: '4',
    name: 'Sodium Hydroxide Pellets',
    category: 'Chemicals',
    quantity: 200,
    unit: 'kg',
    price: 12000,
    supplier: 'Industrial Chem',
    expirationDate: '2028-01-15',
    status: 'in-stock',
    history: [
      { date: '2026-03-01', action: 'Added', quantity: 100, user: 'Admin' },
      { date: '2026-02-25', action: 'Added', quantity: 100, user: 'Admin' },
    ],
  },
  {
    id: '5',
    name: 'Protective Masks N95',
    category: 'Safety Equipment',
    quantity: 15,
    unit: 'boxes',
    price: 85000,
    supplier: 'SafetyFirst Ltd.',
    expirationDate: '2027-12-31',
    status: 'low-stock',
    history: [
      { date: '2026-03-05', action: 'Removed', quantity: -5, user: 'Worker' },
      { date: '2026-02-10', action: 'Added', quantity: 20, user: 'Manager' },
    ],
  },
  {
    id: '6',
    name: 'Hydrogen Peroxide 30%',
    category: 'Chemicals',
    quantity: 80,
    unit: 'L',
    price: 28000,
    supplier: 'ChemSupply Co.',
    expirationDate: '2026-08-20',
    status: 'in-stock',
    history: [
      { date: '2026-03-03', action: 'Added', quantity: 80, user: 'Admin' },
    ],
  },
];

export const mockDebts: Debt[] = [
  {
    id: '1',
    fullName: 'Aliyev Sardor',
    phone: '+998 90 123 45 67',
    totalAmount: 2500000,
    paidAmount: 1000000,
    remainingAmount: 1500000,
    issueDate: '2026-02-15',
    dueDate: '2026-03-15',
    status: 'active',
    products: [
      { productId: '1', productName: 'Sulfuric Acid 98%', quantity: 30, price: 45000 },
      { productId: '4', productName: 'Sodium Hydroxide Pellets', quantity: 50, price: 12000 },
    ],
    notes: 'Regular customer, payment plan agreed',
    paymentHistory: [
      { date: '2026-02-20', amount: 500000, method: 'Cash' },
      { date: '2026-02-28', amount: 500000, method: 'Transfer' },
    ],
  },
  {
    id: '2',
    fullName: 'Karimova Dilnoza',
    phone: '+998 91 234 56 78',
    totalAmount: 1200000,
    paidAmount: 0,
    remainingAmount: 1200000,
    issueDate: '2026-02-01',
    dueDate: '2026-03-01',
    status: 'overdue',
    products: [
      { productId: '6', productName: 'Hydrogen Peroxide 30%', quantity: 40, price: 28000 },
    ],
    notes: 'Follow up required',
    paymentHistory: [],
  },
  {
    id: '3',
    fullName: 'Rahimov Jamshid',
    phone: '+998 93 345 67 89',
    totalAmount: 850000,
    paidAmount: 850000,
    remainingAmount: 0,
    issueDate: '2026-01-10',
    dueDate: '2026-02-10',
    status: 'paid',
    products: [
      { productId: '2', productName: 'Safety Gloves Industrial', quantity: 50, price: 15000 },
      { productId: '5', productName: 'Protective Masks N95', quantity: 2, price: 85000 },
    ],
    paymentHistory: [
      { date: '2026-02-05', amount: 850000, method: 'Cash' },
    ],
  },
  {
    id: '4',
    fullName: 'Tursunova Nigora',
    phone: '+998 94 456 78 90',
    totalAmount: 540000,
    paidAmount: 200000,
    remainingAmount: 340000,
    issueDate: '2026-02-20',
    dueDate: '2026-03-20',
    status: 'partial',
    products: [
      { productId: '4', productName: 'Sodium Hydroxide Pellets', quantity: 45, price: 12000 },
    ],
    paymentHistory: [
      { date: '2026-02-25', amount: 200000, method: 'Transfer' },
    ],
  },
];

export const mockUsers: User[] = [
  {
    id: '1',
    fullName: 'Karimov Otabek',
    phone: '+998 90 111 22 33',
    email: 'otabek@warehouse.uz',
    role: 'owner',
    status: 'active',
    lastActivity: '2026-03-07 09:30',
  },
  {
    id: '2',
    fullName: 'Abdullayeva Malika',
    phone: '+998 91 222 33 44',
    email: 'malika@warehouse.uz',
    role: 'manager',
    status: 'active',
    lastActivity: '2026-03-07 08:15',
  },
  {
    id: '3',
    fullName: 'Nizomov Jasur',
    phone: '+998 93 333 44 55',
    email: 'jasur@warehouse.uz',
    role: 'worker',
    status: 'active',
    lastActivity: '2026-03-06 17:45',
  },
  {
    id: '4',
    fullName: 'Yusupova Sevara',
    phone: '+998 94 444 55 66',
    email: 'sevara@warehouse.uz',
    role: 'worker',
    status: 'inactive',
    lastActivity: '2026-02-28 14:20',
  },
];

// Current logged in user (for demo purposes)
export const currentUser: User = mockUsers[0];

// Dashboard statistics
export const dashboardStats = {
  totalProducts: 6,
  lowStockItems: 2,
  warehouseValue: 15850000,
  monthlyOperations: 24,
  activeDebts: 2,
  overdueDebts: 1,
  totalDebtAmount: 4090000,
  collectedThisMonth: 2050000,
};

// Recent activity
export const recentActivity = [
  { id: '1', action: 'Added product', item: 'Hydrogen Peroxide 30%', user: 'Admin', time: '2 hours ago' },
  { id: '2', action: 'Payment received', item: 'Tursunova Nigora - 200,000 UZS', user: 'Manager', time: '4 hours ago' },
  { id: '3', action: 'Stock updated', item: 'Protective Masks N95 -5 boxes', user: 'Worker', time: '5 hours ago' },
  { id: '4', action: 'New debt created', item: 'Aliyev Sardor - 2,500,000 UZS', user: 'Manager', time: '1 day ago' },
  { id: '5', action: 'Product removed', item: 'Ethanol 96% -50L', user: 'Manager', time: '2 days ago' },
];
