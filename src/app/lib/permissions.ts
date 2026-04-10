import type { User } from '../data/mockData';

export type AppPermissions = {
  analytics: boolean;
  addProducts: boolean;
  editProducts: boolean;
  issueDebt: boolean;
  manageStaff: boolean;
  viewDebts: boolean;
};

export function getPermissions(user: User | null): AppPermissions {
  if (!user) {
    return { analytics: false, addProducts: false, editProducts: false, issueDebt: false, manageStaff: false, viewDebts: false };
  }
  if (user.role === 'director') {
    return { analytics: true, addProducts: true, editProducts: true, issueDebt: true, manageStaff: true, viewDebts: true };
  }
  if (user.role === 'assistant') {
    return {
      analytics: Boolean(user.permissions?.analytics),
      addProducts: Boolean(user.permissions?.addProducts),
      editProducts: Boolean(user.permissions?.editProducts),
      issueDebt: Boolean(user.permissions?.issueDebt),
      manageStaff: Boolean(user.permissions?.manageStaff),
      viewDebts: Boolean(user.permissions?.viewDebts ?? true),
    };
  }
  // worker
  return { analytics: false, addProducts: false, editProducts: false, issueDebt: true, manageStaff: false, viewDebts: Boolean(user.permissions?.viewDebts ?? true) };
}

export function canViewAnalytics(user: User | null): boolean {
  return getPermissions(user).analytics;
}

export function canAddProducts(user: User | null): boolean {
  return getPermissions(user).addProducts;
}

export function canEditProducts(user: User | null): boolean {
  return getPermissions(user).editProducts;
}

export function canIssueDebt(user: User | null): boolean {
  return getPermissions(user).issueDebt;
}


export function canManageStaff(user: User | null): boolean {
  return getPermissions(user).manageStaff;
}


export function canViewDebts(user: User | null): boolean {
  return getPermissions(user).viewDebts;
}
