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
  | { ok: true; role: 'director' | 'assistant' | 'worker' }
  | { ok: false; error?: string };

export type CreateWorkerInput = {
  fullName: string;
  phone: string;
  username: string;
  password: string;
};

export type CreateStaffInput = CreateWorkerInput & {
  role: 'worker' | 'assistant';
  permissions?: {
    analytics?: boolean;
    addProducts?: boolean;
    editProducts?: boolean;
    issueDebt?: boolean;
    manageStaff?: boolean;
  };
};

type StoredAccount = User & { password: string };

const USERNAME_RE = /^[a-zA-Z0-9_.-]{2,32}$/;

function migrateRole(role: string): 'director' | 'assistant' | 'worker' {
  const r = role.toLowerCase();
  if (r == 'assistant' || r == 'director_assistant') return 'assistant';
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
    permissions:
      x.permissions && typeof x.permissions === 'object'
        ? {
            analytics: Boolean((x.permissions as any).analytics),
            addProducts: Boolean((x.permissions as any).addProducts),
            editProducts: Boolean((x.permissions as any).editProducts),
            issueDebt: Boolean((x.permissions as any).issueDebt),
            manageStaff: Boolean((x.permissions as any).manageStaff),
          }
        : undefined,
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

function canManageStaffByRole(user: User | null): boolean {
  if (!user) return false;
  if (user.role === 'director') return true;
  if (user.role === 'assistant') return Boolean(user.permissions?.manageStaff);
  return false;
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

export type UpdateDirectorProfileInput = {
  fullName?: string;
  phone?: string;
  newUsername?: string;
  newPassword?: string;
  passwordConfirm?: string;
  currentPassword?: string;
};

export type UpdateWorkerCredentialsInput = {
  username?: string;
  password?: string;
};

export type UpdateStaffByDirectorInput = {
  fullName?: string;
  phone?: string;
  username?: string;
  password?: string;
  role?: 'worker' | 'assistant';
  permissions?: NonNullable<User['permissions']>;
};

type AuthContextValue = {
  user: User | null;
  workers: User[];
  login: (username: string, password: string) => AuthResult;
  logout: () => void;
  createWorkerAccount: (director: User | null, input: CreateWorkerInput) => AuthResult;
  createStaffAccount: (director: User | null, input: CreateStaffInput) => AuthResult;
  setWorkerStatus: (director: User | null, workerId: string, status: 'active' | 'inactive') => AuthResult;
  setStaffPermissionsByDirector: (director: User | null, staffId: string, permissions: NonNullable<User['permissions']>) => AuthResult;
  deleteWorkerAccount: (director: User | null, workerId: string) => AuthResult;
  updateDirectorProfile: (director: User | null, input: UpdateDirectorProfileInput) => AuthResult;
  updateWorkerCredentialsByDirector: (
    director: User | null,
    workerId: string,
    input: UpdateWorkerCredentialsInput,
  ) => AuthResult;
  updateStaffAccountByDirector: (
    director: User | null,
    staffId: string,
    input: UpdateStaffByDirectorInput,
  ) => AuthResult;
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
    () => accounts.filter((a) => a.role === 'worker' || a.role === 'assistant').map(stripPassword),
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
      if (!canManageStaffByRole(director)) {
        return { ok: false, error: 'Недостаточно прав для изменения статуса' };
      }
      const list = loadAccounts();
      const idx = list.findIndex((a) => a.id === workerId);
      if (idx === -1 || (list[idx].role !== 'worker' && list[idx].role !== 'assistant')) {
        return { ok: false, error: 'Сотрудник не найден' };
      }
      const next = [...list];
      next[idx] = { ...next[idx], status };
      saveAccounts(next);
      setAccounts(next);
      return { ok: true, role: list[idx].role };
    },
    []
  );

  const deleteWorkerAccount = useCallback((director: User | null, workerId: string): AuthResult => {
    if (!canManageStaffByRole(director)) {
      return { ok: false, error: 'Недостаточно прав для удаления учётных записей' };
    }
    if (director.id === workerId) {
      return { ok: false, error: 'Нельзя удалить свою учётную запись' };
    }
    const list = loadAccounts();
    const target = list.find((a) => a.id === workerId);
    if (!target || (target.role !== 'worker' && target.role !== 'assistant')) {
      return { ok: false, error: 'Сотрудник не найден' };
    }
    const next = list.filter((a) => a.id !== workerId);
    saveAccounts(next);
    setAccounts(next);
    return { ok: true, role: 'worker' };
  }, []);

  const createWorkerAccount = useCallback(
    (director: User | null, input: CreateWorkerInput): AuthResult => {
      if (!canManageStaffByRole(director)) {
        return { ok: false, error: 'Недостаточно прав для создания учётных записей' };
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
      return { ok: true, role: nextAcc.role };
    },
    []
  );


  const createStaffAccount = useCallback(
    (director: User | null, input: CreateStaffInput): AuthResult => {
      if (!canManageStaffByRole(director)) {
        return { ok: false, error: 'Недостаточно прав для создания учётных записей' };
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
      const role: 'worker' | 'assistant' = input.role;
      const acc: StoredAccount = {
        id,
        fullName: input.fullName.trim(),
        phone: input.phone.trim(),
        username: uname,
        role,
        permissions:
          role === 'assistant'
            ? {
                analytics: Boolean(input.permissions?.analytics),
                addProducts: Boolean(input.permissions?.addProducts),
                editProducts: Boolean(input.permissions?.editProducts),
                issueDebt: Boolean(input.permissions?.issueDebt),
                manageStaff: Boolean(input.permissions?.manageStaff),
              }
            : undefined,
        status: 'active',
        lastActivity: new Date().toISOString().slice(0, 16).replace('T', ' '),
        password: input.password,
      };
      const next = [...list, acc];
      saveAccounts(next);
      setAccounts(next);
      return { ok: true, role };
    },
    []
  );

  const setStaffPermissionsByDirector = useCallback(
    (director: User | null, staffId: string, permissions: NonNullable<User['permissions']>): AuthResult => {
      if (!canManageStaffByRole(director)) {
        return { ok: false, error: 'Недостаточно прав для изменения разрешений' };
      }
      const list = loadAccounts();
      const idx = list.findIndex((a) => a.id === staffId);
      if (idx == -1) return { ok: false, error: 'Сотрудник не найден' };
      if (list[idx].role !== 'assistant') {
        return { ok: false, error: 'Права доступны только для ассистента' };
      }
      const next = [...list];
      next[idx] = {
        ...next[idx],
        permissions: {
          analytics: Boolean(permissions.analytics),
          addProducts: Boolean(permissions.addProducts),
          editProducts: Boolean(permissions.editProducts),
          issueDebt: Boolean(permissions.issueDebt),
          manageStaff: Boolean(permissions.manageStaff),
        },
      };
      saveAccounts(next);
      setAccounts(next);
      if (user?.id === staffId) {
        setUser(stripPassword(next[idx]));
      }
      return { ok: true, role: 'assistant' };
    },
    [user?.id]
  );
  const logout = useCallback(() => {
    setUser(null);
    persistSession(null);
  }, [persistSession]);

  const updateDirectorProfile = useCallback(
    (director: User | null, input: UpdateDirectorProfileInput): AuthResult => {
      if (!director || director.role !== 'director') {
        return { ok: false, error: 'Профиль директора доступен только директору' };
      }
      const list = loadAccounts();
      const idx = list.findIndex((a) => a.id === director.id);
      if (idx === -1 || list[idx].role !== 'director') {
        return { ok: false, error: 'Учётная запись не найдена' };
      }
      const acc = list[idx];
      const nextU = input.newUsername != null ? input.newUsername.trim().toLowerCase() : undefined;
      const wantUser = nextU !== undefined && nextU !== '';
      const usernameChanged = wantUser && nextU !== acc.username.toLowerCase();
      const pwd = input.newPassword;
      const wantPwd = pwd != null && pwd !== '';
      const passwordChanged = wantPwd;

      if (usernameChanged || passwordChanged) {
        const cur = input.currentPassword ?? '';
        if (!cur) {
          return { ok: false, error: 'Введите текущий пароль для смены логина или пароля' };
        }
        if (cur !== acc.password) {
          return { ok: false, error: 'Неверный текущий пароль' };
        }
        if (usernameChanged) {
          if (!USERNAME_RE.test(nextU!)) {
            return {
              ok: false,
              error: 'Логин: 2–32 символа, латиница, цифры, точка, дефис, подчёркивание',
            };
          }
          if (list.some((a, i) => i !== idx && a.username.toLowerCase() === nextU)) {
            return { ok: false, error: 'Такой логин уже занят' };
          }
        }
        if (passwordChanged) {
          if ((pwd as string).length < 4) {
            return { ok: false, error: 'Пароль не короче 4 символов' };
          }
          if ((pwd as string) !== (input.passwordConfirm ?? '')) {
            return { ok: false, error: 'Новый пароль и подтверждение не совпадают' };
          }
        }
      }

      const nextAcc: StoredAccount = { ...acc };
      if (input.fullName !== undefined) nextAcc.fullName = input.fullName.trim();
      if (input.phone !== undefined) nextAcc.phone = input.phone.trim();
      if (usernameChanged && nextU) nextAcc.username = nextU;
      if (passwordChanged && pwd) nextAcc.password = pwd;

      const next = [...list];
      next[idx] = nextAcc;
      saveAccounts(next);
      setAccounts(next);
      setUser(stripPassword(nextAcc));
      return { ok: true, role: 'director' };
    },
    []
  );

  const updateWorkerCredentialsByDirector = useCallback(
    (director: User | null, workerId: string, input: UpdateWorkerCredentialsInput): AuthResult => {
      if (!director || director.role !== 'director') {
        return { ok: false, error: 'Менять логин и пароль может только директор' };
      }
      const uname = input.username?.trim().toLowerCase();
      const pwd = input.password;
      const hasU = uname !== undefined && uname !== '';
      const hasP = pwd !== undefined && pwd !== '';
      if (!hasU && !hasP) {
        return { ok: false, error: 'Укажите новый логин или пароль' };
      }
      const list = loadAccounts();
      const idx = list.findIndex((a) => a.id === workerId);
      if (idx === -1 || (list[idx].role !== 'worker' && list[idx].role !== 'assistant')) {
        return { ok: false, error: 'Сотрудник не найден' };
      }
      const acc = list[idx];
      const nextAcc: StoredAccount = { ...acc };
      if (hasU) {
        if (!USERNAME_RE.test(uname!)) {
          return {
            ok: false,
            error: 'Логин: 2–32 символа, латиница, цифры, точка, дефис, подчёркивание',
          };
        }
        if (list.some((a, i) => i !== idx && a.username.toLowerCase() === uname)) {
          return { ok: false, error: 'Такой логин уже занят' };
        }
        nextAcc.username = uname!;
      }
      if (hasP) {
        if ((pwd as string).length < 4) {
          return { ok: false, error: 'Пароль не короче 4 символов' };
        }
        nextAcc.password = pwd as string;
      }
      const next = [...list];
      next[idx] = nextAcc;
      saveAccounts(next);
      setAccounts(next);
      if (user?.id === workerId) {
        setUser(stripPassword(nextAcc));
      }
      return { ok: true, role: 'worker' };
    },
    [user?.id]
  );


  const updateStaffAccountByDirector = useCallback(
    (director: User | null, staffId: string, input: UpdateStaffByDirectorInput): AuthResult => {
      if (!canManageStaffByRole(director)) {
        return { ok: false, error: 'Недостаточно прав для изменения учётных записей' };
      }
      const list = loadAccounts();
      const idx = list.findIndex((a) => a.id === staffId);
      if (idx === -1 || (list[idx].role !== 'worker' && list[idx].role !== 'assistant')) {
        return { ok: false, error: 'Сотрудник не найден' };
      }

      const acc = list[idx];
      const nextAcc: StoredAccount = { ...acc };

      if (input.fullName !== undefined) nextAcc.fullName = input.fullName.trim();
      if (input.phone !== undefined) nextAcc.phone = input.phone.trim();

      const uname = input.username?.trim().toLowerCase();
      if (uname !== undefined && uname !== '') {
        if (!USERNAME_RE.test(uname)) {
          return {
            ok: false,
            error: 'Логин: 2–32 символа, латиница, цифры, точка, дефис, подчёркивание',
          };
        }
        if (list.some((a, i) => i !== idx && a.username.toLowerCase() === uname)) {
          return { ok: false, error: 'Такой логин уже занят' };
        }
        nextAcc.username = uname;
      }

      if (input.password !== undefined && input.password !== '') {
        if (input.password.length < 4) {
          return { ok: false, error: 'Пароль не короче 4 символов' };
        }
        nextAcc.password = input.password;
      }

      if (input.role) {
        nextAcc.role = input.role;
      }

      if (nextAcc.role === 'assistant') {
        nextAcc.permissions = {
          analytics: Boolean(input.permissions?.analytics ?? nextAcc.permissions?.analytics),
          addProducts: Boolean(input.permissions?.addProducts ?? nextAcc.permissions?.addProducts),
          editProducts: Boolean(input.permissions?.editProducts ?? nextAcc.permissions?.editProducts),
          issueDebt: Boolean(input.permissions?.issueDebt ?? nextAcc.permissions?.issueDebt),
          manageStaff: Boolean(input.permissions?.manageStaff ?? nextAcc.permissions?.manageStaff),
        };
      } else {
        nextAcc.permissions = undefined;
      }

      const next = [...list];
      next[idx] = nextAcc;
      saveAccounts(next);
      setAccounts(next);
      if (user?.id === staffId) {
        setUser(stripPassword(nextAcc));
      }
      return { ok: true, role: nextAcc.role };
    },
    [user?.id]
  );


  const value = useMemo(
    () => ({
      user,
      workers,
      login,
      logout,
      createWorkerAccount,
      createStaffAccount,
      setWorkerStatus,
      setStaffPermissionsByDirector,
      deleteWorkerAccount,
      updateDirectorProfile,
      updateWorkerCredentialsByDirector,
      updateStaffAccountByDirector,
    }),
    [
      user,
      workers,
      login,
      logout,
      createWorkerAccount,
      createStaffAccount,
      setWorkerStatus,
      setStaffPermissionsByDirector,
      deleteWorkerAccount,
      updateDirectorProfile,
      updateWorkerCredentialsByDirector,
      updateStaffAccountByDirector,
    ]
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
