import * as SecureStore from 'expo-secure-store';

import { normalizePrinterIp } from './printer-ip';

const PRINTER_IP_KEY = 'restoquick.printerIp';

export async function loadPrinterIp() {
  try {
    return (await SecureStore.getItemAsync(PRINTER_IP_KEY)) ?? '';
  } catch {
    return '';
  }
}

export async function savePrinterIp(value: string) {
  const normalized = normalizePrinterIp(value);
  if (!normalized) {
    try {
      await SecureStore.deleteItemAsync(PRINTER_IP_KEY);
    } catch {
      // Ignore storage failures — print can still proceed with the typed IP.
    }
    return;
  }

  try {
    await SecureStore.setItemAsync(PRINTER_IP_KEY, normalized);
  } catch {
    // Ignore storage failures — print can still proceed with the typed IP.
  }
}
