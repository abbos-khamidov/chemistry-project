import * as XLSX from 'xlsx';
import type { Product, ClientSale, Debt, User } from '../data/mockData';
import { formatPhoneDisplay } from './phone';
import { formatDateDotDMY } from './warehouseUtils';

const yn = (v: boolean | undefined): string => (v ? 'Да' : 'Нет');

function makeSheet(
  headers: string[],
  rows: (string | number | null)[][],
  widths: number[],
  freezeRows = 1,
): XLSX.WorkSheet {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = widths.map((w) => ({ wch: w }));
  ws['!views'] = [{ state: 'frozen', xSplit: 0, ySplit: freezeRows }];
  return ws;
}

function productStatusRu(status: string): string {
  switch (status) {
    case 'in-stock': return 'В наличии';
    case 'low-stock': return 'Мало';
    case 'out-of-stock': return 'Нет в наличии';
    default: return status;
  }
}

function debtStatusRu(status: string): string {
  switch (status) {
    case 'paid': return 'Оплачено';
    case 'active': return 'Активен';
    case 'partial': return 'Частично';
    case 'overdue': return 'Просрочен';
    default: return status;
  }
}

function roleRu(role: string): string {
  switch (role) {
    case 'director': return 'Директор';
    case 'assistant': return 'Ассистент';
    case 'worker': return 'Рабочий';
    default: return role;
  }
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function exportProductsToXlsx(products: Product[]): void {
  const headers = [
    '№', 'Название', 'Ед. изм.', 'Кол-во', 'Цена (UZS)',
    'Стоимость (UZS)', 'Поставщик', 'Срок годности', 'Статус', 'Примечания',
  ];

  const rows: (string | number | null)[][] = products.map((p, i) => [
    i + 1,
    p.name,
    p.unit,
    p.quantity,
    p.price,
    p.price * p.quantity,
    p.supplier || '',
    formatDateDotDMY(p.expirationDate),
    productStatusRu(p.status),
    p.notes || '',
  ]);

  const totalQty = products.reduce((s, p) => s + p.quantity, 0);
  const totalValue = products.reduce((s, p) => s + p.price * p.quantity, 0);
  rows.push(['Итого', '', '', totalQty, '', totalValue, '', '', '', '']);

  const widths = [5, 32, 10, 10, 16, 18, 25, 16, 14, 32];
  const ws = makeSheet(headers, rows, widths);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Товары');
  XLSX.writeFile(wb, `products_${todayStr()}.xlsx`);
}

export function exportClientsToXlsx(sales: ClientSale[]): void {
  const headers = ['№', 'Дата', 'ФИО', 'Телефон', 'Компания', 'Товар', 'Кол-во', 'Сумма (UZS)'];

  const rows: (string | number | null)[][] = sales.map((r, i) => [
    i + 1,
    formatDateDotDMY(r.date),
    r.fullName,
    formatPhoneDisplay(r.phone),
    r.company || '',
    r.productName,
    r.quantity,
    r.amountUzs,
  ]);

  const totalQty = sales.reduce((s, r) => s + r.quantity, 0);
  const totalAmount = sales.reduce((s, r) => s + r.amountUzs, 0);
  rows.push(['Итого', '', '', '', '', '', totalQty, totalAmount]);

  const widths = [5, 14, 26, 18, 22, 26, 10, 18];
  const ws = makeSheet(headers, rows, widths);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Клиенты');
  XLSX.writeFile(wb, `clients_${todayStr()}.xlsx`);
}

export function exportDebtsToXlsx(debts: Debt[]): void {
  const activeCount = debts.filter((d) => d.status === 'active' || d.status === 'partial').length;
  const overdueCount = debts.filter((d) => d.status === 'overdue').length;
  const totalRemaining = debts.reduce((s, d) => s + d.remainingAmount, 0);
  const totalPaid = debts.reduce((s, d) => s + d.paidAmount, 0);
  const totalIssued = debts.reduce((s, d) => s + d.totalAmount, 0);

  const summaryBlock: (string | number | null)[][] = [
    ['Активных / частичных:', activeCount, '', '', '', '', '', '', '', '', '', ''],
    ['Просроченных:', overdueCount, '', '', '', '', '', '', '', '', '', ''],
    ['Выдано всего (UZS):', totalIssued, '', '', '', '', '', '', '', '', '', ''],
    ['Оплачено (UZS):', totalPaid, '', '', '', '', '', '', '', '', '', ''],
    ['Остаток (UZS):', totalRemaining, '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', ''],
  ];

  const headers = [
    '№', 'ФИО', 'Телефон', 'Компания', 'Выдан', 'Срок оплаты',
    'Товары', 'Выдано (UZS)', 'Оплачено (UZS)', 'Остаток (UZS)', 'Статус', 'Примечания',
  ];

  const dataRows: (string | number | null)[][] = debts.map((d, i) => {
    const productsText = d.products.map((p) => `${p.productName} ×${p.quantity}`).join(', ');
    return [
      i + 1,
      d.fullName,
      formatPhoneDisplay(d.phone),
      d.company || '',
      formatDateDotDMY(d.issueDate),
      formatDateDotDMY(d.dueDate),
      productsText,
      d.totalAmount,
      d.paidAmount,
      d.remainingAmount,
      debtStatusRu(d.status),
      d.notes || '',
    ];
  });

  dataRows.push(['Итого', '', '', '', '', '', '', totalIssued, totalPaid, totalRemaining, '', '']);

  const allRows = [...summaryBlock, headers, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(allRows);
  const widths = [5, 26, 18, 22, 14, 14, 38, 18, 18, 18, 14, 32];
  ws['!cols'] = widths.map((w) => ({ wch: w }));
  // Freeze after 7th row (6 summary rows + 1 header)
  ws['!views'] = [{ state: 'frozen', xSplit: 0, ySplit: 7 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Должники');
  XLSX.writeFile(wb, `debts_${todayStr()}.xlsx`);
}

export function exportWorkersToXlsx(workers: User[]): void {
  const headers = [
    '№', 'ФИО', 'Телефон', 'Логин', 'Роль', 'Статус',
    'Аналитика', 'Добавлять товары', 'Ред. товары', 'Должники', 'Управление персоналом',
  ];

  const rows: (string | number | null)[][] = workers.map((w, i) => {
    const isWorker = w.role === 'worker';
    return [
      i + 1,
      w.fullName,
      formatPhoneDisplay(w.phone),
      w.username,
      roleRu(w.role),
      w.status === 'active' ? 'Активен' : 'Отключён',
      yn(w.permissions?.analytics),
      yn(w.permissions?.addProducts ?? isWorker),
      yn(w.permissions?.editProducts ?? isWorker),
      yn(w.permissions?.viewDebts ?? true),
      yn(w.permissions?.manageStaff),
    ];
  });

  const widths = [5, 26, 18, 20, 14, 12, 12, 16, 14, 12, 22];
  const ws = makeSheet(headers, rows, widths);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Сотрудники');
  XLSX.writeFile(wb, `workers_${todayStr()}.xlsx`);
}
