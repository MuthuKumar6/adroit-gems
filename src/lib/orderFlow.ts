// Central order-flow rules used by the UI to block illegal status changes,
// reverse stock on returns, and lock orders that already have a bill.
//
// The backend SHOULD enforce these too — this is a frontend safety net.

import type { Order, OrderStatus } from './types';

export const ORDER_STATUSES: OrderStatus[] = [
  'pending', 'approved', 'dispatched', 'delivered', 'cancelled', 'returned',
];

// Allowed forward transitions. Anything not listed is rejected.
const ALLOWED: Record<OrderStatus, OrderStatus[]> = {
  pending:    ['approved', 'cancelled'],
  approved:   ['dispatched', 'cancelled'],
  dispatched: ['delivered', 'cancelled'],
  delivered:  ['returned'],
  cancelled:  [],
  returned:   [],
};

export function isValidStatus(s: string): s is OrderStatus {
  return (ORDER_STATUSES as string[]).includes(s);
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return true;
  return ALLOWED[from]?.includes(to) ?? false;
}

export function allowedNextStatuses(from: OrderStatus): OrderStatus[] {
  return [from, ...(ALLOWED[from] || [])];
}

// Transitions that wipe data / reverse stock — require confirmation.
export function isDestructiveTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return false;
  if (to === 'cancelled' && from !== 'pending') return true;
  if (to === 'returned') return true;
  return false;
}

// Stock should be added back when an order is cancelled (from any stocked state)
// or returned (from delivered). Mirrors backend cancellation logic.
export function shouldReverseStock(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return false;
  if (to === 'cancelled' && (from === 'pending' || from === 'approved' || from === 'dispatched')) return true;
  if (to === 'returned' && from === 'delivered') return true;
  return false;
}

// An order is locked from destructive transitions once a bill exists for it.
export function isOrderLocked(orderId: string, billedOrderIds: Set<string>): boolean {
  return billedOrderIds.has(orderId);
}

// Validate a proposed transition. Returns null if OK, or an error message.
export function validateTransition(
  order: Order,
  to: OrderStatus,
  billedOrderIds: Set<string>,
): string | null {
  if (!isValidStatus(to)) return `Invalid status "${to}"`;
  if (!canTransition(order.status, to)) {
    return `Cannot change status from "${order.status}" to "${to}".`;
  }
  if (isOrderLocked(order.id, billedOrderIds) && isDestructiveTransition(order.status, to)) {
    return `This order has a bill — cannot change to "${to}". Void the bill first.`;
  }
  return null;
}
