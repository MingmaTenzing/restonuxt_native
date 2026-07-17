import { useLocalSearchParams } from 'expo-router';

import { CashierCheckoutScreen } from '@/screens/cashier/checkout-screen';

export default function TakeawayCheckoutRoute() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  return <CashierCheckoutScreen kind="takeaway" id={String(orderId ?? '')} />;
}
