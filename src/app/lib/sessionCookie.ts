/** Сессия входа: id пользователя, до 10 дней. */
export const SESSION_COOKIE_NAME = 'warehouse-auth-session';
const SESSION_MAX_DAYS = 10;

export function getSessionUserIdFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(
    new RegExp(`(?:^|; )${SESSION_COOKIE_NAME.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=([^;]*)`)
  );
  return m ? decodeURIComponent(m[1]) : null;
}

export function setSessionCookie(userId: string): void {
  if (typeof document === 'undefined') return;
  const maxAge = SESSION_MAX_DAYS * 24 * 60 * 60;
  document.cookie = `${SESSION_COOKIE_NAME}=${encodeURIComponent(userId)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function clearSessionCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${SESSION_COOKIE_NAME}=; path=/; max-age=0`;
}
