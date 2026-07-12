import { useLocalSearchParams } from 'expo-router';

import { CashierCheckoutScreen } from '@/screens/cashier/checkout-screen';

export default function TableCheckoutRoute() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  return <CashierCheckoutScreen kind="table" id={String(sessionId ?? '')} />;
}
