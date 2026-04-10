import type { User } from '../data/mockData';

export type AppPermissions = {
  analytics: boolean;
  addProducts: boolean;
  editProducts: boolean;
  issueDebt: boolean;
  manageStaff: boolean;
};

export function getPermissions(user: User | null): AppPermissions {
  if (!user) {
    return { analytics: false, addProducts: false, editProducts: false, issueDebt: false, manageStaff: false };
  }
  if (user.role === 'director') {
    return { analytics: true, addProducts: true, editProducts: true, issueDebt: true, manageStaff: true };
  }
  if (user.role === 'assistant') {
    return {
      analytics: Boolean(user.permissions?.analytics),
      addProducts: Boolean(user.permissions?.addProducts),
      editProducts: Boolean(user.permissions?.editProducts),
      issueDebt: Boolean(user.permissions?.issueDebt),
      manageStaff: Boolean(user.permissions?.manageStaff),
    };
  }
  // worker
  return { analytics: false, addProducts: false, editProducts: false, issueDebt: true, manageStaff: false };
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
