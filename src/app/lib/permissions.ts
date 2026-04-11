import type { User } from '../data/mockData';

export type AppPermissions = {
  analytics: boolean;
  addProducts: boolean;
  editProducts: boolean;
  issueDebt: boolean;
  manageStaff: boolean;
  viewDebts: boolean;
  editDebtRecords: boolean;
};

export function getPermissions(user: User | null): AppPermissions {
  if (!user) {
    return {
      analytics: false,
      addProducts: false,
      editProducts: false,
      issueDebt: false,
      manageStaff: false,
      viewDebts: false,
      editDebtRecords: false,
    };
  }
  if (user.role === 'director') {
    return {
      analytics: true,
      addProducts: true,
      editProducts: true,
      issueDebt: true,
      manageStaff: true,
      viewDebts: true,
      editDebtRecords: true,
    };
  }
  if (user.role === 'assistant') {
    return {
      analytics: Boolean(user.permissions?.analytics),
      addProducts: Boolean(user.permissions?.addProducts),
      editProducts: Boolean(user.permissions?.editProducts),
      issueDebt: Boolean(user.permissions?.issueDebt),
      manageStaff: Boolean(user.permissions?.manageStaff),
      viewDebts: Boolean(user.permissions?.viewDebts ?? true),
      editDebtRecords: Boolean(user.permissions?.editDebtRecords),
    };
  }
  // worker
  return {
    analytics: Boolean(user.permissions?.analytics),
    addProducts: Boolean(user.permissions?.addProducts ?? true),
    editProducts: Boolean(user.permissions?.editProducts ?? true),
    issueDebt: Boolean(user.permissions?.issueDebt ?? true),
    manageStaff: false,
    viewDebts: Boolean(user.permissions?.viewDebts ?? true),
    editDebtRecords: false,
  };
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

export function canEditDebtRecords(user: User | null): boolean {
  return getPermissions(user).editDebtRecords;
}
