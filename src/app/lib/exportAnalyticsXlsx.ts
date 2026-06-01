import * as XLSX from 'xlsx';

const SHEET = {
  summary: 'Summary',
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
};

function safeSheetName(name: string): string {
  return name.replace(/[:\\/?*[\]]/g, '-').slice(0, 31) || 'Sheet';
}

function toDMY(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

/** Скачивает книгу Excel с данными аналитики за выбранный период. */
export function exportAnalyticsToXlsx(input: AnalyticsExportInput): void {
  const { t, startDate, endDate, stats } = input;

  const wb = XLSX.utils.book_new();

  const summaryRows: (string | number)[][] = [
    [t('analytics.pageTitle')],
    [`${t('analytics.periodStart')}: ${toDMY(startDate)}`, `${t('analytics.periodEnd')}: ${toDMY(endDate)}`],
    [],
    [t('analytics.cardWarehouseValue'), stats.totalWarehouseValue],
    [t('analytics.cardCollected'), stats.collectedInRange],
    [t('analytics.cardDebts'), stats.totalDebtsRemaining],
    [t('analytics.cardOps'), stats.operationsInRange],
    [t('analytics.exportOverdueLabel'), stats.overdueDebts],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryRows), safeSheetName(SHEET.summary));

  const filename = `analytics_${startDate}_${endDate}.xlsx`;
  XLSX.writeFile(wb, filename);
}
