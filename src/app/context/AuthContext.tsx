import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '../data/mockData';
import { clearSessionCookie, getSessionUserIdFromCookie, setSessionCookie } from '../lib/sessionCookie';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

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
    viewDebts?: boolean;
  };
};

type StoredAccount = User & { password: string };

type AccountRow = {
  id: string;
  full_name: string;
  phone: string;
  username: string;
  password: string;
  role: 'director' | 'assistant' | 'worker';
  status: 'active' | 'inactive';
  last_activity: string;
  permissions: User['permissions'] | null;
};

const USERNAME_RE = /^[a-zA-Z0-9_.-]{2,32}$/;

function normalizeLogin(s: string): string {
  return s.trim().toLowerCase();
}

function seedAccounts(): StoredAccount[] {
  return [
    {
      id: 'seed-director',
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

function rowToStored(row: AccountRow): StoredAccount {
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    username: row.username,
    role: row.role,
    status: row.status,
    lastActivity: row.last_activity,
    permissions: row.permissions ?? undefined,
    password: row.password,
  };
}

function storedToRow(acc: StoredAccount): AccountRow {
  return {
    id: acc.id,
    full_name: acc.fullName,
    phone: acc.phone,
    username: acc.username,
    password: acc.password,
    role: acc.role,
    status: acc.status,
    last_activity: acc.lastActivity,
    permissions: acc.permissions ?? null,
  };
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

async function fetchAccountsFromDb(): Promise<StoredAccount[]> {
  if (!isSupabaseConfigured) return seedAccounts();
  const { data, error } = await supabase.from('accounts').select('*').order('created_at', { ascending: true });
  if (error || !data) {
    console.error('[AuthContext] Failed to load accounts from Supabase:', error);
    return seedAccounts();
  }
  const rows = data as AccountRow[];
  if (rows.length === 0) {
    const seeded = seedAccounts();
    await upsertAccountsToDb(seeded);
    return seeded;
  }
  return rows.map(rowToStored);
}

async function upsertAccountsToDb(accounts: StoredAccount[]): Promise<void> {
  if (!isSupabaseConfigured) return;
  const payload = accounts.map(storedToRow);
  const { error } = await supabase.from('accounts').upsert(payload, { onConflict: 'id' });
  if (error) {
    console.error('[AuthContext] Failed to upsert accounts to Supabase:', error);
  }
}

async function deleteAccountFromDb(accountId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from('accounts').delete().eq('id', accountId);
  if (error) {
    console.error('[AuthContext] Failed to delete account in Supabase:', error);
  }
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

export type UpdateOwnProfileInput = {
  fullName?: string;
  phone?: string;
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
  isAuthReady: boolean;
  workers: User[];
  login: (username: string, password: string) => Promise<AuthResult>;
  logout: () => void;
  createWorkerAccount: (director: User | null, input: CreateWorkerInput) => Promise<AuthResult>;
  createStaffAccount: (director: User | null, input: CreateStaffInput) => Promise<AuthResult>;
  setWorkerStatus: (director: User | null, workerId: string, status: 'active' | 'inactive') => Promise<AuthResult>;
  setStaffPermissionsByDirector: (
    director: User | null,
    staffId: string,
    permissions: NonNullable<User['permissions']>
  ) => Promise<AuthResult>;
  deleteWorkerAccount: (director: User | null, workerId: string) => Promise<AuthResult>;
  updateDirectorProfile: (director: User | null, input: UpdateDirectorProfileInput) => Promise<AuthResult>;
  updateWorkerCredentialsByDirector: (
    director: User | null,
    workerId: string,
    input: UpdateWorkerCredentialsInput
  ) => Promise<AuthResult>;
  updateStaffAccountByDirector: (
    director: User | null,
    staffId: string,
    input: UpdateStaffByDirectorInput
  ) => Promise<AuthResult>;
  updateOwnProfile: (user: User | null, input: UpdateOwnProfileInput) => Promise<AuthResult>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<StoredAccount[]>(() => seedAccounts());
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

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

  const reloadAccounts = useCallback(async () => {
    const list = await fetchAccountsFromDb();
    setAccounts(list);
    return list;
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const list = await fetchAccountsFromDb();
        if (!active) return;
        setAccounts(list);
        const id = readInitialSessionUserId();
        if (id) {
          const acc = list.find((a) => a.id === id);
          if (acc && acc.status === 'active') setUser(stripPassword(acc));
        }
      } finally {
        if (active) setIsAuthReady(true);
      }
    })();

    if (!isSupabaseConfigured) {
      return () => {
        active = false;
      };
    }

    const channel = supabase
      .channel('accounts-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accounts' }, async () => {
        const list = await fetchAccountsFromDb();
        if (!active) return;
        setAccounts(list);
        setUser((prev) => {
          if (!prev) return prev;
          const found = list.find((a) => a.id === prev.id);
          return found ? stripPassword(found) : null;
        });
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const login = useCallback(
    async (username: string, password: string): Promise<AuthResult> => {
      const list = await reloadAccounts();
      const key = normalizeLogin(username);
      const acc = list.find((a) => normalizeLogin(a.username) === key);
      if (!acc || acc.password !== password) {
        return { ok: false, error: 'Неверный логин или пароль' };
      }
      if (acc.status === 'inactive') {
        return { ok: false, error: 'Учётная запись отключена' };
      }
      const publicUser = stripPassword(acc);
      setUser(publicUser);
      persistSession(publicUser);
      return { ok: true, role: acc.role };
    },
    [persistSession, reloadAccounts]
  );

  const setWorkerStatus = useCallback(async (director: User | null, workerId: string, status: 'active' | 'inactive'): Promise<AuthResult> => {
    if (!canManageStaffByRole(director)) {
      return { ok: false, error: 'Недостаточно прав для изменения статуса' };
    }
    const list = await fetchAccountsFromDb();
    const idx = list.findIndex((a) => a.id === workerId);
    if (idx === -1 || (list[idx].role !== 'worker' && list[idx].role !== 'assistant')) {
      return { ok: false, error: 'Сотрудник не найден' };
    }
    const next = [...list];
    next[idx] = { ...next[idx], status };
    await upsertAccountsToDb(next);
    setAccounts(next);
    return { ok: true, role: list[idx].role };
  }, []);

  const deleteWorkerAccount = useCallback(async (director: User | null, workerId: string): Promise<AuthResult> => {
    if (!canManageStaffByRole(director)) {
      return { ok: false, error: 'Недостаточно прав для удаления учётных записей' };
    }
    if (director.id === workerId) {
      return { ok: false, error: 'Нельзя удалить свою учётную запись' };
    }
    const list = await fetchAccountsFromDb();
    const target = list.find((a) => a.id === workerId);
    if (!target || (target.role !== 'worker' && target.role !== 'assistant')) {
      return { ok: false, error: 'Сотрудник не найден' };
    }
    const next = list.filter((a) => a.id !== workerId);
    await deleteAccountFromDb(workerId);
    setAccounts(next);
    return { ok: true, role: 'worker' };
  }, []);

  const createWorkerAccount = useCallback(async (director: User | null, input: CreateWorkerInput): Promise<AuthResult> => {
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
    const list = await fetchAccountsFromDb();
    if (list.some((a) => a.username.toLowerCase() === uname)) {
      return { ok: false, error: 'Такой логин уже занят' };
    }
    if (input.password.length < 4) {
      return { ok: false, error: 'Пароль не короче 4 символов' };
    }
    const acc: StoredAccount = {
      id: crypto.randomUUID(),
      fullName: input.fullName.trim(),
      phone: input.phone.trim(),
      username: uname,
      role: 'worker',
      status: 'active',
      lastActivity: new Date().toISOString().slice(0, 16).replace('T', ' '),
      password: input.password,
      permissions: { viewDebts: true },
    };
    const next = [...list, acc];
    await upsertAccountsToDb(next);
    setAccounts(next);
    return { ok: true, role: 'worker' };
  }, []);

  const createStaffAccount = useCallback(async (director: User | null, input: CreateStaffInput): Promise<AuthResult> => {
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
    const list = await fetchAccountsFromDb();
    if (list.some((a) => a.username.toLowerCase() === uname)) {
      return { ok: false, error: 'Такой логин уже занят' };
    }
    if (input.password.length < 4) {
      return { ok: false, error: 'Пароль не короче 4 символов' };
    }
    const role: 'worker' | 'assistant' = input.role;
    const acc: StoredAccount = {
      id: crypto.randomUUID(),
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
              viewDebts: Boolean(input.permissions?.viewDebts ?? true),
            }
          : {
              viewDebts: Boolean(input.permissions?.viewDebts ?? true),
            },
      status: 'active',
      lastActivity: new Date().toISOString().slice(0, 16).replace('T', ' '),
      password: input.password,
    };
    const next = [...list, acc];
    await upsertAccountsToDb(next);
    setAccounts(next);
    return { ok: true, role };
  }, []);

  const setStaffPermissionsByDirector = useCallback(async (director: User | null, staffId: string, permissions: NonNullable<User['permissions']>): Promise<AuthResult> => {
    if (!canManageStaffByRole(director)) {
      return { ok: false, error: 'Недостаточно прав для изменения разрешений' };
    }
    const list = await fetchAccountsFromDb();
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
        viewDebts: Boolean(permissions.viewDebts ?? true),
      },
    };
    await upsertAccountsToDb(next);
    setAccounts(next);
    if (user?.id === staffId) {
      setUser(stripPassword(next[idx]));
    }
    return { ok: true, role: 'assistant' };
  }, [user?.id]);

  const logout = useCallback(() => {
    setUser(null);
    persistSession(null);
  }, [persistSession]);

  const updateOwnProfile = useCallback(async (accountUser: User | null, input: UpdateOwnProfileInput): Promise<AuthResult> => {
    if (!accountUser) {
      return { ok: false, error: 'Пользователь не найден' };
    }
    if (accountUser.role !== 'director') {
      return { ok: false, error: 'Изменение профиля доступно только директору' };
    }
    const list = await fetchAccountsFromDb();
    const idx = list.findIndex((a) => a.id === accountUser.id);
    if (idx === -1) {
      return { ok: false, error: 'Учётная запись не найдена' };
    }
    const nextAcc: StoredAccount = { ...list[idx] };
    if (input.fullName !== undefined) nextAcc.fullName = input.fullName.trim();
    if (input.phone !== undefined) nextAcc.phone = input.phone.trim();
    const next = [...list];
    next[idx] = nextAcc;
    await upsertAccountsToDb(next);
    setAccounts(next);
    setUser(stripPassword(nextAcc));
    return { ok: true, role: nextAcc.role };
  }, []);

  const updateDirectorProfile = useCallback(async (director: User | null, input: UpdateDirectorProfileInput): Promise<AuthResult> => {
    if (!director || director.role !== 'director') {
      return { ok: false, error: 'Профиль директора доступен только директору' };
    }
    const list = await fetchAccountsFromDb();
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
    await upsertAccountsToDb(next);
    setAccounts(next);
    setUser(stripPassword(nextAcc));
    return { ok: true, role: 'director' };
  }, []);

  const updateWorkerCredentialsByDirector = useCallback(async (director: User | null, workerId: string, input: UpdateWorkerCredentialsInput): Promise<AuthResult> => {
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
    const list = await fetchAccountsFromDb();
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
    await upsertAccountsToDb(next);
    setAccounts(next);
    if (user?.id === workerId) {
      setUser(stripPassword(nextAcc));
    }
    return { ok: true, role: 'worker' };
  }, [user?.id]);

  const updateStaffAccountByDirector = useCallback(async (director: User | null, staffId: string, input: UpdateStaffByDirectorInput): Promise<AuthResult> => {
    if (!canManageStaffByRole(director)) {
      return { ok: false, error: 'Недостаточно прав для изменения учётных записей' };
    }
    const list = await fetchAccountsFromDb();
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
        viewDebts: Boolean(input.permissions?.viewDebts ?? nextAcc.permissions?.viewDebts ?? true),
      };
    } else {
      nextAcc.permissions = {
        viewDebts: Boolean(input.permissions?.viewDebts ?? nextAcc.permissions?.viewDebts ?? true),
      };
    }

    const next = [...list];
    next[idx] = nextAcc;
    await upsertAccountsToDb(next);
    setAccounts(next);
    if (user?.id === staffId) {
      setUser(stripPassword(nextAcc));
    }
    return { ok: true, role: nextAcc.role };
  }, [user?.id]);

  const value = useMemo(
    () => ({
      user,
      isAuthReady,
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
      updateOwnProfile,
    }),
    [
      user,
      isAuthReady,
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
      updateOwnProfile,
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
