/**
 * BarOps Business Logic & Pure Calculations
 */

import {
  BottomTabType,
  ChecklistItem,
  Department,
  InventoryReport,
  Role,
  RolePermissions,
  TechCardItem,
  TechCardSection,
  WarehouseType,
} from '../types';

export const DEFAULT_PERMISSIONS: Record<Role, RolePermissions> = {
  admin: {
    canEditChecklists: true,
    canAssignTasks: true,
    canManageRequests: true,
    canEditProducts: true,
  },
  head_bartender: {
    canEditChecklists: true,
    canAssignTasks: true,
    canManageRequests: true,
    canEditProducts: true,
  },
  head_chef: {
    canEditChecklists: true,
    canAssignTasks: true,
    canManageRequests: true,
    canEditProducts: true,
  },
  bartender: {
    canEditChecklists: false,
    canAssignTasks: false,
    canManageRequests: false,
    canEditProducts: false,
  },
  cook: {
    canEditChecklists: false,
    canAssignTasks: false,
    canManageRequests: false,
    canEditProducts: false,
  },
  waiter: {
    canEditChecklists: false,
    canAssignTasks: false,
    canManageRequests: false,
    canEditProducts: false,
  },
};

/**
 * Checks if a given role has a specific permission taking custom permissions into account
 */
export function hasPermission(
  role: Role,
  permission: keyof RolePermissions,
  customPermissions?: Record<Role, RolePermissions>
): boolean {
  if (role === 'admin') return true;
  const perms = customPermissions?.[role] || DEFAULT_PERMISSIONS[role];
  return Boolean(perms?.[permission]);
}

/**
 * Returns whether the user role is allowed to change account structure, outlets, or user groups
 */
export function canModifyAccountStructure(role: Role): boolean {
  return role === 'admin';
}

/**
 * Returns visible bottom navigation tabs for a given role:
 * - Waiter ('waiter'): 'requests' and 'warehouse' are hidden -> ['checklists', 'tasks', 'ttk']
 * - All other roles: ['checklists', 'tasks', 'ttk', 'requests', 'warehouse']
 */
export function getVisibleBottomTabs(role: Role): BottomTabType[] {
  if (role === 'waiter') {
    return ['checklists', 'tasks', 'ttk'];
  }
  return ['checklists', 'tasks', 'ttk', 'requests', 'warehouse'];
}

/**
 * Returns visible departments in Checklists tab for a given role:
 * - Waiter: only 'hall' ('bar' and 'kitchen' hidden)
 * - Bartender / Head Bartender: only 'bar' ('kitchen' hidden)
 * - Cook / Head Chef: only 'kitchen'
 * - Admin: ['bar', 'kitchen', 'hall']
 */
export function getVisibleChecklistDepartments(role: Role): Department[] {
  if (role === 'admin') return ['bar', 'kitchen', 'hall'];
  if (role === 'waiter') return ['hall'];
  if (role === 'bartender' || role === 'head_bartender') return ['bar'];
  if (role === 'cook' || role === 'head_chef') return ['kitchen'];
  return ['bar'];
}

/**
 * Returns visible departments in Tasks tab for a given role:
 * - Waiter: only 'hall' ('bar' and 'kitchen' hidden)
 * - Bartender / Head Bartender: ['bar']
 * - Cook / Head Chef: ['kitchen']
 * - Admin: ['bar', 'kitchen', 'hall']
 */
export function getVisibleTaskDepartments(role: Role): Department[] {
  if (role === 'admin') return ['bar', 'kitchen', 'hall'];
  if (role === 'waiter') return ['hall'];
  if (role === 'bartender' || role === 'head_bartender') return ['bar'];
  if (role === 'cook' || role === 'head_chef') return ['kitchen'];
  return ['bar'];
}

/**
 * Determines whether the role has access to view/switch to a given department
 */
export function canAccessDepartment(role: Role, department: Department): boolean {
  return getVisibleChecklistDepartments(role).includes(department);
}

/**
 * Returns visible warehouses for a given role:
 * - Bartender / Head Bartender: ['bar']
 * - Cook / Head Chef: ['kitchen']
 * - Admin: ['bar', 'kitchen']
 * - Waiter: []
 */
export function getVisibleWarehouses(role: Role): WarehouseType[] {
  if (role === 'admin') return ['bar', 'kitchen'];
  if (role === 'head_bartender' || role === 'bartender') return ['bar'];
  if (role === 'head_chef' || role === 'cook') return ['kitchen'];
  return [];
}

/**
 * Determines whether the role has access to view/switch to a given warehouse
 */
export function canAccessWarehouse(role: Role, warehouse: WarehouseType): boolean {
  return getVisibleWarehouses(role).includes(warehouse);
}

/**
 * Determines whether a user can edit nomenclature in a given warehouse
 */
export function canEditWarehouseNomenclature(
  role: Role,
  warehouse: WarehouseType,
  customPermissions?: Record<Role, RolePermissions>
): boolean {
  if (role === 'admin') return true;
  if (!hasPermission(role, 'canEditProducts', customPermissions)) return false;
  if (role === 'head_bartender' && warehouse === 'bar') return true;
  if (role === 'head_chef' && warehouse === 'kitchen') return true;
  return false;
}

/**
 * Determines whether a user can add, edit, or delete Technological Cards (TTK)
 * Allowed only for: 'admin', 'head_bartender', 'head_chef'.
 * All 6 roles can view TTK cards.
 */
export function canManageTechCards(role: Role): boolean {
  return role === 'admin' || role === 'head_bartender' || role === 'head_chef';
}

/**
 * Filters Technological Cards by section ('bar' | 'kitchen'), group filter, and search query
 */
export function filterTechCards(
  cards: TechCardItem[],
  section: TechCardSection,
  groupFilter: string,
  searchQuery: string
): TechCardItem[] {
  const query = searchQuery.trim().toLowerCase();
  return cards.filter((card) => {
    if (card.section !== section) return false;
    if (groupFilter !== 'all') {
      if (groupFilter === 'bar_all_preps') {
        if (!card.group.startsWith('bar_prep_')) return false;
      } else if (card.group !== groupFilter) {
        return false;
      }
    }
    if (query) {
      return card.title.toLowerCase().includes(query);
    }
    return true;
  });
}

/**
 * Returns allowed departments for a given role
 */
export function getAllowedDepartments(role: Role): Department[] {
  return getVisibleChecklistDepartments(role);
}

/**
 * Calculates completion stats for a list of checklist items
 */
export function calculateChecklistProgress(items: ChecklistItem[]): {
  completed: number;
  total: number;
  percentage: number;
} {
  if (!items || items.length === 0) {
    return { completed: 0, total: 0, percentage: 0 };
  }

  let completed = 0;
  for (const item of items) {
    if (item.subtasks && item.subtasks.length > 0) {
      const allSubsDone = item.subtasks.every((s) => s.completed);
      if (allSubsDone || item.completed) {
        completed += 1;
      }
    } else if (item.completed) {
      completed += 1;
    }
  }

  const total = items.length;
  const percentage = Math.round((completed / total) * 100);

  return { completed, total, percentage };
}

/**
 * Sorts checklist items: pinned items always on top, preserved order within groups
 */
export function sortChecklistItems(items: ChecklistItem[]): ChecklistItem[] {
  return [...items].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return 0;
  });
}

/**
 * Formats inventory report into CSV with UTF-8 BOM so Russian letters render correctly in Excel
 */
export function generateInventoryCsv(
  report: Pick<InventoryReport, 'outletName' | 'warehouseName' | 'submittedBy' | 'submittedAt' | 'items'>
): string {
  const BOM = '\uFEFF';
  const lines: string[] = [];

  lines.push(`Отчет по инвентаризации: ${report.warehouseName}`);
  lines.push(`Точка продаж: ${report.outletName}`);
  lines.push(`Сотрудник: ${report.submittedBy}`);
  lines.push(`Дата и время: ${new Date(report.submittedAt).toLocaleString('ru-RU')}`);
  lines.push('');

  lines.push('Категория;Наименование товара;Единица измерения;Фактический остаток');

  for (const item of report.items) {
    const category = `"${(item.category || '').replace(/"/g, '""')}"`;
    const name = `"${(item.name || '').replace(/"/g, '""')}"`;
    const unit = `"${(item.unit || '').replace(/"/g, '""')}"`;
    const count = item.actualCount !== null && item.actualCount !== undefined ? item.actualCount : 0;
    lines.push(`${category};${name};${unit};${count}`);
  }

  return BOM + lines.join('\r\n');
}

/**
 * Checks whether user can manage/review requests for a specific department
 */
export function canReviewRequest(role: Role, department: Department): boolean {
  if (role === 'admin') return true;
  if (role === 'head_bartender' && department === 'bar') return true;
  if (role === 'head_chef' && department === 'kitchen') return true;
  return false;
}
