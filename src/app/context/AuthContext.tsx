import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { User } from '../data/mockData';
import {
  clearSessionCookie,
  getSessionUserIdFromCookie,
  setSessionCookie,
} from '../lib/sessionCookie';

const STORAGE_USERS = 'warehouse-auth-users-v3';
const STORAGE_SESSION_LEGACY = 'warehouse-auth-session-v2';

type AuthResult =
  | { ok: true; role: 'director' | 'worker' }
  | { ok: false; error?: string };

export type CreateWorkerInput = {
  fullName: string;
  phone: string;
  username: string;
  password: string;
};

type StoredAccount = User & { password: string };

const USERNAME_RE = /^[a-zA-Z0-9_.-]{2,32}$/;

function migrateRole(role: string): 'director' | 'worker' {
  const r = role.toLowerCase();
  if (r === 'admin' || r === 'manager' || r === 'director') return 'director';
  return 'worker';
}

/** Директор: логин diyor, пароль 1234 */
function seedAccounts(): StoredAccount[] {
  return [
    {
      id: '1',
      fullName: 'Karimov Otabek',
      phone: '+998 90 111 22 33',
      username: 'diyor',
      role: 'director',
      status: 'active',
      lastActivity: new Date().toISOString().slice(0, 16).replace('T', ' '),
      password: '1234',
    },
  ];
}

function normalizeStored(a: unknown): StoredAccount {
  const x = a as Record<string, unknown>;
  const role = migrateRole(String(x.role ?? 'worker'));
  const legacyEmail = x.email != null ? String(x.email) : '';
  let username = (x.username != null ? String(x.username) : '').trim().toLowerCase();
  if (!username && legacyEmail) {
    const e = legacyEmail.toLowerCase();
    username = e.includes('@') ? e.split('@')[0].trim() : e.trim();
  }
  if (!username) username = `u${String(x.id ?? '').replace(/\W/g, '') || '1'}`;
  return {
    id: String(x.id ?? ''),
    fullName: String(x.fullName ?? ''),
    phone: String(x.phone ?? ''),
    username,
    role,
    status: x.status === 'inactive' ? 'inactive' : 'active',
    lastActivity: String(x.lastActivity ?? ''),
    password: String(x.password ?? ''),
  };
}

function loadAccounts(): StoredAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_USERS);
    if (!raw) {
      const legacy = localStorage.getItem('warehouse-auth-users-v2');
      if (legacy) {
        const parsed = JSON.parse(legacy) as unknown[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const migrated = parsed.map(normalizeStored);
          const seen = new Set<string>();
          for (const acc of migrated) {
            let u = acc.username;
            while (seen.has(u)) {
              u = `${acc.username}_${acc.id.slice(-4)}`;
            }
            acc.username = u;
            seen.add(u);
          }
          saveAccounts(migrated);
          try {
            localStorage.removeItem('warehouse-auth-users-v2');
          } catch {
            /* ignore */
          }
          return migrated;
        }
      }
      return seedAccounts();
    }
    const parsed = JSON.parse(raw) as unknown[];
    if (!Array.isArray(parsed) || parsed.length === 0) return seedAccounts();
    const list = parsed.map(normalizeStored);
    const seen = new Set<string>();
    let changed = false;
    for (const acc of list) {
      let u = acc.username;
      while (seen.has(u)) {
        u = `${acc.username}_${acc.id.slice(-4)}`;
        changed = true;
      }
      if (u !== acc.username) {
        acc.username = u;
        changed = true;
      }
      seen.add(acc.username);
    }
    if (changed) saveAccounts(list);
    return list;
  } catch {
    return seedAccounts();
  }
}

function saveAccounts(accounts: StoredAccount[]) {
  localStorage.setItem(STORAGE_USERS, JSON.stringify(accounts));
}

function normalizeLogin(s: string): string {
  return s.trim().toLowerCase();
}

function findAccount(accounts: StoredAccount[], login: string): StoredAccount | undefined {
  const key = normalizeLogin(login);
  return accounts.find((a) => {
    if (normalizeLogin(a.username) === key) return true;
    return false;
  });
}

function stripPassword(u: StoredAccount): User {
  const { password: _p, ...rest } = u;
  return rest;
}

function readInitialSessionUserId(): string | null {
  if (typeof window === 'undefined') return null;
  let id = getSessionUserIdFromCookie();
  if (!id) {
    id = localStorage.getItem(STORAGE_SESSION_LEGACY);
    if (id) {
      setSessionCookie(id);
      localStorage.removeItem(STORAGE_SESSION_LEGACY);
    }
  }
  return id;
}

type AuthContextValue = {
  user: User | null;
  workers: User[];
  login: (username: string, password: string) => AuthResult;
  logout: () => void;
  createWorkerAccount: (director: User | null, input: CreateWorkerInput) => AuthResult;
  setWorkerStatus: (director: User | null, workerId: string, status: 'active' | 'inactive') => AuthResult;
  deleteWorkerAccount: (director: User | null, workerId: string) => AuthResult;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<StoredAccount[]>(() =>
    typeof window !== 'undefined' ? loadAccounts() : seedAccounts()
  );
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const id = readInitialSessionUserId();
      if (!id) return null;
      const list = loadAccounts();
      const acc = list.find((a) => a.id === id);
      return acc ? stripPassword(acc) : null;
    } catch {
      return null;
    }
  });

  const workers = useMemo(
    () => accounts.filter((a) => a.role === 'worker').map(stripPassword),
    [accounts]
  );

  const persistSession = useCallback((next: User | null) => {
    if (next) {
      setSessionCookie(next.id);
      localStorage.removeItem(STORAGE_SESSION_LEGACY);
    } else {
      clearSessionCookie();
      localStorage.removeItem(STORAGE_SESSION_LEGACY);
    }
  }, []);

  const login = useCallback(
    (username: string, password: string): AuthResult => {
      const list = loadAccounts();
      const acc = findAccount(list, username);
      if (!acc || acc.password !== password) {
        return { ok: false, error: 'Неверный логин или пароль' };
      }
      if (acc.status === 'inactive') {
        return { ok: false, error: 'Учётная запись отключена' };
      }
      const publicUser = stripPassword(acc);
      setUser(publicUser);
      persistSession(publicUser);
      setAccounts(loadAccounts());
      return { ok: true, role: acc.role };
    },
    [persistSession]
  );

  const setWorkerStatus = useCallback(
    (director: User | null, workerId: string, status: 'active' | 'inactive'): AuthResult => {
      if (!director || director.role !== 'director') {
        return { ok: false, error: 'Статус меняет только директор' };
      }
      const list = loadAccounts();
      const idx = list.findIndex((a) => a.id === workerId);
      if (idx === -1 || list[idx].role !== 'worker') {
        return { ok: false, error: 'Рабочий не найден' };
      }
      const next = [...list];
      next[idx] = { ...next[idx], status };
      saveAccounts(next);
      setAccounts(next);
      return { ok: true, role: 'worker' };
    },
    []
  );

  const deleteWorkerAccount = useCallback((director: User | null, workerId: string): AuthResult => {
    if (!director || director.role !== 'director') {
      return { ok: false, error: 'Удалять учётные записи может только директор' };
    }
    if (director.id === workerId) {
      return { ok: false, error: 'Нельзя удалить свою учётную запись' };
    }
    const list = loadAccounts();
    const target = list.find((a) => a.id === workerId);
    if (!target || target.role !== 'worker') {
      return { ok: false, error: 'Рабочий не найден' };
    }
    const next = list.filter((a) => a.id !== workerId);
    saveAccounts(next);
    setAccounts(next);
    return { ok: true, role: 'worker' };
  }, []);

  const createWorkerAccount = useCallback(
    (director: User | null, input: CreateWorkerInput): AuthResult => {
      if (!director || director.role !== 'director') {
        return { ok: false, error: 'Учётные записи создаёт только директор' };
      }
      const uname = input.username.trim().toLowerCase();
      if (!USERNAME_RE.test(uname)) {
        return {
          ok: false,
          error: 'Логин: 2–32 символа, латиница, цифры, точка, дефис, подчёркивание',
        };
      }
      const list = loadAccounts();
      if (list.some((a) => a.username.toLowerCase() === uname)) {
        return { ok: false, error: 'Такой логин уже занят' };
      }
      if (input.password.length < 4) {
        return { ok: false, error: 'Пароль не короче 4 символов' };
      }
      const id = `w-${Date.now()}`;
      const acc: StoredAccount = {
        id,
        fullName: input.fullName.trim(),
        phone: input.phone.trim(),
        username: uname,
        role: 'worker',
        status: 'active',
        lastActivity: new Date().toISOString().slice(0, 16).replace('T', ' '),
        password: input.password,
      };
      const next = [...list, acc];
      saveAccounts(next);
      setAccounts(next);
      return { ok: true, role: 'worker' };
    },
    []
  );

  const logout = useCallback(() => {
    setUser(null);
    persistSession(null);
  }, [persistSession]);

  const value = useMemo(
    () => ({
      user,
      workers,
      login,
      logout,
      createWorkerAccount,
      setWorkerStatus,
      deleteWorkerAccount,
    }),
    [user, workers, login, logout, createWorkerAccount, setWorkerStatus, deleteWorkerAccount]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
