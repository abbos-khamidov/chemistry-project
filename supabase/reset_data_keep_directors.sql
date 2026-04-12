-- Очистка операционных данных склада. Учётные записи с role = 'director' сохраняются.
-- Выполнить в Supabase: SQL Editor → New query → вставить скрипт → Run.
-- После выполнения перезагрузите приложение (или дождитесь realtime-синхронизации).

BEGIN;

TRUNCATE TABLE
  public.audit_reads,
  public.audit_log,
  public.client_sales,
  public.debts,
  public.products,
  public.worker_kpis
RESTART IDENTITY;

DELETE FROM public.accounts
WHERE role <> 'director';

COMMIT;
