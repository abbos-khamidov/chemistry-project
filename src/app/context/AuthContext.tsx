import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

export interface AuthUser {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  role: 'owner' | 'manager' | 'worker';
  status: 'active' | 'inactive';
}

const STORAGE_USER = 'warehouse_user';
const STORAGE_USERS = 'warehouse_users';

function loadStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_USER);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function saveStoredUser(user: AuthUser | null) {
  if (user) localStorage.setItem(STORAGE_USER, JSON.stringify(user));
  else localStorage.removeItem(STORAGE_USER);
}

function loadStoredUsers(): Array<AuthUser & { password?: string }> {
  try {
    const raw = localStorage.getItem(STORAGE_USERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredUsers(users: Array<AuthUser & { password?: string }>) {
  localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
}

const seedUsers: Array<AuthUser & { password: string }> = [
  { id: '1', fullName: 'Karimov Otabek', phone: '+998 90 111 22 33', email: 'owner@warehouse.uz', role: 'owner', status: 'active', password: 'demo123' },
  { id: '2', fullName: 'Abdullayeva Malika', phone: '+998 91 222 33 44', email: 'manager@warehouse.uz', role: 'manager', status: 'active', password: 'demo123' },
  { id: '3', fullName: 'Nizomov Jasur', phone: '+998 93 333 44 55', email: 'worker@warehouse.uz', role: 'worker', status: 'active', password: 'demo123' },
];

function ensureSeeded() {
  const existing = loadStoredUsers();
  if (existing.length > 0) return;
  saveStoredUsers(seedUsers);
}

type AuthContextValue = {
  user: AuthUser | null;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  register: (data: { fullName: string; phone: string; email: string; password: string }) => { ok: boolean; error?: string };
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    ensureSeeded();
    return loadStoredUser();
  });

  const login = useCallback((email: string, password: string) => {
    const users = loadStoredUsers();
    const normalized = email.trim().toLowerCase();
    const found = users.find(
      (u) => u.email?.toLowerCase() === normalized && (u as { password?: string }).password === password
    );
    if (!found) {
      return { ok: false, error: 'Неверный email или пароль' };
    }
    const { password: _, ...authUser } = found;
    const toStore: AuthUser = {
      id: authUser.id,
      fullName: authUser.fullName,
      phone: authUser.phone,
      email: authUser.email,
      role: authUser.role,
      status: authUser.status,
    };
    setUser(toStore);
    saveStoredUser(toStore);
    return { ok: true };
  }, []);

  const register = useCallback(
    (data: { fullName: string; phone: string; email: string; password: string }) => {
      const users = loadStoredUsers();
      const normalized = data.email.trim().toLowerCase();
      if (users.some((u) => u.email?.toLowerCase() === normalized)) {
        return { ok: false, error: 'Пользователь с таким email уже зарегистрирован' };
      }
      const newUser: AuthUser & { password: string } = {
        id: String(Date.now()),
        fullName: data.fullName.trim(),
        phone: data.phone.trim(),
        email: data.email.trim(),
        role: 'worker',
        status: 'active',
        password: data.password,
      };
      users.push(newUser);
      saveStoredUsers(users);
      const { password: _, ...authUser } = newUser;
      setUser(authUser);
      saveStoredUser(authUser);
      return { ok: true };
    },
    []
  );

  const logout = useCallback(() => {
    setUser(null);
    saveStoredUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
