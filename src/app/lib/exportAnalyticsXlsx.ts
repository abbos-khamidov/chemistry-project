import * as XLSX from 'xlsx';

const SHEET = {
  summary: 'Summary',
  monthly: 'Monthly',
  categories: 'Categories',
  debts: 'Debts',
  top: 'Top products',
} as const;

export type AnalyticsExportInput = {
  startDate: string;
  endDate: string;
  t: (key: string) => string;
  stats: {
    totalWarehouseValue: number;
    totalDebtsRemaining: number;
    collectedInRange: number;
    operationsInRange: number;
    overdueDebts: number;
  };
  monthlyInventoryData: Array<{ month: string; value: number; operations: number }>;
  debtAnalytics: Array<{ month: string; paid: number; unpaid: number }>;
  categoryDistribution: Array<{ name: string; value: number; percentage: number }>;
  topProducts: Array<{ name: string; quantity: number; value: number }>;
  totalWarehouseValue: number;
};

function safeSheetName(name: string): string {
  return name.replace(/[:\\/?*[\]]/g, '-').slice(0, 31) || 'Sheet';
}

/** Скачивает книгу Excel с данными аналитики за выбранный период. */
export function exportAnalyticsToXlsx(input: AnalyticsExportInput): void {
  const {
    t,
    startDate,
    endDate,
    stats,
    monthlyInventoryData,
    debtAnalytics,
    categoryDistribution,
    topProducts,
    totalWarehouseValue,
  } = input;

  const wb = XLSX.utils.book_new();

  const summaryRows: (string | number)[][] = [
    [t('analytics.pageTitle')],
    [`${t('analytics.periodStart')}: ${startDate}`, `${t('analytics.periodEnd')}: ${endDate}`],
    [],
    [t('analytics.cardWarehouseValue'), stats.totalWarehouseValue],
    [t('analytics.cardCollected'), stats.collectedInRange],
    [t('analytics.cardDebts'), stats.totalDebtsRemaining],
    [t('analytics.cardOps'), stats.operationsInRange],
    [t('analytics.exportOverdueLabel'), stats.overdueDebts],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryRows), safeSheetName(SHEET.summary));

  const invHeader = [t('analytics.exportColMonth'), t('analytics.lineTurnover'), t('analytics.tooltipOps')];
  const invBody = monthlyInventoryData.map((row) => [row.month, row.value, row.operations]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([invHeader, ...invBody]), safeSheetName(SHEET.monthly));

  const catHeader = [t('analytics.exportColCategory'), t('analytics.tooltipValue'), '%'];
  const catBody = categoryDistribution.map((row) => [row.name, row.value, row.percentage]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([catHeader, ...catBody]), safeSheetName(SHEET.categories));

  const debtHeader = [t('analytics.exportColMonth'), t('analytics.barPaid'), t('analytics.barUnpaid')];
  const debtBody = debtAnalytics.map((row) => [row.month, row.paid, row.unpaid]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([debtHeader, ...debtBody]), safeSheetName(SHEET.debts));

  const topHeader = [
    t('analytics.colNo'),
    t('analytics.colProduct'),
    t('analytics.colQty'),
    t('analytics.colValue'),
    t('analytics.colShare'),
  ];
  const topBody = topProducts.map((p, i) => {
    const share = totalWarehouseValue > 0 ? Number(((p.value / totalWarehouseValue) * 100).toFixed(1)) : 0;
    return [i + 1, p.name, p.quantity, p.value, share];
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([topHeader, ...topBody]), safeSheetName(SHEET.top));

  const filename = `analytics_${startDate}_${endDate}.xlsx`;
  XLSX.writeFile(wb, filename);
}
