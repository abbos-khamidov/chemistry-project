import type { User } from '../data/mockData';

export type AppPermissions = {
  analytics: boolean;
  addProducts: boolean;
  editProducts: boolean;
  issueDebt: boolean;
};

export function getPermissions(user: User | null): AppPermissions {
  if (!user) {
    return { analytics: false, addProducts: false, editProducts: false, issueDebt: false };
  }
  if (user.role === 'director') {
    return { analytics: true, addProducts: true, editProducts: true, issueDebt: true };
  }
  if (user.role === 'assistant') {
    return {
      analytics: Boolean(user.permissions?.analytics),
      addProducts: Boolean(user.permissions?.addProducts),
      editProducts: Boolean(user.permissions?.editProducts),
      issueDebt: Boolean(user.permissions?.issueDebt),
    };
  }
  // worker
  return { analytics: false, addProducts: false, editProducts: false, issueDebt: true };
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
