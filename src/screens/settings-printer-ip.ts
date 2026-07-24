import { isValidPrinterIp, normalizePrinterIp } from '@/screens/receipt/printer-ip';

export type PrinterIpSettingsDecision =
  | { kind: 'clear' }
  | { kind: 'save'; value: string }
  | { kind: 'invalid'; message: string };

/** Validate a Settings draft before persisting the thermal printer IP. */
export function resolvePrinterIpSettingsSave(raw: string): PrinterIpSettingsDecision {
  const value = normalizePrinterIp(raw);
  if (!value) return { kind: 'clear' };
  if (!isValidPrinterIp(value)) {
    return {
      kind: 'invalid',
      message: 'Use an IPv4 address, optionally with a port (e.g. 192.168.1.50:9100).',
    };
  }
  return { kind: 'save', value };
}
