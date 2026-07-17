import type { TableSession } from '@/screens/sessions/types';

import type { CashierTableSession } from './types';

export function toCashierSession(session: TableSession): CashierTableSession {
  const unpaid = (session.orders ?? []).filter((order) => order.paymentStatus === 'UNPAID');
  return {
    ...session,
    outstandingCents: unpaid.reduce((sum, order) => sum + order.totalAmountCents, 0),
    unpaidOrderCount: unpaid.length,
  };
}
